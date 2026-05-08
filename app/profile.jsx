// Profile + security settings

function ProfilePage({ user, onLogout }) {
  const [twoFactor, setTwoFactor] = useState(true);
  const [method, setMethod] = useState('authenticator');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const v = useViewport();
  const isPhone = v.isMobile;

  function savePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      emitToast('Complete all password fields first.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      emitToast('New password and confirmation do not match.', 'warning');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    emitToast('Password change saved.');
  }

  function saveTwoFactor() {
    emitToast(twoFactor ? 'Two-factor settings updated.' : 'Two-factor is currently off.', twoFactor ? 'success' : 'warning');
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 156px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Profile"
        subtitle="Account, security, and notification controls for your care-team workspace."
      />

      <Card style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar initials={user.initials} seed={user.id} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1C192E' }}>{user.name}</div>
          <div style={{ fontSize: 13, color: '#6A7282', marginTop: 2 }}>{user.role}</div>
          <div style={{ fontSize: 12, color: '#99A1AF', marginTop: 4 }}>{FACILITY.name}</div>
        </div>
        <Chip tone="online" dot>Online</Chip>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Change Password</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3 }}>Update your login password for this device and browser session.</div>
          </div>
          <SecurityField label="Current password" type="password" value={currentPassword} onInput={setCurrentPassword} />
          <SecurityField label="New password" type="password" value={newPassword} onInput={setNewPassword} />
          <SecurityField label="Confirm new password" type="password" value={confirmPassword} onInput={setConfirmPassword} />
          <Button variant="primary" icon="shield" onClick={savePassword}>Save Password</Button>
        </Card>

        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Two-factor Authentication</div>
              <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3 }}>Require a second step before sensitive patient data opens.</div>
            </div>
            <button onClick={() => setTwoFactor(v => !v)} style={{
              width: 50, height: 28, borderRadius: 9999, border: 0, cursor: 'pointer',
              background: twoFactor ? '#00C9A7' : '#D1D5DC', padding: 3, display: 'flex',
              justifyContent: twoFactor ? 'flex-end' : 'flex-start', flexShrink: 0,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: 9999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 'authenticator', label: 'Authenticator', icon: 'shield' },
              { id: 'sms', label: 'SMS', icon: 'message' },
            ].map(m => {
              const active = method === m.id;
              return (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                  border: `1px solid ${active ? '#845EC2' : '#E5E7EB'}`, background: active ? '#F5F2FD' : '#fff',
                  borderRadius: 8, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 6,
                  alignItems: 'center', cursor: 'pointer', font: '700 12px Inter', color: active ? '#67568C' : '#52525B',
                }}>
                  <Icon name={m.icon} size={18} color={active ? '#845EC2' : '#6A7282'} />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: '#FAFAFA', border: '1px solid #EEEEEE' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1C192E' }}>Backup codes</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {['A9F2', 'K7Q4', 'M3L8', 'R6T1'].map(code => <Chip key={code} tone="todo">{code}</Chip>)}
            </div>
          </div>
          <Button variant="primary" icon="check" onClick={saveTwoFactor}>Save 2FA</Button>
        </Card>
      </div>

      <div style={{ flex: 1 }} />

      <Button variant="dangerOutline" icon="logout" onClick={onLogout} style={{ alignSelf: isPhone ? 'stretch' : 'flex-start' }}>
        Sign Out
      </Button>
    </div>
  );
}

function SecurityField({ label, type, value, onInput }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#52525B' }}>{label}</span>
      <input type={type} value={value} onInput={e => onInput(e.target.value)} style={{
        height: 40, border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 12px',
        font: '13px Inter', color: '#1C192E', outline: 0, background: '#fff',
      }} />
    </label>
  );
}

Object.assign(window, { ProfilePage });
