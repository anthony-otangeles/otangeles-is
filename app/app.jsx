// Main app — routing + state for Otangeles Intelligent System

function App() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState({ page: 'home' });
  const [chats, setChats] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isCompact = true;

  if (!user) return <LoginScreen onSignIn={u => { setUser(u); setRoute({ page: 'home' }); }} />;

  function onNav(page) { setRoute({ page }); window.scrollTo(0, 0); }
  function onOpenResident(id) { setRoute({ page: 'resident', residentId: id }); window.scrollTo(0, 0); }
  function onOpenIssue(residentId, issueId) { setRoute({ page: 'change', residentId, issueId }); window.scrollTo(0, 0); }
  function onOpenChat(resident, teamUser) {
    const id = `${resident.id}-${teamUser.id}`;
    setChats(c => c.find(x => x.id === id) ? c : [...c, {
      id, resident, user: teamUser,
      messages: [
        { id: 'init', from: 'them', body: `Hi — looking at ${resident.name} now. What's the concern?`, time: 'just now' },
      ],
    }].slice(-3));
  }
  function onCloseChat(id) { setChats(c => c.filter(x => x.id !== id)); }

  const counts = { changes: FACILITY_CHANGES.filter(c => c.severity === 'critical' || c.severity === 'high').length };
  const activeNav = route.page === 'resident' ? 'residents' : route.page;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', fontFamily: 'Inter', color: '#1C192E' }}>
      <AppHeader
        user={user}
        onLogout={() => setUser(null)}
        onNav={onNav}
        onMenu={() => setDrawerOpen(true)}
        mobile={isCompact}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <main className="ois-page" style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 1024 }}>
          {route.page === 'home'      && <HomePage user={user} onOpenResident={onOpenResident} onNav={onNav} />}
          {route.page === 'changes'   && <ChangesPage onOpenResident={onOpenResident} onOpenIssue={onOpenIssue} />}
          {route.page === 'residents' && <ResidentsList onOpen={onOpenResident} />}
          {route.page === 'resident'  && <ResidentProfile residentId={route.residentId} onBack={() => onNav('residents')} onOpenChat={onOpenChat} onOpenIssue={onOpenIssue} />}
          {route.page === 'change'    && <ChangeDetailPage residentId={route.residentId} issueId={route.issueId} onBack={() => onNav('changes')} />}
          {route.page === 'schedule'  && <SchedulePage onOpenResident={onOpenResident} />}
          {route.page === 'watchlist' && <WatchlistPage onOpenResident={onOpenResident} />}
          {route.page === 'huddle'    && <HuddlePage user={user} onOpenResident={onOpenResident} />}
          {!['home','changes','residents','resident','change','schedule','watchlist','huddle'].includes(route.page) && (
            <ComingSoon page={route.page} />
          )}
        </main>
      </div>
      {isCompact && (
        <>
          <MobileDrawer
            open={drawerOpen}
            active={activeNav}
            onNav={onNav}
            counts={counts}
            user={user}
            onClose={() => setDrawerOpen(false)}
            onLogout={() => { setDrawerOpen(false); setUser(null); }}
          />
          <MobileTabBar active={activeNav} onNav={onNav} counts={counts} />
        </>
      )}
      <ChatDock chats={chats} onClose={onCloseChat} onSendCall={() => {}} mobile={isCompact} />
      <MessagesFab onOpenChat={onOpenChat} />
      <ToastHost />
    </div>
  );
}

function ComingSoon({ page }) {
  const titles = { reports: 'Reports' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title={titles[page] || page} subtitle="Placeholder while we focus on Facility-level priority, changes, residents, and watchlist." />
      <Card style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#E7F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={26} color="#00B295" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Coming next</div>
        <div style={{ fontSize: 13, color: '#6A7282', maxWidth: 420 }}>
          The continuity engine already feeds this surface. UI design is queued — let me know when to push it to high fidelity.
        </div>
      </Card>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
