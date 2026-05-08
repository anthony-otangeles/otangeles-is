// Actions and closure — accountability layer

function ActionsPage({ actions, onOpenAction, onOpenResident, onUpdateActionStatus }) {
  const [filter, setFilter] = useState('open');
  const counts = actionStatusCounts(actions);
  const filtered = actions
    .filter(action => {
      if (filter === 'open') return action.status !== 'Completed';
      if (filter === 'high') return action.priority === 'High' && action.status !== 'Completed';
      if (filter === 'overdue') return action.status === 'Overdue';
      if (filter === 'assigned') return ['Assigned','In Progress'].includes(action.status);
      if (filter === 'completed') return action.status === 'Completed';
      if (filter === 'escalated') return action.status === 'Escalated';
      return true;
    })
    .slice()
    .sort((a, b) => {
      const statusRank = { Overdue: 0, Escalated: 1, 'No Action': 2, Assigned: 3, 'In Progress': 4, Completed: 5 };
      return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
    });
  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 18 : 24 }}>
      <PageHeader
        title="Actions"
        subtitle="Execution and accountability for resident risk. Nothing high-risk disappears without closure."
      />
      <OperationalCognitionPanel actions={actions} compact={isPhone} />

      <Card style={{ padding: 14, display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        <ActionMetric label="Overdue" value={counts.overdue} tone="critical" />
        <ActionMetric label="Unassigned" value={counts.unassigned} tone="critical" />
        <ActionMetric label="Escalated" value={counts.escalated} tone="high" />
        <ActionMetric label="Due today" value={counts.dueToday} tone="watch" />
      </Card>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          ['open', 'Open'],
          ['high', 'High Priority'],
          ['overdue', 'Overdue'],
          ['assigned', 'Assigned'],
          ['escalated', 'Escalated'],
          ['completed', 'Completed'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            flexShrink: 0, border: `1px solid ${filter === id ? '#00C9A7' : '#E5E7EB'}`,
            background: filter === id ? '#E7F5EF' : '#fff', color: filter === id ? '#00795E' : '#52525B',
            borderRadius: 9999, padding: '8px 12px', font: '800 12px Inter', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(action => (
          <OperationalActionCard
            key={action.id}
            action={action}
            onOpen={() => onOpenAction(action.id)}
            onOpenResident={() => onOpenResident(action.residentId)}
            onUpdateActionStatus={onUpdateActionStatus}
          />
        ))}
        {filtered.length === 0 && (
          <Card style={{ padding: 30, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>No actions in this queue.</Card>
        )}
      </div>
    </div>
  );
}

function ActionMetric({ label, value, tone }) {
  const c = tone === 'critical' ? '#E53E3E' : tone === 'high' ? RISK.high.dot : '#E9C05F';
  return (
    <div style={{ border: '1px solid #EEEEEE', borderRadius: 10, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: c, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6A7282', fontWeight: 800, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function OperationalActionCard({ action, onOpen, onOpenResident, onUpdateActionStatus }) {
  const r = RESIDENTS.find(x => x.id === action.residentId);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [animatingStatus, setAnimatingStatus] = useState(null);
  const isCompleting = confirmStatus === 'Completed';

  function confirmStatusChange() {
    const nextStatus = confirmStatus;
    setConfirmStatus(null);
    setAnimatingStatus(nextStatus);
    setTimeout(() => onUpdateActionStatus(action.id, nextStatus), 180);
    setTimeout(() => setAnimatingStatus(null), 620);
  }

  return (
    <>
      <Card hoverable onClick={onOpen} style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transform: animatingStatus ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
        border: animatingStatus === 'Completed' ? '1px solid #29BB89' : animatingStatus ? '1px solid #0081CF' : '1px solid #E5E7EB',
        boxShadow: animatingStatus ? '0 12px 24px -14px rgba(0,129,207,0.45)' : undefined,
        transition: 'transform 220ms ease-out, border-color 220ms ease-out, box-shadow 220ms ease-out',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {r && <Avatar initials={r.initials} seed={r.id} size={38} isResident />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>{r ? r.name : 'Resident'}</div>
              {r && <button onClick={e => { e.stopPropagation(); onOpenResident(); }} style={{ border: 0, background: 'transparent', color: '#845EC2', font: '800 11px Inter', cursor: 'pointer', padding: 0 }}>Open resident</button>}
            </div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>{r ? `Room ${r.room} · ${r.unit}` : 'Location pending'}</div>
          </div>
          <ActionStatusBadge status={action.status} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 3 }}>{action.reason}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DomainChip domainId={action.domain} />
          <Chip tone={action.priority === 'High' ? 'high' : 'watch'}>{action.priority}</Chip>
          <Chip tone="todo">{action.due}</Chip>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTop: '1px solid #EEEEEE', paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: '#1C192E', fontWeight: 800 }}>{action.owner} · {action.ownerRole}</div>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
            {action.status !== 'In Progress' && action.status !== 'Completed' && (
              <Button size="sm" variant="secondary" onClick={() => setConfirmStatus('In Progress')}>Start</Button>
            )}
            {action.status !== 'Completed' && (
              <Button size="sm" variant="primary" onClick={() => setConfirmStatus('Completed')}>Complete</Button>
            )}
          </div>
        </div>
      </Card>

      {confirmStatus && (
        <ModalShell
          title={isCompleting ? 'Mark Action Complete?' : 'Start Action?'}
          subtitle={isCompleting ? 'Confirm this follow-through is ready to be marked complete.' : 'Confirm you want to move this action into active work.'}
          onClose={() => setConfirmStatus(null)}
          width={440}
          footer={[
            <Button key="cancel" variant="secondary" onClick={() => setConfirmStatus(null)}>Cancel</Button>,
            <Button key="confirm" variant={isCompleting ? 'primary' : 'secondary'} icon={isCompleting ? 'check' : 'activity'} onClick={confirmStatusChange}>
              {isCompleting ? 'Mark Complete' : 'Start Action'}
            </Button>,
          ]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
            <div style={{ fontSize: 13, color: '#6A7282', lineHeight: '19px' }}>
              {r ? `${r.name} · Room ${r.room}` : 'Resident'} · {action.owner}
            </div>
            <div style={{ padding: 12, borderRadius: 9, background: '#FAFAFC', border: '1px solid #EEEEEE', fontSize: 13, color: '#1C192E', lineHeight: '19px' }}>
              {action.reason}
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}

function ActionDetailPage({ actionId, actions, onBack, onOpenResident, onUpdateActionStatus, onOpenClosure }) {
  const action = actions.find(a => a.id === actionId);
  const r = action && RESIDENTS.find(x => x.id === action.residentId);
  if (!action || !r) return null;
  const statuses = ['Assigned','In Progress','Overdue','Escalated','Completed'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 800,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Actions
      </button>
      <Card style={{ padding: 18, borderLeft: '4px solid #00C9A7', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar initials={r.initials} seed={r.id} size={44} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3 }}>{r.name} · Room {r.room} · {r.unit}</div>
          </div>
          <ActionStatusBadge status={action.status} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DomainChip domainId={action.domain} />
          <Chip tone={action.priority === 'High' ? 'high' : 'watch'}>{action.priority}</Chip>
          <Chip tone="todo">{action.due}</Chip>
        </div>
        <div style={{ fontSize: 14, color: '#1C192E', lineHeight: '20px' }}>{action.reason}</div>
        <div style={{ padding: 12, border: '1px solid #EEEEEE', borderRadius: 10, background: '#FAFAFC' }}>
          <div style={{ fontSize: 11, color: '#99A1AF', fontWeight: 900, letterSpacing: '0.06em' }}>OWNER</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E', marginTop: 4 }}>{action.owner}</div>
          <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>{action.ownerRole}</div>
        </div>
      </Card>

      <ContinuityThreadPanel r={r} actions={actions} />
      <EvidenceSummaryPanel r={r} />

      <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Update Operational State</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {statuses.map(status => (
            <button key={status} onClick={() => onUpdateActionStatus(action.id, status)} style={{
              border: `1px solid ${action.status === status ? '#00C9A7' : '#E5E7EB'}`,
              background: action.status === status ? '#E7F5EF' : '#fff',
              color: action.status === status ? '#00795E' : '#52525B',
              borderRadius: 9999, padding: '8px 11px', font: '800 12px Inter', cursor: 'pointer',
            }}>{status}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="secondary" icon="user" onClick={() => onOpenResident(r.id)}>Open Resident</Button>
          <Button variant="primary" icon="check" onClick={() => onOpenClosure(action.id)}>Close Risk</Button>
        </div>
      </Card>
    </div>
  );
}

function ClosurePage({ actionId, actions, onBack, onCloseRisk }) {
  const action = actions.find(a => a.id === actionId);
  const r = action && RESIDENTS.find(x => x.id === action.residentId);
  const [closure, setClosure] = useState('Intervention completed');
  const [reviewed, setReviewed] = useState(action ? action.reason : '');
  const [taken, setTaken] = useState(action ? action.type : '');
  const [notified, setNotified] = useState('Provider notification pending confirmation');
  const [riskRemains, setRiskRemains] = useState(true);
  const [followUp, setFollowUp] = useState('Next shift');
  if (!action || !r) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 800,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Action
      </button>
      <PageHeader title="Closure View" subtitle={`${r.name} · close the operational loop with rationale and follow-up.`} />
      <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ClosureField label="Closure option">
          <select value={closure} onChange={e => setClosure(e.target.value)} style={selectStyle}>
            {['Reviewed — no intervention needed','Intervention completed','Escalated to provider','Monitoring continued','Deferred with rationale','Unresolved'].map(x => <option key={x}>{x}</option>)}
          </select>
        </ClosureField>
        <ClosureField label="What was reviewed"><textarea value={reviewed} onChange={e => setReviewed(e.target.value)} style={textareaStyle} /></ClosureField>
        <ClosureField label="What action was taken"><textarea value={taken} onChange={e => setTaken(e.target.value)} style={textareaStyle} /></ClosureField>
        <ClosureField label="Provider/family notification"><textarea value={notified} onChange={e => setNotified(e.target.value)} style={textareaStyle} /></ClosureField>
        <ClosureField label="Resident remains at risk">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Button variant={riskRemains ? 'lavender' : 'secondary'} onClick={() => setRiskRemains(true)}>Yes</Button>
            <Button variant={!riskRemains ? 'lavender' : 'secondary'} onClick={() => setRiskRemains(false)}>No</Button>
          </div>
        </ClosureField>
        <ClosureField label="Next follow-up time"><Input value={followUp} onChange={e => setFollowUp(e.target.value)} /></ClosureField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="secondary" icon="activity" onClick={() => onCloseRisk(action.id, { closure: 'Monitoring continued', reviewed, taken, notified, riskRemains: true, followUp })}>Continue Monitoring</Button>
          <Button variant="primary" icon="check" onClick={() => onCloseRisk(action.id, { closure, reviewed, taken, notified, riskRemains, followUp })}>Close Risk</Button>
        </div>
      </Card>
    </div>
  );
}

function ClosureField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontSize: 11, color: '#6A7282', fontWeight: 900, letterSpacing: '0.06em' }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}

const textareaStyle = { minHeight: 82, border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, font: '13px Inter', color: '#1C192E', resize: 'vertical', outline: 0 };
const selectStyle = { height: 42, border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 10px', font: '13px Inter', color: '#1C192E', background: '#fff' };

Object.assign(window, { ActionsPage, OperationalActionCard, ActionDetailPage, ClosurePage });
