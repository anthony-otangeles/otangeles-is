// Changes feed + Watchlist pages

function ChangesPage({ onOpenResident, onOpenIssue }) {
  const [filter, setFilter] = useState('all');
  const priorityRank = { critical: 0, high: 1, watch: 2, stable: 3 };
  const severityCounts = FACILITY_CHANGES.reduce((acc, c) => {
    acc[c.severity] = (acc[c.severity] || 0) + 1;
    return acc;
  }, {});
  const filtered = FACILITY_CHANGES
    .filter(c => filter === 'all' || c.severity === filter)
    .slice()
    .sort((a, b) => (priorityRank[a.severity] ?? 9) - (priorityRank[b.severity] ?? 9));
  const v = useViewport();
  const isPhone = v.isMobile;
  const topChange = filtered[0];
  const topResident = topChange ? RESIDENTS.find(x => x.id === topChange.residentId) : null;
  const [alertAgentRun, setAlertAgentRun] = useState({ status: 'idle', steps: [] });

  useEffect(() => {
    let cancelled = false;
    if (!topResident) {
      setAlertAgentRun({ status: 'idle', steps: [] });
      return;
    }

    setAlertAgentRun({ status: 'running', steps: [] });
    runResidentAgentSkill({
      skillId: RESIDENT_BASELINE_SKILL_ID,
      residentId: topResident.id,
      stepDelay: 160,
      onStep: (step, steps) => {
        if (!cancelled) setAlertAgentRun({ status: 'running', steps });
      },
    }).then(run => {
      if (!cancelled) setAlertAgentRun({ status: 'complete', steps: run.steps, assessment: run.assessment });
    }).catch(error => {
      if (!cancelled) setAlertAgentRun({ status: 'error', steps: [{ id: 'alert-agent-error', status: 'error', label: 'Alert agent failed', detail: error.message, time: 'now' }] });
    });

    return () => { cancelled = true; };
  }, [topResident ? `${filter}-${topResident.id}` : filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Changes"
        subtitle="Clinical deviations across all residents in the last 24 hours. Click any card to open the resident."
        actions={[
          <Button key="filter" variant="secondary" icon="filter" onClick={() => emitToast('Advanced filters coming soon.', 'info')}>Filter</Button>,
        ]}
      />

      <Card style={{ padding: isPhone ? 12 : 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <ChangeFilterGrid
          value={filter}
          onChange={setFilter}
          counts={{ all: FACILITY_CHANGES.length, ...severityCounts }}
          isPhone={isPhone}
        />
        <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6, width: isPhone ? '100%' : 'auto', justifyContent: isPhone ? 'flex-start' : 'flex-end' }}>
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#29BB89' }} />
          Live · updated 14s ago
        </div>
      </Card>

      {topResident && (
        <AgentExecutionLog
          steps={alertAgentRun.steps}
          title="Alert Agent Trace"
          subtitle={`${topResident.name} - top ${filter === 'all' ? 'priority' : filter} alert is being checked with tool calls.`}
          compact={isPhone}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 260 : 300}px, 1fr))`, gap: 12, alignItems: 'stretch' }}>
        {filtered.map((c, i) => {
          const r = RESIDENTS.find(x => x.id === c.residentId);
          return <ChangeFeedCard key={i} c={c} r={r} onClick={() => onOpenIssue ? onOpenIssue(r.id, c.id || (r.issues && r.issues[0] && r.issues[0].id)) : onOpenResident(r.id)} />;
        })}
        {filtered.length === 0 && (
          <Card style={{ padding: 32, textAlign: 'center', color: '#6A7282', fontSize: 13, gridColumn: '1 / -1' }}>
            No {filter !== 'all' ? filter : ''} changes right now.
          </Card>
        )}
      </div>
    </div>
  );
}

function ChangeFilterGrid({ value, onChange, counts, isPhone }) {
  const options = [
    { id: 'all', label: 'All', tone: 'todo' },
    { id: 'critical', label: 'Critical', tone: 'critical' },
    { id: 'high', label: 'High', tone: 'high' },
    { id: 'watch', label: 'Watch', tone: 'watch' },
    { id: 'stable', label: 'Stable', tone: 'stable' },
  ];
  return (
    <div style={{
      flex: 1, minWidth: 0, display: 'grid',
      gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
      gap: 8,
    }}>
      {options.map(o => {
        const active = value === o.id;
        const tone = o.tone === 'todo' ? { dot: '#845EC2', bg: '#F5F2FD', fg: '#67568C' } : RISK[o.tone];
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            minWidth: 0, minHeight: 42, borderRadius: 8,
            border: `1px solid ${active ? tone.dot : '#E5E7EB'}`,
            background: active ? tone.bg : '#fff',
            color: active ? tone.fg : '#52525B',
            cursor: 'pointer', padding: '8px 9px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            font: '700 12px Inter',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: tone.dot, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
            </span>
            <span style={{
              minWidth: 22, height: 22, padding: '0 6px', borderRadius: 9999,
              background: active ? '#fff' : '#F4F4F5', color: active ? tone.fg : '#6A7282',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{counts[o.id] || 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChangeFeedCard({ c, r, onClick }) {
  const sev = RISK[c.severity] || RISK.watch;
  const iconMap = { vitals: 'activity', wound: 'heart', med: 'pill', fall: 'shield', lab: 'fileText', nutrition: 'droplet', sepsis: 'alertTriangle', rehab: 'trendingDown' };
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 4, background: sev.dot, flexShrink: 0 }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar initials={r.initials} seed={r.id} size={40} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#6A7282' }}>Rm {r.room} · <code style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>{r.mrn}</code></div>
          </div>
          <RiskBadge level={c.severity} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon name={iconMap[c.kind] || 'activity'} size={13} color={sev.fg} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1C192E', lineHeight: '19px' }}>{c.title}</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 4, lineHeight: '17px' }}>{c.detail}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EEEEEE', paddingTop: 10, marginTop: 'auto' }}>
          <div style={{ fontSize: 11, color: '#99A1AF' }}>{c.source} · {c.time}</div>
          <Icon name="chevronRight" size={16} color="#99A1AF" />
        </div>
      </div>
    </Card>
  );
}

// ============== WATCHLIST ==============

function WatchlistPage({ actions, onOpenResident }) {
  const [active, setActive] = useState('condition');
  const v = useViewport();
  const isPhone = v.isMobile;
  const domain = domainById(active);
  const residents = priorityResidentsWithActions(actions).filter(r =>
    (r.drivers || []).includes(active) ||
    residentEvidenceItems(r).some(item => item.domain === active)
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Watchlists"
        subtitle="Domain-focused views inside the same operational intelligence system. Residents stay ranked by overall risk."
        actions={[
          <Button key="actions" variant="primary" icon="check" onClick={() => emitToast('Use Actions to assign and close follow-through from each resident.', 'info')}>Track Follow-through</Button>,
        ]}
      />

      <Card style={{ padding: 12, display: 'flex', gap: 8, overflowX: 'auto' }}>
        {RISK_DOMAINS.map(d => {
          const count = RESIDENTS.filter(r =>
            (r.drivers || []).includes(d.id) ||
            residentEvidenceItems(r).some(item => item.domain === d.id)
          ).length;
          const selected = active === d.id;
          return (
            <button key={d.id} onClick={() => setActive(d.id)} style={{
              flex: '0 0 auto',
              minWidth: isPhone ? 128 : 150,
              borderRadius: 10,
              border: `1px solid ${selected ? '#00C9A7' : '#E5E7EB'}`,
              background: selected ? '#E7F5EF' : '#fff',
              color: selected ? '#00795E' : '#1C192E',
              padding: '10px 11px',
              cursor: 'pointer',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.short}</span>
                <span style={{
                  minWidth: 22, height: 22, borderRadius: 9999,
                  background: selected ? '#fff' : '#F4F4F5',
                  color: selected ? '#00795E' : '#6A7282',
                  fontSize: 11, fontWeight: 900,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{count}</span>
              </div>
              <div style={{ fontSize: 11, color: selected ? '#3F6B4E' : '#6A7282', marginTop: 5, lineHeight: '15px' }}>{d.label}</div>
            </button>
          );
        })}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) 300px', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionHeader
            title={domain.label}
            subtitle={`${residents.length} residents with active signals. Cards show domain evidence, action status, and global risk priority.`}
          />
          {residents.map(r => (
            <OperationalResidentCard key={r.id} r={r} actions={actions} focusDomain={active} onClick={() => onOpenResident(r.id)} />
          ))}
          {residents.length === 0 && (
            <Card style={{ padding: 28, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>
              No residents are currently on this watchlist.
            </Card>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OperationalCognitionPanel actions={actions} compact={isPhone} />
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>Suggested owner rule</div>
            <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
              {domain.label} signals normally route to <b>{domain.owner}</b> with a recommended action of <b>{domain.action}</b>.
            </div>
            <DomainChip domainId={active} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function WatchlistCard({ w, onClick }) {
  const tone = RISK[w.tone] || (w.tone === 'info' ? { fg: '#0081CF' }
                            : w.tone === 'pending' ? { fg: '#B58420' }
                            : w.tone === 'coral' ? { fg: '#FF6E6C' }
                            : { fg: '#67568C' });
  return (
    <Card hoverable onClick={onClick} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Icon name={w.icon} size={22} color={tone.fg} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#1C192E', letterSpacing: '-0.02em', lineHeight: 1 }}>{w.count}</span>
          <span style={{ fontSize: 13, color: '#6A7282' }}>residents</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1C192E' }}>{w.label}</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 4, lineHeight: '17px' }}>{w.desc}</div>
      </div>
    </Card>
  );
}

function WatchlistDetail({ list, onBack, onOpen }) {
  // Pick a plausible subset of residents
  const subset = useMemo(() => {
    const map = {
      admits:    RESIDENTS.filter(r => ['r3','r4','r7'].includes(r.id)),
      returns:   RESIDENTS.filter(r => ['r1','r3'].includes(r.id)),
      fall:      RESIDENTS.filter(r => (r.drivers || []).includes('fall') || r.score >= 40).slice(0, 5),
      sepsis:    RESIDENTS.filter(r => ['r2','r1'].includes(r.id)),
      wound:     RESIDENTS.filter(r => (r.drivers || []).includes('skin')),
      iso:       RESIDENTS.filter(r => ['r2'].includes(r.id)),
      nutrition: RESIDENTS.filter(r => (r.drivers || []).includes('nutrition')),
      pendingMd: RESIDENTS.filter(r => ['r1','r3','r4'].includes(r.id)),
      meds:      RESIDENTS.filter(r => (r.drivers || []).includes('med')),
      discharge: RESIDENTS.filter(r => ['r7','r9'].includes(r.id)),
    };
    return map[list.id] || RESIDENTS.slice(0, 4);
  }, [list.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Watchlist
      </button>
      <PageHeader title={list.label} subtitle={list.desc} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="ois-stack" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ fontSize: 11, color: '#6A7282', fontWeight: 700, textAlign: 'left', letterSpacing: '0.04em', background: '#FAFAFA' }}>
              <th style={{ padding: '12px 18px' }}>RESIDENT</th>
              <th style={{ padding: '12px 18px' }}>LOCATION</th>
              <th style={{ padding: '12px 18px' }}>RISK</th>
              <th style={{ padding: '12px 18px' }}>WHY ON LIST</th>
              <th style={{ padding: '12px 18px' }}></th>
            </tr>
          </thead>
          <tbody>
            {subset.map(r => (
              <tr key={r.id} onClick={() => onOpen(r.id)} style={{ borderTop: '1px solid #EEEEEE', cursor: 'pointer' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={r.initials} seed={r.id} size={36} isResident />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: '#6A7282' }}>{r.age} · {r.sex}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 18px', fontSize: 13 }}>Rm {r.room}<br/><span style={{ color: '#6A7282', fontSize: 12 }}>{r.unit}</span></td>
                <td style={{ padding: '14px 18px' }}><RiskBadge level={r.risk} score={r.score} /></td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: '#6A7282' }}>{r.dx}</td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}><Icon name="chevronRight" size={16} color="#99A1AF" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============== CHAT POPOVER ==============

function ChatDock({ chats, onClose, onSendCall, mobile }) {
  if (!chats || chats.length === 0) return null;
  const visibleChats = mobile ? chats.slice(-1) : chats;
  return (
    <div style={{
      position: 'fixed',
      left: mobile ? 8 : 'auto',
      right: mobile ? 8 : 24,
      bottom: mobile ? 'calc(76px + env(safe-area-inset-bottom))' : 0,
      zIndex: 60,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      pointerEvents: 'none',
    }}>
      {visibleChats.map(c => <ChatWindow key={c.id} chat={c} mobile={mobile} onClose={() => onClose(c.id)} onCall={() => onSendCall(c.id)} />)}
    </div>
  );
}

function ChatWindow({ chat, onClose, onCall, mobile }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(chat.messages || []);
  const [callState, setCallState] = useState(null); // null | 'voice' | 'video' | 'summary'
  const [callSummary, setCallSummary] = useState(null);
  const me = TEST_USERS[0];
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function send() {
    if (!draft.trim()) return;
    setMessages(m => [...m, { id: 'm' + Date.now(), from: 'me', body: draft, time: 'now' }]);
    setDraft('');
    setTimeout(() => {
      setMessages(m => [...m, { id: 'r' + Date.now(), from: 'them', body: 'Got it — checking now.', time: 'now' }]);
    }, 900);
  }

  function startCall(kind) {
    setCallState(kind);
    setTimeout(() => {
      setCallState('summary');
      setCallSummary({
        duration: kind === 'video' ? '6m 42s' : '3m 18s',
        summary: `Discussed ${chat.resident.name}'s recent change in vitals. ${chat.user.name.split(' ')[0]} will recheck BP at the top of the next hour and notify the provider if SBP < 90. Action items captured to the Care Plan.`,
        actions: ['Recheck BP at next hour', 'Notify provider if SBP < 90', 'Document in care plan'],
      });
    }, 1400);
  }

  return (
    <div style={{
      width: mobile ? '100%' : 340, height: mobile ? 'min(68vh, 500px)' : 480, background: '#fff', borderRadius: mobile ? 12 : '12px 12px 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
      border: '1px solid #E5E7EB', borderBottom: mobile ? '1px solid #E5E7EB' : 0, overflow: 'hidden',
      pointerEvents: 'auto',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #EEEEEE', background: '#1C192E', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={chat.user.initials} seed={chat.user.id} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.user.name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Re: {chat.resident.name}</div>
        </div>
        <button onClick={() => startCall('voice')} title="Voice call" style={iconBtnLight}><Icon name="phone" size={14} color="#fff" /></button>
        <button onClick={() => startCall('video')} title="Video call" style={iconBtnLight}><Icon name="video" size={14} color="#fff" /></button>
        <button onClick={onClose} style={iconBtnLight}><Icon name="x" size={14} color="#fff" /></button>
      </div>

      {callState === 'voice' || callState === 'video' ? (
        <div style={{ flex: 1, background: '#1C192E', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 16 }}>
          <Avatar initials={chat.user.initials} seed={chat.user.id} size={72} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>{chat.user.name}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{callState === 'video' ? 'Video call' : 'Voice call'} · connecting…</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Avatar initials={me.initials} seed={me.id} size={36} />
            <div style={{ width: 36, height: 36, borderRadius: 9999, background: '#FF6E6C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="mic" size={12} color="#fff" /> Call capture active — patient {chat.resident.name} auto-tagged.
          </div>
        </div>
      ) : callState === 'summary' && callSummary ? (
        <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="fileText" size={14} color="#845EC2" />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#67568C', letterSpacing: '0.04em' }}>CALL SUMMARY · {callSummary.duration}</div>
          </div>
          <div style={{ fontSize: 13, lineHeight: '18px', padding: 12, background: '#F5F2FD', borderRadius: 8 }}>{callSummary.summary}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>ACTION ITEMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {callSummary.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <Icon name="check" size={14} color="#29BB89" /> {a}
                </div>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" icon="fileText" onClick={() => { setCallState(null); setCallSummary(null); }}>Save to Care Plan</Button>
        </div>
      ) : (
        <div ref={scrollRef} style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#FAFAFA' }}>
          <div style={{ alignSelf: 'center', fontSize: 11, color: '#99A1AF', background: '#fff', padding: '4px 10px', borderRadius: 9999, border: '1px solid #EEEEEE' }}>
            Resident <b>{chat.resident.name}</b> auto-tagged
          </div>
          {messages.map(m => (
            <div key={m.id} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                padding: '8px 12px', borderRadius: m.from === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.from === 'me' ? '#845EC2' : '#fff', color: m.from === 'me' ? '#fff' : '#1C192E',
                fontSize: 13, lineHeight: '18px', border: m.from === 'me' ? 0 : '1px solid #EEEEEE',
              }}>{m.body}</div>
            </div>
          ))}
        </div>
      )}

      {!callState && (
        <div style={{ padding: 8, borderTop: '1px solid #EEEEEE', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 9999, padding: '8px 14px', font: '13px Inter', outline: 0 }} />
          <button onClick={send} style={{ width: 32, height: 32, borderRadius: 9999, border: 0, background: '#845EC2', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtnLight = {
  width: 26, height: 26, borderRadius: 9999, border: 0,
  background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

Object.assign(window, { ChangesPage, WatchlistPage, ChatDock });
