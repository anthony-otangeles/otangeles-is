// Residents list + Resident profile with tabs

function ResidentsList({ onOpen, actions }) {
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('all');
  const [risk, setRisk] = useState('all');
  const [domain, setDomain] = useState('all');
  const [actionStatus, setActionStatus] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const v = useViewport();
  const isPhone = v.isMobile;
  const units = ['all', ...Array.from(new Set(RESIDENTS.map(r => r.unit)))];
  const riskOptions = ['all', 'High', 'Moderate', 'Low'];
  const actionOptions = ['all', 'No Action', 'Assigned', 'In Progress', 'Overdue', 'Escalated', 'Completed'];
  const activeFilterCount = [unit, risk, domain, actionStatus].filter(x => x !== 'all').length;

  const filtered = priorityResidentsWithActions(actions).filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.mrn.includes(q) || r.room.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q);
    const matchesUnit = unit === 'all' || r.unit === unit;
    const matchesRisk = risk === 'all' || riskLabelForResident(r) === risk;
    const matchesDomain = domain === 'all'
      || (r.drivers || []).includes(domain)
      || residentEvidenceItems(r).some(item => item.domain === domain);
    const matchesAction = actionStatus === 'all' || residentActionStatus(r, actions) === actionStatus;
    return matchesSearch && matchesUnit && matchesRisk && matchesDomain && matchesAction;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Residents"
        subtitle="Searchable resident directory. Filters narrow the same unified risk and action model shown on Home."
        actions={[
          <Button key="add" variant="primary" icon="plus" onClick={() => emitToast('Add Resident flow coming soon — wire to PCC admit endpoint.', 'info')}>Add Resident</Button>,
        ]}
      />

      <Card style={{ padding: isPhone ? 12 : 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <Input icon="search" placeholder="Search by name, MRN, room, unit…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          <Button variant="secondary" icon="filter" onClick={() => setFilterOpen(true)} style={{ minWidth: isPhone ? 104 : 124 }}>
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: '#6A7282' }}>
            Showing <b style={{ color: '#1C192E' }}>{filtered.length}</b> of {RESIDENTS.length}
          </div>
          <ActiveFilterSummary unit={unit} risk={risk} domain={domain} actionStatus={actionStatus} />
          {activeFilterCount > 0 && (
            <button onClick={() => { setUnit('all'); setRisk('all'); setDomain('all'); setActionStatus('all'); }} style={{
              border: 0, background: 'transparent', color: '#845EC2', font: '800 12px Inter', cursor: 'pointer', padding: 0,
            }}>Clear filters</button>
          )}
        </div>
      </Card>
      {filterOpen && (
        <ResidentFilterSheet
          unit={unit} risk={risk} domain={domain} actionStatus={actionStatus}
          units={units} riskOptions={riskOptions} actionOptions={actionOptions}
          onUnit={setUnit} onRisk={setRisk} onDomain={setDomain} onActionStatus={setActionStatus}
          onClose={() => setFilterOpen(false)}
          onClear={() => { setUnit('all'); setRisk('all'); setDomain('all'); setActionStatus('all'); }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 260 : 320}px, 1fr))`, gap: 12 }}>
        {filtered.map(r => <OperationalResidentCard key={r.id} r={r} actions={actions} onClick={() => onOpen(r.id)} />)}
      </div>
      {filtered.length === 0 && (
        <Card style={{ padding: 28, textAlign: 'center', fontSize: 13, color: '#6A7282' }}>
          No residents match the current filters.
        </Card>
      )}
    </div>
  );
}

function ActiveFilterSummary({ unit, risk, domain, actionStatus }) {
  const active = [
    unit !== 'all' && unit,
    risk !== 'all' && risk,
    domain !== 'all' && domainById(domain).short,
    actionStatus !== 'all' && actionStatus,
  ].filter(Boolean);
  if (!active.length) return <div style={{ fontSize: 12, color: '#99A1AF' }}>No filters applied</div>;
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {active.map(item => <Chip key={item} tone="todo">{item}</Chip>)}
    </div>
  );
}

function ResidentFilterSheet({ unit, risk, domain, actionStatus, units, riskOptions, actionOptions, onUnit, onRisk, onDomain, onActionStatus, onClose, onClear }) {
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,46,0.34)', zIndex: 80, display: 'flex', alignItems: isPhone ? 'flex-end' : 'center', justifyContent: 'center', padding: isPhone ? 0 : 18 }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isPhone ? '100%' : 480,
        maxWidth: isPhone ? '100%' : 'calc(100vw - 36px)',
        background: '#fff',
        borderRadius: isPhone ? '16px 16px 0 0' : 14,
        border: '1px solid #E5E7EB',
        boxShadow: '0 20px 40px rgba(28,25,46,0.18)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1C192E' }}>Filter Residents</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>Use structured filters instead of sideways scrolling chips.</div>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 12 }}>
          <FilterSelect label="Unit" value={unit} onChange={onUnit} options={units.map(u => ({ id: u, label: u === 'all' ? 'All units' : u }))} />
          <FilterSelect label="Risk level" value={risk} onChange={onRisk} options={riskOptions.map(x => ({ id: x, label: x === 'all' ? 'All risk levels' : x }))} />
          <FilterSelect label="Risk domain" value={domain} onChange={onDomain} options={[{ id: 'all', label: 'All domains' }, ...RISK_DOMAINS.map(d => ({ id: d.id, label: d.label }))]} />
          <FilterSelect label="Action status" value={actionStatus} onChange={onActionStatus} options={actionOptions.map(x => ({ id: x, label: x === 'all' ? 'All action statuses' : x }))} />
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #EEEEEE', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="secondary" onClick={onClear}>Clear</Button>
          <Button variant="primary" onClick={onClose}>Apply Filters</Button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: '#6A7282', letterSpacing: '0.06em' }}>{label.toUpperCase()}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%',
        height: 42,
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        background: '#fff',
        color: '#1C192E',
        font: '700 13px Inter',
        padding: '0 10px',
        outline: 0,
      }}>
        {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}

function FilterRow({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 8, alignItems: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6A7282', letterSpacing: '0.05em' }}>{label.toUpperCase()}</div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {options.map(option => {
          const active = value === option.id;
          return (
            <button key={option.id} onClick={() => onChange(option.id)} style={{
              flex: '0 0 auto',
              minHeight: 34,
              borderRadius: 9999,
              border: `1px solid ${active ? '#00C9A7' : '#E5E7EB'}`,
              background: active ? '#E7F5EF' : '#fff',
              color: active ? '#00795E' : '#52525B',
              padding: '7px 11px',
              font: '800 12px Inter',
              cursor: 'pointer',
            }}>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const th = { padding: '12px 18px', fontWeight: 700 };
const td = { padding: '14px 18px', fontSize: 14, color: '#1C192E', verticalAlign: 'middle' };

function SegmentedControl({ value, onChange, options }) {
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4, background: '#F5F2FD', borderRadius: 8,
      flexWrap: isPhone ? 'wrap' : 'nowrap', width: '100%', maxWidth: '100%',
    }}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 12px', borderRadius: 6, border: 0,
            background: active ? '#fff' : 'transparent',
            color: active ? '#1C192E' : '#6A7282',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            flex: isPhone ? '1 1 calc(50% - 4px)' : '0 0 auto',
            minWidth: 0,
          }}>
            {o.tone && <span style={{ width: 7, height: 7, borderRadius: 9999, background: RISK[o.tone].dot }} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ViewBtn({ icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, border: 0, background: active ? '#F5F2FD' : '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={16} color={active ? '#845EC2' : '#6A7282'} />
    </button>
  );
}

function ResidentRow({ r, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <tr onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderTop: '1px solid #EEEEEE', cursor: 'pointer', background: hover ? '#FAFAFA' : '#fff', transition: 'background 120ms' }}>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={r.initials} seed={r.id} size={36} isResident />
          <div>
            <div style={{ fontWeight: 700 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6A7282' }}>{r.age} · {r.sex} · {r.dx.split(',')[0]}</div>
          </div>
        </div>
      </td>
      <td style={{ ...td, fontFamily: 'JetBrains Mono', fontSize: 12, color: '#6A7282' }}>{r.mrn}</td>
      <td style={td}><div style={{ fontWeight: 600 }}>Rm {r.room}</div><div style={{ fontSize: 12, color: '#6A7282' }}>{r.unit}</div></td>
      <td style={td}><Chip tone={r.code === 'Full Code' ? 'info' : r.code.startsWith('DNR') ? 'voided' : 'todo'}>{r.code}</Chip></td>
      <td style={td}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(r.drivers || []).slice(0, 2).map(id => {
            const cat = RISK_CATEGORIES.find(c => c.id === id);
            return cat ? <Chip key={id} tone="todo">{cat.label.split(' / ')[0]}</Chip> : null;
          })}
          {(r.drivers || []).length > 2 && <Chip tone="todo">+{r.drivers.length - 2}</Chip>}
        </div>
      </td>
      <td style={{ ...td, textAlign: 'right' }}><Icon name="chevronRight" size={16} color="#99A1AF" /></td>
    </tr>
  );
}

function ResidentGridCard({ r, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 4, background: '#E5E7EB' }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar initials={r.initials} seed={r.id} size={44} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6A7282' }}>Rm {r.room} · {r.unit}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#6A7282', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.dx}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip tone={r.code === 'Full Code' ? 'info' : r.code.startsWith('DNR') ? 'voided' : 'todo'}>{r.code}</Chip>
          <code style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6A7282' }}>{r.mrn}</code>
        </div>
      </div>
    </Card>
  );
}

// ============== RESIDENT PROFILE ==============

function ResidentProfile({ residentId, actions, onBack, onOpenChat, onOpenIssue, onAssignAction, onOpenAction }) {
  const r = RESIDENTS.find(x => x.id === residentId);
  const [tab, setTab] = useState('changes');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const v = useViewport();
  const isPhone = v.isMobile;
  if (!r) return null;
  const tone = RISK[r.risk];
  const teamIds = CARE_TEAMS[r.id] || CARE_TEAMS.r1;
  const team = teamIds.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const evidence = residentEvidenceItems(r);
  const activeDomains = Array.from(new Set([...(r.drivers || []), ...evidence.map(item => item.domain)]));
  const residentSchedule = SCHEDULE_EVENTS_SEED.filter(event => event.residentId === r.id);
  const nextSchedule = residentSchedule[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Residents
      </button>

      {/* Profile header */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 4, background: tone.dot }} />
        <div style={{ padding: isPhone ? 14 : 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: isPhone ? 12 : 16, alignItems: 'stretch' }}>
            <div style={{ position: 'relative' }}>
              <Avatar initials={r.initials} seed={r.id} size={isPhone ? 58 : 72} isResident />
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#fff', borderRadius: 9999, padding: 2 }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, background: tone.dot, border: '2px solid #fff' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: isPhone ? 20 : 24, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.05 }}>{r.name}</h1>
                <RiskBadge level={r.risk} score={r.score} />
              </div>
              <div style={{ fontSize: isPhone ? 12 : 13, color: '#6A7282', lineHeight: '17px' }}>
                {r.age} · {r.sex} · <code style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>MRN {r.mrn}</code>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: isPhone ? 96 : 120 }}>
              <Button size="sm" variant="lavender" icon="calendar" style={{ width: '100%' }} onClick={() => setShowSchedule(true)}>Schedule</Button>
              <Button size="sm" variant="danger" icon="alertTriangle" style={{ width: '100%' }} onClick={() => setShowEscalate(true)}>Escalate</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' }}>
            <ProfileDetailTile icon="mapPin" label="Location" value={`Rm ${r.room} · ${r.unit}`} />
            <ProfileDetailTile icon="shield" label="Code Status" value={r.code} />
            <ProfileDetailTile icon="calendar" label="Admitted" value={r.admitted} />
            <ProfileDetailTile icon="activity" label="Primary Dx" value={r.dx} wide />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) minmax(280px, 0.7fr)', gap: 10, width: '100%' }}>
            <div style={{ padding: 10, border: '1px solid #EEEEEE', borderRadius: 9, background: '#FAFAFC' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#6A7282', letterSpacing: '0.06em', marginBottom: 7 }}>ACTIVE RISK DOMAINS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activeDomains.length ? activeDomains.slice(0, 8).map(id => <DomainChip key={id} domainId={id} />) : <Chip tone="stable">Routine monitoring</Chip>}
              </div>
            </div>
            <button onClick={() => setShowSchedule(true)} style={{
              border: '1px solid #E5E7EB',
              borderRadius: 9,
              background: nextSchedule ? '#E7F5EF' : '#fff',
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              cursor: 'pointer',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="calendar" size={16} color={nextSchedule ? '#00795E' : '#6A7282'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: nextSchedule ? '#00795E' : '#6A7282', letterSpacing: '0.05em' }}>{nextSchedule ? 'NEXT SCHEDULED' : 'NO UPCOMING SCHEDULE'}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nextSchedule ? `${nextSchedule.title} · ${nextSchedule.dateLabel} ${nextSchedule.startLabel}` : 'Tap to schedule'}
                </div>
              </div>
              <Icon name="chevronRight" size={14} color="#99A1AF" />
            </button>
          </div>
        </div>

        {/* Risk score + trend */}
        <div className="ois-profile-trend">
          <RiskScoreCard score={r.score} level={r.risk} trend={r.trend} />
          <RiskTrendChart score={r.score} level={r.risk} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) minmax(280px, 0.8fr)', gap: 12 }}>
        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Why this resident was flagged</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3 }}>
              Risk moved to {riskLabelForResident(r)} and is {trendLabelForResident(r)} over the current monitoring window.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(evidence.length ? evidence : [{ id: 'routine', title: 'Routine monitoring', detail: r.dx, severity: r.risk }]).slice(0, 5).map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: '#1C192E', lineHeight: '18px' }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: (RISK[item.severity] || tone).dot, marginTop: 6, flexShrink: 0 }} />
                <span><b>{item.title}</b>{item.detail ? ` - ${item.detail}` : ''}</span>
              </div>
            ))}
          </div>
        </Card>
        <OperationalCognitionPanel resident={r} actions={actions} compact={isPhone} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) minmax(300px, 0.9fr)', gap: 12 }}>
        <ContinuityThreadPanel r={r} actions={actions} onOpenAction={onOpenAction} />
        <SuggestedActionPanel r={r} actions={actions} onAssign={onAssignAction} onOpenAction={onOpenAction} />
      </div>

      {/* Tabs */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid #EEEEEE', padding: isPhone ? '0 4px' : '0 12px' }}>
          {[
            { id: 'changes', label: 'Changes', icon: 'activity', count: (r.issues || []).length },
            { id: 'team', label: 'Care Team', icon: 'users', count: team.length },
            { id: 'notes', label: 'Notes', icon: 'fileText', count: (NOTES_SEED[r.id] || []).length },
            { id: 'plan', label: 'Care Plan', icon: 'message', count: (CAREPLAN_SEED[r.id] || []).length },
          ].map(t => (
            <TabBtn key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />
          ))}
        </div>
        <div style={{ padding: isPhone ? 14 : 24 }}>
          {tab === 'changes' && <ChangesTab r={r} onOpenIssue={onOpenIssue} />}
          {tab === 'team' && <CareTeamTab team={team} onMessage={u => onOpenChat(r, u)} />}
          {tab === 'notes' && <NotesTab r={r} team={team} />}
          {tab === 'plan' && <CarePlanTab r={r} team={team} />}
        </div>
      </Card>

      {showSchedule && <ScheduleModal r={r} team={team} onClose={() => setShowSchedule(false)} />}
      {showEscalate && <EscalateModal r={r} team={team} onClose={() => setShowEscalate(false)} />}
    </div>
  );
}

function ProfileDetailTile({ icon, label, value, wide }) {
  return (
    <div style={{
      gridColumn: wide ? '1 / -1' : undefined,
      minWidth: 0,
      border: '1px solid #EEEEEE',
      borderRadius: 9,
      background: '#fff',
      padding: 10,
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
    }}>
      <Icon name={icon} size={15} color="#99A1AF" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#99A1AF', letterSpacing: '0.06em' }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 12, fontWeight: 800, marginTop: 3, color: '#1C192E', lineHeight: '16px' }}>{value}</div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value, flex }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0, flex: flex ? 1 : '0 0 auto' }}>
      <Icon name={icon} size={16} color="#99A1AF" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.04em' }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}

function TabBtn({ t, active, onClick }) {
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <button onClick={onClick} style={{
      padding: isPhone ? '10px 4px 9px' : '12px 8px 10px', border: 0, background: 'transparent', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      fontSize: isPhone ? 11 : 12, fontWeight: 800,
      color: active ? '#845EC2' : '#6A7282',
      borderBottom: `2px solid ${active ? '#845EC2' : 'transparent'}`,
      marginBottom: -1, transition: 'all 120ms', minWidth: 0, minHeight: isPhone ? 58 : 64, position: 'relative',
    }}>
      <Icon name={t.icon} size={isPhone ? 17 : 18} color={active ? '#845EC2' : '#6A7282'} />
      <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
      {t.count != null && <span style={{
        position: 'absolute', top: 5, right: 5,
        minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999,
        background: active ? '#F5F2FD' : '#F3F4F6', color: active ? '#845EC2' : '#6A7282',
        fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{t.count}</span>}
    </button>
  );
}

function RiskScoreCard({ score, level, trend }) {
  const tone = RISK[level];
  const pct = Math.min(100, score);
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em' }}>RISK SCORE</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 48, fontWeight: 700, color: tone.fg, letterSpacing: '-0.02em' }}>{score}</span>
        <span style={{ fontSize: 14, color: '#6A7282' }}>/ 100</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: trend === 'up' ? '#E53E3E' : trend === 'down' ? '#29BB89' : '#6A7282', fontSize: 13, fontWeight: 700 }}>
          <Icon name={trend === 'up' ? 'trendingUp' : trend === 'down' ? 'trendingDown' : 'arrowRight'} size={14} color={trend === 'up' ? '#E53E3E' : trend === 'down' ? '#29BB89' : '#6A7282'} />
          {trend === 'up' ? '+9 last 7d' : trend === 'down' ? '−6 last 7d' : '±0 last 7d'}
        </div>
      </div>
      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 9999, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: tone.dot, borderRadius: 9999, transition: 'width 400ms' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#99A1AF', marginTop: 4 }}>
        <span>0 Stable</span><span>40 Watch</span><span>60 High</span><span>80 Critical</span>
      </div>
    </div>
  );
}

function RiskTrendChart({ score, level }) {
  const lineColor = '#E53E3E';
  const softRed = 'rgba(229,62,62,0.12)';
  const gradId = `risk-trend-red-${level || 'resident'}`;
  // Generate 14 data points trending up to current
  const points = useMemo(() => {
    const arr = [];
    let cur = Math.max(15, score - 22);
    for (let i = 0; i < 14; i++) {
      cur += (Math.random() - 0.4) * 6;
      cur = Math.max(8, Math.min(95, cur));
      arr.push(cur);
    }
    arr[arr.length - 1] = score;
    return arr;
  }, [score]);
  const W = 480, H = 96, P = 8;
  const max = 100, min = 0;
  const path = points.map((p, i) => {
    const x = P + (i / (points.length - 1)) * (W - P * 2);
    const y = P + (1 - (p - min) / (max - min)) * (H - P * 2);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPath = path + ` L ${W - P},${H - P} L ${P},${H - P} Z`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em' }}>14-DAY TREND</div>
        <div style={{ fontSize: 11, color: '#6A7282' }}>Score · driven by vitals, labs, ADL change, med adherence</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block', background: 'linear-gradient(180deg, rgba(253,236,236,0.72) 0%, rgba(255,255,255,0) 100%)', borderRadius: 8 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#E53E3E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={P} y1={P + (1 - 0.6) * (H - 2 * P)} x2={W - P} y2={P + (1 - 0.6) * (H - 2 * P)} stroke={softRed} strokeDasharray="3 3" />
        <line x1={P} y1={P + (1 - 0.8) * (H - 2 * P)} x2={W - P} y2={P + (1 - 0.8) * (H - 2 * P)} stroke="#FCA5A5" strokeDasharray="3 3" />
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => {
          const x = P + (i / (points.length - 1)) * (W - P * 2);
          const y = P + (1 - (p - min) / (max - min)) * (H - P * 2);
          return <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 0} fill={lineColor} />;
        })}
      </svg>
    </div>
  );
}

// ============== TABS ==============

function ChangesTab({ r, onOpenIssue }) {
  const issues = r.issues || [
    { id: 'i1', kind: 'vitals', severity: 'watch', title: 'No active changes flagged', detail: 'Vitals, labs, and notes are within the current monitoring window.', source: 'Monitor', time: 'Now' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Icon name="activity" size={16} color="#845EC2" />
        <div style={{ fontSize: 13, color: '#6A7282' }}>
          <b style={{ color: '#1C192E' }}>{issues.length} active changes</b> driving this resident's risk score. Click any card for full evidence and next actions.
        </div>
      </div>
      {issues.map(issue => (
        <ChangeCard key={issue.id} issue={issue} r={r}
          onOpen={() => onOpenIssue && onOpenIssue(r.id, issue.id)} />
      ))}
    </div>
  );
}

function ChangeCard({ issue, r, onOpen, status }) {
  const sev = RISK[issue.severity] || RISK.watch;
  const iconMap = { vitals: 'activity', wound: 'heart', med: 'pill', fall: 'shield', lab: 'fileText', nutrition: 'droplet', sepsis: 'alertTriangle', rehab: 'trendingDown' };
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid #E5E7EB', borderRadius: 12, padding: 16,
        display: 'flex', gap: 14, alignItems: 'flex-start', background: '#fff', cursor: 'pointer',
        boxShadow: hover ? '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 150ms',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={iconMap[issue.kind] || 'activity'} size={20} color={sev.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{issue.title}</div>
          <RiskBadge level={issue.severity} />
          {status === 'ack' && <Chip tone="signed" dot>Acknowledged</Chip>}
          {status === 'monitor' && <Chip tone="pending" dot>For Monitoring</Chip>}
        </div>
        <div style={{ fontSize: 13, color: '#6A7282', marginTop: 6, lineHeight: '18px' }}>{issue.detail}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, fontSize: 12, color: '#99A1AF' }}>
          <span>{issue.source}</span>
          <span>·</span>
          <span>{issue.time}</span>
        </div>
      </div>
    </div>
  );
}

function ChangeActionMenu({ status, onSetStatus, fullWidth }) {
  const containerStyle = fullWidth ? { width: '100%' } : undefined;
  const actionStyle = fullWidth ? { width: '100%', height: 40, justifyContent: 'center' } : undefined;
  if (status === 'ack') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
        background: '#E7F5EF', color: '#3F6B4E',
        ...actionStyle,
      }}>
        <Icon name="check" size={14} color="#3F6B4E" /> Acknowledged
      </span>
    );
  }
  if (status === 'monitor') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
        background: '#FFF8E6', color: '#92703A',
        ...actionStyle,
      }}>
        <Icon name="activity" size={14} color="#92703A" /> For Monitoring
      </span>
    );
  }
  return (
    <MoreActionMenu
      label="More action"
      icon="plus"
      style={containerStyle}
      buttonStyle={actionStyle}
      items={[
        { icon: 'check',    label: 'Acknowledge',  sub: 'Mark this change as reviewed and resolved.', onClick: () => onSetStatus('ack') },
        { icon: 'activity', label: 'Move to Watch', sub: 'Keep monitoring — change stays open.',       onClick: () => onSetStatus('monitor') },
      ]}
    />
  );
}

function ChangeDetailPage({ residentId, issueId, onBack }) {
  const r = RESIDENTS.find(x => x.id === residentId);
  if (!r) return null;
  const issue = (r.issues || []).find(i => i.id === issueId) || (r.issues || [])[0];
  if (!issue) return null;
  const teamIds = CARE_TEAMS[r.id] || CARE_TEAMS.r1;
  const team = teamIds.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const [discussOpen, setDiscussOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const v = useViewport();
  const isPhone = v.isMobile;
  const sev = RISK[issue.severity] || RISK.watch;
  const iconMap = { vitals: 'activity', wound: 'heart', med: 'pill', fall: 'shield', lab: 'fileText', nutrition: 'droplet', sepsis: 'alertTriangle', rehab: 'trendingDown' };
  const drivers = (issue.drivers || r.drivers || []).slice(0, 3);
  const reasons = issue.reasons || [issue.detail];
  const actions = issue.actions || [
    { kind: 'message', title: 'Discuss with care team', sub: `${team.length} members on this resident` },
    { kind: 'phone',   title: 'Notify primary MD',     sub: 'NP / MD on call' },
    { kind: 'shield',  title: 'Order pharmacist review', sub: 'Pharmacist · async' },
  ];
  const timeline = issue.timeline || [
    { when: 'Yesterday AM', text: 'Stable, baseline within range', tone: '#99A1AF' },
    { when: 'Yesterday PM', text: 'First deviation noted', tone: '#E9C05F' },
    { when: 'Overnight',    text: issue.detail, tone: '#FF6E6C' },
    { when: 'Today',        text: `Risk increased → ${sev.label}`, tone: '#E53E3E' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 800,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Changes
      </button>

      <Card style={{ padding: isPhone ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 14, borderLeft: `4px solid ${sev.dot}` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={iconMap[issue.kind] || 'activity'} size={22} color={sev.fg} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isPhone ? 18 : 22, fontWeight: 800, lineHeight: isPhone ? '23px' : '28px', color: '#1C192E' }}>{issue.title}</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 5, lineHeight: '17px' }}>
              {r.name} · Rm {r.room} · {r.unit} · MRN {r.mrn}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <RiskBadge level={issue.severity} />
          <Chip tone="info">{issue.source}</Chip>
          <Chip tone="todo">{issue.time}</Chip>
          <Chip tone={r.code === 'Full Code' ? 'info' : r.code.startsWith('DNR') ? 'voided' : 'todo'}>Code: {r.code}</Chip>
          {status && <Chip tone={status === 'ack' ? 'signed' : 'watch'} dot>{status === 'ack' ? 'Acknowledged' : 'For Monitoring'}</Chip>}
        </div>

        <div style={{ padding: 12, borderRadius: 10, background: '#FAFAFC', border: '1px solid #EEEEEE', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#67568C', letterSpacing: '0.05em' }}>RECOMMENDED NEXT HUMAN DECISION</div>
          <div style={{ fontSize: 14, color: '#1C192E', lineHeight: '20px', fontWeight: 700 }}>{actions[0] ? actions[0].title : 'Review this change with the care team'}</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>{actions[0] ? actions[0].sub : 'Confirm evidence, select the intervention, and document the outcome.'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 8, alignItems: 'stretch' }}>
            <Button variant="primary" icon="phone" style={{ width: '100%' }} onClick={() => setNotifyOpen(true)}>Notify Provider</Button>
            <Button variant="secondary" icon="users" style={{ width: '100%' }} onClick={() => setDiscussOpen(true)}>Discuss Team</Button>
            <ChangeActionMenu fullWidth status={status} onSetStatus={s => { setStatus(s); s === 'ack' ? emitToast('Change acknowledged.') : emitToast('Moved to For Monitoring.', 'info'); }} />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1.05fr) minmax(280px, 0.95fr)', gap: 12 }}>
        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#52525B', letterSpacing: '0.06em' }}>WHY THIS WAS FLAGGED</div>
          <div style={{ fontSize: 14, color: '#1C192E', lineHeight: '20px' }}>{issue.detail}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reasons.map((rs, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: '#1C192E', lineHeight: '18px' }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: sev.dot, marginTop: 6, flexShrink: 0 }} />
                <span>{rs}</span>
              </div>
            ))}
          </div>
          {drivers.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
              {drivers.map(id => {
                const cat = RISK_CATEGORIES.find(c => c.id === id);
                return cat ? <Chip key={id} tone="todo">{cat.label}</Chip> : null;
              })}
            </div>
          )}
        </Card>

        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#52525B', letterSpacing: '0.06em' }}>ACTION QUEUE</div>
          {actions.map((a, i) => (
            <button key={i} onClick={() => emitToast(`Queued: ${a.title}`)} style={{
              border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, display: 'flex',
              gap: 10, alignItems: 'center', background: i === 0 ? '#F5F2FD' : '#fff',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E5E7EB' }}>
                <Icon name={a.kind} size={16} color="#845EC2" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C192E' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2, lineHeight: '17px' }}>{a.sub}</div>
              </div>
              <Icon name="plus" size={16} color="#845EC2" />
            </button>
          ))}
        </Card>

        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#52525B', letterSpacing: '0.06em' }}>TIMELINE</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            <span style={{ position: 'absolute', top: 6, bottom: 6, left: 5, width: 1, background: '#E5E7EB' }} />
            {timeline.map((ev, i) => (
              <li key={i} style={{ display: 'flex', gap: 13, position: 'relative' }}>
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: ev.tone, marginTop: 4, flexShrink: 0, zIndex: 1, border: '2px solid #fff' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#6A7282', fontWeight: 700 }}>{ev.when}</div>
                  <div style={{ fontSize: 13, color: '#1C192E', marginTop: 2, lineHeight: '18px' }}>{ev.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#52525B', letterSpacing: '0.06em' }}>CARE TEAM</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {team.slice(0, 6).map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', border: '1px solid #E5E7EB', borderRadius: 9999, background: '#fff' }}>
                <Avatar initials={u.initials} seed={u.id} size={24} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1C192E' }}>{u.short}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" icon="message" onClick={() => setDiscussOpen(true)}>Open Team Discussion</Button>
        </Card>
      </div>

      {notifyOpen && <NotifyProviderModal r={r} issue={issue} team={team} onClose={() => setNotifyOpen(false)} />}
      {discussOpen && <DiscussTeamModal r={r} issue={issue} team={team} onClose={() => setDiscussOpen(false)} />}
    </div>
  );
}

function ChangeDetailModal({ r, issue, onClose, onNotify, onDiscuss }) {
  const sev = RISK[issue.severity] || RISK.watch;
  const iconMap = { vitals: 'activity', wound: 'heart', med: 'pill', fall: 'shield', lab: 'fileText', nutrition: 'droplet', sepsis: 'alertTriangle', rehab: 'trendingDown' };
  const drivers = (issue.drivers || r.drivers || []).slice(0, 3);
  const reasons = issue.reasons || [issue.detail];
  const actions = issue.actions || [
    { kind: 'message', title: 'Discuss with care team', sub: `${(CARE_TEAMS[r.id]||[]).length} members on this resident` },
    { kind: 'phone',   title: 'Notify primary MD',     sub: 'NP / MD on call' },
    { kind: 'shield',  title: 'Order pharmacist review', sub: 'Pharmacist · async' },
  ];
  const timeline = issue.timeline || [
    { when: 'Yesterday AM', text: 'Stable, baseline within range', tone: '#99A1AF' },
    { when: 'Yesterday PM', text: 'First deviation noted', tone: '#E9C05F' },
    { when: 'Overnight',    text: issue.detail, tone: '#FF6E6C' },
    { when: 'Today',        text: `Risk increased → ${sev.label}`, tone: '#E53E3E' },
  ];
  return (
    <ModalShell title={issue.title} subtitle={`${r.name} · Rm ${r.room} · ${r.unit}`} onClose={onClose} width={680}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={iconMap[issue.kind] || 'activity'} size={22} color={sev.fg} />
          </div>
          <RiskBadge level={issue.severity} />
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6A7282' }}>{issue.source} · {issue.time}</div>
        </div>

        <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 14, border: '1px solid #EEEEEE' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.06em', marginBottom: 8 }}>WHY THIS WAS FLAGGED</div>
          <div style={{ fontSize: 14, color: '#1C192E', lineHeight: '20px' }}>{issue.detail}</div>
          <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reasons.map((rs, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#1C192E' }}>
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: sev.dot, marginTop: 7, flexShrink: 0 }} />
                <span>{rs}</span>
              </li>
            ))}
          </ul>
        </div>

        {drivers.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.06em', marginBottom: 8 }}>CLINICAL DOMAINS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {drivers.map(id => {
                const cat = RISK_CATEGORIES.find(c => c.id === id);
                return cat ? <Chip key={id} tone="todo">{cat.label}</Chip> : null;
              })}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.06em', marginBottom: 8 }}>SUGGESTED ACTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map((a, i) => (
              <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, display: 'flex', gap: 12, alignItems: 'center', background: '#fff' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9999, background: '#F5F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={a.kind} size={16} color="#845EC2" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>{a.sub}</div>
                </div>
                <IconButton icon="plus" color="#845EC2" onClick={() => emitToast(`Queued: ${a.title}`)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.06em', marginBottom: 10 }}>TIMELINE</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            <span style={{ position: 'absolute', top: 6, bottom: 6, left: 5, width: 1, background: '#E5E7EB' }} />
            {timeline.map((ev, i) => (
              <li key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: ev.tone, marginTop: 4, flexShrink: 0, zIndex: 1, border: '2px solid #fff' }} />
                <div>
                  <div style={{ fontSize: 12, color: '#6A7282', fontWeight: 600 }}>{ev.when}</div>
                  <div style={{ fontSize: 13, color: '#1C192E', marginTop: 2 }}>{ev.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #EEEEEE', paddingTop: 16, flexWrap: 'wrap' }}>
          <Button variant="ghost" icon="check" onClick={() => { emitToast('Change acknowledged.'); onClose(); }}>Acknowledge</Button>
          <Button variant="secondary" icon="users" onClick={onDiscuss}>Discuss with Team</Button>
          <Button variant="primary" icon="phone" onClick={onNotify}>Notify Provider</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function NotifyProviderModal({ r, issue, team, onClose }) {
  const providers = team.filter(u => /MD|NP|Provider|Director|Pharmac/i.test(u.role));
  const fallback = team.slice(0, 1);
  const list = providers.length ? providers : fallback;
  const [selected, setSelected] = useState(list[0]?.id);
  const [msg, setMsg] = useState(`@${r.name.split(' ')[0]} — ${issue?.title || 'Change flagged'}.\n\n${issue?.detail || ''}\n\nPlease advise.`);
  return (
    <ModalShell title="Notify Provider" subtitle={`This will tag ${r.name} and send a message to the selected provider.`} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>SEND TO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {list.map(u => {
              const checked = selected === u.id;
              return (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8,
                  background: checked ? '#F5F2FD' : 'transparent', border: '1px solid ' + (checked ? '#845EC2' : '#E5E7EB'), cursor: 'pointer',
                }}>
                  <input type="radio" checked={checked} onChange={() => setSelected(u.id)} />
                  <Avatar initials={u.initials} seed={u.id} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#6A7282' }}>{u.role}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>MESSAGE</div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 9999, background: '#F5F2FD', color: '#67568C', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              <Icon name="users" size={11} color="#67568C" /> Patient: {r.name} · Rm {r.room}
            </div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              style={{ width: '100%', border: 0, outline: 0, font: '14px Inter', resize: 'vertical', minHeight: 110, boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="send" onClick={() => {
            const u = list.find(x => x.id === selected);
            emitToast(`Provider notified · ${r.name} tagged · sent to ${u ? u.name : 'provider'}.`);
            onClose();
          }}>Send Message</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function DiscussTeamModal({ r, issue, team, onClose }) {
  const [selected, setSelected] = useState([]);
  const v = useViewport();
  const isPhone = v.isMobile;
  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  const isGroup = selected.length > 1;
  return (
    <ModalShell title="Discuss with Team" subtitle={`Start a thread about ${r.name}. ${r.name} will be tagged automatically.`} onClose={onClose} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#F5F2FD', borderRadius: 10, padding: 12, fontSize: 12, color: '#67568C', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="message" size={14} color="#67568C" />
          {selected.length === 0 && 'Select at least one team member to start a thread.'}
          {selected.length === 1 && 'Direct message — patient will be auto-tagged in the thread.'}
          {selected.length > 1 && `Group chat with ${selected.length} members — patient auto-tagged. Saved to Care Plan.`}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282' }}>SELECT TEAM · {selected.length} of {team.length}</div>
            <button onClick={() => setSelected(selected.length === team.length ? [] : team.map(u => u.id))}
              style={{ background: 'transparent', border: 0, color: '#845EC2', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {selected.length === team.length ? 'Clear' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 6, maxHeight: 280, overflowY: 'auto', border: '1px solid #EEEEEE', borderRadius: 8, padding: 8 }}>
            {team.map(u => {
              const checked = selected.includes(u.id);
              return (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6,
                  background: checked ? '#F5F2FD' : 'transparent', cursor: 'pointer',
                }}>
                  <Checkbox checked={checked} onChange={() => toggle(u.id)} />
                  <Avatar initials={u.initials} seed={u.id} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.short || u.role}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={isGroup ? 'users' : 'message'} onClick={() => {
            if (selected.length === 0) { emitToast('Select at least one team member.', 'warning'); return; }
            const ctx = issue ? ` re: ${issue.title}` : '';
            emitToast(isGroup
              ? `Group chat created · ${selected.length} members · ${r.name} tagged${ctx} · saved to Care Plan.`
              : `Thread started · ${r.name} tagged${ctx} · saved to Care Plan.`);
            onClose();
          }}>
            {selected.length <= 1 ? 'Start Thread' : 'Start Group Chat'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function CareTeamTab({ team, onMessage }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#6A7282', marginBottom: 12 }}>
        {team.length} people on this resident's care team. Tap a name to call, message, or open their thread.
      </div>
      <div className="ois-team-grid">
        {team.map(u => <TeamMemberRow key={u.id} u={u} onMessage={() => onMessage(u)} />)}
      </div>
    </div>
  );
}

function TeamMemberRow({ u, onMessage }) {
  const presence = ['available', 'available', 'busy', 'available', 'away'][u.id.charCodeAt(1) % 5];
  const presColor = { available: '#29BB89', busy: '#FF6E6C', away: '#E9C05F' }[presence];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12,
      border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff',
    }}>
      <div style={{ position: 'relative' }}>
        <Avatar initials={u.initials} seed={u.id} size={40} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 9999, background: presColor, border: '2px solid #fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
        <div style={{ fontSize: 12, color: '#6A7282' }}>{u.role}</div>
      </div>
      <IconButton icon="phone" color="#00B295" title="Call" />
      <IconButton icon="video" color="#00B295" title="Video call" />
      <IconButton icon="message" color="#00B295" title="Message" onClick={onMessage} />
    </div>
  );
}

function NotesTab({ r, team }) {
  const [notes, setNotes] = useState(NOTES_SEED[r.id] || []);
  const [draft, setDraft] = useState('');
  const me = TEST_USERS[0];
  function send() {
    if (!draft.trim()) return;
    setNotes([{ id: 'n' + Date.now(), user: me.id, body: draft, time: 'Just now' }, ...notes]);
    setDraft('');
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar initials={me.initials} seed={me.id} size={36} />
        <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, background: '#fff' }}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="Add a note. Use @ to tag care team members…"
            style={{ width: '100%', border: 0, outline: 0, font: '14px Inter', resize: 'vertical', minHeight: 60 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <IconButton icon="paperclip" />
              <IconButton icon="users" title="Tag people" />
            </div>
            <Button variant="primary" size="sm" icon="send" onClick={send}>Post Note</Button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notes.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#99A1AF', fontSize: 13 }}>No notes yet. Be the first to add one.</div>}
        {notes.map(n => {
          const u = TEST_USERS.find(x => x.id === n.user) || me;
          return (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: 14, border: '1px solid #EEEEEE', borderRadius: 10 }}>
              <Avatar initials={u.initials} seed={u.id} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</span>
                  <span style={{ fontSize: 12, color: '#6A7282' }}>{u.role}</span>
                  <span style={{ fontSize: 12, color: '#99A1AF', marginLeft: 'auto' }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 14, marginTop: 6, lineHeight: '20px' }}>{renderMentions(n.body)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderMentions(text) {
  return text.split(/(@u\d+)/).map((part, i) => {
    if (part.startsWith('@u')) {
      const u = TEST_USERS.find(x => x.id === part.slice(1));
      return <span key={i} style={{ background: '#F5F2FD', color: '#67568C', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>@{u ? u.name.split(' ')[0] : 'user'}</span>;
    }
    return part;
  });
}

function CarePlanTab({ r, team }) {
  const items = CAREPLAN_SEED[r.id] || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 16, border: '1px solid #EEEEEE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name="fileText" size={14} color="#52525B" />
          <div style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.04em' }}>CARE PLAN SUMMARY</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: '19px', color: '#1C192E' }}>
          Active goals: <b>stabilize CHF</b>, <b>advance sacral wound healing</b>, <b>target home discharge in 4 weeks</b>.
          Open threads: nephrology consult pending response, repositioning compliance flagged. Next care-plan review: 14:00.
        </div>
      </div>
      {items.map(item => <CarePlanThread key={item.id} item={item} team={team} />)}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: '#99A1AF', fontSize: 13 }}>
          No conversations yet. Start a thread from the Care Team tab to preserve it as continuity.
        </div>
      )}
    </div>
  );
}

function CarePlanThread({ item, team }) {
  const [expanded, setExpanded] = useState(false);
  const participants = item.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const kindMap = {
    huddle:  { icon: 'users',   tone: 'todo',    label: 'Huddle' },
    call:    { icon: 'phone',   tone: 'info',    label: 'Voice Call' },
    video:   { icon: 'video',   tone: 'info',    label: 'Video Call' },
    message: { icon: 'message', tone: 'pending', label: 'Message Thread' },
  };
  const k = kindMap[item.kind];
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={k.icon} size={18} color="#845EC2" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
            <Chip tone={k.tone}>{k.label}</Chip>
            {item.duration && <Chip tone="info">{item.duration}</Chip>}
          </div>
          <div style={{ fontSize: 12, color: '#99A1AF', marginTop: 4 }}>{item.time}</div>
          <div style={{ display: 'flex', marginTop: 10 }}>
            {participants.slice(0, 5).map((u, i) => (
              <div key={u.id} style={{ marginLeft: i ? -8 : 0, border: '2px solid #fff', borderRadius: 9999 }}>
                <Avatar initials={u.initials} seed={u.id} size={28} />
              </div>
            ))}
            {participants.length > 5 && (
              <div style={{ marginLeft: -8, width: 28, height: 28, borderRadius: 9999, background: '#F3F4F6', color: '#6A7282', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                +{participants.length - 5}
              </div>
            )}
          </div>
          <div style={{ marginTop: 12, padding: 12, background: '#F5F2FD', borderRadius: 8, fontSize: 13, lineHeight: '19px', color: '#1C192E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#67568C', letterSpacing: '0.04em', marginBottom: 6 }}>
              <Icon name="fileText" size={12} color="#67568C" /> SUMMARY
            </div>
            {item.summary}
          </div>
          {expanded && item.actions && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {item.actions.map((a, i) => (
                <Chip key={i} tone="signed" dot>{a}</Chip>
              ))}
            </div>
          )}
          <button onClick={() => setExpanded(e => !e)} style={{
            marginTop: 10, background: 'transparent', border: 0, color: '#845EC2', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {expanded ? 'Hide' : 'Show'} action items <Icon name="chevronDown" size={12} color="#845EC2" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== MODALS ==============

function ModalShell({ title, subtitle, children, onClose, width = 560, footer }) {
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(28,25,46,0.5)', zIndex: 100,
      display: 'flex', alignItems: isPhone ? 'flex-end' : 'center', justifyContent: 'center', padding: isPhone ? 8 : 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: isPhone ? '16px 16px 10px 10px' : 16, width: '100%', maxWidth: isPhone ? '100%' : width,
        maxHeight: isPhone ? '92vh' : '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ padding: isPhone ? '16px 16px' : '18px 24px', borderBottom: '1px solid #EEEEEE', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: '22px' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: '#6A7282', marginTop: 4, lineHeight: '18px' }}>{subtitle}</div>}
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div style={{ padding: isPhone ? 16 : 24, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: isPhone ? '12px 16px' : '14px 24px', borderTop: '1px solid #EEEEEE', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleModal({ r, team, onClose }) {
  const [includeAll, setIncludeAll] = useState(false);
  const [selected, setSelected] = useState(team.slice(0, 4).map(u => u.id));
  const [date, setDate] = useState('Today · 14:00');
  const [topic, setTopic] = useState(`Care plan review · ${r.name}`);
  const v = useViewport();
  const isPhone = v.isMobile;

  const finalIds = includeAll ? team.map(u => u.id) : selected;
  const scheduled = SCHEDULE_EVENTS_SEED.filter(event => event.residentId === r.id);

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  return (
    <ModalShell title="Schedule Care Team Meeting" subtitle={`For ${r.name} · Rm ${r.room}`} onClose={onClose} width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>TOPIC</div>
          <Input value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="ois-modal-2col">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>WHEN</div>
            <Input icon="calendar" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>FORMAT</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" icon="video" style={{ flex: 1 }}>Video</Button>
              <Button variant="ghost" icon="phone" style={{ flex: 1 }}>Voice</Button>
            </div>
          </div>
        </div>
        <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 10, background: scheduled.length ? '#E7F5EF' : '#FAFAFC' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: scheduled.length ? '#00795E' : '#6A7282', letterSpacing: '0.06em', marginBottom: 8 }}>
            CURRENT SCHEDULE
          </div>
          {scheduled.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scheduled.map(event => (
                <div key={event.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #DDEFE7', borderRadius: 8, padding: 9 }}>
                  <Icon name="calendar" size={15} color="#00795E" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{event.title}</div>
                    <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{event.dateLabel} · {event.startLabel}-{event.endLabel} · {event.location}</div>
                  </div>
                  <Chip tone={event.status === 'Tentative' ? 'watch' : 'stable'}>{event.status}</Chip>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#6A7282' }}>No scheduled huddles, family conferences, consults, or care-team meetings are currently attached to this resident.</div>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282' }}>PARTICIPANTS · {finalIds.length} of {team.length}</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#1C192E', cursor: 'pointer' }}>
              <Checkbox checked={includeAll} onChange={e => setIncludeAll(e.target.checked)} />
              Include everyone on the Care Team
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 6, maxHeight: 240, overflowY: 'auto', border: '1px solid #EEEEEE', borderRadius: 8, padding: 8 }}>
            {team.map(u => {
              const checked = includeAll || selected.includes(u.id);
              return (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6,
                  background: checked ? '#F5F2FD' : 'transparent', cursor: includeAll ? 'not-allowed' : 'pointer',
                }}>
                  <Checkbox checked={checked} onChange={() => !includeAll && toggle(u.id)} disabled={includeAll} />
                  <Avatar initials={u.initials} seed={u.id} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.short}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #EEEEEE', paddingTop: 16 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="calendar" onClick={() => { emitToast(`Meeting scheduled · ${finalIds.length} invites sent · ${date}`); onClose(); }}>Schedule Meeting</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function EscalateModal({ r, team, onClose }) {
  const [reason, setReason] = useState('');
  return (
    <ModalShell title="Escalate" subtitle={`For ${r.name} · This will notify all care team members, the DON, and every available user on shift.`} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 14, background: '#FFF3EF', border: '1px solid rgba(255,110,108,0.25)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="alertTriangle" size={20} color="#FF6E6C" />
          <div style={{ fontSize: 13, color: '#1C192E', lineHeight: '18px' }}>
            <b>{team.length} care team members</b> + <b>1 DON</b> + <b>~12 available users</b> will receive an immediate push, SMS, and in-app alert. The continuity thread will mark this resident as <b>Escalated</b>.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>REASON</div>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="What's happening? Leave blank to use the latest documented change."
            style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, font: '14px Inter', resize: 'vertical', minHeight: 90, boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="coral" icon="alertTriangle" onClick={() => { emitToast(`Escalation sent for ${r.name}. ${team.length} care team + DON + on-shift users notified.`, 'warning'); onClose(); }}>Send Escalation</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function SchedulePage({ onOpenResident }) {
  // Build a week view with seeded meeting events, anchored to today
  const today = new Date();
  const v = useViewport();
  const isPhone = v.isMobile;
  const day = today.getDay();
  const monday = new Date(today); monday.setDate(today.getDate() - ((day + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({ length: 11 }, (_, i) => 7 + i); // 7am-5pm

  const events = useMemo(() => {
    const todayIdx = (day + 6) % 7;
    const dateOffsets = { Today: 0, Tomorrow: 1, Friday: Math.max(0, 4 - todayIdx) };
    function parseTime(label) {
      const match = label.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!match) return 9;
      let hour = Number(match[1]);
      const minute = Number(match[2]) / 60;
      const period = match[3].toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour + minute;
    }
    return SCHEDULE_EVENTS_SEED.map(event => {
      const offset = dateOffsets[event.dateLabel] == null ? 0 : dateOffsets[event.dateLabel];
      const resident = event.residentId ? RESIDENTS.find(r => r.id === event.residentId) : null;
      const start = parseTime(event.startLabel);
      const end = parseTime(event.endLabel);
      return {
        ...event,
        day: Math.min(todayIdx + offset, 6),
        start,
        end,
        resident,
        kind: event.kind === 'family' ? 'family' : event.kind === 'huddle' ? 'huddle' : 'meeting',
      };
    });
  }, [day]);

  const eventColors = {
    meeting: { bg: '#F5F2FD', fg: '#67568C', border: '#845EC2' },
    family:  { bg: '#E7F5EF', fg: '#3F6B4E', border: '#00C9A7' },
    huddle:  { bg: '#FFF8E6', fg: '#92703A', border: '#E9C05F' },
  };

  const monthLabel = today.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Schedule"
        subtitle="Care team meetings, huddles, consults, and family conferences. Resident profile cards show the next scheduled item."
        actions={[
          <Button key="new" variant="primary" icon="plus" onClick={() => emitToast('Open a resident profile to schedule a meeting.', 'info')}>New Meeting</Button>,
        ]}
      />
      <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{monthLabel}</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6A7282' }}>
          <Legend color="#845EC2" label="Care meeting" />
          <Legend color="#00C9A7" label="Family" />
          <Legend color="#E9C05F" label="Huddle" />
        </div>
      </Card>
      <Card style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ minWidth: isPhone ? 760 : 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #EEEEEE', background: '#FAFAFA' }}>
          <div />
          {days.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '1px solid #EEEEEE' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#845EC2' : '#6A7282', letterSpacing: '0.06em' }}>{dayLabels[i]}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? '#845EC2' : '#1C192E', marginTop: 2 }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', position: 'relative' }}>
          <div>
            {hours.map(h => (
              <div key={h} style={{ height: 56, padding: '4px 8px', fontSize: 11, color: '#99A1AF', textAlign: 'right', borderTop: '1px solid #F4F4F5' }}>
                {h <= 12 ? h : h - 12}{h < 12 ? 'a' : 'p'}
              </div>
            ))}
          </div>
          {days.map((d, dIdx) => (
            <div key={dIdx} style={{ position: 'relative', borderLeft: '1px solid #EEEEEE' }}>
              {hours.map(h => (
                <div key={h} style={{ height: 56, borderTop: '1px solid #F4F4F5' }} />
              ))}
              {events.filter(e => e.day === dIdx).map(e => {
                const c = eventColors[e.kind] || eventColors.meeting;
                const top = (e.start - hours[0]) * 56;
                const height = (e.end - e.start) * 56 - 2;
                return (
                  <div key={e.id} onClick={() => e.resident && onOpenResident(e.resident.id)}
                    style={{
                      position: 'absolute', top, left: 4, right: 4, height,
                      background: c.bg, borderLeft: `3px solid ${c.border}`, borderRadius: 6,
                      padding: '6px 8px', cursor: e.resident ? 'pointer' : 'default',
                      overflow: 'hidden',
                    }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.resident ? e.resident.name : 'All staff'}
                    </div>
                    <div style={{ fontSize: 11, color: c.fg, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 10, color: c.fg, opacity: 0.7, marginTop: 2 }}>{fmtTime(e.start)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      </Card>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} /> {label}
    </div>
  );
}

function fmtTime(h) {
  const hr = Math.floor(h);
  const m = Math.round((h - hr) * 60);
  const ampm = hr < 12 ? 'a' : 'p';
  const d = hr <= 12 ? hr : hr - 12;
  return `${d}:${m.toString().padStart(2,'0')}${ampm}`;
}

Object.assign(window, { ResidentsList, ResidentProfile, ChangeDetailPage, SchedulePage, ModalShell });
