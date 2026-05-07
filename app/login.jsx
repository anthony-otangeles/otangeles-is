// Login screen for Otangeles Intelligent System — minimalist, single-panel

function LoginScreen({ onSignIn }) {
  const [email, setEmail] = useState('sarah.chen@otangeles.com');
  const [pw, setPw] = useState('demo');
  const [showUsers, setShowUsers] = useState(false);
  const [error, setError] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  function submit() {
    const u = TEST_USERS.find(x => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === pw);
    if (!u) { setError('Invalid email or password.'); return; }
    setError('');
    onSignIn(u);
  }

  function pickUser(u) {
    setEmail(u.email); setPw(u.password); setError('');
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAFA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter',
    }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Brand */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Brand height={32} />
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #EEEEEE',
          padding: 36, display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1C192E', letterSpacing: '-0.01em' }}>Sign in</div>
            <div style={{ fontSize: 13, color: '#6A7282' }}>Continue to your facility workspace.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Email">
              <Input placeholder="you@facility.org" value={email} onChange={e => setEmail(e.target.value)} style={{ height: 44 }} />
            </Field>
            <Field label="Password" right={<a href="#" style={{ color: '#6A7282', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>Forgot?</a>}>
              <Input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} style={{ height: 44 }} />
            </Field>

            {error && (
              <div style={{ fontSize: 12, color: '#E53E3E' }}>{error}</div>
            )}

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#6A7282', cursor: 'pointer' }}>
              <Checkbox checked={keepSignedIn} onChange={e => setKeepSignedIn(e.target.checked)} /> Keep me signed in
            </label>

            <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={submit}>Sign In</Button>
          </div>

          <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: 16 }}>
            <button onClick={() => setShowUsers(s => !s)} style={{
              background: 'transparent', border: 0, color: '#6A7282', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, width: '100%', justifyContent: 'space-between',
            }}>
              <span>Demo accounts</span>
              <Icon name={showUsers ? 'chevronDown' : 'chevronRight'} size={12} color="#6A7282" />
            </button>

            {showUsers && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {TEST_USERS.map(u => <DemoUserRow key={u.id} u={u} onPick={() => pickUser(u)} active={email === u.email} />)}
                <div style={{ fontSize: 11, color: '#99A1AF', marginTop: 8 }}>
                  Password is <code style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>demo</code> for all.
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#99A1AF', textAlign: 'center' }}>
          HIPAA-grade encryption · Otangeles Note+
        </div>
      </div>
    </div>
  );
}

function Field({ label, right, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1C192E' }}>{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function DemoUserRow({ u, onPick, active }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onPick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 6, border: 0,
        background: active ? '#F4F4F5' : hover ? '#FAFAFA' : 'transparent',
        textAlign: 'left', cursor: 'pointer', width: '100%',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1C192E' }}>{u.name}</div>
        <div style={{ fontSize: 11, color: '#6A7282', marginTop: 1 }}>{u.role}</div>
      </div>
      <code style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#99A1AF' }}>{u.email.split('@')[0]}</code>
    </button>
  );
}

Object.assign(window, { LoginScreen });
