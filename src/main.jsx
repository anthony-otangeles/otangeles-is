import { createApp, defineComponent, isVNode, nextTick, onUnmounted, ref as vueRef, shallowRef } from 'vue';

let currentHookContext = null;

const unitlessStyleProps = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
]);

function normalizeReactStyle(style) {
  if (!style || typeof style !== 'object') return style;
  if (Array.isArray(style)) return style.map(normalizeReactStyle);

  const normalized = {};
  for (const [key, value] of Object.entries(style)) {
    if (
      typeof value === 'number'
      && value !== 0
      && !key.startsWith('--')
      && !unitlessStyleProps.has(key)
    ) {
      normalized[key] = value + 'px';
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function normalizeReactVNode(node) {
  if (Array.isArray(node)) {
    node.forEach(normalizeReactVNode);
    return node;
  }
  if (!isVNode(node)) return node;

  if (node.props && node.props.style) {
    node.props = {
      ...node.props,
      style: normalizeReactStyle(node.props.style),
    };
  }

  if (Array.isArray(node.children)) {
    node.children.forEach(normalizeReactVNode);
  }

  return node;
}

function areHookDepsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, index) => Object.is(value, b[index]));
}

function useState(initialValue) {
  if (!currentHookContext) throw new Error('useState must be called while rendering a Vue-wrapped component.');
  const context = currentHookContext;
  const index = context.index++;
  if (!context.hooks[index]) {
    context.hooks[index] = shallowRef(typeof initialValue === 'function' ? initialValue() : initialValue);
  }
  const state = context.hooks[index];
  const setState = nextValue => {
    state.value = typeof nextValue === 'function' ? nextValue(state.value) : nextValue;
    context.bump.value += 1;
  };
  return [state.value, setState];
}

function useRef(initialValue) {
  if (!currentHookContext) throw new Error('useRef must be called while rendering a Vue-wrapped component.');
  const context = currentHookContext;
  const index = context.index++;
  if (!context.hooks[index]) {
    const holder = vueRef(initialValue);
    Object.defineProperty(holder, 'current', {
      get() { return holder.value; },
      set(value) { holder.value = value; },
    });
    context.hooks[index] = holder;
  }
  return context.hooks[index];
}

function useMemo(factory, deps) {
  if (!currentHookContext) throw new Error('useMemo must be called while rendering a Vue-wrapped component.');
  const context = currentHookContext;
  const index = context.index++;
  const previous = context.hooks[index];
  if (!previous || !areHookDepsEqual(previous.deps, deps)) {
    context.hooks[index] = { deps, value: factory() };
  }
  return context.hooks[index].value;
}

function useEffect(effect, deps) {
  if (!currentHookContext) throw new Error('useEffect must be called while rendering a Vue-wrapped component.');
  const context = currentHookContext;
  const index = context.index++;
  const hook = context.hooks[index] || {};
  const changed = !hook.hasRun || deps == null || !areHookDepsEqual(hook.deps, deps);
  hook.deps = deps;
  context.hooks[index] = hook;
  if (!changed) return;
  context.effects.push(() => {
    if (typeof hook.cleanup === 'function') hook.cleanup();
    const cleanup = effect();
    hook.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
    hook.hasRun = true;
  });
}

function childrenFromSlots(slots) {
  if (!slots.default) return undefined;
  const children = slots.default();
  return children.length === 1 ? children[0] : children;
}

function defineReactComponent(renderFn) {
  return defineComponent({
    name: renderFn.name || 'VueJsxComponent',
    inheritAttrs: false,
    setup(_props, context) {
      const hooks = [];
      const bump = vueRef(0);

      onUnmounted(() => {
        for (const hook of hooks) {
          if (hook && typeof hook.cleanup === 'function') hook.cleanup();
        }
      });

      return () => {
        bump.value;
        const hookContext = { hooks, bump, index: 0, effects: [] };
        const previousContext = currentHookContext;
        currentHookContext = hookContext;

        try {
          const props = { ...context.attrs };
          const children = childrenFromSlots(context.slots);
          if (children !== undefined) props.children = children;
          const rendered = normalizeReactVNode(renderFn(props));
          if (hookContext.effects.length) {
            nextTick(() => hookContext.effects.forEach(run => run()));
          }
          return rendered;
        } finally {
          currentHookContext = previousContext;
        }
      };
    },
  });
}


// ---- app/primitives.jsx ----
// Otangeles Intelligent System — primitives
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

function Button({ variant = 'primary', icon, rightIcon, children, onClick, style, size = 'md', disabled }) {
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
        borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, display: 'inline-flex',
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

function Input({ icon, rightIcon, placeholder, value, onChange, type = 'text', style, onFocus, onBlur, onKeyDown }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      border: `1px solid ${focus ? '#1C192E' : '#E5E7EB'}`,
      borderRadius: 5, padding: '0 14px', height: 44, background: '#fff',
      boxSizing: 'border-box', transition: 'border-color 150ms', ...style,
    }}>
      {icon && <Icon name={icon} size={18} color={focus ? '#1C192E' : '#99A1AF'} />}
      <input type={type} value={value} onInput={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
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
function MoreActionMenu({ label = 'More action', icon = 'plus', items, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0 14px', height: 36, borderRadius: 6,
          border: '1px solid #E5E7EB', background: '#fff',
          color: '#1C192E', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, font: '600 13px Inter',
        }}>
        <Icon name={icon} size={14} color="#1C192E" /> {label}
        <Icon name="chevronDown" size={14} color="#6A7282" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 10px 20px -8px rgba(0,0,0,0.15)', minWidth: 240, zIndex: 50,
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
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
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
            minWidth: 280, maxWidth: 420, pointerEvents: 'auto', fontSize: 13, fontWeight: 600,
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


// ---- app/data.jsx ----
// Mock data for the Otangeles Intelligent System

const TEST_USERS = [
  { id: 'u1',  email: 'sarah.chen@otangeles.com',   password: 'demo', name: 'Sarah Chen',      initials: 'SC', role: 'Director of Nursing',          short: 'DON', dept: 'Nursing leadership' },
  { id: 'u2',  email: 'marcus.webb@otangeles.com',  password: 'demo', name: 'Marcus Webb',     initials: 'MW', role: 'Assistant Director of Nursing', short: 'ADON', dept: 'Nursing leadership' },
  { id: 'u3',  email: 'david.kim@otangeles.com',    password: 'demo', name: 'David Kim',       initials: 'DK', role: 'Unit Manager',                 short: 'Unit Mgr', dept: 'Nursing leadership' },
  { id: 'u4',  email: 'jenny.ortiz@otangeles.com',  password: 'demo', name: 'Jenny Ortiz',     initials: 'JO', role: 'RN — Charge Nurse',             short: 'RN', dept: 'Nursing' },
  { id: 'u5',  email: 'linh.tran@otangeles.com',    password: 'demo', name: 'Linh Tran',       initials: 'LT', role: 'LPN',                          short: 'LPN', dept: 'Nursing' },
  { id: 'u6',  email: 'diana.cole@otangeles.com',   password: 'demo', name: 'Diana Cole',      initials: 'DC', role: 'CNA',                          short: 'CNA', dept: 'Nursing support' },
  { id: 'u7',  email: 'beatrice.liu@otangeles.com', password: 'demo', name: 'Beatrice Liu',    initials: 'BL', role: 'MDS Coordinator',              short: 'MDS', dept: 'Assessment' },
  { id: 'u8',  email: 'robert.chen@otangeles.com',  password: 'demo', name: 'Robert Chen',     initials: 'RC', role: 'Infection Preventionist',      short: 'IP', dept: 'Quality / IPCP' },
  { id: 'u9',  email: 'aisha.patel@otangeles.com',  password: 'demo', name: 'Aisha Patel',     initials: 'AP', role: 'Wound Care Nurse',             short: 'Wound', dept: 'Nursing quality' },
  { id: 'u10', email: 'dr.patel@otangeles.com',     password: 'demo', name: 'Dr. Eleanor Patel', initials: 'EP', role: 'Medical Director',          short: 'MD', dept: 'Medical oversight' },
  { id: 'u11', email: 'henry.cole@otangeles.com',   password: 'demo', name: 'Dr. Henry Cole',  initials: 'HC', role: 'Nurse Practitioner',           short: 'NP', dept: 'Medical care' },
  { id: 'u12', email: 'aanya.verma@otangeles.com',  password: 'demo', name: 'Aanya Verma',     initials: 'AV', role: 'Consultant Pharmacist',        short: 'Rx', dept: 'Pharmacy' },
  { id: 'u13', email: 'david.rehab@otangeles.com',  password: 'demo', name: 'David Park',      initials: 'DP', role: 'Director of Rehabilitation',   short: 'DOR', dept: 'Rehabilitation' },
  { id: 'u14', email: 'olivia.reed@otangeles.com',  password: 'demo', name: 'Olivia Reed',     initials: 'OR', role: 'Physical Therapist',           short: 'PT', dept: 'Rehabilitation' },
  { id: 'u15', email: 'maria.alvarez@otangeles.com',password: 'demo', name: 'Maria Alvarez',   initials: 'MA', role: 'Director of Social Services',  short: 'SW', dept: 'Social services' },
  { id: 'u16', email: 'tom.becker@otangeles.com',   password: 'demo', name: 'Tom Becker',      initials: 'TB', role: 'Case Manager',                 short: 'CM', dept: 'Case management' },
  { id: 'u17', email: 'nora.williams@otangeles.com',password: 'demo', name: 'Nora Williams',   initials: 'NW', role: 'Director of Food & Nutrition', short: 'Dietary', dept: 'Dietary' },
  { id: 'u18', email: 'sofia.rossi@otangeles.com',  password: 'demo', name: 'Sofia Rossi',     initials: 'SR', role: 'Registered Dietitian',         short: 'RD', dept: 'Dietary clinical' },
];

const FACILITY = {
  name: 'Sunnybrook Skilled Nursing',
  building: 'Building A',
  beds: 124,
  occupied: 117,
  admits24h: 3,
  discharges24h: 1,
  pendingProvider: 6,
};

// Risk drivers we surface across the app
const RISK_CATEGORIES = [
  { id: 'rehosp',     label: 'Transfer / Rehosp Risk',  icon: 'arrowRight',     tone: 'critical', count: 7 },
  { id: 'sepsis',     label: 'Infection / Sepsis',       icon: 'alertTriangle',  tone: 'critical', count: 4 },
  { id: 'fall',       label: 'Fall Risk',                icon: 'shield',         tone: 'high',     count: 11 },
  { id: 'med',        label: 'Medication Risk',          icon: 'pill',           tone: 'high',     count: 9 },
  { id: 'nutrition',  label: 'Nutrition / Hydration',    icon: 'droplet',        tone: 'watch',    count: 8 },
  { id: 'rehab',      label: 'Functional / Rehab',       icon: 'trendingDown',   tone: 'watch',    count: 6 },
  { id: 'skin',       label: 'Skin / Wound',             icon: 'heart',          tone: 'watch',    count: 5 },
  { id: 'behavioral', label: 'Behavioral / Cognitive',   icon: 'sparkles',       tone: 'stable',   count: 3 },
];

// Watchlist cards
const WATCHLISTS = [
  { id: 'admits',     label: 'New Admits (72h)',       icon: 'plus',         tone: 'info',     count: 5,  desc: 'Residents admitted in the last 72 hours — heightened observation window.' },
  { id: 'returns',    label: 'Post-Hospital Return',   icon: 'refresh',      tone: 'info',     count: 3,  desc: 'Residents returning from acute hospitalization in the last 7 days.' },
  { id: 'fall',       label: 'High Fall Risk',         icon: 'shield',       tone: 'high',     count: 11, desc: 'Morse Fall Scale ≥ 45 or recent fall event.' },
  { id: 'sepsis',     label: 'Sepsis Watch',           icon: 'alertTriangle',tone: 'critical', count: 4,  desc: 'Active sepsis screening positive or 2+ qSOFA criteria.' },
  { id: 'wound',      label: 'Active Wound Care',      icon: 'heart',        tone: 'watch',    count: 9,  desc: 'Stage II+ pressure injury, surgical wound, or non-healing wound.' },
  { id: 'iso',        label: 'Isolation / Precaution', icon: 'shield',       tone: 'coral',    count: 2,  desc: 'Contact, droplet, or enhanced precautions in effect.' },
  { id: 'nutrition',  label: 'Weight Loss / Nutrition',icon: 'droplet',      tone: 'watch',    count: 6,  desc: '≥ 5% weight loss in 30 days or PO intake < 50%.' },
  { id: 'pendingMd',  label: 'Pending Provider',       icon: 'clock',        tone: 'pending',  count: 6,  desc: 'Awaiting provider response — > 4 hours elapsed since outreach.' },
  { id: 'meds',       label: 'High-Risk Medications',  icon: 'pill',         tone: 'high',     count: 14, desc: 'Anticoagulants, opioids, antipsychotics, insulin sliding scale.' },
  { id: 'discharge',  label: 'Discharge Planning',     icon: 'arrowRight',   tone: 'info',     count: 7,  desc: 'Targeted discharge within 14 days — coordination active.' },
];

// Residents
const RESIDENTS = [
  { id: 'r1', name: 'Harold Johnson', age: 78, sex: 'M', mrn: '0034-722', room: '312B', unit: 'East · Skilled', code: 'Full Code', risk: 'critical', score: 87, trend: 'up', dx: 'CHF exacerbation, Stage III sacral wound', admitted: '2026-04-22', initials: 'HJ', avatar: '#845EC2',
    drivers: ['rehosp', 'skin', 'nutrition'],
    issues: [
      { id: 'i1', kind: 'vitals', severity: 'critical', title: 'BP trend: 88/52 → 84/49 over 4h', detail: 'Systolic dropped 14 pts since 02:00. HR 112. Concern for early sepsis vs. volume depletion.', source: 'AI · vitals stream', time: '2h ago' },
      { id: 'i2', kind: 'wound', severity: 'high',     title: 'Sacral wound — exudate increased', detail: 'CNA night shift documented saturated dressing × 2. Photo on file. Last MD review 3d ago.', source: 'CNA note · A. Patel', time: '5h ago' },
      { id: 'i3', kind: 'med',   severity: 'watch',    title: 'Furosemide held × 2 doses', detail: 'BP parameters per order. Provider not yet notified of held doses.', source: 'eMAR', time: '6h ago' },
    ]},
  { id: 'r2', name: 'Marjorie Bell', age: 84, sex: 'F', mrn: '0034-781', room: '218A', unit: 'West · LTC', code: 'DNR', risk: 'critical', score: 81, trend: 'up', dx: 'UTI, dementia, recurrent falls', admitted: '2026-03-04', initials: 'MB', avatar: '#FF6E6C',
    drivers: ['sepsis', 'fall'],
    issues: [
      { id: 'i1', kind: 'vitals', severity: 'critical', title: 'Temp spike 38.9°C, qSOFA = 2', detail: 'Tachypnea 24, AMS noted. Urine cloudy. Sepsis screening positive.', source: 'AI · sepsis screen', time: '40m ago' },
      { id: 'i2', kind: 'fall',   severity: 'high',     title: 'Witnessed fall — bathroom, no injury', detail: 'Morse score updated 65 → 80. Bed alarm reordered.', source: 'Incident · J. Okafor', time: '12h ago' },
    ]},
  { id: 'r3', name: 'Rafael Moreno', age: 71, sex: 'M', mrn: '0034-815', room: '305A', unit: 'East · Skilled', code: 'Full Code', risk: 'high', score: 68, trend: 'flat', dx: 'Post-op CABG day 6, A.fib', admitted: '2026-05-01', initials: 'RM', avatar: '#0081CF',
    drivers: ['med', 'rehab'],
    issues: [
      { id: 'i1', kind: 'med',  severity: 'high', title: 'INR 3.8 — supratherapeutic', detail: 'On warfarin 5mg. Hold dose pending provider confirmation.', source: 'Lab · Quest', time: '1h ago' },
      { id: 'i2', kind: 'rehab', severity: 'watch', title: 'PT session refused × 2', detail: 'Reports fatigue. OT proceeded with bedside ADLs.', source: 'Rehab · O. Reed', time: '1d ago' },
    ]},
  { id: 'r4', name: 'Adam Linda',     age: 69, sex: 'M', mrn: '0034-772', room: '312A', unit: 'East · Skilled',  code: 'Full Code', risk: 'high', score: 64, trend: 'down', dx: 'COPD exac., DM2',                  admitted: '2026-04-29', initials: 'AL', avatar: '#FF9671', drivers: ['rehosp','med'] },
  { id: 'r5', name: 'Priscilla Owens',age: 76, sex: 'F', mrn: '0034-803', room: '221B', unit: 'West · LTC',      code: 'DNR/DNI',   risk: 'high', score: 62, trend: 'up',   dx: 'Stage IV sacral pressure injury',   admitted: '2026-02-12', initials: 'PO', avatar: '#C34A7D', drivers: ['skin','nutrition'] },
  { id: 'r6', name: 'Gladys Howe',    age: 88, sex: 'F', mrn: '0034-829', room: '117',  unit: 'Memory Care',     code: 'DNR',       risk: 'watch',score: 49, trend: 'flat', dx: 'Advanced dementia, dysphagia',      admitted: '2025-11-20', initials: 'GH', avatar: '#67568C', drivers: ['nutrition','behavioral'] },
  { id: 'r7', name: 'Harold Chen',    age: 73, sex: 'M', mrn: '0034-799', room: '104C', unit: 'East · Skilled',  code: 'Full Code', risk: 'watch',score: 44, trend: 'down', dx: 'Total knee replacement day 3',       admitted: '2026-05-04', initials: 'HC', avatar: '#00C9A7', drivers: ['rehab','med'] },
  { id: 'r8', name: 'Eleanor Park',   age: 81, sex: 'F', mrn: '0034-744', room: '210',  unit: 'West · LTC',      code: 'Full Code', risk: 'watch',score: 41, trend: 'flat', dx: 'Parkinson\u2019s, recurrent UTI',    admitted: '2026-01-08', initials: 'EP', avatar: '#FF6E6C', drivers: ['fall','med'] },
  { id: 'r9', name: 'Jorge Salazar',  age: 65, sex: 'M', mrn: '0034-855', room: '301B', unit: 'East · Skilled',  code: 'Full Code', risk: 'stable',score: 22, trend: 'down', dx: 'Hip fracture s/p ORIF, day 9',     admitted: '2026-04-26', initials: 'JS', avatar: '#0081CF', drivers: ['rehab'] },
  { id: 'r10',name: 'Helen Goodwin',  age: 79, sex: 'F', mrn: '0034-866', room: '215A', unit: 'West · LTC',      code: 'DNR',       risk: 'stable',score: 18, trend: 'flat', dx: 'CKD III, HTN',                       admitted: '2025-12-01', initials: 'HG', avatar: '#29BB89', drivers: [] },
  { id: 'r11',name: 'Wendell Ortiz',  age: 70, sex: 'M', mrn: '0034-877', room: '109',  unit: 'Memory Care',     code: 'DNR',       risk: 'stable',score: 15, trend: 'flat', dx: 'Alzheimer\u2019s, behavioral plan',  admitted: '2025-10-14', initials: 'WO', avatar: '#845EC2', drivers: ['behavioral'] },
  { id: 'r12',name: 'Doris Pham',     age: 86, sex: 'F', mrn: '0034-888', room: '222',  unit: 'West · LTC',      code: 'DNR',       risk: 'stable',score: 12, trend: 'down', dx: 'Hospice eligible — comfort care',    admitted: '2025-09-22', initials: 'DP', avatar: '#FF9671', drivers: [] },
];

// Care team for a resident (just store IDs)
const CARE_TEAMS = {
  r1: ['u1','u2','u3','u4','u9','u10','u11','u12','u14','u18'],
  r2: ['u1','u3','u4','u8','u10','u11','u15'],
  r3: ['u1','u4','u10','u11','u12','u13','u14'],
};

const NOTES_SEED = {
  r1: [
    { id: 'n1', user: 'u9', body: 'Sacral wound: dressing change at 06:00. Exudate moderate, no odor. Photo uploaded. Recommend escalating to wound consult — @u10 @u1.', time: 'Today · 06:42' },
    { id: 'n2', user: 'u4', body: 'Held 06:00 furosemide per parameters (SBP < 95). Will recheck at 10:00. @u11 please advise on next dose.', time: 'Today · 06:18' },
    { id: 'n3', user: 'u14', body: 'Bed mobility assist x 2 → x 1 today. Tolerated 8 minutes upright. Continuing current plan.', time: 'Yesterday · 15:10' },
  ],
};

const CAREPLAN_SEED = {
  r1: [
    { id: 'cp1', kind: 'huddle', title: 'Morning Huddle — Apr 7', participants: ['u1','u2','u3','u4','u9','u10'], time: 'Today · 07:00', summary: 'Wound nurse raised positioning compliance. AI linked to PT note from 4/5 noting refusal of repositioning q2h. Decision: wound specialist consult requested via @u10. Follow-up: Aisha to retake photo in 24h.', actions: ['Wound consult requested','Repositioning q2h re-educated','Photo recheck 24h'] },
    { id: 'cp2', kind: 'call', title: 'Call with Dr. Park — nephrology follow-up', participants: ['u1','u10'], time: 'Yesterday · 14:32', duration: '8m 14s', summary: 'Discussed declining UOP and BUN/Cr trend. Plan: hold furosemide if SBP < 95, recheck BMP in AM, consider IV fluids 250cc bolus PRN. Nephrology to call back tomorrow.', actions: ['Hold furosemide if SBP<95','BMP in AM','IV bolus PRN'] },
    { id: 'cp3', kind: 'message', title: 'Care plan thread — initial admission', participants: ['u1','u11','u15'], time: 'Apr 22 · 10:14', summary: 'Initial admission goals set: stabilize CHF, advance wound healing, target d/c home with family in 4 weeks. Social services to assess home suitability.', actions: ['Social work assessment','4-wk d/c target','Family meeting scheduled'] },
  ],
};

// Today's priority list — derived but explicit for the Home page
function priorityResidents() {
  const order = { critical: 0, high: 1, watch: 2, stable: 3 };
  return [...RESIDENTS].sort((a, b) => order[a.risk] - order[b.risk] || b.score - a.score);
}

// Recent "changes" (Changes tab summary across the facility)
const FACILITY_CHANGES = [
  { residentId: 'r2', kind: 'sepsis',   severity: 'critical', title: 'Sepsis screen positive', detail: 'Temp 38.9°C, AMS, qSOFA 2. AI flagged 40m ago. No provider response yet.',           time: '40m ago', source: 'AI · sepsis screen' },
  { residentId: 'r1', kind: 'vitals',   severity: 'critical', title: 'BP trending down', detail: 'SBP −14 pts in 4h, HR 112. Consider sepsis vs volume depletion.',                          time: '2h ago',  source: 'AI · vitals stream' },
  { residentId: 'r3', kind: 'lab',      severity: 'high',     title: 'INR 3.8 — supratherapeutic', detail: 'Warfarin held pending provider confirmation. Last INR 2.6 (4d ago).',             time: '1h ago',  source: 'Lab · Quest' },
  { residentId: 'r4', kind: 'vitals',   severity: 'high',     title: 'SpO₂ 88% on 2L', detail: 'Resp rate 24, audible wheeze. Respiratory therapy paged.',                                    time: '3h ago',  source: 'AI · vitals stream' },
  { residentId: 'r1', kind: 'wound',    severity: 'high',     title: 'Sacral wound — exudate ↑', detail: 'Saturated dressing × 2 overnight. Photo on file.',                                  time: '5h ago',  source: 'CNA note' },
  { residentId: 'r5', kind: 'nutrition',severity: 'watch',    title: 'PO intake < 25% × 3 meals', detail: 'Refusing solids, accepting fluids. Consider supplement order.',                    time: '6h ago',  source: 'eMAR' },
  { residentId: 'r2', kind: 'fall',     severity: 'high',     title: 'Witnessed fall — bathroom', detail: 'No injury. Morse 65 → 80. Bed alarm reordered.',                                   time: '12h ago', source: 'Incident report' },
  { residentId: 'r7', kind: 'rehab',    severity: 'watch',    title: 'PT session shortened', detail: 'Pain 7/10 at incision site. PRN oxycodone given, plan to retry in PM.',                 time: '14h ago', source: 'Rehab note' },
];

Object.assign(window, { TEST_USERS, FACILITY, RISK_CATEGORIES, WATCHLISTS, RESIDENTS, CARE_TEAMS, NOTES_SEED, CAREPLAN_SEED, FACILITY_CHANGES, priorityResidents });


// ---- app/shell.jsx ----
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
              <input autoFocus value={searchQ} onInput={e => setSearchQ(e.target.value)}
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


// ---- app/login.jsx ----
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


// ---- app/home.jsx ----
// Home page — DON facility-level operations view

function HomePage({ user, onOpenResident, onNav }) {
  const priority = priorityResidents();
  const critical = priority.filter(r => r.risk === 'critical');
  const high     = priority.filter(r => r.risk === 'high');
  const watch    = priority.filter(r => r.risk === 'watch');
  const stable   = priority.filter(r => r.risk === 'stable');
  const occPct = Math.round(FACILITY.occupied / FACILITY.beds * 100);
  const [showHuddle, setShowHuddle] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 28 : 32 }}>
      {/* Greeting + facility summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr', gap: 14,
      }}>
        <div style={{
          background: '#fff', border: '1px solid #EEEEEE',
          color: '#1C192E', borderRadius: 10, padding: isPhone ? 20 : 24,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#99A1AF' }}>{greeting()} · MAY 7, 2026</div>
              <div style={{ fontSize: isPhone ? 26 : 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6, color: '#1C192E' }}>Hi, {user.name.split(' ')[0]}.</div>
              <div style={{ fontSize: 13, color: '#6A7282', marginTop: 4 }}>{FACILITY.name} · {FACILITY.building}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, width: isPhone ? '100%' : 'auto' }}>
              <Button variant="secondary" icon="message" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => setShowHuddle(true)}>Start Huddle</Button>
              <Button variant="lavender" icon="sparkles" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => setShowAI(true)}>Ask AI</Button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isPhone ? 14 : 20, borderTop: '1px solid #EEEEEE', paddingTop: 18 }}>
            <HeroStat label="Beds occupied" value={`${FACILITY.occupied} / ${FACILITY.beds}`} sub={`${occPct}% capacity`} />
            <HeroStat label="New admits 24h" value={FACILITY.admits24h} sub="1 awaiting H&P" />
            <HeroStat label="Discharges 24h" value={FACILITY.discharges24h} sub="0 returns" />
            <HeroStat label="Pending provider" value={FACILITY.pendingProvider} sub="2 over 4h" />
          </div>
        </div>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="sparkles" size={14} color="#52525B" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.04em' }}>OVERNIGHT BRIEF · AI</span>
          </div>
          <div style={{ fontSize: 13, color: '#1C192E', lineHeight: '19px', marginBottom: 14 }}>
            <b>3 escalations</b>, <b>6 follow-ups</b>, and <b>2 awaiting nephrology</b>.
            Highest concern: M. Bell — sepsis screen positive 40m ago.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BriefBullet text="Mr. Johnson · BP trend −14 pts in 4h. Wound exudate ↑." tone="critical" />
            <BriefBullet text="Marjorie Bell · sepsis screen positive, no provider response." tone="critical" />
            <BriefBullet text="Rafael Moreno · INR 3.8, warfarin held pending confirmation." tone="high" />
          </div>
          <button onClick={() => emitToast('Opening overnight thread — full context.', 'info')} style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', width: '100%',
            background: '#fff', color: '#1C192E', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            View full overnight thread <Icon name="chevronRight" size={12} color="#1C192E" />
          </button>
        </Card>
      </div>

      {/* Priority list */}
      <div>
        <SectionHeader
          title="Today's Priority"
          subtitle="Critical and High-risk residents only. AI keeps this list current."
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip tone="critical" dot>{critical.length} Critical</Chip>
              <Chip tone="high" dot>{high.length} High</Chip>
            </div>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...critical, ...high].map(r => (
            <PriorityRow key={r.id} r={r} onClick={() => onOpenResident(r.id)} />
          ))}
          {critical.length + high.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>
              No Critical or High-risk residents right now. Watch and Stable residents are tracked under the Residents tab.
            </Card>
          )}
        </div>
        <button onClick={() => onNav('residents')} style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 6, border: '1px solid #E5E7EB',
          background: '#fff', color: '#1C192E', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          View all {RESIDENTS.length} residents <Icon name="arrowRight" size={14} color="#1C192E" />
        </button>
      </div>

      {/* Risk drivers */}
      <div>
        <SectionHeader title="Risk Drivers" subtitle="Active risk categories across the facility. Click a category to see who's affected." />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 150 : 190}px, 1fr))`, gap: 10 }}>
          {RISK_CATEGORIES.map(cat => <RiskCategoryCard key={cat.id} cat={cat} />)}
        </div>
      </div>

      {showHuddle && <HuddleModal user={user} onClose={() => setShowHuddle(false)} onOpenResident={onOpenResident} />}
      {showAI && <AskAIPanel user={user} onClose={() => setShowAI(false)} onOpenResident={onOpenResident} onNav={onNav} />}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function HeroStat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#99A1AF', letterSpacing: '0.04em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.1, color: '#1C192E' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function BriefBullet({ text, tone }) {
  const c = tone === 'critical' ? '#B91C1C' : tone === 'high' ? '#C2410C' : '#92703A';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#1C192E' }}>
      <span style={{ width: 5, height: 5, borderRadius: 9999, background: c, marginTop: 7, flexShrink: 0 }} />
      <span style={{ lineHeight: '18px' }}>{text}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h2>
        {subtitle && <div style={{ fontSize: 13, color: '#6A7282', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function PriorityRow({ r, onClick }) {
  const tone = RISK[r.risk];
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 6, background: tone.dot }} />
        <div style={{ flex: 1, padding: isPhone ? '14px 14px' : '14px 18px', display: 'flex', alignItems: isPhone ? 'flex-start' : 'center', gap: isPhone ? 12 : 16, flexDirection: isPhone ? 'column' : 'row' }}>
          <div style={{ display: 'flex', gap: 12, width: isPhone ? '100%' : 'auto', alignItems: 'center' }}>
            <Avatar initials={r.initials} seed={r.id} size={44} isResident />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>
                <code style={{ fontFamily: 'JetBrains Mono' }}>{r.mrn}</code> · Rm {r.room} · {r.unit}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, fontSize: 13, color: '#6A7282', minWidth: 0, width: isPhone ? '100%' : 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isPhone ? 'normal' : 'nowrap', lineHeight: '18px' }}>
            {r.dx}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: isPhone ? '100%' : 'auto' }}>
            {r.drivers && r.drivers.slice(0, 3).map(id => {
              const cat = RISK_CATEGORIES.find(c => c.id === id);
              if (!cat) return null;
              return <Chip key={id} tone="todo">{cat.label.split(' / ')[0]}</Chip>;
            })}
          </div>
          {!isPhone && <div style={{ width: 1, height: 36, background: '#EEEEEE' }} />}
          <div style={{ display: 'flex', flexDirection: isPhone ? 'row' : 'column', alignItems: isPhone ? 'center' : 'flex-end', justifyContent: 'space-between', gap: 8, minWidth: isPhone ? 0 : 110, width: isPhone ? '100%' : 'auto' }}>
            <RiskBadge level={r.risk} score={r.score} />
            <div style={{ fontSize: 11, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name={r.trend === 'up' ? 'trendingUp' : r.trend === 'down' ? 'trendingDown' : 'arrowRight'} size={12} color={r.trend === 'up' ? '#E53E3E' : r.trend === 'down' ? '#29BB89' : '#6A7282'} />
              Trend {r.trend === 'up' ? 'rising' : r.trend === 'down' ? 'improving' : 'flat'}
            </div>
          </div>
          {!isPhone && <Icon name="chevronRight" size={18} color="#99A1AF" />}
        </div>
      </div>
    </Card>
  );
}

function RiskCategoryCard({ cat }) {
  return (
    <Card hoverable onClick={() => emitToast(`Filtering residents by ${cat.label} — ${cat.count} affected.`, 'info')} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={cat.icon} size={18} color="#52525B" />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#1C192E' }}>{cat.count}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1C192E' }}>{cat.label}</div>
        <div style={{ fontSize: 11, color: '#99A1AF', marginTop: 2 }}>residents at risk</div>
      </div>
    </Card>
  );
}

// ============== HUDDLE MODAL ==============
function HuddleModal({ user, onClose, onOpenResident }) {
  const onShift = TEST_USERS.filter(u => ['DON','ADON','UM','RN','LPN','CNA','NP','MD','MDS','IP','WC'].includes(u.short));
  const [selected, setSelected] = useState(onShift.slice(0, 6).map(u => u.id));
  const [topic, setTopic] = useState('Morning shift huddle · facility status');
  const [includeAll, setIncludeAll] = useState(false);
  const [agenda, setAgenda] = useState([
    { id: 'a1', text: 'Mr. Johnson — BP trend, wound exudate ↑', resident: 'r1' },
    { id: 'a2', text: 'Marjorie Bell — sepsis screen positive, awaiting provider', resident: 'r2' },
    { id: 'a3', text: 'Rafael Moreno — INR 3.8, warfarin held', resident: 'r3' },
  ]);
  const [newItem, setNewItem] = useState('');
  const [step, setStep] = useState('compose'); // compose | live
  const finalIds = includeAll ? onShift.map(u => u.id) : selected;
  const v = useViewport();
  const isPhone = v.isMobile;

  function toggle(id) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  function addItem() {
    if (!newItem.trim()) return;
    setAgenda(a => [...a, { id: 'a' + Date.now(), text: newItem.trim() }]);
    setNewItem('');
  }

  if (step === 'live') {
    return (
      <ModalShell title="Huddle in Progress" subtitle={`${finalIds.length} on call · started just now`} onClose={onClose} width={680}
        footer={<>
          <Button variant="ghost" onClick={onClose}>Leave</Button>
          <Button variant="lavender" icon="check" onClick={() => { emitToast(`Huddle ended — AI summary saved to ${agenda.length} resident records.`); onClose(); }}>End & Save Summary</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1C192E', borderRadius: 12, padding: 16, color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#FF6E6C', animation: 'ois-pulse 1.5s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>LIVE · 00:42</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <IconButton icon="micOff" color="#fff" />
                <IconButton icon="video" color="#fff" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {finalIds.slice(0, 8).map(id => {
                const u = TEST_USERS.find(x => x.id === id);
                if (!u) return null;
                return (
                  <div key={id} style={{ background: '#2D2A40', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Avatar initials={u.initials} seed={u.id} size={36} />
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{u.name.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 8 }}>AGENDA · AI CAPTURING</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agenda.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#F5F2FD', borderRadius: 8, fontSize: 13 }}>
                  <Icon name="circle" size={6} color="#845EC2" style={{ marginTop: 6 }} />
                  <span style={{ flex: 1 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Start Huddle" subtitle="Quick standup with on-shift care team. AI captures the agenda and posts notes to each resident." onClose={onClose} width={680}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="lavender" icon="video" onClick={() => setStep('live')}>Start Now ({finalIds.length})</Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>TOPIC</div>
          <Input value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>AGENDA — AI suggested from overnight events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {agenda.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, padding: '8px 10px', border: '1px solid #EEEEEE', borderRadius: 6, fontSize: 13, alignItems: 'center' }}>
                <Icon name="sparkles" size={12} color="#845EC2" />
                <span style={{ flex: 1 }}>{a.text}</span>
                <IconButton icon="x" size={24} onClick={() => setAgenda(agenda.filter(x => x.id !== a.id))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Input placeholder="Add agenda item…" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} style={{ flex: 1 }} />
            <Button variant="secondary" icon="plus" onClick={addItem}>Add</Button>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282' }}>PARTICIPANTS · {finalIds.length} of {onShift.length} on shift</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Checkbox checked={includeAll} onChange={e => setIncludeAll(e.target.checked)} />
              Everyone on shift
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 6, maxHeight: 200, overflowY: 'auto', border: '1px solid #EEEEEE', borderRadius: 8, padding: 8 }}>
            {onShift.map(u => {
              const checked = includeAll || selected.includes(u.id);
              return (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6,
                  background: checked ? '#F5F2FD' : 'transparent', cursor: includeAll ? 'not-allowed' : 'pointer',
                }}>
                  <Checkbox checked={checked} onChange={() => !includeAll && toggle(u.id)} disabled={includeAll} />
                  <Avatar initials={u.initials} seed={u.id} size={26} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.short}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ============== ASK AI PANEL ==============
function AskAIPanel({ user, onClose, onOpenResident, onNav }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi ${user.name.split(' ')[0]}, I have full context on ${FACILITY.name}. Ask me about residents, trends, staffing, or risks.` },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const suggestions = [
    'Who needs my attention before noon?',
    'Summarize overnight events for the DON',
    'Which residents have rising fall risk this week?',
    'Compare today\'s priority list to yesterday',
  ];
  const v = useViewport();
  const isPhone = v.isMobile;

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setMessages(m => [...m, { role: 'me', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const ctx = `You are an AI clinical assistant for a Director of Nursing at ${FACILITY.name} (${FACILITY.occupied}/${FACILITY.beds} beds occupied). The facility has ${critical().length} critical and ${high().length} high-risk residents. Critical: ${critical().map(r=>r.name+' ('+r.dx+')').join('; ')}. Be concise (under 80 words), clinical, and direct. No emoji.`;
      const reply = await window.claude.complete({
        messages: [
          { role: 'user', content: ctx + '\n\nDON asks: ' + q },
        ],
      });
      setMessages(m => [...m, { role: 'ai', text: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: 'I had trouble reaching the model. Try again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  }

  function critical() { return priorityResidents().filter(r => r.risk === 'critical'); }
  function high() { return priorityResidents().filter(r => r.risk === 'high'); }

  return (
    <ModalShell title="Ask AI" subtitle="Facility-aware assistant. Knows every resident, every change, every plan." onClose={onClose} width={640}
      footer={<>
        <div style={{ flex: 1, display: 'flex', gap: 8, flexDirection: isPhone ? 'column' : 'row' }}>
          <Input placeholder="Ask about residents, trends, staffing…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
          <Button variant="lavender" icon="arrowRight" style={{ width: isPhone ? '100%' : 'auto' }} onClick={() => send()} disabled={busy}>{busy ? '…' : 'Send'}</Button>
        </div>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 360 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'me' ? 'row-reverse' : 'row' }}>
            {m.role === 'ai'
              ? <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(#845EC2 37%, #00C9A7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkles" size={14} color="#fff" /></div>
              : <Avatar initials={user.initials} seed={user.id} size={32} />}
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: '19px',
              background: m.role === 'me' ? '#845EC2' : '#F5F2FD',
              color: m.role === 'me' ? '#fff' : '#1C192E',
              whiteSpace: 'pre-wrap',
            }}>{m.text}</div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(#845EC2 37%, #00C9A7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkles" size={14} color="#fff" /></div>
            <div style={{ display: 'flex', gap: 4, padding: '12px 14px', background: '#F5F2FD', borderRadius: 12 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 9999, background: '#845EC2', opacity: 0.4, animation: `ois-bounce 1.2s ${i*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6A7282', marginBottom: 8, letterSpacing: '0.04em' }}>SUGGESTED</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  textAlign: 'left', padding: '10px 12px', border: '1px solid #EEEEEE', borderRadius: 8,
                  background: '#fff', cursor: 'pointer', fontSize: 13, color: '#1C192E', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Icon name="sparkles" size={12} color="#845EC2" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

Object.assign(window, { HomePage });


// ---- app/residents.jsx ----
// Residents list + Resident profile with tabs

function ResidentsList({ onOpen }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  const v = useViewport();
  const isPhone = v.isMobile;

  const filtered = RESIDENTS.filter(r => {
    if (filter !== 'all' && r.risk !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.mrn.includes(q) || r.room.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Residents"
        subtitle={`${RESIDENTS.length} residents across ${FACILITY.name} · ${FACILITY.building}`}
        actions={[
          <Button key="filter" variant="secondary" icon="filter" onClick={() => emitToast('Advanced filters coming soon — use the search and risk pills below.', 'info')}>Filter</Button>,
          <Button key="add" variant="primary" icon="plus" onClick={() => emitToast('Add Resident flow coming soon — wire to PCC admit endpoint.', 'info')}>Add Resident</Button>,
        ]}
      />

      <Card style={{ padding: isPhone ? 12 : 16, display: 'flex', alignItems: 'stretch', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: isPhone ? '100%' : 240 }}>
          <Input icon="search" placeholder="Search by name, MRN, room, unit…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
          <SegmentedControl
            value={filter} onChange={setFilter}
            options={[
              { id: 'all', label: 'All' },
              { id: 'critical', label: 'Critical', tone: 'critical' },
              { id: 'high', label: 'High', tone: 'high' },
              { id: 'watch', label: 'Watch', tone: 'watch' },
              { id: 'stable', label: 'Stable', tone: 'stable' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginLeft: isPhone ? 'auto' : 0 }}>
          <ViewBtn icon="list" active={view === 'list'} onClick={() => setView('list')} />
          <ViewBtn icon="grid" active={view === 'grid'} onClick={() => setView('grid')} />
        </div>
      </Card>

      {view === 'list' ? (
        <Card style={{ padding: 0, overflow: isPhone ? 'hidden' : 'auto' }}>
          <table class="ois-stack" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter', minWidth: isPhone ? 0 : 840 }}>
            <thead>
              <tr style={{ fontSize: 11, color: '#6A7282', fontWeight: 700, textAlign: 'left', letterSpacing: '0.04em', background: '#FAFAFA' }}>
                <th style={th}>RESIDENT</th>
                <th style={th}>MRN</th>
                <th style={th}>LOCATION</th>
                <th style={th}>CODE STATUS</th>
                <th style={th}>RISK</th>
                <th style={th}>TREND</th>
                <th style={th}>DRIVERS</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => <ResidentRow key={r.id} r={r} onClick={() => onOpen(r.id)} />)}
            </tbody>
          </table>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 240 : 280}px, 1fr))`, gap: 12 }}>
          {filtered.map(r => <ResidentGridCard key={r.id} r={r} onClick={() => onOpen(r.id)} />)}
        </div>
      )}
    </div>
  );
}

const th = { padding: '12px 18px', fontWeight: 700 };
const td = { padding: '14px 18px', fontSize: 14, color: '#1C192E', verticalAlign: 'middle' };

function SegmentedControl({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: '#F5F2FD', borderRadius: 8 }}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 12px', borderRadius: 6, border: 0,
            background: active ? '#fff' : 'transparent',
            color: active ? '#1C192E' : '#6A7282',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {o.tone && <span style={{ width: 7, height: 7, borderRadius: 9999, background: RISK[o.tone].dot }} />}
            {o.label}
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
  const tone = RISK[r.risk];
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
      <td style={td}><RiskBadge level={r.risk} score={r.score} /></td>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: r.trend === 'up' ? '#E53E3E' : r.trend === 'down' ? '#29BB89' : '#6A7282' }}>
          <Icon name={r.trend === 'up' ? 'trendingUp' : r.trend === 'down' ? 'trendingDown' : 'arrowRight'} size={14} color={r.trend === 'up' ? '#E53E3E' : r.trend === 'down' ? '#29BB89' : '#6A7282'} />
          {r.trend === 'up' ? 'Rising' : r.trend === 'down' ? 'Improving' : 'Flat'}
        </div>
      </td>
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
  const tone = RISK[r.risk];
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 4, background: tone.dot }} />
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
          <RiskBadge level={r.risk} score={r.score} />
          <code style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6A7282' }}>{r.mrn}</code>
        </div>
      </div>
    </Card>
  );
}

// ============== RESIDENT PROFILE ==============

function ResidentProfile({ residentId, onBack, onOpenChat, onOpenIssue }) {
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
        <div class="ois-profile-grid">
          {/* Identity */}
          <div style={{ display: 'flex', gap: isPhone ? 14 : 20, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              <Avatar initials={r.initials} seed={r.id} size={isPhone ? 64 : 92} isResident />
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#fff', borderRadius: 9999, padding: 2 }}>
                <div style={{ width: 18, height: 18, borderRadius: 9999, background: tone.dot, border: '2px solid #fff' }} />
              </div>
            </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: isPhone ? 24 : 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{r.name}</h1>
                <RiskBadge level={r.risk} score={r.score} />
              </div>
              <div style={{ fontSize: 14, color: '#6A7282', marginTop: 6 }}>
                {r.age} · {r.sex} · <code style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>MRN {r.mrn}</code>
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
                <Detail icon="mapPin" label="Location" value={`Rm ${r.room} · ${r.unit}`} />
                <Detail icon="shield" label="Code Status" value={r.code} />
                <Detail icon="calendar" label="Admitted" value={r.admitted} />
                <Detail icon="activity" label="Primary Dx" value={r.dx} flex />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div class="ois-row-actions" style={{ display: 'flex', gap: 8 }}>
            <Button variant="lavender" icon="calendar" onClick={() => setShowSchedule(true)}>Schedule</Button>
            <Button variant="danger" icon="alertTriangle" onClick={() => setShowEscalate(true)}>Escalate</Button>
          </div>
        </div>

        {/* Risk score + trend */}
        <div class="ois-profile-trend">
          <RiskScoreCard score={r.score} level={r.risk} trend={r.trend} />
          <RiskTrendChart score={r.score} level={r.risk} />
        </div>
      </Card>

      {/* Tabs */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #EEEEEE', padding: isPhone ? '0 8px' : '0 16px', overflowX: 'auto' }}>
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
      padding: isPhone ? '12px 10px' : '14px 18px', border: 0, background: 'transparent', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8, fontSize: isPhone ? 13 : 14, fontWeight: 700,
      color: active ? '#845EC2' : '#6A7282',
      borderBottom: `2px solid ${active ? '#845EC2' : 'transparent'}`,
      marginBottom: -1, transition: 'all 120ms', flexShrink: 0,
    }}>
      <Icon name={t.icon} size={16} color={active ? '#845EC2' : '#6A7282'} />
      {t.label}
      {t.count != null && <span style={{
        minWidth: 20, height: 18, padding: '0 6px', borderRadius: 9999,
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
  const tone = RISK[level];
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
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone.dot} stopOpacity="0.25" />
            <stop offset="100%" stopColor={tone.dot} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={P} y1={P + (1 - 0.6) * (H - 2 * P)} x2={W - P} y2={P + (1 - 0.6) * (H - 2 * P)} stroke="#EEEEEE" strokeDasharray="3 3" />
        <line x1={P} y1={P + (1 - 0.8) * (H - 2 * P)} x2={W - P} y2={P + (1 - 0.8) * (H - 2 * P)} stroke="#FFE5E5" strokeDasharray="3 3" />
        <path d={areaPath} fill="url(#trend-grad)" />
        <path d={path} fill="none" stroke={tone.dot} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => {
          const x = P + (i / (points.length - 1)) * (W - P * 2);
          const y = P + (1 - (p - min) / (max - min)) * (H - P * 2);
          return <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 0} fill={tone.dot} />;
        })}
      </svg>
    </div>
  );
}

// ============== TABS ==============

function ChangesTab({ r, onOpenIssue }) {
  const issues = r.issues || [
    { id: 'i1', kind: 'vitals', severity: 'watch', title: 'No active changes flagged', detail: 'Continuity AI is monitoring vitals, labs, and notes. You will be notified when something changes.', source: 'AI · monitor', time: 'Now' },
  ];
  const [statuses, setStatuses] = useState({});
  function setStatus(id, s) {
    setStatuses(m => ({ ...m, [id]: s }));
    if (s === 'ack')      emitToast('Change acknowledged.');
    if (s === 'monitor')  emitToast('Moved to For Monitoring.', 'info');
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Icon name="sparkles" size={16} color="#845EC2" />
        <div style={{ fontSize: 13, color: '#6A7282' }}>
          <b style={{ color: '#1C192E' }}>{issues.length} active changes</b> driving this resident's risk score. Click any card for full evidence and AI-suggested actions.
        </div>
      </div>
      {issues.map(issue => (
        <ChangeCard key={issue.id} issue={issue} r={r}
          status={statuses[issue.id]}
          onSetStatus={s => setStatus(issue.id, s)}
          onOpen={() => onOpenIssue && onOpenIssue(r.id, issue.id)} />
      ))}
    </div>
  );
}

function ChangeCard({ issue, r, onOpen, status, onSetStatus }) {
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
      <div onClick={e => e.stopPropagation()}>
        <ChangeActionMenu status={status} onSetStatus={onSetStatus} />
      </div>
    </div>
  );
}

function ChangeActionMenu({ status, onSetStatus }) {
  if (status === 'ack') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
        background: '#E7F5EF', color: '#3F6B4E',
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
      }}>
        <Icon name="activity" size={14} color="#92703A" /> For Monitoring
      </span>
    );
  }
  return (
    <MoreActionMenu
      label="More action"
      icon="plus"
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back
      </button>
      <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={iconMap[issue.kind] || 'activity'} size={24} color={sev.fg} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{issue.title}</div>
            <div style={{ fontSize: 13, color: '#6A7282', marginTop: 2 }}>{r.name} · Rm {r.room} · {r.unit} · <code style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>MRN {r.mrn}</code></div>
          </div>
          <RiskBadge level={issue.severity} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid #EEEEEE' }}>
          <div style={{ fontSize: 12, color: '#6A7282' }}>{issue.source} · {issue.time}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ChangeActionMenu status={status} onSetStatus={s => { setStatus(s); s === 'ack' ? emitToast('Change acknowledged.') : emitToast('Moved to For Monitoring.', 'info'); }} />
            <Button variant="secondary" icon="users" onClick={() => setDiscussOpen(true)}>Discuss with Team</Button>
            <Button variant="primary" icon="phone" onClick={() => setNotifyOpen(true)}>Notify Provider</Button>
          </div>
        </div>

        <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 16, border: '1px solid #EEEEEE' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.06em', marginBottom: 8 }}>WHY THIS WAS FLAGGED</div>
          <div style={{ fontSize: 14, color: '#1C192E', lineHeight: '20px' }}>{issue.detail}</div>
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
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

      </Card>
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
            <textarea value={msg} onInput={e => setMsg(e.target.value)}
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
          <Icon name="sparkles" size={14} color="#67568C" />
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
      <div class="ois-team-grid">
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
          <textarea value={draft} onInput={e => setDraft(e.target.value)}
            placeholder="Add a note. Use @ to tag care team members…"
            style={{ width: '100%', border: 0, outline: 0, font: '14px Inter', resize: 'vertical', minHeight: 60 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <IconButton icon="paperclip" />
              <IconButton icon="users" title="Tag people" />
              <IconButton icon="sparkles" title="AI suggest" color="#845EC2" />
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
          <Icon name="sparkles" size={14} color="#52525B" />
          <div style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.04em' }}>AI CARE PLAN SUMMARY</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: '19px', color: '#1C192E' }}>
          Active goals: <b>stabilize CHF</b>, <b>advance sacral wound healing</b>, <b>target home discharge in 4 weeks</b>.
          Open threads: nephrology consult pending response, repositioning compliance flagged. Next AI check-in: 14:00.
        </div>
      </div>
      {items.map(item => <CarePlanThread key={item.id} item={item} team={team} />)}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: '#99A1AF', fontSize: 13 }}>
          No conversations yet. Start a thread from the Care Team tab — the AI will preserve it as continuity.
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
              <Icon name="sparkles" size={12} color="#67568C" /> AI SUMMARY
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
        <div class="ois-modal-2col">
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
          <textarea value={reason} onInput={e => setReason(e.target.value)}
            placeholder="What's happening? AI will pre-fill from the latest changes if you leave this blank."
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
    const r1 = RESIDENTS[0], r2 = RESIDENTS[1] || RESIDENTS[0], r3 = RESIDENTS[2] || RESIDENTS[0], r4 = RESIDENTS[3] || RESIDENTS[0];
    const todayIdx = (day + 6) % 7;
    return [
      { id: 'e1', day: todayIdx, start: 9,  end: 9.5,  title: 'Care plan review', resident: r1, kind: 'meeting' },
      { id: 'e2', day: todayIdx, start: 11, end: 11.5, title: 'Wound consult',    resident: r2, kind: 'meeting' },
      { id: 'e3', day: todayIdx, start: 14, end: 15,   title: 'Family conference', resident: r1, kind: 'family' },
      { id: 'e4', day: Math.min(todayIdx + 1, 6), start: 8,  end: 9,  title: 'Daily huddle', kind: 'huddle' },
      { id: 'e5', day: Math.min(todayIdx + 1, 6), start: 13, end: 13.5, title: 'Medication review', resident: r3, kind: 'meeting' },
      { id: 'e6', day: Math.min(todayIdx + 2, 6), start: 10, end: 10.5, title: 'Discharge planning', resident: r4, kind: 'meeting' },
      { id: 'e7', day: Math.min(todayIdx + 3, 6), start: 15, end: 16,   title: 'PT assessment',     resident: r2, kind: 'meeting' },
    ];
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
        subtitle="Care team meetings, huddles, and family conferences for this facility."
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


// ---- app/changes.jsx ----
// Changes feed + Watchlist pages

function ChangesPage({ onOpenResident, onOpenIssue }) {
  const [filter, setFilter] = useState('all');
  const filtered = FACILITY_CHANGES.filter(c => filter === 'all' || c.severity === filter);
  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Changes"
        subtitle="AI-detected deviations across all residents in the last 24 hours. Click any card to open the resident."
        actions={[
          <Button key="brief" variant="secondary" icon="sparkles" onClick={() => emitToast('AI brief generated — sent to your inbox.', 'info')}>Generate AI Brief</Button>,
          <Button key="filter" variant="secondary" icon="filter" onClick={() => emitToast('Advanced filters coming soon.', 'info')}>Filter</Button>,
        ]}
      />

      <Card style={{ padding: isPhone ? 12 : 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
          <SegmentedControl
            value={filter} onChange={setFilter}
            options={[
              { id: 'all', label: `All (${FACILITY_CHANGES.length})` },
              { id: 'critical', label: 'Critical', tone: 'critical' },
              { id: 'high', label: 'High', tone: 'high' },
              { id: 'watch', label: 'Watch', tone: 'watch' },
              { id: 'stable', label: 'Stable', tone: 'stable' },
            ]}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#29BB89' }} />
          Live · updated 14s ago
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 260 : 300}px, 1fr))`, gap: 12, alignItems: 'stretch' }}>
        {filtered.map((c, i) => {
          const r = RESIDENTS.find(x => x.id === c.residentId);
          return <ChangeFeedCard key={i} c={c} r={r} onClick={() => onOpenIssue ? onOpenIssue(r.id, c.id || (r.issues && r.issues[0] && r.issues[0].id)) : onOpenResident(r.id)} />;
        })}
        {filtered.length === 0 && (
          <Card style={{ padding: 32, textAlign: 'center', color: '#6A7282', fontSize: 13, gridColumn: '1 / -1' }}>
            No {filter !== 'all' ? filter : ''} changes right now.
          </Card>
        )}
      </div>
    </div>
  );
}

function ChangeFeedCard({ c, r, onClick }) {
  const sev = RISK[c.severity] || RISK.watch;
  const iconMap = { vitals: 'activity', wound: 'heart', med: 'pill', fall: 'shield', lab: 'fileText', nutrition: 'droplet', sepsis: 'alertTriangle', rehab: 'trendingDown' };
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 4, background: sev.dot, flexShrink: 0 }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar initials={r.initials} seed={r.id} size={40} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#6A7282' }}>Rm {r.room} · <code style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>{r.mrn}</code></div>
          </div>
          <RiskBadge level={c.severity} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon name={iconMap[c.kind] || 'activity'} size={13} color={sev.fg} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1C192E', lineHeight: '19px' }}>{c.title}</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 4, lineHeight: '17px' }}>{c.detail}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EEEEEE', paddingTop: 10, marginTop: 'auto' }}>
          <div style={{ fontSize: 11, color: '#99A1AF' }}>{c.source} · {c.time}</div>
          <Icon name="chevronRight" size={16} color="#99A1AF" />
        </div>
      </div>
    </Card>
  );
}

// ============== WATCHLIST ==============

function WatchlistPage({ onOpenResident }) {
  const [active, setActive] = useState(null);
  const v = useViewport();
  const isPhone = v.isMobile;
  if (active) {
    const list = WATCHLISTS.find(w => w.id === active);
    return <WatchlistDetail list={list} onBack={() => setActive(null)} onOpen={onOpenResident} />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Watchlist"
        subtitle="Cohorts that need extra eyes. AI keeps these lists current — residents move on and off automatically."
        actions={[
          <Button key="custom" variant="primary" icon="plus" onClick={() => emitToast('Custom watchlist builder coming soon.', 'info')}>Custom Watchlist</Button>,
        ]}
      />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 240 : 280}px, 1fr))`, gap: 12 }}>
        {WATCHLISTS.map(w => <WatchlistCard key={w.id} w={w} onClick={() => setActive(w.id)} />)}
      </div>
    </div>
  );
}

function WatchlistCard({ w, onClick }) {
  const tone = RISK[w.tone] || (w.tone === 'info' ? { fg: '#0081CF' }
                            : w.tone === 'pending' ? { fg: '#B58420' }
                            : w.tone === 'coral' ? { fg: '#FF6E6C' }
                            : { fg: '#67568C' });
  return (
    <Card hoverable onClick={onClick} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Icon name={w.icon} size={22} color={tone.fg} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: '#1C192E', letterSpacing: '-0.02em', lineHeight: 1 }}>{w.count}</span>
          <span style={{ fontSize: 13, color: '#6A7282' }}>residents</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1C192E' }}>{w.label}</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 4, lineHeight: '17px' }}>{w.desc}</div>
      </div>
    </Card>
  );
}

function WatchlistDetail({ list, onBack, onOpen }) {
  // Pick a plausible subset of residents
  const subset = useMemo(() => {
    const map = {
      admits:    RESIDENTS.filter(r => ['r3','r4','r7'].includes(r.id)),
      returns:   RESIDENTS.filter(r => ['r1','r3'].includes(r.id)),
      fall:      RESIDENTS.filter(r => (r.drivers || []).includes('fall') || r.score >= 40).slice(0, 5),
      sepsis:    RESIDENTS.filter(r => ['r2','r1'].includes(r.id)),
      wound:     RESIDENTS.filter(r => (r.drivers || []).includes('skin')),
      iso:       RESIDENTS.filter(r => ['r2'].includes(r.id)),
      nutrition: RESIDENTS.filter(r => (r.drivers || []).includes('nutrition')),
      pendingMd: RESIDENTS.filter(r => ['r1','r3','r4'].includes(r.id)),
      meds:      RESIDENTS.filter(r => (r.drivers || []).includes('med')),
      discharge: RESIDENTS.filter(r => ['r7','r9'].includes(r.id)),
    };
    return map[list.id] || RESIDENTS.slice(0, 4);
  }, [list.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Watchlist
      </button>
      <PageHeader title={list.label} subtitle={list.desc} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table class="ois-stack" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ fontSize: 11, color: '#6A7282', fontWeight: 700, textAlign: 'left', letterSpacing: '0.04em', background: '#FAFAFA' }}>
              <th style={{ padding: '12px 18px' }}>RESIDENT</th>
              <th style={{ padding: '12px 18px' }}>LOCATION</th>
              <th style={{ padding: '12px 18px' }}>RISK</th>
              <th style={{ padding: '12px 18px' }}>WHY ON LIST</th>
              <th style={{ padding: '12px 18px' }}></th>
            </tr>
          </thead>
          <tbody>
            {subset.map(r => (
              <tr key={r.id} onClick={() => onOpen(r.id)} style={{ borderTop: '1px solid #EEEEEE', cursor: 'pointer' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={r.initials} seed={r.id} size={36} isResident />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: '#6A7282' }}>{r.age} · {r.sex}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 18px', fontSize: 13 }}>Rm {r.room}<br/><span style={{ color: '#6A7282', fontSize: 12 }}>{r.unit}</span></td>
                <td style={{ padding: '14px 18px' }}><RiskBadge level={r.risk} score={r.score} /></td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: '#6A7282' }}>{r.dx}</td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}><Icon name="chevronRight" size={16} color="#99A1AF" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============== CHAT POPOVER ==============

function ChatDock({ chats, onClose, onSendCall }) {
  if (!chats || chats.length === 0) return null;
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 0, zIndex: 60, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
      {chats.map(c => <ChatWindow key={c.id} chat={c} onClose={() => onClose(c.id)} onCall={() => onSendCall(c.id)} />)}
    </div>
  );
}

function ChatWindow({ chat, onClose, onCall }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(chat.messages || []);
  const [callState, setCallState] = useState(null); // null | 'voice' | 'video' | 'summary'
  const [callSummary, setCallSummary] = useState(null);
  const me = TEST_USERS[0];
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function send() {
    if (!draft.trim()) return;
    setMessages(m => [...m, { id: 'm' + Date.now(), from: 'me', body: draft, time: 'now' }]);
    setDraft('');
    setTimeout(() => {
      setMessages(m => [...m, { id: 'r' + Date.now(), from: 'them', body: 'Got it — checking now.', time: 'now' }]);
    }, 900);
  }

  function startCall(kind) {
    setCallState(kind);
    setTimeout(() => {
      setCallState('summary');
      setCallSummary({
        duration: kind === 'video' ? '6m 42s' : '3m 18s',
        summary: `Discussed ${chat.resident.name}'s recent change in vitals. ${chat.user.name.split(' ')[0]} will recheck BP at the top of the next hour and notify the provider if SBP < 90. Action items captured to the Care Plan.`,
        actions: ['Recheck BP at next hour', 'Notify provider if SBP < 90', 'Document in care plan'],
      });
    }, 1400);
  }

  return (
    <div style={{
      width: 340, height: 480, background: '#fff', borderRadius: '12px 12px 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
      border: '1px solid #E5E7EB', borderBottom: 0, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #EEEEEE', background: '#1C192E', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={chat.user.initials} seed={chat.user.id} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.user.name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Re: {chat.resident.name}</div>
        </div>
        <button onClick={() => startCall('voice')} title="Voice call" style={iconBtnLight}><Icon name="phone" size={14} color="#fff" /></button>
        <button onClick={() => startCall('video')} title="Video call" style={iconBtnLight}><Icon name="video" size={14} color="#fff" /></button>
        <button onClick={onClose} style={iconBtnLight}><Icon name="x" size={14} color="#fff" /></button>
      </div>

      {callState === 'voice' || callState === 'video' ? (
        <div style={{ flex: 1, background: '#1C192E', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 16 }}>
          <Avatar initials={chat.user.initials} seed={chat.user.id} size={72} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>{chat.user.name}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{callState === 'video' ? 'Video call' : 'Voice call'} · connecting…</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Avatar initials={me.initials} seed={me.id} size={36} />
            <div style={{ width: 36, height: 36, borderRadius: 9999, background: '#FF6E6C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="mic" size={12} color="#fff" /> AI is transcribing & summarizing — patient {chat.resident.name} auto-tagged.
          </div>
        </div>
      ) : callState === 'summary' && callSummary ? (
        <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkles" size={14} color="#845EC2" />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#67568C', letterSpacing: '0.04em' }}>CALL SUMMARY · {callSummary.duration}</div>
          </div>
          <div style={{ fontSize: 13, lineHeight: '18px', padding: 12, background: '#F5F2FD', borderRadius: 8 }}>{callSummary.summary}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>ACTION ITEMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {callSummary.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <Icon name="check" size={14} color="#29BB89" /> {a}
                </div>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" icon="fileText" onClick={() => { setCallState(null); setCallSummary(null); }}>Save to Care Plan</Button>
        </div>
      ) : (
        <div ref={scrollRef} style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#FAFAFA' }}>
          <div style={{ alignSelf: 'center', fontSize: 11, color: '#99A1AF', background: '#fff', padding: '4px 10px', borderRadius: 9999, border: '1px solid #EEEEEE' }}>
            Resident <b>{chat.resident.name}</b> auto-tagged
          </div>
          {messages.map(m => (
            <div key={m.id} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                padding: '8px 12px', borderRadius: m.from === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.from === 'me' ? '#845EC2' : '#fff', color: m.from === 'me' ? '#fff' : '#1C192E',
                fontSize: 13, lineHeight: '18px', border: m.from === 'me' ? 0 : '1px solid #EEEEEE',
              }}>{m.body}</div>
            </div>
          ))}
        </div>
      )}

      {!callState && (
        <div style={{ padding: 8, borderTop: '1px solid #EEEEEE', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={draft} onInput={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 9999, padding: '8px 14px', font: '13px Inter', outline: 0 }} />
          <button onClick={send} style={{ width: 32, height: 32, borderRadius: 9999, border: 0, background: '#845EC2', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtnLight = {
  width: 26, height: 26, borderRadius: 9999, border: 0,
  background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

Object.assign(window, { ChangesPage, WatchlistPage, ChatDock });


// ---- app/huddle.jsx ----
// Huddle page — facility-wide huddle history + saved AI summaries

const HUDDLE_HISTORY = [
  {
    id: 'h1', title: 'Morning shift huddle · facility status', kind: 'shift',
    when: 'Today · 7:15 AM', duration: '12m 04s', host: 'u1',
    participants: ['u1','u2','u3','u4','u5','u6','u9','u11'],
    residents: ['r1','r2','r3'],
    summary: 'Reviewed overnight escalations. Sepsis pathway initiated for M. Bell — IV fluids, blood cultures drawn. Mr. Johnson awaiting NP assessment. Wound care plan updated for two residents. Day shift will recheck vitals on r1 q2h until trending stable.',
    actions: [
      { text: 'Recheck Mr. Johnson BP q2h until SBP > 100', owner: 'u4' },
      { text: 'Confirm NP visit for M. Bell by 09:00', owner: 'u11' },
      { text: 'Update care plan for R. Moreno — INR target 2-3', owner: 'u2' },
    ],
    tags: ['Critical', 'Sepsis', 'Wound'],
  },
  {
    id: 'h2', title: 'Wound care rounds', kind: 'clinical',
    when: 'Today · 6:02 AM', duration: '8m 47s', host: 'u9',
    participants: ['u9','u4','u5','u11'],
    residents: ['r1','r5','r8'],
    summary: 'Stage 3 sacral wound on r1 with increased exudate — escalated to NP. Two residents transitioned to maintenance protocol. Photos uploaded to chart.',
    actions: [
      { text: 'Photograph r1 sacral wound q24h', owner: 'u9' },
      { text: 'Order alginate dressing for r5', owner: 'u11' },
    ],
    tags: ['Wound', 'Skin'],
  },
  {
    id: 'h3', title: 'Sepsis pathway · Marjorie Bell', kind: 'incident',
    when: 'Yesterday · 11:42 PM', duration: '14m 18s', host: 'u11',
    participants: ['u11','u4','u5','u1'],
    residents: ['r2'],
    summary: 'qSOFA reached 2 at 23:15. Cultures drawn, ceftriaxone started per standing order. Family notified. Continuous monitoring overnight; if SBP < 90 transfer to acute care.',
    actions: [
      { text: 'Q1h vitals overnight on r2', owner: 'u4' },
      { text: 'Notify on-call MD if any deterioration', owner: 'u5' },
    ],
    tags: ['Critical', 'Sepsis'],
  },
  {
    id: 'h4', title: 'Evening shift handoff', kind: 'shift',
    when: 'Yesterday · 7:00 PM', duration: '9m 31s', host: 'u3',
    participants: ['u3','u4','u5','u6','u9'],
    residents: ['r1','r3','r7'],
    summary: 'Quiet evening expected. Three residents flagged for overnight checks: r1 (wound), r3 (INR), r7 (post-op day 2). All families updated on care plans.',
    actions: [
      { text: 'Q4h neuro checks on r7 until stable', owner: 'u5' },
      { text: 'Hold warfarin on r3 pending AM lab', owner: 'u4' },
    ],
    tags: ['Shift', 'Routine'],
  },
  {
    id: 'h5', title: 'Care plan review · Eleanor Park', kind: 'careplan',
    when: 'Yesterday · 2:30 PM', duration: '22m 09s', host: 'u2',
    participants: ['u2','u7','u11','u14','u18'],
    residents: ['r8'],
    summary: 'Quarterly care plan meeting. Family present. Goals updated: increase ambulation to 50ft x 2/day, swallow study scheduled for Friday. PO intake improving — dietitian to monitor weekly weights.',
    actions: [
      { text: 'Schedule swallow study Friday', owner: 'u14' },
      { text: 'Weekly weight tracking', owner: 'u18' },
      { text: 'Update family weekly via portal', owner: 'u15' },
    ],
    tags: ['Care plan', 'Quarterly'],
  },
  {
    id: 'h6', title: 'IPCP weekly · IP review', kind: 'ipcp',
    when: '2 days ago · 1:00 PM', duration: '18m 42s', host: 'u8',
    participants: ['u8','u1','u3','u11'],
    residents: ['r2'],
    summary: 'No new infection clusters. r2 on enhanced precautions pending culture results. Hand hygiene audit at 94% — target 98%. Two staff completed bloodborne pathogen refresher.',
    actions: [
      { text: 'Re-audit hand hygiene next Monday', owner: 'u8' },
      { text: 'Discontinue precautions on r2 if cultures negative', owner: 'u8' },
    ],
    tags: ['Infection', 'Quality'],
  },
];

function HuddlePage({ user, onOpenResident }) {
  const [showStart, setShowStart] = useState(false);
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const v = useViewport();
  const isPhone = v.isMobile;

  const list = HUDDLE_HISTORY.filter(h => filter === 'all' || h.kind === filter);

  if (active) {
    return <HuddleDetail huddle={active} onBack={() => setActive(null)} onOpenResident={onOpenResident} />;
  }

  const stats = {
    today: HUDDLE_HISTORY.filter(h => h.when.startsWith('Today')).length,
    week: HUDDLE_HISTORY.length,
    avg: '13m 32s',
    actions: HUDDLE_HISTORY.reduce((n, h) => n + h.actions.length, 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Huddle"
        subtitle="Every shift handoff, clinical round, and care plan meeting in one place. AI captures the agenda, transcribes the call, and posts the summary to each resident's chart automatically."
        actions={[
          <Button key="start" variant="lavender" icon="video" onClick={() => setShowStart(true)}>Start Huddle</Button>,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 140 : 170}px, 1fr))`, gap: 10 }}>
        <StatCard label="Huddles today" value={stats.today} icon="calendar" />
        <StatCard label="This week" value={stats.week} icon="message" />
        <StatCard label="Avg duration" value={stats.avg} icon="trendingDown" />
        <StatCard label="Action items captured" value={stats.actions} icon="check" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Recent huddles</h2>
          <div style={{ minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
            <SegmentedControl
              value={filter} onChange={setFilter}
              options={[
                { id: 'all', label: `All (${HUDDLE_HISTORY.length})` },
                { id: 'shift', label: 'Shift' },
                { id: 'clinical', label: 'Clinical' },
                { id: 'incident', label: 'Incident' },
                { id: 'careplan', label: 'Care plan' },
                { id: 'ipcp', label: 'IPCP' },
              ]}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(h => <HuddleRow key={h.id} h={h} onClick={() => setActive(h)} />)}
          {list.length === 0 && (
            <Card style={{ padding: 32, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>No huddles in this category.</Card>
          )}
        </div>
      </div>

      {showStart && <HuddleModal user={user} onClose={() => setShowStart(false)} onOpenResident={onOpenResident} />}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={icon} size={16} color="#52525B" />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1C192E', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6A7282' }}>{label}</div>
    </Card>
  );
}

const KIND_META = {
  shift:    { label: 'Shift',     color: '#0081CF' },
  clinical: { label: 'Clinical',  color: '#00B295' },
  incident: { label: 'Incident',  color: '#FF6E6C' },
  careplan: { label: 'Care plan', color: '#845EC2' },
  ipcp:     { label: 'IPCP',      color: '#B58420' },
};

function HuddleRow({ h, onClick }) {
  const meta = KIND_META[h.kind] || { label: h.kind, color: '#6A7282' };
  const participants = h.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const visible = participants.slice(0, 4);
  const extra = participants.length - visible.length;
  const v = useViewport();
  const isPhone = v.isMobile;
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 4, background: meta.color }} />
        <div style={{ flex: 1, padding: isPhone ? '14px' : '14px 18px', display: 'flex', alignItems: 'center', gap: isPhone ? 12 : 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: isPhone ? '100%' : 220, flex: '1 1 240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: '#99A1AF' }}>·</span>
              <span style={{ fontSize: 11, color: '#6A7282' }}>{h.when}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1C192E' }}>{h.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {visible.map(u => <Avatar key={u.id} initials={u.initials} seed={u.id} size={26} />)}
            {extra > 0 && (
              <div style={{ width: 26, height: 26, borderRadius: 9999, background: '#F4F4F5', color: '#52525B', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{extra}</div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
            <Icon name="trendingDown" size={12} color="#6A7282" />
            {h.duration}
          </div>
          <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
            <Icon name="sparkles" size={12} color="#845EC2" />
            {h.actions.length} action{h.actions.length === 1 ? '' : 's'}
          </div>
          {!isPhone && <Icon name="chevronRight" size={18} color="#99A1AF" />}
        </div>
      </div>
    </Card>
  );
}

function HuddleDetail({ huddle: h, onBack, onOpenResident }) {
  const meta = KIND_META[h.kind] || { label: h.kind, color: '#6A7282' };
  const participants = h.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
  const host = TEST_USERS.find(u => u.id === h.host);
  const residents = h.residents.map(id => RESIDENTS.find(r => r.id === id)).filter(Boolean);

  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 18 : 24 }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 0, color: '#845EC2', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, alignSelf: 'flex-start',
      }}>
        <Icon name="chevronLeft" size={16} color="#845EC2" /> Back to Huddle
      </button>

      <Card style={{ padding: isPhone ? 18 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', background: meta.color + '18', borderRadius: 4 }}>{meta.label}</span>
          <span style={{ fontSize: 12, color: '#6A7282' }}>{h.when} · {h.duration}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: isPhone ? 22 : 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#1C192E' }}>{h.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar initials={host.initials} seed={host.id} size={26} />
            <span style={{ fontSize: 12, color: '#6A7282' }}>Hosted by <b style={{ color: '#1C192E' }}>{host.name}</b></span>
          </div>
          <span style={{ fontSize: 12, color: '#99A1AF' }}>·</span>
          <span style={{ fontSize: 12, color: '#6A7282' }}>{participants.length} participants</span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} class="ois-grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon name="sparkles" size={14} color="#845EC2" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#67568C', letterSpacing: '0.04em' }}>AI SUMMARY</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: '21px', color: '#1C192E' }}>{h.summary}</div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>ACTION ITEMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {h.actions.map((a, i) => {
                const owner = TEST_USERS.find(u => u.id === a.owner);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #EEEEEE' }}>
                    <Icon name="check" size={14} color="#29BB89" />
                    <div style={{ flex: 1, fontSize: 13, color: '#1C192E' }}>{a.text}</div>
                    {owner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar initials={owner.initials} seed={owner.id} size={22} />
                        <span style={{ fontSize: 12, color: '#6A7282' }}>{owner.name.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>RESIDENTS DISCUSSED</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {residents.map(r => (
                <button key={r.id} onClick={() => onOpenResident(r.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
                  background: '#fff', border: '1px solid #EEEEEE', cursor: 'pointer', textAlign: 'left',
                }}>
                  <Avatar initials={r.initials} seed={r.id} size={32} isResident />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C192E' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>Rm {r.room} · {r.unit}</div>
                  </div>
                  <RiskBadge level={r.risk} score={r.score} />
                  <Icon name="chevronRight" size={16} color="#99A1AF" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>PARTICIPANTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {participants.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                  <Avatar initials={u.initials} seed={u.id} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282' }}>{u.short}</div>
                  </div>
                  {u.id === h.host && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#845EC2', letterSpacing: '0.04em', padding: '2px 6px', background: '#F5F2FD', borderRadius: 4 }}>HOST</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525B', letterSpacing: '0.04em', marginBottom: 12 }}>RECORDING & TRANSCRIPT</div>
            <Button variant="secondary" icon="video" style={{ width: '100%', marginBottom: 8 }} onClick={() => emitToast('Playing recording…', 'info')}>Play recording</Button>
            <Button variant="ghost" icon="fileText" style={{ width: '100%' }} onClick={() => emitToast('Transcript downloading…', 'info')}>Download transcript</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HuddlePage });


// ---- app/messages-fab.jsx ----
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
                  onInput={e => setQ(e.target.value)}
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


// ---- app/app.jsx ----
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
        <main class="ois-page" style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 1024 }}>
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



Icon = defineReactComponent(Icon);
Brand = defineReactComponent(Brand);
LogoMark = defineReactComponent(LogoMark);
Avatar = defineReactComponent(Avatar);
Chip = defineReactComponent(Chip);
Button = defineReactComponent(Button);
IconButton = defineReactComponent(IconButton);
Card = defineReactComponent(Card);
Input = defineReactComponent(Input);
RiskBadge = defineReactComponent(RiskBadge);
Checkbox = defineReactComponent(Checkbox);
MoreActionMenu = defineReactComponent(MoreActionMenu);
ToastHost = defineReactComponent(ToastHost);
AppHeader = defineReactComponent(AppHeader);
SideNav = defineReactComponent(SideNav);
MobileDrawer = defineReactComponent(MobileDrawer);
MobileTabBar = defineReactComponent(MobileTabBar);
NavItem = defineReactComponent(NavItem);
PageHeader = defineReactComponent(PageHeader);
LoginScreen = defineReactComponent(LoginScreen);
Field = defineReactComponent(Field);
DemoUserRow = defineReactComponent(DemoUserRow);
HomePage = defineReactComponent(HomePage);
HeroStat = defineReactComponent(HeroStat);
BriefBullet = defineReactComponent(BriefBullet);
SectionHeader = defineReactComponent(SectionHeader);
PriorityRow = defineReactComponent(PriorityRow);
RiskCategoryCard = defineReactComponent(RiskCategoryCard);
HuddleModal = defineReactComponent(HuddleModal);
AskAIPanel = defineReactComponent(AskAIPanel);
ResidentsList = defineReactComponent(ResidentsList);
SegmentedControl = defineReactComponent(SegmentedControl);
ViewBtn = defineReactComponent(ViewBtn);
ResidentRow = defineReactComponent(ResidentRow);
ResidentGridCard = defineReactComponent(ResidentGridCard);
ResidentProfile = defineReactComponent(ResidentProfile);
Detail = defineReactComponent(Detail);
TabBtn = defineReactComponent(TabBtn);
RiskScoreCard = defineReactComponent(RiskScoreCard);
RiskTrendChart = defineReactComponent(RiskTrendChart);
ChangesTab = defineReactComponent(ChangesTab);
ChangeCard = defineReactComponent(ChangeCard);
ChangeActionMenu = defineReactComponent(ChangeActionMenu);
ChangeDetailPage = defineReactComponent(ChangeDetailPage);
ChangeDetailModal = defineReactComponent(ChangeDetailModal);
NotifyProviderModal = defineReactComponent(NotifyProviderModal);
DiscussTeamModal = defineReactComponent(DiscussTeamModal);
CareTeamTab = defineReactComponent(CareTeamTab);
TeamMemberRow = defineReactComponent(TeamMemberRow);
NotesTab = defineReactComponent(NotesTab);
CarePlanTab = defineReactComponent(CarePlanTab);
CarePlanThread = defineReactComponent(CarePlanThread);
ModalShell = defineReactComponent(ModalShell);
ScheduleModal = defineReactComponent(ScheduleModal);
EscalateModal = defineReactComponent(EscalateModal);
SchedulePage = defineReactComponent(SchedulePage);
Legend = defineReactComponent(Legend);
ChangesPage = defineReactComponent(ChangesPage);
ChangeFeedCard = defineReactComponent(ChangeFeedCard);
WatchlistPage = defineReactComponent(WatchlistPage);
WatchlistCard = defineReactComponent(WatchlistCard);
WatchlistDetail = defineReactComponent(WatchlistDetail);
ChatDock = defineReactComponent(ChatDock);
ChatWindow = defineReactComponent(ChatWindow);
HuddlePage = defineReactComponent(HuddlePage);
StatCard = defineReactComponent(StatCard);
HuddleRow = defineReactComponent(HuddleRow);
HuddleDetail = defineReactComponent(HuddleDetail);
MessagesFab = defineReactComponent(MessagesFab);
App = defineReactComponent(App);
ComingSoon = defineReactComponent(ComingSoon);

Object.assign(window, {
  Icon,
  Brand,
  LogoMark,
  Avatar,
  Chip,
  Button,
  IconButton,
  Card,
  Input,
  RiskBadge,
  Checkbox,
  MoreActionMenu,
  ToastHost,
  AppHeader,
  SideNav,
  MobileDrawer,
  MobileTabBar,
  NavItem,
  PageHeader,
  LoginScreen,
  Field,
  DemoUserRow,
  HomePage,
  HeroStat,
  BriefBullet,
  SectionHeader,
  PriorityRow,
  RiskCategoryCard,
  HuddleModal,
  AskAIPanel,
  ResidentsList,
  SegmentedControl,
  ViewBtn,
  ResidentRow,
  ResidentGridCard,
  ResidentProfile,
  Detail,
  TabBtn,
  RiskScoreCard,
  RiskTrendChart,
  ChangesTab,
  ChangeCard,
  ChangeActionMenu,
  ChangeDetailPage,
  ChangeDetailModal,
  NotifyProviderModal,
  DiscussTeamModal,
  CareTeamTab,
  TeamMemberRow,
  NotesTab,
  CarePlanTab,
  CarePlanThread,
  ModalShell,
  ScheduleModal,
  EscalateModal,
  SchedulePage,
  Legend,
  ChangesPage,
  ChangeFeedCard,
  WatchlistPage,
  WatchlistCard,
  WatchlistDetail,
  ChatDock,
  ChatWindow,
  HuddlePage,
  StatCard,
  HuddleRow,
  HuddleDetail,
  MessagesFab,
  App,
  ComingSoon,
});

createApp(App).mount('#root');
