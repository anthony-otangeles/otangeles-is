// Home page — DON facility-level operations view

function HomePage({ user, actions, onOpenResident, onOpenAction, onNav }) {
  const priority = priorityResidentsWithActions(actions);
  const critical = priority.filter(r => r.risk === 'critical');
  const high     = priority.filter(r => r.risk === 'high');
  const actionCounts = actionStatusCounts(actions);
  const openActions = (actions || [])
    .filter(a => a.status !== 'Completed')
    .slice()
    .sort((a, b) => {
      const rank = { Overdue: 0, Escalated: 1, 'No Action': 2, Assigned: 3, 'In Progress': 4 };
      return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    })
    .slice(0, 4);
  const domainCounts = RISK_DOMAINS.map(domain => ({
    domain,
    count: RESIDENTS.filter(r =>
      (r.drivers || []).includes(domain.id) ||
      residentEvidenceItems(r).some(item => item.domain === domain.id)
    ).length,
  })).filter(item => item.count > 0);
  const occPct = Math.round(FACILITY.occupied / FACILITY.beds * 100);
  const [showHuddle, setShowHuddle] = useState(false);
  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 34 : 42 }}>
      {/* Greeting + facility summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr', gap: 14,
      }}>
        <div style={{
          background: '#fff', border: '1px solid #EEEEEE',
          color: '#1C192E', borderRadius: 10, padding: isPhone ? 20 : 24,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#99A1AF' }}>{greeting()} · DON COMMAND CENTER</div>
              <div style={{ fontSize: isPhone ? 25 : 30, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6, color: '#1C192E' }}>Operational Intelligence</div>
              <div style={{ fontSize: 13, color: '#6A7282', marginTop: 4, lineHeight: '18px' }}>
                {FACILITY.name} · persistent continuity across resident risk, evidence, action ownership, and closure.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, width: isPhone ? '100%' : 'auto' }}>
              <Button variant="secondary" icon="message" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => setShowHuddle(true)}>Start Huddle</Button>
              <Button variant="primary" icon="check" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => onNav('actions')}>Open Actions</Button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isPhone ? 14 : 20, borderTop: '1px solid #EEEEEE', paddingTop: 18 }}>
            <HeroStat label="Beds occupied" value={`${FACILITY.occupied} / ${FACILITY.beds}`} sub={`${occPct}% capacity`} />
            <HeroStat label="High concern" value={critical.length + high.length} sub={`${critical.length} critical · ${high.length} high`} />
            <HeroStat label="Open actions" value={actionCounts.open} sub={`${actionCounts.overdue} overdue · ${actionCounts.escalated} escalated`} />
            <HeroStat label="Pending provider" value={FACILITY.pendingProvider} sub="2 over 4h" />
          </div>
        </div>

        <OperationalCognitionPanel actions={actions} compact={isPhone} />
      </div>

      {/* Priority list */}
      <div>
        <SectionHeader
          title="Top Priority Residents"
          subtitle="Ranked by overall risk, deterioration trend, and whether follow-through is owned."
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip tone="critical" dot>{critical.length} Critical</Chip>
              <Chip tone="high" dot>{high.length} High</Chip>
            </div>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {priority.slice(0, 5).map(r => (
            <OperationalResidentCard key={r.id} r={r} actions={actions} onClick={() => onOpenResident(r.id)} />
          ))}
          {priority.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>
              No resident risk signals are active right now.
            </Card>
          )}
        </div>
        <button onClick={() => onNav('residents')} style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 6, border: '1px solid #E5E7EB',
          background: '#fff', color: '#1C192E', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          View all {RESIDENTS.length} residents <Icon name="arrowRight" size={14} color="#1C192E" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) minmax(280px, 0.75fr)', gap: isPhone ? 18 : 24 }}>
        <div>
          <SectionHeader title="Unit Risk Heatmap" subtitle="Tap a unit to narrow the resident directory." />
          <UnitRiskHeatmap actions={actions} onSelectUnit={unit => { emitToast(`Opening residents for ${unit}.`, 'info'); onNav('residents'); }} />
        </div>
        <div>
          <SectionHeader title="Open Actions" subtitle="Execution and accountability queue." />
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              <ActionMiniStat label="Overdue" value={actionCounts.overdue} tone="critical" />
              <ActionMiniStat label="Unassigned" value={actionCounts.unassigned} tone="watch" />
              <ActionMiniStat label="Escalated" value={actionCounts.escalated} tone="high" />
              <ActionMiniStat label="Due today" value={actionCounts.dueToday} tone="info" />
            </div>
            {openActions.map(action => {
              const r = RESIDENTS.find(x => x.id === action.residentId);
              return (
                <button key={action.id} onClick={() => onOpenAction(action.id)} style={{
                  border: '1px solid #E5E7EB', borderRadius: 9, padding: 10,
                  background: '#fff', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <ActionStatusBadge status={action.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.type}</div>
                    <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{r ? `${r.name} · Rm ${r.room}` : 'Resident'} · {action.owner}</div>
                  </div>
                  <Icon name="chevronRight" size={14} color="#99A1AF" />
                </button>
              );
            })}
            <Button variant="secondary" icon="check" onClick={() => onNav('actions')}>View Action Queue</Button>
          </Card>
        </div>
      </div>

      <div>
        <SectionHeader title="What's New Today" subtitle="Risk domains are one unified intelligence system, not separate dashboards." />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 148 : 190}px, 1fr))`, gap: 10 }}>
          {domainCounts.map(item => (
            <RiskDomainSummaryCard key={item.domain.id} item={item} onClick={() => onNav('watchlist')} />
          ))}
        </div>
      </div>

      {showHuddle && <HuddleModal user={user} onClose={() => setShowHuddle(false)} onOpenResident={onOpenResident} />}
    </div>
  );
}

function ActionMiniStat({ label, value, tone }) {
  const color = tone === 'critical' ? '#B91C1C'
    : tone === 'high' ? '#C2410C'
    : tone === 'watch' ? '#92703A'
    : '#67568C';
  return (
    <div style={{ border: '1px solid #EEEEEE', borderRadius: 8, padding: 10, background: '#FAFAFC' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6A7282' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginTop: 2, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function RiskDomainSummaryCard({ item, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Icon name={RISK_CATEGORIES.find(c => c.id === item.domain.id)?.icon || 'activity'} size={18} color="#52525B" />
        <div style={{ fontSize: 24, fontWeight: 900, color: '#1C192E', lineHeight: 1 }}>{item.count}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E', lineHeight: '17px' }}>{item.domain.label}</div>
        <div style={{ fontSize: 11, color: '#6A7282', marginTop: 3 }}>residents with active signals</div>
      </div>
    </Card>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function HeroStat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#99A1AF', letterSpacing: '0.04em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.1, color: '#1C192E' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function BriefBullet({ text, tone }) {
  const c = tone === 'critical' ? '#B91C1C' : tone === 'high' ? '#C2410C' : '#92703A';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#1C192E' }}>
      <span style={{ width: 5, height: 5, borderRadius: 9999, background: c, marginTop: 7, flexShrink: 0 }} />
      <span style={{ lineHeight: '18px' }}>{text}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h2>
        {subtitle && <div style={{ fontSize: 13, color: '#6A7282', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function PriorityRow({ r, onClick }) {
  const tone = RISK[r.risk];
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 6, background: tone.dot }} />
        <div style={{ flex: 1, padding: isPhone ? '14px 14px' : '14px 18px', display: 'flex', alignItems: isPhone ? 'flex-start' : 'center', gap: isPhone ? 12 : 16, flexDirection: isPhone ? 'column' : 'row' }}>
          <div style={{ display: 'flex', gap: 12, width: isPhone ? '100%' : 'auto', alignItems: 'center' }}>
            <Avatar initials={r.initials} seed={r.id} size={44} isResident />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>
                <code style={{ fontFamily: 'JetBrains Mono' }}>{r.mrn}</code> · Rm {r.room} · {r.unit}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, fontSize: 13, color: '#6A7282', minWidth: 0, width: isPhone ? '100%' : 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isPhone ? 'normal' : 'nowrap', lineHeight: '18px' }}>
            {r.dx}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: isPhone ? '100%' : 'auto' }}>
            {r.drivers && r.drivers.slice(0, 3).map(id => {
              const cat = RISK_CATEGORIES.find(c => c.id === id);
              if (!cat) return null;
              return <Chip key={id} tone="todo">{cat.label.split(' / ')[0]}</Chip>;
            })}
          </div>
          {!isPhone && <div style={{ width: 1, height: 36, background: '#EEEEEE' }} />}
          <div style={{ display: 'flex', flexDirection: isPhone ? 'row' : 'column', alignItems: isPhone ? 'center' : 'flex-end', justifyContent: 'space-between', gap: 8, minWidth: isPhone ? 0 : 110, width: isPhone ? '100%' : 'auto' }}>
            <RiskBadge level={r.risk} score={r.score} />
            <div style={{ fontSize: 11, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name={r.trend === 'up' ? 'trendingUp' : r.trend === 'down' ? 'trendingDown' : 'arrowRight'} size={12} color={r.trend === 'up' ? '#E53E3E' : r.trend === 'down' ? '#29BB89' : '#6A7282'} />
              Trend {r.trend === 'up' ? 'rising' : r.trend === 'down' ? 'improving' : 'flat'}
            </div>
          </div>
          {!isPhone && <Icon name="chevronRight" size={18} color="#99A1AF" />}
        </div>
      </div>
    </Card>
  );
}

function RiskCategoryCard({ cat }) {
  return (
    <Card hoverable onClick={() => emitToast(`Filtering residents by ${cat.label} — ${cat.count} affected.`, 'info')} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={cat.icon} size={18} color="#52525B" />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#1C192E' }}>{cat.count}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1C192E' }}>{cat.label}</div>
        <div style={{ fontSize: 11, color: '#99A1AF', marginTop: 2 }}>residents at risk</div>
      </div>
    </Card>
  );
}

// ============== HUDDLE MODAL ==============
function HuddleModal({ user, onClose, onOpenResident }) {
  const onShift = TEST_USERS.filter(u => ['DON','ADON','UM','RN','LPN','CNA','NP','MD','MDS','IP','WC'].includes(u.short));
  const [selected, setSelected] = useState(onShift.slice(0, 6).map(u => u.id));
  const [topic, setTopic] = useState('Morning shift huddle · facility status');
  const [includeAll, setIncludeAll] = useState(false);
  const [agenda, setAgenda] = useState([
    { id: 'a1', text: 'Mr. Johnson — BP trend, wound exudate ↑', resident: 'r1' },
    { id: 'a2', text: 'Marjorie Bell — sepsis screen positive, awaiting provider', resident: 'r2' },
    { id: 'a3', text: 'Rafael Moreno — INR 3.8, warfarin held', resident: 'r3' },
  ]);
  const [newItem, setNewItem] = useState('');
  const [step, setStep] = useState('compose'); // compose | live
  const finalIds = includeAll ? onShift.map(u => u.id) : selected;
  const v = useViewport();
  const isPhone = v.isMobile;

  function toggle(id) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  function addItem() {
    if (!newItem.trim()) return;
    setAgenda(a => [...a, { id: 'a' + Date.now(), text: newItem.trim() }]);
    setNewItem('');
  }

  if (step === 'live') {
    return (
      <ModalShell title="Huddle in Progress" subtitle={`${finalIds.length} on call · started just now`} onClose={onClose} width={680}
        footer={<>
          <Button variant="ghost" onClick={onClose}>Leave</Button>
          <Button variant="lavender" icon="check" onClick={() => { emitToast(`Huddle ended — summary saved to ${agenda.length} resident records.`); onClose(); }}>End & Save Summary</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1C192E', borderRadius: 12, padding: 16, color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#FF6E6C', animation: 'ois-pulse 1.5s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>LIVE · 00:42</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <IconButton icon="micOff" color="#fff" />
                <IconButton icon="video" color="#fff" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {finalIds.slice(0, 8).map(id => {
                const u = TEST_USERS.find(x => x.id === id);
                if (!u) return null;
                return (
                  <div key={id} style={{ background: '#2D2A40', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Avatar initials={u.initials} seed={u.id} size={36} />
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{u.name.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 8 }}>AGENDA · LIVE CAPTURE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agenda.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#F5F2FD', borderRadius: 8, fontSize: 13 }}>
                  <Icon name="circle" size={6} color="#845EC2" style={{ marginTop: 6 }} />
                  <span style={{ flex: 1 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Start Huddle" subtitle="Quick standup with on-shift care team. Notes and resident follow-ups stay attached to the chart." onClose={onClose} width={680}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="lavender" icon="video" onClick={() => setStep('live')}>Start Now ({finalIds.length})</Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>TOPIC</div>
          <Input value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>AGENDA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {agenda.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, padding: '8px 10px', border: '1px solid #EEEEEE', borderRadius: 6, fontSize: 13, alignItems: 'center' }}>
                <Icon name="fileText" size={12} color="#845EC2" />
                <span style={{ flex: 1 }}>{a.text}</span>
                <IconButton icon="x" size={24} onClick={() => setAgenda(agenda.filter(x => x.id !== a.id))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Input placeholder="Add agenda item…" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} style={{ flex: 1 }} />
            <Button variant="secondary" icon="plus" onClick={addItem}>Add</Button>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282' }}>PARTICIPANTS · {finalIds.length} of {onShift.length} on shift</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Checkbox checked={includeAll} onChange={e => setIncludeAll(e.target.checked)} />
              Everyone on shift
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 6, maxHeight: 200, overflowY: 'auto', border: '1px solid #EEEEEE', borderRadius: 8, padding: 8 }}>
            {onShift.map(u => {
              const checked = includeAll || selected.includes(u.id);
              return (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6,
                  background: checked ? '#F5F2FD' : 'transparent', cursor: includeAll ? 'not-allowed' : 'pointer',
                }}>
                  <Checkbox checked={checked} onChange={() => !includeAll && toggle(u.id)} disabled={includeAll} />
                  <Avatar initials={u.initials} seed={u.id} size={26} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.short}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

Object.assign(window, { HomePage });
