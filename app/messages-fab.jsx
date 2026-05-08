// Messages page - full-height care-team, huddle, and tagged resident threads

const RECENT_THREADS_SEED = [
  { id: 't1', kind: 'direct', userId: 'u11', residentId: 'r1', preview: 'Reviewing labs now - back to you in 5.', time: '4m', unread: 2 },
  { id: 't2', kind: 'direct', userId: 'u9', residentId: 'r5', preview: 'New wound photo uploaded.', time: '22m', unread: 1 },
  { id: 't3', kind: 'direct', userId: 'u4', residentId: 'r2', preview: 'Cultures drawn, awaiting results.', time: '1h', unread: 0 },
  { id: 't4', kind: 'direct', userId: 'u10', residentId: 'r3', preview: 'Approved - restart at 5mg AM.', time: '2h', unread: 0 },
  { id: 't5', kind: 'direct', userId: 'u14', residentId: 'r7', preview: 'PT eval scheduled for tomorrow 10am.', time: '4h', unread: 0 },
];

const HUDDLE_MESSAGE_THREADS = [
  {
    id: 'huddle-h1',
    kind: 'huddle',
    title: 'Morning shift huddle',
    residentIds: ['r1','r2','r3'],
    participants: ['u1','u2','u3','u4','u5','u8','u9','u11'],
    preview: 'Open items: BP recheck, sepsis pathway confirmation, INR follow-up.',
    time: '18m',
    unread: 3,
  },
  {
    id: 'huddle-h2',
    kind: 'huddle',
    title: 'Wound care rounds',
    residentIds: ['r1','r5','r8'],
    participants: ['u9','u4','u5','u11','u18'],
    preview: 'Photos uploaded. Wound nurse requesting nutrition review for two residents.',
    time: '1h',
    unread: 1,
  },
  {
    id: 'huddle-h3',
    kind: 'huddle',
    title: 'West LTC safety huddle',
    residentIds: ['r2','r8','r10'],
    participants: ['u2','u3','u4','u6','u15'],
    preview: 'Falls and staffing-sensitive follow-through for evening shift.',
    time: 'Yesterday',
    unread: 0,
  },
];

function messageUnreadCount() {
  return [...RECENT_THREADS_SEED, ...HUDDLE_MESSAGE_THREADS].reduce((n, t) => n + (t.unread || 0), 0);
}

function hydrateDirectThread(t) {
  return {
    ...t,
    user: TEST_USERS.find(u => u.id === t.userId),
    resident: RESIDENTS.find(r => r.id === t.residentId),
  };
}

function hydrateHuddleThread(t) {
  return {
    ...t,
    users: t.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean),
    residents: t.residentIds.map(id => RESIDENTS.find(r => r.id === id)).filter(Boolean),
  };
}

function MessagesPage({ user, onOpenThread, onOpenChat, taggedResidentId }) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('threads');
  const [showStartHuddle, setShowStartHuddle] = useState(false);
  const unread = messageUnreadCount();
  const taggedResident = taggedResidentId ? RESIDENTS.find(r => r.id === taggedResidentId) : null;

  const directThreads = RECENT_THREADS_SEED.map(hydrateDirectThread).filter(t => t.user && t.resident);
  const huddleThreads = HUDDLE_MESSAGE_THREADS.map(hydrateHuddleThread);
  const allUsers = TEST_USERS.filter(u => u.id !== 'u1');
  const lowerQ = q.trim().toLowerCase();

  const filteredDirect = directThreads.filter(t =>
    !lowerQ || t.user.name.toLowerCase().includes(lowerQ)
      || t.resident.name.toLowerCase().includes(lowerQ)
      || t.preview.toLowerCase().includes(lowerQ)
  );
  const filteredHuddles = huddleThreads.filter(t =>
    !lowerQ || t.title.toLowerCase().includes(lowerQ)
      || t.preview.toLowerCase().includes(lowerQ)
      || t.residents.some(r => r.name.toLowerCase().includes(lowerQ))
      || t.users.some(u => u.name.toLowerCase().includes(lowerQ))
  );
  const filteredUsers = allUsers.filter(u =>
    !lowerQ || u.name.toLowerCase().includes(lowerQ) || u.role.toLowerCase().includes(lowerQ)
  );

  function pickUser(u) {
    const r = taggedResident || RESIDENTS.find(x => x.risk === 'critical') || RESIDENTS[0];
    onOpenChat(r, u);
    setQ('');
  }

  return (
    <div style={{ height: 'calc(100vh - 86px)', minHeight: 620, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1C192E' }}>Messages</div>
          <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {taggedResident ? `${taggedResident.name} is tagged for new conversations.` : 'Care-team and huddle conversations with resident context preserved.'}
          </div>
        </div>
        {unread > 0 && <Chip tone="high" dot>{unread} unread</Chip>}
        <Button size="sm" variant="lavender" icon="video" onClick={() => setShowStartHuddle(true)}>Start Huddle</Button>
      </div>

      {taggedResident && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #EEEEEE', display: 'flex', gap: 10, alignItems: 'center', background: '#FAFAFC' }}>
          <Avatar initials={taggedResident.initials} seed={taggedResident.id} size={34} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#67568C' }}>Tagged resident</div>
            <div style={{ fontSize: 12, color: '#1C192E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {taggedResident.name} - Rm {taggedResident.room} - MRN {taggedResident.mrn}
            </div>
          </div>
          <RiskBadge level={taggedResident.risk} score={taggedResident.score} compact />
        </div>
      )}

      <div style={{ padding: '8px 10px 0', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, borderBottom: '1px solid #EEEEEE' }}>
        {[
          { id: 'threads', label: 'Threads', badge: RECENT_THREADS_SEED.reduce((n, t) => n + t.unread, 0) },
          { id: 'huddles', label: 'Huddles', badge: HUDDLE_MESSAGE_THREADS.reduce((n, t) => n + t.unread, 0) },
          { id: 'new', label: 'New' },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setQ(''); }} style={{
              minWidth: 0,
              background: 'transparent',
              border: 0,
              padding: '9px 8px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 900,
              color: active ? '#00795E' : '#6A7282',
              borderBottom: `2px solid ${active ? '#00C9A7' : 'transparent'}`,
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              {t.badge > 0 && (
                <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999, background: '#FF6E6C', color: '#fff', fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 12, borderBottom: '1px solid #EEEEEE' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            <Icon name="search" size={14} color="#99A1AF" />
          </span>
          <input
            value={q}
            onInput={e => setQ(e.target.value)}
            placeholder={tab === 'new' ? 'Search team by name or role...' : 'Search messages, huddles, residents...'}
            style={{
              width: '100%', height: 38, padding: '0 12px 0 32px',
              border: '1px solid #E5E7EB', borderRadius: 8, font: '13px Inter',
              outline: 0, color: '#1C192E', background: '#FAFAFA',
            }}
          />
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, background: '#fff' }}>
        {tab === 'threads' && filteredDirect.map(t => (
          <DirectThreadRow key={t.id} t={t} onClick={() => onOpenThread(t.id)} />
        ))}
        {tab === 'threads' && filteredDirect.length === 0 && <EmptyMessages text="No messages match." />}

        {tab === 'huddles' && filteredHuddles.map(t => (
          <HuddleThreadRow key={t.id} t={t} onClick={() => onOpenThread(t.id)} />
        ))}
        {tab === 'huddles' && filteredHuddles.length === 0 && <EmptyMessages text="No huddle threads match." />}

        {tab === 'new' && filteredUsers.map(u => (
          <button key={u.id} onClick={() => pickUser(u)} style={{
            width: '100%', display: 'flex', gap: 12, alignItems: 'center',
            padding: '12px 16px', border: 0, background: '#fff',
            borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
          }}>
            <Avatar initials={u.initials} seed={u.id} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E' }}>{u.name}</div>
              <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{u.role}</div>
            </div>
            <Icon name="chevronRight" size={14} color="#99A1AF" />
          </button>
        ))}
        {tab === 'new' && filteredUsers.length === 0 && <EmptyMessages text="No team members match." />}
      </div>

      {showStartHuddle && <HuddleModal user={user || TEST_USERS[0]} onClose={() => setShowStartHuddle(false)} onOpenResident={() => {}} />}
    </div>
  );
}

function DirectThreadRow({ t, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', gap: 12, alignItems: 'center',
      padding: '13px 16px', border: 0, background: t.unread ? '#FAFAFC' : '#fff',
      borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
    }}>
      <Avatar initials={t.user.initials} seed={t.user.id} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user.name}</div>
          <div style={{ fontSize: 11, color: '#99A1AF', flexShrink: 0 }}>{t.time}</div>
        </div>
        <div style={{ fontSize: 11, color: '#67568C', fontWeight: 800, marginTop: 2 }}>Re: {t.resident.name} - Rm {t.resident.room}</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
      </div>
      {t.unread > 0 && <UnreadBadge count={t.unread} />}
    </button>
  );
}

function HuddleThreadRow({ t, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', gap: 12, alignItems: 'center',
      padding: '13px 16px', border: 0, background: t.unread ? '#FAFAFC' : '#fff',
      borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', marginLeft: 2, flexShrink: 0 }}>
        {t.users.slice(0, 3).map((u, i) => (
          <div key={u.id} style={{ marginLeft: i ? -10 : 0, border: '2px solid #fff', borderRadius: 9999 }}>
            <Avatar initials={u.initials} seed={u.id} size={34} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
          <div style={{ fontSize: 11, color: '#99A1AF', flexShrink: 0 }}>{t.time}</div>
        </div>
        <div style={{ fontSize: 11, color: '#00795E', fontWeight: 900, marginTop: 2 }}>
          {t.users.length} participants - {t.residents.map(r => r.name).join(', ')}
        </div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
      </div>
      {t.unread > 0 && <UnreadBadge count={t.unread} />}
    </button>
  );
}

function UnreadBadge({ count }) {
  return (
    <span style={{ width: 19, height: 19, borderRadius: 9999, background: '#845EC2', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{count}</span>
  );
}

function EmptyMessages({ text }) {
  return <div style={{ padding: 36, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>{text}</div>;
}

function MessageThreadPage({ threadId, onBack, onOpenChat }) {
  const directSeed = RECENT_THREADS_SEED.find(t => t.id === threadId);
  const huddleSeed = HUDDLE_MESSAGE_THREADS.find(t => t.id === threadId);
  const isHuddle = !!huddleSeed;
  const seed = directSeed || huddleSeed || RECENT_THREADS_SEED[0];
  const direct = directSeed ? hydrateDirectThread(directSeed) : null;
  const huddle = huddleSeed ? hydrateHuddleThread(huddleSeed) : null;
  const user = direct ? direct.user : huddle.users[0];
  const resident = direct ? direct.resident : huddle.residents[0];
  const participants = isHuddle ? huddle.users : [user];
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(isHuddle ? [
    { id: 'm1', from: 'them', user: participants[1]?.name || 'Team', body: huddle.preview, time: seed.time },
    { id: 'm2', from: 'me', user: 'Sarah Chen', body: 'Please keep the open action owner and follow-up time visible in this thread.', time: 'now' },
    { id: 'm3', from: 'them', user: participants[2]?.name || 'Team', body: 'Acknowledged. I will update once the follow-up is complete.', time: 'now' },
  ] : [
    { id: 'm1', from: 'them', user: user.name, body: `I am reviewing ${resident.name}'s latest documentation now.`, time: seed.time },
    { id: 'm2', from: 'me', user: 'Sarah Chen', body: 'The baseline change was flagged. Can you confirm what changed clinically?', time: 'now' },
    { id: 'm3', from: 'them', user: user.name, body: seed.preview, time: seed.time },
  ]);

  function send() {
    if (!draft.trim()) return;
    setMessages(m => [...m, { id: 'm' + Date.now(), from: 'me', user: 'Sarah Chen', body: draft, time: 'now' }]);
    setDraft('');
  }

  return (
    <div style={{ height: 'calc(100vh - 86px)', minHeight: 620, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconButton icon="chevronLeft" title="Back to Messages" onClick={onBack} />
        {isHuddle ? (
          <div style={{ display: 'flex', marginLeft: -2, flexShrink: 0 }}>
            {participants.slice(0, 3).map((u, i) => (
              <div key={u.id} style={{ marginLeft: i ? -10 : 0, border: '2px solid #fff', borderRadius: 9999 }}>
                <Avatar initials={u.initials} seed={u.id} size={36} />
              </div>
            ))}
          </div>
        ) : (
          <Avatar initials={user.initials} seed={user.id} size={38} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isHuddle ? huddle.title : user.name}
          </div>
          <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isHuddle ? `${participants.length} participants - ${huddle.residents.map(r => r.name).join(', ')}` : `${user.role} - re: ${resident.name}`}
          </div>
        </div>
        {isHuddle ? (
          <Button size="sm" variant="lavender" icon="video" onClick={() => emitToast('Opening huddle room.', 'info')}>Join</Button>
        ) : (
          <Button variant="secondary" size="sm" icon="message" onClick={() => onOpenChat(resident, user)}>Live Chat</Button>
        )}
      </div>

      <div style={{ padding: '9px 12px', borderBottom: '1px solid #EEEEEE', display: 'flex', gap: 10, alignItems: 'center', background: '#FAFAFC' }}>
        <Avatar initials={resident.initials} seed={resident.id} size={34} isResident />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#67568C' }}>{isHuddle ? 'Primary resident context' : 'Tagged resident'}</div>
          <div style={{ fontSize: 12, color: '#1C192E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resident.name} - Rm {resident.room} - MRN {resident.mrn}
          </div>
        </div>
        <RiskBadge level={resident.risk} score={resident.score} compact />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ alignSelf: 'center', fontSize: 11, color: '#67568C', background: '#F5F2FD', padding: '5px 10px', borderRadius: 9999 }}>
          Resident context and follow-up state preserved in this thread
        </div>
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
            {isHuddle && m.from !== 'me' && <div style={{ fontSize: 10, color: '#6A7282', margin: '0 0 3px 4px', fontWeight: 800 }}>{m.user}</div>}
            <div style={{
              padding: '9px 12px', borderRadius: m.from === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.from === 'me' ? '#845EC2' : '#fff', color: m.from === 'me' ? '#fff' : '#1C192E',
              border: m.from === 'me' ? 0 : '1px solid #E5E7EB',
              fontSize: 13, lineHeight: '18px',
            }}>{m.body}</div>
            <div style={{ fontSize: 10, color: '#99A1AF', marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid #EEEEEE', display: 'flex', gap: 8, alignItems: 'center', background: '#fff' }}>
        <input value={draft} onInput={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={isHuddle ? 'Message the huddle...' : `Reply to ${user.short || user.name.split(' ')[0]}...`}
          style={{ flex: 1, minWidth: 0, border: '1px solid #E5E7EB', borderRadius: 9999, padding: '10px 14px', font: '13px Inter', outline: 0 }} />
        <button onClick={send} style={{ width: 38, height: 38, borderRadius: 9999, border: 0, background: '#845EC2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="send" size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function MessagesFab() {
  return null;
}

Object.assign(window, { MessagesPage, MessageThreadPage, MessagesFab, RECENT_THREADS_SEED, HUDDLE_MESSAGE_THREADS, messageUnreadCount });
