// Operational intelligence layer — resident risk, actions, continuity thread

const ACTION_STATUS_TONES = {
  'No Action': 'critical',
  Assigned: 'pending',
  'In Progress': 'info',
  Overdue: 'critical',
  Completed: 'signed',
  Escalated: 'high',
  Reviewed: 'stable',
  'Monitoring Continued': 'watch',
};

function riskLabelForResident(r) {
  if (r.risk === 'critical' || r.risk === 'high') return 'High';
  if (r.risk === 'watch') return 'Moderate';
  return 'Low';
}

function riskToneForResident(r) {
  if (r.risk === 'critical') return 'critical';
  if (r.risk === 'high') return 'high';
  if (r.risk === 'watch') return 'watch';
  return 'stable';
}

function trendLabelForResident(r) {
  if (r.trend === 'up') return 'worsening';
  if (r.trend === 'down') return 'improving';
  return 'stable';
}

function domainById(id) {
  return RISK_DOMAINS.find(d => d.id === id) || RISK_DOMAINS[0];
}

function domainForIssue(issue) {
  if (!issue) return 'condition';
  const map = {
    sepsis: 'sepsis',
    vitals: 'condition',
    wound: 'skin',
    med: 'med',
    lab: 'med',
    fall: 'fall',
    nutrition: 'nutrition',
    rehab: 'rehab',
  };
  return map[issue.kind] || 'condition';
}

function residentActions(actions, residentId) {
  return (actions || []).filter(a => a.residentId === residentId);
}

function residentActionStatus(r, actions) {
  const list = residentActions(actions, r.id);
  if (!list.length) return 'No Action';
  if (list.some(a => a.status === 'Overdue')) return 'Overdue';
  if (list.some(a => a.status === 'Escalated')) return 'Escalated';
  if (list.some(a => a.status === 'No Action')) return 'No Action';
  if (list.some(a => a.status === 'In Progress')) return 'In Progress';
  if (list.some(a => a.status === 'Assigned')) return 'Assigned';
  if (list.every(a => a.status === 'Completed')) return 'Completed';
  return list[0].status;
}

function actionStatusCounts(actions) {
  const counts = { overdue: 0, unassigned: 0, escalated: 0, dueToday: 0, open: 0, completed: 0 };
  (actions || []).forEach(a => {
    if (a.status === 'Overdue') counts.overdue += 1;
    if (a.status === 'No Action') counts.unassigned += 1;
    if (a.status === 'Escalated') counts.escalated += 1;
    if (/today|shift|overdue/i.test(a.due)) counts.dueToday += 1;
    if (a.status === 'Completed') counts.completed += 1;
    else counts.open += 1;
  });
  return counts;
}

function priorityResidentsWithActions(actions) {
  const order = { critical: 0, high: 1, watch: 2, stable: 3 };
  return [...RESIDENTS].sort((a, b) => {
    const statusRank = { Overdue: 0, Escalated: 1, 'No Action': 2, Assigned: 3, 'In Progress': 4, Completed: 5, Reviewed: 6 };
    const aStatus = residentActionStatus(a, actions);
    const bStatus = residentActionStatus(b, actions);
    return (order[a.risk] - order[b.risk])
      || ((statusRank[aStatus] ?? 9) - (statusRank[bStatus] ?? 9))
      || b.score - a.score;
  });
}

function residentEvidenceItems(r) {
  const issueEvidence = (r.issues || []).map(issue => ({
    id: issue.id,
    domain: domainForIssue(issue),
    title: issue.title,
    detail: issue.detail,
    source: issue.source,
    time: issue.time,
    severity: issue.severity,
  }));
  const noteEvidence = (NOTES_SEED[r.id] || []).slice(0, 3).map(note => ({
    id: note.id,
    domain: /wound|dressing|exudate/i.test(note.body) ? 'skin' : /held|dose|furosemide/i.test(note.body) ? 'med' : 'condition',
    title: 'Nursing note signal',
    detail: note.body,
    source: 'Nursing note',
    time: note.time,
    severity: 'watch',
  }));
  return [...issueEvidence, ...noteEvidence];
}

function residentTimelineEvents(r, actions) {
  const issues = (r.issues || []).slice(0, 3).map((issue, i) => ({
    id: `issue-${issue.id}`,
    when: i === 0 ? 'Today' : issue.time,
    title: issue.title,
    detail: issue.detail,
  }));
  const actionEvents = residentActions(actions, r.id).slice(0, 3).map(action => ({
    id: `action-${action.id}`,
    when: action.due,
    title: `${action.status}: ${action.type}`,
    detail: `${action.owner} owns this follow-through.`,
  }));
  return [
    { id: 'baseline', when: 'Baseline', title: r.dx, detail: `Code status: ${r.code}.` },
    ...issues,
    ...actionEvents,
  ];
}

function suggestedActionForResident(r) {
  const domainId = (r.drivers && r.drivers[0]) || domainForIssue((r.issues || [])[0]);
  const domain = domainById(domainId);
  return {
    type: domain.action,
    domain: domain.id,
    ownerRole: domain.owner,
    priority: riskLabelForResident(r),
    due: riskLabelForResident(r) === 'High' ? 'This shift' : 'Today',
    reason: `${domain.label} is active for ${r.name}; follow-through needs an accountable owner.`,
  };
}

function ActionStatusBadge({ status }) {
  return <Chip tone={ACTION_STATUS_TONES[status] || 'todo'} dot>{status}</Chip>;
}

function DomainChip({ domainId, label }) {
  const domain = domainById(domainId);
  return <Chip tone="todo">{label || domain.short}</Chip>;
}

function OperationalResidentCard({ r, actions, onClick, focusDomain }) {
  const status = residentActionStatus(r, actions);
  const evidence = residentEvidenceItems(r).filter(item => !focusDomain || item.domain === focusDomain);
  const drivers = focusDomain
    ? evidence.slice(0, 3).map(item => item.title)
    : (r.drivers || []).slice(0, 4).map(id => domainById(id).short);
  const tone = RISK[r.risk] || RISK.watch;
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 5, background: tone.dot }} />
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Avatar initials={r.initials} seed={r.id} size={38} isResident />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>{r.name}</div>
                <RiskBadge level={r.risk} score={r.score} compact />
              </div>
              <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>Room {r.room} · {r.unit}</div>
            </div>
            <ActionStatusBadge status={status} />
          </div>
          <div style={{ fontSize: 13, color: '#1C192E', lineHeight: '18px', fontWeight: 700 }}>
            {riskLabelForResident(r)} · {trendLabelForResident(r)} over 24-48h
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(drivers.length ? drivers : ['No active driver beyond routine monitoring']).slice(0, 4).map((driver, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
                <span style={{ width: 5, height: 5, borderRadius: 9999, background: tone.dot, marginTop: 6, flexShrink: 0 }} />
                <span>{driver}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(r.drivers || []).slice(0, 4).map(id => <DomainChip key={id} domainId={id} />)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function UnitRiskHeatmap({ actions, onSelectUnit }) {
  const units = ['East · Skilled', 'West · LTC', 'Memory Care'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
      {units.map(unit => {
        const residents = RESIDENTS.filter(r => r.unit === unit);
        const high = residents.filter(r => ['critical','high'].includes(r.risk)).length;
        const overdue = residents.filter(r => residentActionStatus(r, actions) === 'Overdue').length;
        const level = high > 1 || overdue ? 'High' : high ? 'Moderate' : 'Stable';
        const color = level === 'High' ? '#E53E3E' : level === 'Moderate' ? '#E9C05F' : '#29BB89';
        return (
          <button key={unit} onClick={() => onSelectUnit(unit)} style={{
            minWidth: 0, border: `1px solid ${color}`, background: '#fff', borderRadius: 10,
            padding: '12px 10px', textAlign: 'left', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit}</div>
            <div style={{ color, fontSize: 15, fontWeight: 900, marginTop: 4 }}>{level}</div>
            <div style={{ fontSize: 11, color: '#6A7282', marginTop: 3 }}>{high} high · {overdue} overdue</div>
          </button>
        );
      })}
    </div>
  );
}

function OperationalCognitionPanel({ resident, actions, compact }) {
  const [step, setStep] = useState(0);
  const steps = [
    'Observing clinical changes, handoffs, and open work.',
    'Structuring risk drivers around resident continuity threads.',
    'Checking whether high-risk changes have accountable owners.',
    'Preserving context for huddle, escalation, and closure.',
  ];
  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % steps.length), 2200);
    return () => clearInterval(timer);
  }, []);
  const target = resident || priorityResidentsWithActions(actions)[0];
  return (
    <Card style={{ padding: compact ? 12 : 14, borderLeft: '4px solid #67568C', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={16} color="#67568C" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>Operational Cognition Layer</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 2 }}>{steps[step]}</div>
        </div>
        <Chip tone="info" dot>Live</Chip>
      </div>
      {target && (
        <div style={{ padding: 10, background: '#FAFAFC', borderRadius: 8, border: '1px solid #EEEEEE' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#67568C', letterSpacing: '0.05em' }}>CURRENT CONTEXT</div>
          <div style={{ fontSize: 13, color: '#1C192E', fontWeight: 800, marginTop: 4 }}>{target.name} · {residentActionStatus(target, actions)}</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 3 }}>{suggestedActionForResident(target).reason}</div>
        </div>
      )}
    </Card>
  );
}

function ContinuityThreadPanel({ r, actions, onOpenAction }) {
  const timeline = residentTimelineEvents(r, actions);
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Continuity Thread</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, lineHeight: '17px' }}>
          Persistent operational memory for communication, decisions, escalations, AI observations, and closure.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeline.map((event, i) => (
          <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: i === timeline.length - 1 ? '#67568C' : '#D1D5DC', marginTop: 4 }} />
              {i < timeline.length - 1 && <span style={{ width: 1, flex: 1, background: '#E5E7EB', marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#99A1AF', fontWeight: 900 }}>{event.when}</div>
              <div style={{ fontSize: 13, color: '#1C192E', fontWeight: 800, marginTop: 2 }}>{event.title}</div>
              <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 2 }}>{event.detail}</div>
            </div>
          </div>
        ))}
      </div>
      {residentActions(actions, r.id).map(action => (
        <button key={action.id} onClick={() => onOpenAction && onOpenAction(action.id)} style={{
          border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, padding: 10,
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer',
        }}>
          <Icon name="check" size={14} color="#00795E" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
            <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{action.owner} · {action.status}</div>
          </div>
          <Icon name="chevronRight" size={14} color="#99A1AF" />
        </button>
      ))}
    </Card>
  );
}

function EvidenceSummaryPanel({ r }) {
  const grouped = residentEvidenceItems(r).reduce((acc, item) => {
    acc[item.domain] = acc[item.domain] || [];
    acc[item.domain].push(item);
    return acc;
  }, {});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.keys(grouped).map(domainId => (
        <Card key={domainId} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E' }}>{domainById(domainId).label}</div>
            <DomainChip domainId={domainId} />
          </div>
          {grouped[domainId].map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: (RISK[item.severity] || RISK.watch).dot, marginTop: 6 }} />
              <span><b style={{ color: '#1C192E' }}>{item.title}</b> · {item.detail} <span style={{ color: '#99A1AF' }}>({item.source} · {item.time})</span></span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function SuggestedActionPanel({ r, actions, onAssign, onOpenAction }) {
  const suggestion = suggestedActionForResident(r);
  const [notes, setNotes] = useState('');
  const open = residentActions(actions, r.id).filter(a => a.status !== 'Completed');
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '4px solid #00C9A7' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Suggested Action</div>
        <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 3 }}>AI converts the interpreted risk into accountable follow-through. Humans still decide.</div>
      </div>
      <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 10, background: '#FAFAFC', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DomainChip domainId={suggestion.domain} />
          <Chip tone={suggestion.priority === 'High' ? 'critical' : 'watch'}>{suggestion.priority}</Chip>
          <Chip tone="todo">{suggestion.due}</Chip>
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>{suggestion.type}</div>
        <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>Suggested owner: <b>{suggestion.ownerRole}</b></div>
        <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>{suggestion.reason}</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add handoff notes..." style={{
          minHeight: 70, border: '1px solid #E5E7EB', borderRadius: 8, padding: 10,
          font: '13px Inter', resize: 'vertical', outline: 0, color: '#1C192E',
        }} />
        <Button variant="primary" icon="check" onClick={() => onAssign && onAssign(r.id, { ...suggestion, notes })}>Assign & Track</Button>
      </div>
      {open.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#52525B', letterSpacing: '0.06em' }}>OPEN FOLLOW-THROUGH</div>
          {open.map(action => (
            <button key={action.id} onClick={() => onOpenAction && onOpenAction(action.id)} style={{
              border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, padding: 10,
              display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
            }}>
              <ActionStatusBadge status={action.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
                <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{action.owner} · {action.due}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

Object.assign(window, {
  ACTION_STATUS_TONES,
  riskLabelForResident,
  riskToneForResident,
  trendLabelForResident,
  domainById,
  domainForIssue,
  residentActions,
  residentActionStatus,
  actionStatusCounts,
  priorityResidentsWithActions,
  residentEvidenceItems,
  residentTimelineEvents,
  suggestedActionForResident,
  ActionStatusBadge,
  DomainChip,
  OperationalResidentCard,
  UnitRiskHeatmap,
  OperationalCognitionPanel,
  ContinuityThreadPanel,
  EvidenceSummaryPanel,
  SuggestedActionPanel,
});
