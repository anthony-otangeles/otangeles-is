// Huddle page — facility-wide huddle history + saved summaries

const HUDDLE_HISTORY = [
  {
    id: 'h1', title: 'Morning shift huddle · facility status', kind: 'shift',
    when: 'Today · 7:15 AM', duration: '12m 04s', host: 'u1',
    participants: ['u1','u2','u3','u4','u5','u6','u9','u11'],
    residents: ['r1','r2','r3'],
    summary: 'Reviewed overnight escalations. Sepsis pathway initiated for M. Bell — IV fluids, blood cultures drawn. Mr. Johnson awaiting NP assessment. Wound care plan updated for two residents. Day shift will recheck vitals on r1 q2h until trending stable.',
    actions: [
      { text: 'Recheck Mr. Johnson BP q2h until SBP > 100', owner: 'u4' },
      { text: 'Confirm NP visit for M. Bell by 09:00', owner: 'u11' },
      { text: 'Update care plan for R. Moreno — INR target 2-3', owner: 'u2' },
    ],
    tags: ['Critical', 'Sepsis', 'Wound'],
  },
  {
    id: 'h2', title: 'Wound care rounds', kind: 'clinical',
    when: 'Today · 6:02 AM', duration: '8m 47s', host: 'u9',
    participants: ['u9','u4','u5','u11'],
    residents: ['r1','r5','r8'],
    summary: 'Stage 3 sacral wound on r1 with increased exudate — escalated to NP. Two residents transitioned to maintenance protocol. Photos uploaded to chart.',
    actions: [
      { text: 'Photograph r1 sacral wound q24h', owner: 'u9' },
      { text: 'Order alginate dressing for r5', owner: 'u11' },
    ],
    tags: ['Wound', 'Skin'],
  },
  {
    id: 'h3', title: 'Sepsis pathway · Marjorie Bell', kind: 'incident',
    when: 'Yesterday · 11:42 PM', duration: '14m 18s', host: 'u11',
    participants: ['u11','u4','u5','u1'],
    residents: ['r2'],
    summary: 'qSOFA reached 2 at 23:15. Cultures drawn, ceftriaxone started per standing order. Family notified. Continuous monitoring overnight; if SBP < 90 transfer to acute care.',
    actions: [
      { text: 'Q1h vitals overnight on r2', owner: 'u4' },
      { text: 'Notify on-call MD if any deterioration', owner: 'u5' },
    ],
    tags: ['Critical', 'Sepsis'],
  },
  {
    id: 'h4', title: 'Evening shift handoff', kind: 'shift',
    when: 'Yesterday · 7:00 PM', duration: '9m 31s', host: 'u3',
    participants: ['u3','u4','u5','u6','u9'],
    residents: ['r1','r3','r7'],
    summary: 'Quiet evening expected. Three residents flagged for overnight checks: r1 (wound), r3 (INR), r7 (post-op day 2). All families updated on care plans.',
    actions: [
      { text: 'Q4h neuro checks on r7 until stable', owner: 'u5' },
      { text: 'Hold warfarin on r3 pending AM lab', owner: 'u4' },
    ],
    tags: ['Shift', 'Routine'],
  },
  {
    id: 'h5', title: 'Care plan review · Eleanor Park', kind: 'careplan',
    when: 'Yesterday · 2:30 PM', duration: '22m 09s', host: 'u2',
    participants: ['u2','u7','u11','u14','u18'],
    residents: ['r8'],
    summary: 'Quarterly care plan meeting. Family present. Goals updated: increase ambulation to 50ft x 2/day, swallow study scheduled for Friday. PO intake improving — dietitian to monitor weekly weights.',
    actions: [
      { text: 'Schedule swallow study Friday', owner: 'u14' },
      { text: 'Weekly weight tracking', owner: 'u18' },
      { text: 'Update family weekly via portal', owner: 'u15' },
    ],
    tags: ['Care plan', 'Quarterly'],
  },
  {
    id: 'h6', title: 'IPCP weekly · IP review', kind: 'ipcp',
    when: '2 days ago · 1:00 PM', duration: '18m 42s', host: 'u8',
    participants: ['u8','u1','u3','u11'],
    residents: ['r2'],
    summary: 'No new infection clusters. r2 on enhanced precautions pending culture results. Hand hygiene audit at 94% — target 98%. Two staff completed bloodborne pathogen refresher.',
    actions: [
      { text: 'Re-audit hand hygiene next Monday', owner: 'u8' },
      { text: 'Discontinue precautions on r2 if cultures negative', owner: 'u8' },
    ],
    tags: ['Infection', 'Quality'],
  },
];

function HuddlePage({ user, onOpenResident }) {
  const [showStart, setShowStart] = useState(false);
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const v = useViewport();
  const isPhone = v.isMobile;

  const list = HUDDLE_HISTORY.filter(h => filter === 'all' || h.kind === filter);

  if (active) {
    return <HuddleDetail huddle={active} onBack={() => setActive(null)} onOpenResident={onOpenResident} />;
  }

  const stats = {
    today: HUDDLE_HISTORY.filter(h => h.when.startsWith('Today')).length,
    week: HUDDLE_HISTORY.length,
    avg: '13m 32s',
    actions: HUDDLE_HISTORY.reduce((n, h) => n + h.actions.length, 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Huddle"
        subtitle="Every shift handoff, clinical round, and care plan meeting in one place, with summaries and follow-ups attached to resident charts."
        actions={[
          <Button key="start" variant="lavender" icon="video" onClick={() => setShowStart(true)}>Start Huddle</Button>,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 140 : 170}px, 1fr))`, gap: 10 }}>
        <StatCard label="Huddles today" value={stats.today} icon="calendar" />
        <StatCard label="This week" value={stats.week} icon="message" />
        <StatCard label="Avg duration" value={stats.avg} icon="trendingDown" />
        <StatCard label="Action items captured" value={stats.actions} icon="check" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Recent huddles</h2>
          <div style={{ minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
            <SegmentedControl
              value={filter} onChange={setFilter}
              options={[
                { id: 'all', label: `All (${HUDDLE_HISTORY.length})` },
                { id: 'shift', label: 'Shift' },
                { id: 'clinical', label: 'Clinical' },
                { id: 'incident', label: 'Incident' },
                { id: 'careplan', label: 'Care plan' },
                { id: 'ipcp', label: 'IPCP' },
              ]}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(h => <HuddleRow key={h.id} h={h} onClick={() => setActive(h)} />)}
          {list.length === 0 && (
            <Card style={{ padding: 32, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>No huddles in this category.</Card>
          )}
        </div>
      </div>

      {showStart && <HuddleModal user={user} onClose={() => setShowStart(false)} onOpenResident={onOpenResident} />}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={icon} size={16} color="#52525B" />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1C192E', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6A7282' }}>{label}</div>
    </Card>
  );
}

const KIND_META = {
  shift:    { label: 'Shift',     color: '#0081CF' },
  clinical: { label: 'Clinical',  color: '#00B295' },
  incident: { label: 'Incident',  color: '#FF6E6C' },
  careplan: { label: 'Care plan', color: '#845EC2' },
  ipcp:     { label: 'IPCP',      color: '#B58420' },
};

function HuddleRow({ h, onClick }) {
  const meta = KIND_META[h.kind] || { label: h.kind, color: '#6A7282' };
  const participants = h.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const visible = participants.slice(0, 4);
  const extra = participants.length - visible.length;
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 4, background: meta.color }} />
        <div style={{ flex: 1, padding: isPhone ? '14px' : '14px 18px', display: 'flex', alignItems: 'center', gap: isPhone ? 12 : 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: isPhone ? '100%' : 220, flex: '1 1 240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: '#99A1AF' }}>·</span>
              <span style={{ fontSize: 11, color: '#6A7282' }}>{h.when}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1C192E' }}>{h.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {visible.map(u => <Avatar key={u.id} initials={u.initials} seed={u.id} size={26} />)}
            {extra > 0 && (
              <div style={{ width: 26, height: 26, borderRadius: 9999, background: '#F4F4F5', color: '#52525B', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{extra}</div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
            <Icon name="trendingDown" size={12} color="#6A7282" />
            {h.duration}
          </div>
          <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
            <Icon name="check" size={12} color="#845EC2" />
            {h.actions.length} action{h.actions.length === 1 ? '' : 's'}
          </div>
          {!isPhone && <Icon name="chevronRight" size={18} color="#99A1AF" />}
        </div>
      </div>
    </Card>
  );
}

function HuddleDetail({ huddle: h, onBack, onOpenResident }) {
  const meta = KIND_META[h.kind] || { label: h.kind, color: '#6A7282' };
  const participants = h.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const host = TEST_USERS.find(u => u.id === h.host);
  const residents = h.residents.map(id => RESIDENTS.find(r => r.id === id)).filter(Boolean);

  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 18 : 24 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Huddle
      </button>

      <Card style={{ padding: isPhone ? 18 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', background: meta.color + '18', borderRadius: 4 }}>{meta.label}</span>
          <span style={{ fontSize: 12, color: '#6A7282' }}>{h.when} · {h.duration}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: isPhone ? 22 : 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#1C192E' }}>{h.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar initials={host.initials} seed={host.id} size={26} />
            <span style={{ fontSize: 12, color: '#6A7282' }}>Hosted by <b style={{ color: '#1C192E' }}>{host.name}</b></span>
          </div>
          <span style={{ fontSize: 12, color: '#99A1AF' }}>·</span>
          <span style={{ fontSize: 12, color: '#6A7282' }}>{participants.length} participants</span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="ois-grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon name="fileText" size={14} color="#845EC2" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#67568C', letterSpacing: '0.04em' }}>SUMMARY</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: '21px', color: '#1C192E' }}>{h.summary}</div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>ACTION ITEMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {h.actions.map((a, i) => {
                const owner = TEST_USERS.find(u => u.id === a.owner);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #EEEEEE' }}>
                    <Icon name="check" size={14} color="#29BB89" />
                    <div style={{ flex: 1, fontSize: 13, color: '#1C192E' }}>{a.text}</div>
                    {owner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar initials={owner.initials} seed={owner.id} size={22} />
                        <span style={{ fontSize: 12, color: '#6A7282' }}>{owner.name.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>RESIDENTS DISCUSSED</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {residents.map(r => (
                <button key={r.id} onClick={() => onOpenResident(r.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
                  background: '#fff', border: '1px solid #EEEEEE', cursor: 'pointer', textAlign: 'left',
                }}>
                  <Avatar initials={r.initials} seed={r.id} size={32} isResident />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C192E' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>Rm {r.room} · {r.unit}</div>
                  </div>
                  <RiskBadge level={r.risk} score={r.score} />
                  <Icon name="chevronRight" size={16} color="#99A1AF" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>PARTICIPANTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {participants.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                  <Avatar initials={u.initials} seed={u.id} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.short}</div>
                  </div>
                  {u.id === h.host && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#845EC2', letterSpacing: '0.04em', padding: '2px 6px', background: '#F5F2FD', borderRadius: 4 }}>HOST</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>RECORDING & TRANSCRIPT</div>
            <Button variant="secondary" icon="video" style={{ width: '100%', marginBottom: 8 }} onClick={() => emitToast('Playing recording…', 'info')}>Play recording</Button>
            <Button variant="ghost" icon="fileText" style={{ width: '100%' }} onClick={() => emitToast('Transcript downloading…', 'info')}>Download transcript</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HuddlePage });
