// Home page — DON facility-level operations view

function HomePage({ user, onOpenResident, onNav }) {
  const priority = priorityResidents();
  const critical = priority.filter(r => r.risk === 'critical');
  const high     = priority.filter(r => r.risk === 'high');
  const watch    = priority.filter(r => r.risk === 'watch');
  const stable   = priority.filter(r => r.risk === 'stable');
  const occPct = Math.round(FACILITY.occupied / FACILITY.beds * 100);
  const [showHuddle, setShowHuddle] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 28 : 32 }}>
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
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#99A1AF' }}>{greeting()} · MAY 7, 2026</div>
              <div style={{ fontSize: isPhone ? 26 : 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6, color: '#1C192E' }}>Hi, {user.name.split(' ')[0]}.</div>
              <div style={{ fontSize: 13, color: '#6A7282', marginTop: 4 }}>{FACILITY.name} · {FACILITY.building}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, width: isPhone ? '100%' : 'auto' }}>
              <Button variant="secondary" icon="message" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => setShowHuddle(true)}>Start Huddle</Button>
              <Button variant="lavender" icon="sparkles" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => setShowAI(true)}>Ask AI</Button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isPhone ? 14 : 20, borderTop: '1px solid #EEEEEE', paddingTop: 18 }}>
            <HeroStat label="Beds occupied" value={`${FACILITY.occupied} / ${FACILITY.beds}`} sub={`${occPct}% capacity`} />
            <HeroStat label="New admits 24h" value={FACILITY.admits24h} sub="1 awaiting H&P" />
            <HeroStat label="Discharges 24h" value={FACILITY.discharges24h} sub="0 returns" />
            <HeroStat label="Pending provider" value={FACILITY.pendingProvider} sub="2 over 4h" />
          </div>
        </div>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="sparkles" size={14} color="#52525B" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.04em' }}>OVERNIGHT BRIEF · AI</span>
          </div>
          <div style={{ fontSize: 13, color: '#1C192E', lineHeight: '19px', marginBottom: 14 }}>
            <b>3 escalations</b>, <b>6 follow-ups</b>, and <b>2 awaiting nephrology</b>.
            Highest concern: M. Bell — sepsis screen positive 40m ago.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BriefBullet text="Mr. Johnson · BP trend −14 pts in 4h. Wound exudate ↑." tone="critical" />
            <BriefBullet text="Marjorie Bell · sepsis screen positive, no provider response." tone="critical" />
            <BriefBullet text="Rafael Moreno · INR 3.8, warfarin held pending confirmation." tone="high" />
          </div>
          <button onClick={() => emitToast('Opening overnight thread — full context.', 'info')} style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', width: '100%',
            background: '#fff', color: '#1C192E', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            View full overnight thread <Icon name="chevronRight" size={12} color="#1C192E" />
          </button>
        </Card>
      </div>

      {/* Priority list */}
      <div>
        <SectionHeader
          title="Today's Priority"
          subtitle="Critical and High-risk residents only. AI keeps this list current."
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip tone="critical" dot>{critical.length} Critical</Chip>
              <Chip tone="high" dot>{high.length} High</Chip>
            </div>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...critical, ...high].map(r => (
            <PriorityRow key={r.id} r={r} onClick={() => onOpenResident(r.id)} />
          ))}
          {critical.length + high.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>
              No Critical or High-risk residents right now. Watch and Stable residents are tracked under the Residents tab.
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

      {/* Risk drivers */}
      <div>
        <SectionHeader title="Risk Drivers" subtitle="Active risk categories across the facility. Click a category to see who's affected." />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 150 : 190}px, 1fr))`, gap: 10 }}>
          {RISK_CATEGORIES.map(cat => <RiskCategoryCard key={cat.id} cat={cat} />)}
        </div>
      </div>

      {showHuddle && <HuddleModal user={user} onClose={() => setShowHuddle(false)} onOpenResident={onOpenResident} />}
      {showAI && <AskAIPanel user={user} onClose={() => setShowAI(false)} onOpenResident={onOpenResident} onNav={onNav} />}
    </div>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
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
          <Button variant="lavender" icon="check" onClick={() => { emitToast(`Huddle ended — AI summary saved to ${agenda.length} resident records.`); onClose(); }}>End & Save Summary</Button>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 8 }}>AGENDA · AI CAPTURING</div>
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
    <ModalShell title="Start Huddle" subtitle="Quick standup with on-shift care team. AI captures the agenda and posts notes to each resident." onClose={onClose} width={680}
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
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>AGENDA — AI suggested from overnight events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {agenda.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, padding: '8px 10px', border: '1px solid #EEEEEE', borderRadius: 6, fontSize: 13, alignItems: 'center' }}>
                <Icon name="sparkles" size={12} color="#845EC2" />
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

// ============== ASK AI PANEL ==============
function AskAIPanel({ user, onClose, onOpenResident, onNav }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi ${user.name.split(' ')[0]}, I have full context on ${FACILITY.name}. Ask me about residents, trends, staffing, or risks.` },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const suggestions = [
    'Who needs my attention before noon?',
    'Summarize overnight events for the DON',
    'Which residents have rising fall risk this week?',
    'Compare today\'s priority list to yesterday',
  ];
  const v = useViewport();
  const isPhone = v.isMobile;

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setMessages(m => [...m, { role: 'me', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const ctx = `You are an AI clinical assistant for a Director of Nursing at ${FACILITY.name} (${FACILITY.occupied}/${FACILITY.beds} beds occupied). The facility has ${critical().length} critical and ${high().length} high-risk residents. Critical: ${critical().map(r=>r.name+' ('+r.dx+')').join('; ')}. Be concise (under 80 words), clinical, and direct. No emoji.`;
      const reply = await window.claude.complete({
        messages: [
          { role: 'user', content: ctx + '\n\nDON asks: ' + q },
        ],
      });
      setMessages(m => [...m, { role: 'ai', text: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: 'I had trouble reaching the model. Try again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  }

  function critical() { return priorityResidents().filter(r => r.risk === 'critical'); }
  function high() { return priorityResidents().filter(r => r.risk === 'high'); }

  return (
    <ModalShell title="Ask AI" subtitle="Facility-aware assistant. Knows every resident, every change, every plan." onClose={onClose} width={640}
      footer={<>
        <div style={{ flex: 1, display: 'flex', gap: 8, flexDirection: isPhone ? 'column' : 'row' }}>
          <Input placeholder="Ask about residents, trends, staffing…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
          <Button variant="lavender" icon="arrowRight" style={{ width: isPhone ? '100%' : 'auto' }} onClick={() => send()} disabled={busy}>{busy ? '…' : 'Send'}</Button>
        </div>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 360 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'me' ? 'row-reverse' : 'row' }}>
            {m.role === 'ai'
              ? <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(#845EC2 37%, #00C9A7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkles" size={14} color="#fff" /></div>
              : <Avatar initials={user.initials} seed={user.id} size={32} />}
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: '19px',
              background: m.role === 'me' ? '#845EC2' : '#F5F2FD',
              color: m.role === 'me' ? '#fff' : '#1C192E',
              whiteSpace: 'pre-wrap',
            }}>{m.text}</div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(#845EC2 37%, #00C9A7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkles" size={14} color="#fff" /></div>
            <div style={{ display: 'flex', gap: 4, padding: '12px 14px', background: '#F5F2FD', borderRadius: 12 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 9999, background: '#845EC2', opacity: 0.4, animation: `ois-bounce 1.2s ${i*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6A7282', marginBottom: 8, letterSpacing: '0.04em' }}>SUGGESTED</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  textAlign: 'left', padding: '10px 12px', border: '1px solid #EEEEEE', borderRadius: 8,
                  background: '#fff', cursor: 'pointer', fontSize: 13, color: '#1C192E', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Icon name="sparkles" size={12} color="#845EC2" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

Object.assign(window, { HomePage });
