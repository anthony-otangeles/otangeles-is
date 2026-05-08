// Main app — routing + state for Otangeles Intelligent System

function App() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState({ page: 'home' });
  const [chats, setChats] = useState([]);
  const [actions, setActions] = useState(OPERATIONAL_ACTIONS_SEED);
  const isCompact = true;

  if (!user) return <LoginScreen onSignIn={u => { setUser(u); setRoute({ page: 'home' }); }} />;

  function onNav(page) { setRoute({ page }); window.scrollTo(0, 0); }
  function onOpenMenu() { setRoute({ page: 'menu' }); window.scrollTo(0, 0); }
  function onSmartNav(page) {
    const residentId = route.residentId;
    const contextual = page === 'ai' && residentId;
    setRoute(contextual ? { page, residentId } : { page });
    window.scrollTo(0, 0);
  }
  function onOpenResident(id) { setRoute({ page: 'resident', residentId: id }); window.scrollTo(0, 0); }
  function onOpenIssue(residentId, issueId) { setRoute({ page: 'change', residentId, issueId }); window.scrollTo(0, 0); }
  function onOpenAction(actionId) { setRoute({ page: 'action', actionId }); window.scrollTo(0, 0); }
  function onOpenClosure(actionId) { setRoute({ page: 'closure', actionId }); window.scrollTo(0, 0); }
  function onOpenMessageThread(threadId) {
    setRoute(route.residentId ? { page: 'messageDetail', threadId, residentId: route.residentId } : { page: 'messageDetail', threadId });
    window.scrollTo(0, 0);
  }
  function onBackToMessages() {
    setRoute(route.residentId ? { page: 'messages', residentId: route.residentId } : { page: 'messages' });
    window.scrollTo(0, 0);
  }
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
  function onAssignAction(residentId, suggestion) {
    const domain = domainById(suggestion.domain);
    const owner = TEST_USERS.find(u => u.role === suggestion.ownerRole || u.short === suggestion.ownerRole || u.role.includes(suggestion.ownerRole));
    const action = {
      id: `a${Date.now()}`,
      residentId,
      type: suggestion.type,
      domain: suggestion.domain,
      owner: owner ? owner.name : domain.owner,
      ownerRole: suggestion.ownerRole || domain.owner,
      priority: suggestion.priority,
      due: suggestion.due,
      status: 'Assigned',
      reason: suggestion.reason,
      notes: suggestion.notes || '',
    };
    setActions(list => [action, ...list]);
    emitToast(`${action.type} assigned to ${action.owner}.`, 'success');
    setRoute({ page: 'action', actionId: action.id });
    window.scrollTo(0, 0);
  }
  function onUpdateActionStatus(actionId, status) {
    setActions(list => list.map(a => a.id === actionId ? { ...a, status } : a));
    emitToast(`Action updated: ${status}.`, status === 'Completed' ? 'success' : 'info');
  }
  function onCloseRisk(actionId, closure) {
    setActions(list => list.map(a => a.id === actionId ? { ...a, status: closure.closure === 'Monitoring continued' ? 'In Progress' : 'Completed', closure } : a));
    emitToast(closure.closure === 'Monitoring continued' ? 'Monitoring continued.' : 'Risk closed with rationale.');
    setRoute({ page: 'actions' });
    window.scrollTo(0, 0);
  }

  const counts = {
    changes: FACILITY_CHANGES.filter(c => c.severity === 'critical' || c.severity === 'high').length,
    messages: messageUnreadCount(),
    actions: actions.filter(a => a.status !== 'Completed').length,
  };
  const activeNav = route.page === 'resident' ? 'residents'
    : route.page === 'change' ? 'changes'
    : route.page === 'action' || route.page === 'closure' ? 'actions'
    : route.page === 'messageDetail' ? 'messages'
    : route.page;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', fontFamily: 'Inter', color: '#1C192E' }}>
      <AppHeader
        user={user}
        onLogout={() => setUser(null)}
        onNav={onSmartNav}
        onOpenResident={onOpenResident}
        counts={counts}
        mobile={isCompact}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <main className="ois-page" style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 1024 }}>
          {route.page === 'home'      && <HomePage user={user} actions={actions} onOpenResident={onOpenResident} onOpenAction={onOpenAction} onNav={onSmartNav} />}
          {route.page === 'changes'   && <ChangesPage onOpenResident={onOpenResident} onOpenIssue={onOpenIssue} />}
          {route.page === 'residents' && <ResidentsList actions={actions} onOpen={onOpenResident} />}
          {route.page === 'resident'  && <ResidentProfile residentId={route.residentId} actions={actions} onBack={() => onNav('residents')} onOpenChat={onOpenChat} onOpenIssue={onOpenIssue} onAssignAction={onAssignAction} onOpenAction={onOpenAction} />}
          {route.page === 'change'    && <ChangeDetailPage residentId={route.residentId} issueId={route.issueId} onBack={() => onNav('changes')} />}
          {route.page === 'schedule'  && <SchedulePage onOpenResident={onOpenResident} />}
          {route.page === 'watchlist' && <WatchlistPage actions={actions} onOpenResident={onOpenResident} />}
          {route.page === 'actions'   && <ActionsPage actions={actions} onOpenAction={onOpenAction} onOpenResident={onOpenResident} onUpdateActionStatus={onUpdateActionStatus} />}
          {route.page === 'action'    && <ActionDetailPage actionId={route.actionId} actions={actions} onBack={() => onNav('actions')} onOpenResident={onOpenResident} onUpdateActionStatus={onUpdateActionStatus} onOpenClosure={onOpenClosure} />}
          {route.page === 'closure'   && <ClosurePage actionId={route.actionId} actions={actions} onBack={() => setRoute({ page: 'action', actionId: route.actionId })} onCloseRisk={onCloseRisk} />}
          {route.page === 'messages'  && <MessagesPage user={user} onOpenThread={onOpenMessageThread} onOpenChat={onOpenChat} taggedResidentId={route.residentId} />}
          {route.page === 'messageDetail' && <MessageThreadPage threadId={route.threadId} onBack={onBackToMessages} onOpenChat={onOpenChat} />}
          {route.page === 'ai'        && <AIAssistantPage user={user} residentId={route.residentId} onOpenResident={onOpenResident} onOpenChat={onOpenChat} onNav={onSmartNav} />}
          {route.page === 'huddle'    && <HuddlePage user={user} onOpenResident={onOpenResident} />}
          {route.page === 'profile'   && <ProfilePage user={user} onLogout={() => setUser(null)} />}
          {route.page === 'menu'      && <MenuPage active={activeNav} onNav={onSmartNav} counts={counts} user={user} onLogout={() => setUser(null)} />}
          {!['home','changes','residents','resident','change','schedule','watchlist','actions','action','closure','messages','messageDetail','ai','huddle','profile','menu'].includes(route.page) && (
            <ComingSoon page={route.page} />
          )}
        </main>
      </div>
      {isCompact && (
        <MobileTabBar active={activeNav} onNav={onSmartNav} onMenu={onOpenMenu} counts={counts} />
      )}
      <ChatDock chats={chats} onClose={onCloseChat} onSendCall={() => {}} mobile={isCompact} />
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
