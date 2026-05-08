// Otangeles Intelligent System — primitives
const { useState, useEffect, useRef, useMemo } = React;

const C = {
  primary: '#845EC2', primaryDark: '#67568C', primaryTint: '#F5F2FD',
  coral: '#FF6E6C', coralTint: '#FFF3EF', peach: '#FF9671',
  mint: '#00C9A7', mintDark: '#29BB89', mintTint: '#E7F5EF',
  pink: '#C34A7D', pinkTint: '#FFF3F8', blue: '#0081CF', blueTint: '#E6F2FB',
  gold: '#E9C05F', goldTint: '#FFF8E6',
  red: '#E53E3E', redTint: '#FDECEC',
  fg1: '#1C192E', fg2: '#6A7282', fg3: '#99A1AF',
  border: '#E5E7EB', borderStrong: '#D1D5DC', divider: '#EEEEEE',
  surface: '#FFFFFF', canvas: '#F7F7F7', hover: '#F8F8F8',
};

// Risk tones
const RISK = {
  critical: { bg: '#FDECEC', fg: '#E53E3E', dot: '#E53E3E', label: 'Critical' },
  high:     { bg: '#FFF3EF', fg: '#FF6E6C', dot: '#FF6E6C', label: 'High' },
  watch:    { bg: '#FFF8E6', fg: '#B58420', dot: '#E9C05F', label: 'Watch' },
  stable:   { bg: '#E7F5EF', fg: '#29BB89', dot: '#29BB89', label: 'Stable' },
};

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2 }) {
  const paths = {
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2z',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3',
    chevronDown: 'm6 9 6 6 6-6',
    chevronRight: 'm9 18 6-6-6-6',
    chevronLeft: 'm15 18-6-6 6-6',
    plus: 'M12 5v14 M5 12h14',
    x: 'M18 6 6 18 M6 6l12 12',
    check: 'M20 6 9 17l-5-5',
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z',
    video: 'M23 7l-7 5 7 5V7z M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
    message: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
    alertTriangle: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z M12 9v4 M12 17h.01',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    pill: 'M10.5 20.5a6.5 6.5 0 1 1 9.2-9.2L11 20a6.5 6.5 0 0 1-.5.5Z M8.5 8.5l7 7',
    droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
    trendingUp: 'm23 6-9.5 9.5-5-5L1 18 M17 6h6v6',
    trendingDown: 'm23 18-9.5-9.5-5 5L1 6 M17 18h6v-6',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    bed: 'M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0',
    calendar: 'M21 10H3 M8 2v4 M16 2v4 M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
    fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M8 13h8 M8 17h8 M8 9h3',
    mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8',
    micOff: 'M1 1l22 22 M9 9v3a3 3 0 0 0 5.12 2.12 M15 9.34V4a3 3 0 0 0-5.94-.6 M17 16.95A7 7 0 0 1 5 12v-2 M19 10v2a7 7 0 0 1-.11 1.23 M12 19v4 M8 23h8',
    circle: 'M12 12 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0',
    send: 'M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7z',
    paperclip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
    arrowRight: 'M5 12h14 m-6-6 6 6-6 6',
    arrowUp: 'M12 19V5 m-7 7 7-7 7 7',
    arrowDown: 'M12 5v14 m-7-7 7 7 7-7',
    sparkles: 'M12 3l1.9 5.8L19.7 11l-5.8 1.9L12 18.7l-1.9-5.8L4.3 11l5.8-2.2L12 3z M19 3v4 M21 5h-4 M5 17v4 M7 19H3',
    moreVert: 'M12 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z M12 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M20.49 15a9 9 0 0 1-14.85 3.36L1 14',
    list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  };
  const d = paths[name] || paths.home;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((p, i) => <path key={i} d={(i ? 'M' + p : p)} />)}
    </svg>
  );
}

function Brand({ height = 30 }) {
  return <img src="assets/otangeles-logo.svg" height={height} alt="Otangeles" style={{ display: 'block', height, width: 'auto' }} />;
}
function LogoMark({ size = 36 }) {
  return <img src="assets/otangeles-icon.svg" width={size} height={size} alt="" style={{ display: 'block' }} />;
}

// (photo pools removed — avatars are now gray+icon)
const _UNUSED_PHOTO_POOL_REMOVED = [
  '1494790108377-be9c29b29330','1438761681033-6461ffad8d80','1535713875002-d1d0cf377fde',
  '1544005313-94ddf0286df2','1573497019940-1c28c88b4f3e','1554151228-14d9def656e4',
  '1580489944761-15a19d654956','1592621385612-4d7129426394','1530785602389-07594beb8b73',
  '1559548331-f9cb98001426','1551836022-d5d88e9218df','1519085360753-af0119f7cbe7',
  '1547425260-76bcadfb4f2c','1573496359142-b8d87734a5a2','1607746882042-944635dfe10e',
  '1500648767791-00dcc994a43e','1438761681033-6461ffad8d80','1488426862026-3ee34a7d66df',
  '1531123897727-8f129e1688ce','1542206395-9feb3edaa68d','1546961342-de76e4be1e74',
  '1556157382-97eda2d62296','1463453091185-61582044d556','1492562080023-ab3db95bfbce',
];
const _RESIDENT_PHOTO_POOL = [
  '1559963110-71b394e7494d','1493673272479-a20888bcee10','1521252659862-eec69941b071',
  '1544005313-94ddf0286df2','1581579438747-104c53d7f100','1568602471122-7832951cc4c5',
  '1556888219-a36b3da72d44','1582750433449-648ed127bb54','1573496359142-b8d87734a5a2',
  '1545167622-3a6ac756afa4','1530268729831-4b0b9e170218','1556475850-6b50f6c11d99',
  '1485178575877-1a13bf489dfe','1597884133110-cb3d1e6e4c45','1571260899304-425eee4c7efd',
  '1545912452-8aea7e25a3d3','1559963110-71b394e7494d','1559643888-4b8df96e2a17',
  '1612531048118-826c12d59f3a','1583195763986-0e1f1f1f1f1f','1591348122449-02525d70379b',
  '1601758174039-3c40f1e58c0d','1574169208507-84376144848b','1556475850-6b50f6c11d99',
];
function _photoFor(seed, isResident) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pool = isResident ? _RESIDENT_PHOTO_POOL : _PHOTO_POOL;
  return `https://images.unsplash.com/photo-${pool[h % pool.length]}?w=200&h=200&fit=crop&crop=faces`;
}
function Avatar({ initials = 'JC', size = 36, seed, ring, isResident }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999, flexShrink: 0,
      background: '#F4F4F5', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
    }}>
      <Icon name="user" size={size * 0.55} color="#99A1AF" />
    </div>
  );
}

function Chip({ tone = 'todo', children, dot, style }) {
  const tones = {
    todo:    { bg: '#F4F4F5', fg: '#52525B' },
    review:  { bg: '#F4F4F5', fg: '#52525B' },
    signing: { bg: '#F4F4F5', fg: '#52525B' },
    signed:  { bg: '#F4F4F5', fg: '#52525B' },
    voided:  { bg: '#F4F4F5', fg: '#6A7282' },
    pending: { bg: '#F4F4F5', fg: '#52525B' },
    info:    { bg: '#F4F4F5', fg: '#52525B' },
    // Risk tones keep clinical signal — but desaturated.
    critical: { bg: '#FDECEC', fg: '#B91C1C' },
    high:     { bg: '#FFF3EF', fg: '#C2410C' },
    watch:    { bg: '#FEFAEC', fg: '#92703A' },
    stable:   { bg: '#F0F7F2', fg: '#3F6B4E' },
  };
  const t = tones[tone] || tones.todo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 9999,
      background: t.bg, color: t.fg,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
      whiteSpace: 'nowrap', ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 9999, background: t.fg }} />}
      {children}
    </span>
  );
}

function Button({ variant = 'primary', icon, rightIcon, children, onClick, style, size = 'md' }) {
  const [hover, setHover] = useState(false);
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 13, height: 32 },
    md: { padding: '10px 16px', fontSize: 14, height: 40 },
    lg: { padding: '12px 20px', fontSize: 15, height: 48 },
  };
  const variants = {
    primary: { background: hover ? '#00B295' : '#00C9A7', color: '#fff', border: '1px solid transparent' },
    secondary: { background: hover ? '#FAFAFA' : '#fff', color: '#1C192E', border: '1px solid #E5E7EB' },
    ghost: { background: hover ? '#F4F4F5' : 'transparent', color: '#1C192E', border: '1px solid transparent' },
    dark: { background: hover ? '#000' : '#1C192E', color: '#fff', border: '1px solid transparent' },
    danger: { background: hover ? '#DC2626' : '#fff', color: hover ? '#fff' : '#DC2626', border: hover ? '1px solid #DC2626' : '1px solid #FECACA' },
    coral: { background: hover ? '#A11D1D' : '#B91C1C', color: '#fff', border: '1px solid transparent' },
    mint: { background: hover ? '#00B295' : '#00C9A7', color: '#fff', border: '1px solid transparent' },
    lavender: { background: hover ? '#67568C' : '#845EC2', color: '#fff', border: '1px solid transparent' },
  };
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'Inter', fontWeight: 600, lineHeight: '20px',
        borderRadius: 5, cursor: 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 150ms ease-out', boxSizing: 'border-box',
        ...sizes[size], ...variants[variant], ...style,
      }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} color={variants[variant].color} />}
      {children}
      {rightIcon && <Icon name={rightIcon} size={size === 'sm' ? 14 : 16} color={variants[variant].color} />}
    </button>
  );
}

function IconButton({ icon, onClick, color = '#6A7282', size = 36, title, style }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, borderRadius: 9999,
        background: hover ? '#F4F4F5' : 'transparent', border: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background 150ms', ...style,
      }}>
      <Icon name={icon} size={size * 0.5} color={color} />
    </button>
  );
}

function Card({ children, style, onClick, hoverable }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        background: '#fff', borderRadius: 12,
        border: '1px solid #E5E7EB',
        boxShadow: hover ? '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 150ms', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>{children}</div>
  );
}

function Input({ icon, rightIcon, placeholder, value, onChange, type = 'text', style, onFocus, onBlur }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      border: `1px solid ${focus ? '#1C192E' : '#E5E7EB'}`,
      borderRadius: 5, padding: '0 14px', height: 44, background: '#fff',
      boxSizing: 'border-box', transition: 'border-color 150ms', ...style,
    }}>
      {icon && <Icon name={icon} size={18} color={focus ? '#1C192E' : '#99A1AF'} />}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={(e) => { setFocus(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        style={{ flex: 1, border: 0, outline: 0, font: '14px Inter', color: '#1C192E', minWidth: 0, background: 'transparent' }} />
      {rightIcon && <Icon name={rightIcon} size={18} color="#6A7282" />}
    </div>
  );
}

// Risk dot/badge
function RiskBadge({ level, score, compact }) {
  const r = RISK[level] || RISK.stable;
  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: r.dot }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: r.fg }}>{r.label}</span>
        {score != null && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#6A7282' }}>· {score}</span>}
      </div>
    );
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px 4px 8px', borderRadius: 9999, background: r.bg, color: r.fg,
      fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: r.dot }} />
      <span>{r.label.toUpperCase()}</span>
      {score != null && <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, opacity: 0.85 }}>{score}</span>}
    </div>
  );
}

// Themed checkbox — used in modals
function Checkbox({ checked, onChange, disabled, size = 18 }) {
  return (
    <span
      onClick={e => { e.stopPropagation(); if (!disabled) onChange && onChange({ target: { checked: !checked } }); }}
      style={{
        width: size, height: size, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${checked ? '#845EC2' : '#D1D5DC'}`,
        background: checked ? '#845EC2' : '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 120ms',
      }}>
      {checked && <Icon name="check" size={size - 6} color="#fff" strokeWidth={3} />}
    </span>
  );
}

// More-action dropdown — single button + menu
function MoreActionMenu({ label = 'More action', icon = 'plus', items, disabled, style, buttonStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const v = useViewport();
  const isPhone = v.isMobile;
  useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', ...style }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0 14px', height: 36, borderRadius: 6,
          border: '1px solid #E5E7EB', background: '#fff',
          color: '#1C192E', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, font: '600 13px Inter',
          ...buttonStyle,
        }}>
        <Icon name={icon} size={14} color="#1C192E" /> {label}
        <Icon name="chevronDown" size={14} color="#6A7282" />
      </button>
      {open && (
        <div style={{
          position: isPhone ? 'fixed' : 'absolute',
          top: isPhone ? 'auto' : 'calc(100% + 4px)',
          left: isPhone ? 8 : 'auto',
          right: isPhone ? 8 : 0,
          bottom: isPhone ? 'calc(76px + env(safe-area-inset-bottom))' : 'auto',
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 10px 20px -8px rgba(0,0,0,0.15)', minWidth: isPhone ? 0 : 240,
          maxWidth: isPhone ? 'calc(100vw - 16px)' : 320,
          maxHeight: isPhone ? 'calc(100vh - 120px)' : 'min(420px, calc(100vh - 96px))',
          overflowY: 'auto',
          zIndex: 90,
          padding: 6,
        }}>
          {items.map((it, i) => (
            <button key={i}
              onClick={() => { setOpen(false); it.onClick && it.onClick(); }}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 0,
                padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 10, font: '13px Inter',
                color: it.tone || '#1C192E',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F2FD'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {it.icon && <Icon name={it.icon} size={16} color={it.tone || '#845EC2'} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{it.label}</div>
                {it.sub && <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>{it.sub}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useViewport() {
  const get = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    return { w, isMobile: w < 720, isTablet: w >= 720 && w < 1180, isDesktop: w >= 1180 };
  };
  const [v, setV] = useState(get());
  useEffect(() => {
    function onR() { setV(get()); }
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return v;
}

function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const v = useViewport();
  const isPhone = v.isMobile;
  useEffect(() => {
    function onT(e) {
      const t = e.detail;
      setToasts(arr => [...arr, t]);
      setTimeout(() => setToasts(arr => arr.filter(x => x.id !== t.id)), 4200);
    }
    window.addEventListener('ois-toast', onT);
    return () => window.removeEventListener('ois-toast', onT);
  }, []);
  return (
    <div style={{
      position: 'fixed',
      bottom: isPhone ? 'calc(84px + env(safe-area-inset-bottom))' : 24,
      left: isPhone ? 8 : 'auto',
      right: isPhone ? 8 : 24,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const tones = {
          success: { bg: '#fff', fg: '#1C192E', accent: '#00C9A7', icon: 'check' },
          info:    { bg: '#fff', fg: '#1C192E', accent: '#845EC2', icon: 'sparkles' },
          warning: { bg: '#fff', fg: '#1C192E', accent: '#FF6E6C', icon: 'alertTriangle' },
        };
        const tn = tones[t.tone] || tones.success;
        return (
          <div key={t.id} style={{
            background: tn.bg, color: tn.fg, padding: '12px 16px', borderRadius: 10,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -4px rgba(0,0,0,0.1)',
            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10,
            minWidth: isPhone ? 0 : 280, maxWidth: isPhone ? '100%' : 420, pointerEvents: 'auto', fontSize: 13, fontWeight: 600,
            borderLeft: `3px solid ${tn.accent}`,
          }}>
            <Icon name={tn.icon} size={16} color={tn.accent} />
            <div style={{ flex: 1 }}>{t.msg}</div>
          </div>
        );
      })}
    </div>
  );
}

// Toast system — global event-based
function emitToast(msg, tone = 'success') {
  window.dispatchEvent(new CustomEvent('ois-toast', { detail: { msg, tone, id: Date.now() + Math.random() } }));
}

Object.assign(window, { C, RISK, Icon, Brand, LogoMark, Avatar, Chip, Button, IconButton, Card, Input, Checkbox, MoreActionMenu, RiskBadge, useState, useEffect, useRef, useMemo, useViewport, emitToast, ToastHost });
