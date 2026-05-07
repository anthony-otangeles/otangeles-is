// Shell — Header + SideNav for Otangeles Intelligent System (responsive)

const NAV_PRIMARY = [
  { id: 'home',      label: 'Home',       icon: 'home' },
  { id: 'changes',   label: 'Changes',    icon: 'activity' },
  { id: 'residents', label: 'Residents',  icon: 'users' },
  { id: 'watchlist', label: 'Watchlist',  icon: 'eye' },
];
const NAV_SECONDARY = [
  { id: 'huddle',    label: 'Huddle',          icon: 'message' },
  { id: 'schedule',  label: 'Schedule',        icon: 'calendar' },
  { id: 'reports',   label: 'Reports',         icon: 'fileText' },
];

const NOTIFICATIONS_SEED = [
  { id: 'n1', icon: 'alertTriangle', tone: '#FF6E6C', title: 'Eleanor Vance escalated', body: 'Risk increased High → Critical', time: '2m ago', unread: true },
  { id: 'n2', icon: 'message', tone: '#845EC2', title: 'Dr. Patel replied', body: 'Re: Robert Kasprzak meds review', time: '14m ago', unread: true },
  { id: 'n3', icon: 'activity', tone: '#E9C05F', title: 'Vitals deviation', body: 'Margaret Chen · SpO2 drift to 91%', time: '38m ago', unread: true },
  { id: 'n4', icon: 'check', tone: '#29BB89', title: 'Care plan updated', body: 'Wound care plan approved by NP', time: '2h ago' },
  { id: 'n5', icon: 'users', tone: '#0081CF', title: 'Huddle scheduled', body: 'Skilled Nursing · 14:00 today', time: '4h ago' },
];

function AppHeader({ user, onLogout, onSearch, onNav, onMenu, mobile }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const unread = NOTIFICATIONS_SEED.filter(n => n.unread).length;
  return (
    <header style={{
      height: 60, background: '#fff', borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', padding: mobile ? '0 12px' : '0 24px', gap: mobile ? 8 : 12,
      position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
    }}>
      {mobile && (
        <IconButton icon="list" onClick={onMenu} title="Menu" />
      )}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Brand height={26} />
      </div>
      <div style={{ flex: 1 }} />

      {!mobile && (
        <div style={{ position: 'relative' }}>
          {!searchOpen ? (
            <IconButton icon="search" title="Search" onClick={() => setSearchOpen(true)} />
          ) : (
            <div style={{
              width: 320, background: '#F7F7F7', border: '1px solid #E5E7EB', borderRadius: 8, height: 38,
              display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
            }}>
              <Icon name="search" size={16} color="#99A1AF" />
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onBlur={() => { if (!searchQ) setSearchOpen(false); }}
                placeholder="Search residents, MRN, rooms…"
                style={{ flex: 1, border: 0, outline: 0, background: 'transparent', font: '14px Inter', color: '#1C192E' }} />
              <IconButton icon="x" size={24} onClick={() => { setSearchQ(''); setSearchOpen(false); }} />
            </div>
          )}
        </div>
      )}
      {mobile && <IconButton icon="search" title="Search" onClick={() => emitToast('Search coming soon.', 'info')} />}

      <div style={{ position: 'relative' }}>
        <IconButton icon="bell" title="Notifications" onClick={() => setNotifOpen(o => !o)} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 9999, background: '#E53E3E', color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', pointerEvents: 'none',
          }}>{unread}</span>
        )}
        {notifOpen && (
          <>
            <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'absolute', top: 44, right: 0, width: mobile ? 'min(92vw, 360px)' : 360, maxHeight: 480, overflowY: 'auto',
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
              zIndex: 50,
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEEEEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Notifications</div>
                <button onClick={() => { setNotifOpen(false); emitToast('All marked read.'); }} style={{ background: 'transparent', border: 0, color: '#845EC2', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Mark all read</button>
              </div>
              {NOTIFICATIONS_SEED.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F4F4F5', display: 'flex', gap: 12, cursor: 'pointer', background: n.unread ? '#FAFAFC' : '#fff' }}
                  onClick={() => { setNotifOpen(false); emitToast(`Opening: ${n.title}`, 'info'); }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9999, background: n.tone + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={n.icon} size={16} color={n.tone} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C192E' }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: '#99A1AF', marginTop: 4 }}>{n.time}</div>
                  </div>
                  {n.unread && <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#845EC2', flexShrink: 0, marginTop: 6 }} />}
                </div>
              ))}
              <div style={{ padding: '12px 16px', textAlign: 'center' }}>
                <button onClick={() => { setNotifOpen(false); emitToast('All notifications view coming soon.', 'info'); }} style={{ background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>View all</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={user.initials} seed={user.id} size={34} />
        {!mobile && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1C192E' }}>{user.name}</span>
            <span style={{ fontSize: 11, color: '#6A7282' }}>{user.role}</span>
          </div>
        )}
        {!mobile && <IconButton icon="logout" title="Sign out" onClick={onLogout} />}
      </div>
    </header>
  );
}

function SideNav({ active, onNav, counts }) {
  const items = NAV_PRIMARY.map(it => it.id === 'changes' ? { ...it, badge: counts.changes } : it);
  return (
    <aside style={{
      width: 248, background: '#fff', borderRight: '1px solid #E5E7EB',
      padding: 16, display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 60px)', position: 'sticky', top: 60, flexShrink: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em', padding: '8px 14px 8px' }}>FACILITY</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(it => <NavItem key={it.id} item={it} active={active === it.id} onClick={() => onNav(it.id)} />)}
      </nav>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em', padding: '20px 14px 8px' }}>WORKSPACE</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_SECONDARY.map(it => <NavItem key={it.id} item={it} active={active === it.id} onClick={() => onNav(it.id)} />)}
      </nav>
      <div style={{ flex: 1 }} />
      <div style={{
        padding: 14, borderRadius: 10, background: '#E7F5EF',
        border: '1px solid #C9EFE2', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkles" size={14} color="#00B295" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#00795E' }}>Continuity AI</span>
        </div>
        <div style={{ fontSize: 11, lineHeight: '16px', color: '#00795E' }}>
          117 residents · 14 active threads · 3 awaiting response
        </div>
        <button style={{
          marginTop: 4, padding: '8px 12px', borderRadius: 8, border: 0,
          background: '#00C9A7', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }} onClick={() => emitToast('AI assistant ready — ask anything.', 'info')}>
          <Icon name="message" size={12} color="#fff" /> Ask AI
        </button>
      </div>
    </aside>
  );
}

function MobileDrawer({ open, active, onNav, counts, user, onLogout, onClose }) {
  if (!open) return null;
  const items = NAV_PRIMARY.map(it => it.id === 'changes' ? { ...it, badge: counts.changes } : it);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(28,25,46,0.5)', zIndex: 80,
    }}>
      <aside onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(86vw, 320px)',
        background: '#fff', display: 'flex', flexDirection: 'column', padding: 16, gap: 16,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand height={26} />
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#FAFAFA', border: '1px solid #EEEEEE' }}>
          <Avatar initials={user.initials} seed={user.id} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#6A7282' }}>{user.role}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em' }}>FACILITY</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(it => <NavItem key={it.id} item={it} active={active === it.id} onClick={() => { onNav(it.id); onClose(); }} />)}
        </nav>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em' }}>WORKSPACE</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_SECONDARY.map(it => <NavItem key={it.id} item={it} active={active === it.id} onClick={() => { onNav(it.id); onClose(); }} />)}
        </nav>
        <div style={{ flex: 1 }} />
        <button onClick={onLogout} style={{
          padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
          color: '#1C192E', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="logout" size={16} color="#1C192E" /> Sign out
        </button>
      </aside>
    </div>
  );
}

function MobileTabBar({ active, onNav, counts }) {
  const items = [
    { id: 'home',      label: 'Home',      icon: 'home' },
    { id: 'changes',   label: 'Changes',   icon: 'activity', badge: counts.changes },
    { id: 'residents', label: 'Residents', icon: 'users' },
    { id: 'watchlist', label: 'Watch',     icon: 'eye' },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: '#fff', borderTop: '1px solid #E5E7EB',
      display: 'flex', justifyContent: 'space-around',
      padding: '6px 4px calc(8px + env(safe-area-inset-bottom))',
    }}>
      {items.map(it => {
        const isActive = active === it.id;
        const color = isActive ? '#00B295' : '#6A7282';
        return (
          <button key={it.id} onClick={() => onNav(it.id)} style={{
            flex: 1, background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 4px', position: 'relative',
            color, fontFamily: 'Inter', fontSize: 11, fontWeight: 600,
          }}>
            <div style={{ position: 'relative' }}>
              <Icon name={it.icon} size={22} color={color} strokeWidth={isActive ? 2.4 : 2} />
              {it.badge > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 9999, background: '#E53E3E', color: '#fff', fontSize: 9, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
                }}>{it.badge}</span>
              )}
            </div>
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function NavItem({ item, active, onClick }) {
  const [hover, setHover] = useState(false);
  const bg = active ? '#E7F5EF' : hover ? '#F4F4F5' : 'transparent';
  const color = active ? '#00795E' : hover ? '#1C192E' : '#52525B';
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 8,
        background: bg, color, border: 0, cursor: 'pointer',
        fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
        justifyContent: 'flex-start', transition: 'all 120ms',
        width: '100%', textAlign: 'left',
      }}>
      <Icon name={item.icon} size={18} color={color} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span style={{
          minWidth: 22, height: 20, padding: '0 6px', borderRadius: 9999,
          background: active ? '#00C9A7' : '#E53E3E',
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{item.badge}</span>
      )}
    </button>
  );
}

function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 16, marginBottom: 20, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontFamily: 'Inter', fontWeight: 700, fontSize: 'clamp(22px, 4vw, 30px)', lineHeight: 1.1, color: '#1C192E', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: '#6A7282' }}>{subtitle}</div>}
        {children}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

Object.assign(window, { AppHeader, SideNav, MobileDrawer, MobileTabBar, PageHeader });
