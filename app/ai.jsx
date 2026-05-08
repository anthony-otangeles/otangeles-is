// AI workspace — proactive clinical driver + resident-aware assistant

function residentCareTeam(residentId) {
  const ids = CARE_TEAMS[residentId] || CARE_TEAMS.r1 || [];
  return ids.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
}

function residentPrimaryIssue(r) {
  return (r.issues && r.issues[0]) || FACILITY_CHANGES.find(c => c.residentId === r.id) || null;
}

function pendingSkillAssessment(r) {
  const skillName = (agentSkillRegistry.get(RESIDENT_BASELINE_SKILL_ID) || {}).name || '72-Hour Post-Hospital Return Watch';
  return {
    skillId: RESIDENT_BASELINE_SKILL_ID,
    skillName,
    status: 'evaluating',
    normal: [`Evaluating ${r.name}'s current data against the resident baseline.`],
    deviations: ['Skill evaluation in progress.'],
    implications: ['Waiting for multidimensional assessment.'],
    recommendedActions: ['Review the latest chart evidence while the skill completes.'],
    confidence: 'pending',
  };
}

function nextActionsForResident(r) {
  const issue = residentPrimaryIssue(r);
  const actions = [];
  if (r.risk === 'critical') actions.push('Notify charge nurse and DON for same-shift review.');
  if (issue && issue.kind === 'vitals') actions.push('Repeat focused vitals and compare to resident baseline before provider outreach.');
  if (issue && issue.kind === 'wound') actions.push('Ask wound nurse to confirm dressing status and whether care plan needs revision.');
  if (issue && issue.kind === 'med') actions.push('Route medication variance to provider/pharmacy with eMAR evidence.');
  if (issue && issue.kind === 'rehab') actions.push('Ask rehab lead whether refusal is pain, fatigue, cognition, or clinical decline.');
  if (issue && issue.kind === 'nutrition') actions.push('Ask dietary/RD to review meal intake, fluids, weight, and supplement options.');
  if (!actions.length) actions.push('Continue baseline monitoring and wait for a meaningful deviation before escalating.');
  actions.push('If human team chooses an intervention, save outcome as a workflow pattern for future skill tuning.');
  return actions;
}

function proactiveQueue() {
  return priorityResidents().slice(0, 5).map(r => {
    const issue = residentPrimaryIssue(r);
    return {
      resident: r,
      issue,
      action: nextActionsForResident(r)[0],
    };
  });
}

function matchCareTeamMember(text, residentId) {
  const q = text.toLowerCase();
  return residentCareTeam(residentId).find(u => {
    const first = u.name.split(' ')[0].toLowerCase();
    const last = u.name.split(' ').slice(-1)[0].toLowerCase();
    return q.includes(u.name.toLowerCase()) || q.includes(first) || q.includes(last) || q.includes((u.short || '').toLowerCase()) || q.includes(u.role.toLowerCase());
  });
}

function isConversationRequest(text) {
  const q = text.toLowerCase();
  return ['message', 'chat', 'thread', 'discuss', 'talk to', 'open conversation', 'start conversation', 'ask '].some(x => q.includes(x));
}

function AIAssistantPage({ user, residentId, onOpenResident, onOpenChat, onNav }) {
  const taggedResident = residentId ? RESIDENTS.find(r => r.id === residentId) : null;
  const queue = proactiveQueue();
  const heroResident = taggedResident || (queue[0] && queue[0].resident);
  const [input, setInput] = useState('');
  const [baselineAssessment, setBaselineAssessment] = useState(() => taggedResident ? pendingSkillAssessment(taggedResident) : null);
  const [agentRun, setAgentRun] = useState({ status: 'idle', steps: [], assessment: null });
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: taggedResident
        ? `${taggedResident.name} is tagged. I can explain the baseline shift, recommend next actions, or open a tagged conversation with anyone on the care team.`
        : `I am watching resident baselines, deviations, risk implications, and care-team workflow patterns for ${FACILITY.name}. Ask what needs action next.`,
    },
  ]);

  const team = taggedResident ? residentCareTeam(taggedResident.id) : [];

  useEffect(() => {
    let cancelled = false;
    const target = taggedResident || heroResident;
    if (!target) {
      setBaselineAssessment(null);
      setAgentRun({ status: 'idle', steps: [], assessment: null });
      return;
    }

    if (taggedResident) setBaselineAssessment(pendingSkillAssessment(taggedResident));
    setAgentRun({ status: 'running', steps: [], assessment: null });

    runResidentAgentSkill({
      skillId: RESIDENT_BASELINE_SKILL_ID,
      residentId: target.id,
      onStep: (step, steps) => {
        if (!cancelled) setAgentRun(s => ({ ...s, status: 'running', steps }));
      },
    }).then(run => {
      if (cancelled) return;
      setAgentRun({ status: 'complete', steps: run.steps, assessment: run.assessment, skill: run.skill });
      if (taggedResident) setBaselineAssessment(run.assessment);
    }).catch(error => {
      if (cancelled) return;
      const step = { id: 'agent-error', status: 'error', label: 'Agent run failed', detail: error.message, time: 'now' };
      setAgentRun({ status: 'error', steps: [step], assessment: null });
      if (taggedResident) setBaselineAssessment(pendingSkillAssessment(taggedResident));
    });

    return () => { cancelled = true; };
  }, [taggedResident ? `tagged-${taggedResident.id}` : heroResident ? `facility-${heroResident.id}` : 'none']);

  function addMessage(role, text) {
    setMessages(m => [...m, { role, text }]);
  }

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    addMessage('me', q);
    setInput('');

    if (taggedResident && isConversationRequest(q)) {
      const member = matchCareTeamMember(q, taggedResident.id);
      if (member) {
        onOpenChat(taggedResident, member);
        addMessage('ai', `Opened a conversation with ${member.name}. ${taggedResident.name} remains tagged, and I included the active baseline deviation plus recommended next step.`);
        return;
      }
      addMessage('ai', `I can open a tagged conversation for ${taggedResident.name}. Try a name or role from the care team: ${team.map(u => `${u.name} (${u.short})`).join(', ')}.`);
      return;
    }

    if (taggedResident) {
      const assessment = baselineAssessment || pendingSkillAssessment(taggedResident);
      const action = (assessment.recommendedActions && assessment.recommendedActions[0]) || 'Confirm findings with the care team.';
      addMessage('ai', `${taggedResident.name}: ${assessment.skillName} shows ${assessment.deviations[0]} ${assessment.implications[0]} Recommended next action: ${action}`);
      return;
    }

    const top = queue[0];
    addMessage('ai', `Top proactive item: ${top.resident.name}. Signal: ${top.issue ? top.issue.title : top.resident.dx}. Recommended driver action: ${top.action}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="AI Command"
        subtitle={taggedResident ? `Resident context active · ${taggedResident.name} is tagged` : 'Proactive work queue from PCC signals, resident baselines, and care-team patterns.'}
        actions={[
          taggedResident && <Button key="profile" variant="secondary" icon="user" onClick={() => onOpenResident(taggedResident.id)}>Open Profile</Button>,
        ].filter(Boolean)}
      />

      <AgentCommandBanner queue={queue} taggedResident={taggedResident} assessment={baselineAssessment} onOpenResident={onOpenResident} />
      <AgentExecutionLog
        steps={agentRun.steps}
        title="Agent Work Log"
        subtitle={heroResident ? `${heroResident.name} - markdown skill registry plus autonomous tool calls.` : 'Waiting for a resident trigger.'}
      />

      {taggedResident ? (
        <ResidentAICard r={taggedResident} baseline={baselineAssessment || pendingSkillAssessment(taggedResident)} team={team} onOpenChat={onOpenChat} />
      ) : (
        <FacilityAIDriver queue={queue} onOpenResident={onOpenResident} />
      )}

      <AgentOperatingLoop />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Command AI</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>
              {taggedResident ? `${taggedResident.name} stays tagged in this conversation.` : 'Ask about priorities, patterns, risks, or what to do next.'}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', background: '#FAFAFA' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'me' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '86%', padding: '10px 12px', borderRadius: 12,
                background: m.role === 'me' ? '#845EC2' : '#fff',
                color: m.role === 'me' ? '#fff' : '#1C192E',
                border: m.role === 'me' ? 0 : '1px solid #E5E7EB',
                fontSize: 13, lineHeight: '18px',
              }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #EEEEEE', display: 'flex', gap: 8, flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(taggedResident
              ? ['What changed from baseline?', `Message ${team[0]?.name.split(' ')[0] || 'the nurse'} about this`, 'What should the care team do next?']
              : ['Who needs action before noon?', 'What patterns are repeating?', 'Which skill should be created next?']
            ).map(s => (
              <button key={s} onClick={() => send(s)} style={{
                border: '1px solid #E5E7EB', background: '#fff', borderRadius: 9999, padding: '7px 10px',
                font: '600 12px Inter', color: '#52525B', cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder={taggedResident ? `Ask about ${taggedResident.name} or say "message Dr. Cole"` : 'Ask what needs action next...'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
            <Button variant="lavender" icon="send" onClick={() => send()}>Send</Button>
          </div>
        </div>
      </Card>

      <SkillLearningCard />
    </div>
  );
}

function AgentCommandBanner({ queue, taggedResident, assessment, onOpenResident }) {
  const target = taggedResident || (queue[0] && queue[0].resident);
  const issue = taggedResident ? residentPrimaryIssue(taggedResident) : queue[0] && queue[0].issue;
  const nextAction = taggedResident && assessment && assessment.recommendedActions
    ? assessment.recommendedActions[0]
    : target
      ? nextActionsForResident(target)[0]
      : 'Continue baseline monitoring.';
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '4px solid #845EC2' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="sparkles" size={20} color="#845EC2" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1C192E' }}>Next work item</div>
          <div style={{ fontSize: 13, lineHeight: '19px', color: '#1C192E', marginTop: 5 }}>
            {target ? `${target.name}: ${issue ? issue.title : target.dx}` : 'No active work item.'}
          </div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 4 }}>
            {nextAction}
          </div>
        </div>
        {target && <RiskBadge level={target.risk} score={target.score} compact />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 8 }}>
        <AiMiniStat label="Baseline shifts" value={FACILITY_CHANGES.length} icon="activity" />
        <AiMiniStat label="Same-shift decisions" value={priorityResidents().filter(r => ['critical','high'].includes(r.risk)).length} icon="alertTriangle" />
        <AiMiniStat label="Skills learning" value="3" icon="fileText" />
      </div>
      {target && (
        <Button variant="secondary" icon="user" onClick={() => onOpenResident(target.id)}>Open Work Item</Button>
      )}
    </Card>
  );
}

function AiMiniStat({ label, value, icon }) {
  return (
    <div style={{ padding: 12, border: '1px solid #EEEEEE', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={16} color="#845EC2" />
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1C192E', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function FacilityAIDriver({ queue, onOpenResident }) {
  const statusMap = ['Now', 'Next', 'Before noon', 'This shift', 'Watch'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader title="Proactive Queue" subtitle="AI-initiated work ordered by risk, trend, and workflow timing." />
      {queue.map(item => (
        <Card key={item.resident.id} hoverable onClick={() => onOpenResident(item.resident.id)} style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar initials={item.resident.initials} seed={item.resident.id} size={42} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{item.resident.name}</div>
                <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>Rm {item.resident.room} · {item.resident.unit}</div>
              </div>
              <RiskBadge level={item.resident.risk} score={item.resident.score} compact />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Chip tone={item.resident.risk} dot>{statusMap[queue.indexOf(item)] || 'Queued'}</Chip>
              <Chip tone="todo">{item.issue ? item.issue.source : 'Baseline'}</Chip>
            </div>
            <div style={{ fontSize: 13, lineHeight: '18px', color: '#1C192E', marginTop: 10, fontWeight: 700 }}>{item.issue ? item.issue.title : item.resident.dx}</div>
            <div style={{ fontSize: 12, lineHeight: '17px', color: '#6A7282', marginTop: 4 }}>{item.action}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AgentOperatingLoop() {
  const stages = [
    { icon: 'fileText', title: 'PCC Digest', body: 'vitals, eMAR, notes, labs, wounds' },
    { icon: 'activity', title: 'Baseline Compare', body: 'resident-specific normal range' },
    { icon: 'alertTriangle', title: 'Risk Shift', body: 'decline, transfer, sepsis, fall, wound' },
    { icon: 'users', title: 'Human Decision', body: 'team accepts, edits, or rejects plan' },
    { icon: 'refresh', title: 'Skill Update', body: 'trigger, response, outcome pattern' },
  ];
  return (
    <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Agent Loop</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3 }}>Every recommendation stays tied to evidence, owner, decision, and outcome.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {stages.map((s, i) => (
          <div key={s.title} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, background: i === 2 ? '#FFF3EF' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name={s.icon} size={15} color={i === 2 ? '#FF6E6C' : '#845EC2'} />
              <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{s.title}</div>
            </div>
            <div style={{ fontSize: 11, color: '#6A7282', lineHeight: '15px', marginTop: 6 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ResidentAICard({ r, baseline, team, onOpenChat }) {
  const actions = baseline.recommendedActions || [];
  const statusLabel = baseline.status === 'evaluating'
    ? 'Evaluating'
    : baseline.status === 'fallback'
      ? 'Fallback'
      : `Confidence ${baseline.confidence}`;
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials={r.initials} seed={r.id} size={46} isResident />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#6A7282' }}>{baseline.skillName} · MRN {r.mrn} · Rm {r.room}</div>
        </div>
        <Chip tone={baseline.status === 'fallback' ? 'watch' : 'info'}>{statusLabel}</Chip>
        <RiskBadge level={r.risk} score={r.score} compact />
      </div>
      <AiEvidenceBlock title="Baseline Model" items={baseline.normal} />
      <AiEvidenceBlock title="Meaningful Change" items={baseline.deviations} />
      <AiEvidenceBlock title="Likely Implication" items={baseline.implications} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#52525B', letterSpacing: '0.05em', marginBottom: 8 }}>NEXT HUMAN DECISION</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#1C192E', lineHeight: '18px' }}>
              <Icon name={i === 0 ? 'arrowRight' : 'check'} size={14} color={i === 0 ? '#845EC2' : '#29BB89'} />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 2 }}>
        {team.slice(0, 5).map(u => (
          <button key={u.id} onClick={() => onOpenChat(r, u)} style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            border: '1px solid #E5E7EB', background: '#fff', borderRadius: 9999, padding: '7px 10px',
            font: '600 12px Inter', color: '#1C192E', cursor: 'pointer',
          }}>
            <Avatar initials={u.initials} seed={u.id} size={24} />
            {u.short}
          </button>
        ))}
      </div>
    </Card>
  );
}

function AiEvidenceBlock({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#52525B', letterSpacing: '0.05em', marginBottom: 6 }}>{title.toUpperCase()}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
            <span style={{ width: 5, height: 5, borderRadius: 9999, background: '#845EC2', marginTop: 6, flexShrink: 0 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillLearningCard() {
  return (
    <Card style={{ padding: 16, background: '#fff' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E7F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="fileText" size={16} color="#00795E" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1C192E' }}>Skill learning loop</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 4 }}>
            When the team accepts, edits, or rejects an AI recommendation, the pattern is saved as a reusable facility workflow: trigger, PCC evidence, intervention, outcome, and escalation policy.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <Chip tone="signed">72h return watch</Chip>
            <Chip tone="signed">Sepsis deviation review</Chip>
            <Chip tone="signed">Wound exudate escalation</Chip>
          </div>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { AIAssistantPage });
