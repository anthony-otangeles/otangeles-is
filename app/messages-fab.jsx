// Floating action button for messages — global access from any page

const RECENT_THREADS_SEED = [
  { id: 't1', userId: 'u11', residentId: 'r1', preview: 'Reviewing labs now — back to you in 5.', time: '4m', unread: 2 },
  { id: 't2', userId: 'u9', residentId: 'r5', preview: 'New wound photo uploaded.', time: '22m', unread: 1 },
  { id: 't3', userId: 'u4', residentId: 'r2', preview: 'Cultures drawn, awaiting results.', time: '1h', unread: 0 },
  { id: 't4', userId: 'u10', residentId: 'r3', preview: 'Approved — restart at 5mg AM.', time: '2h', unread: 0 },
  { id: 't5', userId: 'u14', residentId: 'r7', preview: 'PT eval scheduled for tomorrow 10am.', time: '4h', unread: 0 },
];

function MessagesFab({ onOpenChat }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('threads'); // threads | new
  const unread = RECENT_THREADS_SEED.reduce((n, t) => n + t.unread, 0);

  const threads = RECENT_THREADS_SEED.map(t => ({
    ...t,
    user: TEST_USERS.find(u => u.id === t.userId),
    resident: RESIDENTS.find(r => r.id === t.residentId),
  })).filter(t => t.user && t.resident);

  const filtered = threads.filter(t =>
    !q || t.user.name.toLowerCase().includes(q.toLowerCase())
       || t.resident.name.toLowerCase().includes(q.toLowerCase())
       || t.preview.toLowerCase().includes(q.toLowerCase())
  );

  const allUsers = TEST_USERS.filter(u => u.id !== 'u1');
  const filteredUsers = allUsers.filter(u => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.role.toLowerCase().includes(q.toLowerCase()));

  function pickThread(t) {
    onOpenChat(t.resident, t.user);
    setOpen(false);
    setQ('');
  }
  function pickUser(u) {
    // open chat with first critical resident as default tag
    const r = RESIDENTS.find(x => x.risk === 'critical') || RESIDENTS[0];
    onOpenChat(r, u);
    setOpen(false);
    setQ('');
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} title="Messages" style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 70,
        width: 56, height: 56, borderRadius: 9999, border: 0, cursor: 'pointer',
        background: '#845EC2', color: '#fff',
        boxShadow: '0 8px 24px rgba(132,94,194,0.4), 0 2px 6px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 120ms',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <Icon name="message" size={24} color="#fff" />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4, minWidth: 20, height: 20, padding: '0 6px',
            borderRadius: 9999, background: '#FF6E6C', color: '#fff', fontSize: 11, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
          }}>{unread}</span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 65 }} />
          <div style={{
            position: 'fixed', right: 24, bottom: 92, zIndex: 70,
            width: 360, maxHeight: 540, background: '#fff',
            borderRadius: 14, border: '1px solid #E5E7EB',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18), 0 8px 16px -8px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1C192E' }}>Messages</div>
              <IconButton icon="x" size={26} onClick={() => setOpen(false)} />
            </div>

            <div style={{ padding: '10px 16px 0', display: 'flex', gap: 4, borderBottom: '1px solid #EEEEEE' }}>
              {[
                { id: 'threads', label: 'Recent', badge: unread },
                { id: 'new', label: 'New message' },
              ].map(t => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setQ(''); }} style={{
                    background: 'transparent', border: 0, padding: '8px 12px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    color: active ? '#845EC2' : '#6A7282',
                    borderBottom: `2px solid ${active ? '#845EC2' : 'transparent'}`,
                    marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {t.label}
                    {t.badge > 0 && (
                      <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999, background: '#FF6E6C', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
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
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={tab === 'threads' ? 'Search messages…' : 'Search team by name or role…'}
                  style={{
                    width: '100%', height: 36, padding: '0 12px 0 32px',
                    border: '1px solid #E5E7EB', borderRadius: 8, font: '13px Inter',
                    outline: 0, color: '#1C192E', background: '#FAFAFA',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {tab === 'threads' && filtered.map(t => (
                <button key={t.id} onClick={() => pickThread(t)} style={{
                  width: '100%', display: 'flex', gap: 12, alignItems: 'center',
                  padding: '12px 16px', border: 0, background: t.unread ? '#FAFAFC' : '#fff',
                  borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
                }}>
                  <Avatar initials={t.user.initials} seed={t.user.id} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user.name}</div>
                      <div style={{ fontSize: 11, color: '#99A1AF', flexShrink: 0 }}>{t.time}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#67568C', fontWeight: 600, marginTop: 1 }}>Re: {t.resident.name} · Rm {t.resident.room}</div>
                    <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
                  </div>
                  {t.unread > 0 && (
                    <span style={{ width: 18, height: 18, borderRadius: 9999, background: '#845EC2', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.unread}</span>
                  )}
                </button>
              ))}
              {tab === 'threads' && filtered.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>No messages match.</div>
              )}

              {tab === 'new' && filteredUsers.map(u => (
                <button key={u.id} onClick={() => pickUser(u)} style={{
                  width: '100%', display: 'flex', gap: 12, alignItems: 'center',
                  padding: '10px 16px', border: 0, background: '#fff',
                  borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
                }}>
                  <Avatar initials={u.initials} seed={u.id} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C192E' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.role}</div>
                  </div>
                  <Icon name="chevronRight" size={14} color="#99A1AF" />
                </button>
              ))}
              {tab === 'new' && filteredUsers.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>No team members match.</div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

Object.assign(window, { MessagesFab });
