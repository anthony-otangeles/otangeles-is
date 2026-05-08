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
  high:     { bg: '#FFF7ED', fg: '#C2410C', dot: '#F97316', label: 'High' },
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
      background: '#E5E7EB', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
    }}>
      <Icon name="user" size={size * 0.55} color="#6A7282" />
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
    assigned: { bg: '#F4F4F5', fg: '#52525B' },
    inProgress: { bg: '#E6F2FB', fg: '#0F6FA6' },
    completed: { bg: '#E7F5EF', fg: '#00795E' },
    online: { bg: '#E7F5EF', fg: '#00795E' },
    domain: { bg: '#F5F2FD', fg: '#67568C' },
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
    dangerOutline: { background: hover ? '#FDECEC' : '#fff', color: '#B91C1C', border: '1px solid #FCA5A5' },
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
  { id: 'condition',  label: 'Change of Condition',      icon: 'activity',       tone: 'critical', count: 8 },
  { id: 'rehosp',     label: 'Transfer / Rehosp Risk',  icon: 'arrowRight',     tone: 'critical', count: 7 },
  { id: 'sepsis',     label: 'Infection / Sepsis',       icon: 'alertTriangle',  tone: 'critical', count: 4 },
  { id: 'fall',       label: 'Fall Risk',                icon: 'shield',         tone: 'high',     count: 11 },
  { id: 'med',        label: 'Medication Risk',          icon: 'pill',           tone: 'high',     count: 9 },
  { id: 'nutrition',  label: 'Nutrition / Hydration',    icon: 'droplet',        tone: 'watch',    count: 8 },
  { id: 'rehab',      label: 'Functional / Rehab',       icon: 'trendingDown',   tone: 'watch',    count: 6 },
  { id: 'skin',       label: 'Skin / Wound',             icon: 'heart',          tone: 'watch',    count: 5 },
  { id: 'documentation', label: 'Documentation / QM',    icon: 'fileText',       tone: 'stable',   count: 5 },
  { id: 'staffing',   label: 'Staffing / Communication', icon: 'users',          tone: 'watch',    count: 4 },
];

const RISK_DOMAINS = [
  { id: 'condition', label: 'Change of Condition', short: 'Condition', action: 'Clinical Review', owner: 'Unit Manager' },
  { id: 'rehosp', label: 'Transfer / Rehospitalization', short: 'Transfer', action: 'Provider Notification', owner: 'Charge Nurse' },
  { id: 'sepsis', label: 'Infection / Sepsis', short: 'Infection', action: 'Assess Infection Risk', owner: 'Infection Preventionist' },
  { id: 'fall', label: 'Fall Risk', short: 'Falls', action: 'Review Fall Precautions', owner: 'Unit Manager' },
  { id: 'skin', label: 'Wound / Pressure Injury', short: 'Wound', action: 'Escalate Wound Concern', owner: 'Wound Care Nurse' },
  { id: 'med', label: 'Medication Risk', short: 'Meds', action: 'Review Medications', owner: 'Consultant Pharmacist' },
  { id: 'nutrition', label: 'Nutrition / Hydration', short: 'Nutrition', action: 'Initiate Nutrition Plan', owner: 'Dietitian' },
  { id: 'rehab', label: 'Functional Decline / Rehab', short: 'Functional', action: 'Add to Morning Huddle', owner: 'Director of Rehabilitation' },
  { id: 'documentation', label: 'Documentation / QM', short: 'Docs', action: 'Review Documentation Gap', owner: 'MDS Coordinator' },
  { id: 'staffing', label: 'Staffing / Communication', short: 'Staffing', action: 'Assign to Unit Manager', owner: 'ADON' },
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
      { id: 'i1', kind: 'vitals', severity: 'critical', title: 'BP trend: 88/52 → 84/49 over 4h', detail: 'Systolic dropped 14 pts since 02:00. HR 112. Concern for early sepsis vs. volume depletion.', source: 'Vitals stream', time: '2h ago' },
      { id: 'i2', kind: 'wound', severity: 'high',     title: 'Sacral wound — exudate increased', detail: 'CNA night shift documented saturated dressing × 2. Photo on file. Last MD review 3d ago.', source: 'CNA note · A. Patel', time: '5h ago' },
      { id: 'i3', kind: 'med',   severity: 'watch',    title: 'Furosemide held × 2 doses', detail: 'BP parameters per order. Provider not yet notified of held doses.', source: 'eMAR', time: '6h ago' },
    ]},
  { id: 'r2', name: 'Marjorie Bell', age: 84, sex: 'F', mrn: '0034-781', room: '218A', unit: 'West · LTC', code: 'DNR', risk: 'critical', score: 81, trend: 'up', dx: 'UTI, dementia, recurrent falls', admitted: '2026-03-04', initials: 'MB', avatar: '#FF6E6C',
    drivers: ['sepsis', 'fall'],
    issues: [
      { id: 'i1', kind: 'vitals', severity: 'critical', title: 'Temp spike 38.9°C, qSOFA = 2', detail: 'Tachypnea 24, AMS noted. Urine cloudy. Sepsis screening positive.', source: 'Sepsis screen', time: '40m ago' },
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
  { id: 'r6', name: 'Gladys Howe',    age: 88, sex: 'F', mrn: '0034-829', room: '117',  unit: 'Memory Care',     code: 'DNR',       risk: 'watch',score: 49, trend: 'flat', dx: 'Advanced dementia, dysphagia',      admitted: '2025-11-20', initials: 'GH', avatar: '#67568C', drivers: ['nutrition','staffing'] },
  { id: 'r7', name: 'Harold Chen',    age: 73, sex: 'M', mrn: '0034-799', room: '104C', unit: 'East · Skilled',  code: 'Full Code', risk: 'watch',score: 44, trend: 'down', dx: 'Total knee replacement day 3',       admitted: '2026-05-04', initials: 'HC', avatar: '#00C9A7', drivers: ['rehab','med'] },
  { id: 'r8', name: 'Eleanor Park',   age: 81, sex: 'F', mrn: '0034-744', room: '210',  unit: 'West · LTC',      code: 'Full Code', risk: 'watch',score: 41, trend: 'flat', dx: 'Parkinson\u2019s, recurrent UTI',    admitted: '2026-01-08', initials: 'EP', avatar: '#FF6E6C', drivers: ['fall','med'] },
  { id: 'r9', name: 'Jorge Salazar',  age: 65, sex: 'M', mrn: '0034-855', room: '301B', unit: 'East · Skilled',  code: 'Full Code', risk: 'stable',score: 22, trend: 'down', dx: 'Hip fracture s/p ORIF, day 9',     admitted: '2026-04-26', initials: 'JS', avatar: '#0081CF', drivers: ['rehab'] },
  { id: 'r10',name: 'Helen Goodwin',  age: 79, sex: 'F', mrn: '0034-866', room: '215A', unit: 'West · LTC',      code: 'DNR',       risk: 'stable',score: 18, trend: 'flat', dx: 'CKD III, HTN',                       admitted: '2025-12-01', initials: 'HG', avatar: '#29BB89', drivers: [] },
  { id: 'r11',name: 'Wendell Ortiz',  age: 70, sex: 'M', mrn: '0034-877', room: '109',  unit: 'Memory Care',     code: 'DNR',       risk: 'stable',score: 15, trend: 'flat', dx: 'Alzheimer\u2019s, behavioral plan',  admitted: '2025-10-14', initials: 'WO', avatar: '#845EC2', drivers: ['documentation','staffing'] },
  { id: 'r12',name: 'Doris Pham',     age: 86, sex: 'F', mrn: '0034-888', room: '222',  unit: 'West · LTC',      code: 'DNR',       risk: 'stable',score: 12, trend: 'down', dx: 'Hospice eligible — comfort care',    admitted: '2025-09-22', initials: 'DP', avatar: '#FF9671', drivers: [] },
];

const OPERATIONAL_ACTIONS_SEED = [
  { id: 'a1', residentId: 'r2', type: 'Assess Infection Risk', domain: 'sepsis', owner: 'Robert Chen', ownerRole: 'Infection Preventionist', priority: 'High', due: 'Overdue 40m', status: 'Overdue', reason: 'Sepsis screen positive, AMS, qSOFA 2, no provider response documented.', notes: 'Confirm repeat vitals and route provider update.' },
  { id: 'a2', residentId: 'r1', type: 'Provider Notification', domain: 'rehosp', owner: 'Jenny Ortiz', ownerRole: 'Charge Nurse', priority: 'High', due: 'This shift', status: 'No Action', reason: 'BP trend down with held diuretic and wound exudate increase.', notes: 'Include code status and held eMAR doses.' },
  { id: 'a3', residentId: 'r1', type: 'Escalate Wound Concern', domain: 'skin', owner: 'Aisha Patel', ownerRole: 'Wound Care Nurse', priority: 'High', due: 'Today 12:00', status: 'In Progress', reason: 'Sacral wound dressing saturated twice overnight.', notes: 'Photo exists; wound consult may be needed.' },
  { id: 'a4', residentId: 'r3', type: 'Review Medications', domain: 'med', owner: 'Aanya Verma', ownerRole: 'Consultant Pharmacist', priority: 'High', due: 'Today 13:00', status: 'Assigned', reason: 'INR 3.8 with warfarin held pending confirmation.', notes: 'Need provider/pharmacy review before next dose.' },
  { id: 'a5', residentId: 'r4', type: 'Request Vitals Recheck', domain: 'condition', owner: 'David Kim', ownerRole: 'Unit Manager', priority: 'High', due: 'This shift', status: 'Assigned', reason: 'SpO2 88% on 2L with wheeze and increased RR.', notes: 'Respiratory therapy paged; follow-up not closed.' },
  { id: 'a6', residentId: 'r5', type: 'Initiate Nutrition Plan', domain: 'nutrition', owner: 'Sofia Rossi', ownerRole: 'Dietitian', priority: 'Moderate', due: 'Today', status: 'Assigned', reason: 'PO intake below 25% for 3 meals with wound risk.', notes: 'Review supplements and fluids.' },
  { id: 'a7', residentId: 'r7', type: 'Add to Morning Huddle', domain: 'rehab', owner: 'David Park', ownerRole: 'Director of Rehabilitation', priority: 'Moderate', due: 'Next huddle', status: 'In Progress', reason: 'PT session shortened due to pain after TKR.', notes: 'Review pain timing before therapy.' },
  { id: 'a8', residentId: 'r8', type: 'Review Fall Precautions', domain: 'fall', owner: 'David Kim', ownerRole: 'Unit Manager', priority: 'Moderate', due: 'Today', status: 'Completed', reason: 'Parkinsons with recurrent UTI history and medication risk.', notes: 'Precautions reviewed; continue monitoring.' },
  { id: 'a9', residentId: 'r11', type: 'Review Documentation Gap', domain: 'documentation', owner: 'Beatrice Liu', ownerRole: 'MDS Coordinator', priority: 'Moderate', due: 'Tomorrow AM', status: 'Assigned', reason: 'Behavioral plan documentation needs reconciliation before review window.', notes: 'MDS and nursing notes need alignment.' },
  { id: 'a10', residentId: 'r6', type: 'Assign to Unit Manager', domain: 'staffing', owner: 'Marcus Webb', ownerRole: 'ADON', priority: 'Moderate', due: 'Today', status: 'Escalated', reason: 'Dysphagia monitoring concern has no documented owner on current shift.', notes: 'ADON to assign shift owner.' },
];

const SCHEDULE_EVENTS_SEED = [
  { id: 's1', residentId: 'r1', title: 'Care plan review', kind: 'care-team', dateLabel: 'Today', startLabel: '9:00 AM', endLabel: '9:30 AM', status: 'Scheduled', owner: 'Sarah Chen', location: 'Conference A + video', participants: ['u1','u3','u9','u11','u18'] },
  { id: 's2', residentId: 'r2', title: 'Sepsis follow-up huddle', kind: 'huddle', dateLabel: 'Today', startLabel: '10:15 AM', endLabel: '10:30 AM', status: 'Scheduled', owner: 'Jenny Ortiz', location: 'West nurse station', participants: ['u1','u4','u8','u11'] },
  { id: 's3', residentId: 'r5', title: 'Wound consult', kind: 'clinical', dateLabel: 'Today', startLabel: '11:00 AM', endLabel: '11:30 AM', status: 'Scheduled', owner: 'Aisha Patel', location: 'Room 221B', participants: ['u9','u11','u18'] },
  { id: 's4', residentId: 'r1', title: 'Family conference', kind: 'family', dateLabel: 'Today', startLabel: '2:00 PM', endLabel: '3:00 PM', status: 'Scheduled', owner: 'Maria Alvarez', location: 'Family room + phone', participants: ['u1','u10','u15','u16'] },
  { id: 's5', residentId: 'r3', title: 'Medication review', kind: 'clinical', dateLabel: 'Tomorrow', startLabel: '1:00 PM', endLabel: '1:30 PM', status: 'Scheduled', owner: 'Aanya Verma', location: 'Pharmacy review', participants: ['u12','u10','u11'] },
  { id: 's6', residentId: 'r7', title: 'PT pain-timing review', kind: 'rehab', dateLabel: 'Tomorrow', startLabel: '10:00 AM', endLabel: '10:20 AM', status: 'Tentative', owner: 'David Park', location: 'Therapy gym', participants: ['u13','u14','u4'] },
  { id: 's7', residentId: 'r8', title: 'Swallow study planning', kind: 'clinical', dateLabel: 'Friday', startLabel: '10:00 AM', endLabel: '10:30 AM', status: 'Scheduled', owner: 'Olivia Reed', location: 'Rehab office', participants: ['u14','u18','u11'] },
  { id: 's8', residentId: null, title: 'Daily operations huddle', kind: 'huddle', dateLabel: 'Tomorrow', startLabel: '8:00 AM', endLabel: '8:20 AM', status: 'Scheduled', owner: 'Sarah Chen', location: 'Nursing leadership', participants: ['u1','u2','u3','u4','u5','u8','u9'] },
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
    { id: 'cp1', kind: 'huddle', title: 'Morning Huddle — Apr 7', participants: ['u1','u2','u3','u4','u9','u10'], time: 'Today · 07:00', summary: 'Wound nurse raised positioning compliance. PT note from 4/5 noted refusal of repositioning q2h. Decision: wound specialist consult requested via @u10. Follow-up: Aisha to retake photo in 24h.', actions: ['Wound consult requested','Repositioning q2h re-educated','Photo recheck 24h'] },
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
  { residentId: 'r2', kind: 'sepsis',   severity: 'critical', title: 'Sepsis screen positive', detail: 'Temp 38.9°C, AMS, qSOFA 2. Flagged 40m ago. No provider response yet.',              time: '40m ago', source: 'Sepsis screen' },
  { residentId: 'r1', kind: 'vitals',   severity: 'critical', title: 'BP trending down', detail: 'SBP −14 pts in 4h, HR 112. Consider sepsis vs volume depletion.',                          time: '2h ago',  source: 'Vitals stream' },
  { residentId: 'r3', kind: 'lab',      severity: 'high',     title: 'INR 3.8 — supratherapeutic', detail: 'Warfarin held pending provider confirmation. Last INR 2.6 (4d ago).',             time: '1h ago',  source: 'Lab · Quest' },
  { residentId: 'r4', kind: 'vitals',   severity: 'high',     title: 'SpO₂ 88% on 2L', detail: 'Resp rate 24, audible wheeze. Respiratory therapy paged.',                                    time: '3h ago',  source: 'Vitals stream' },
  { residentId: 'r1', kind: 'wound',    severity: 'high',     title: 'Sacral wound — exudate ↑', detail: 'Saturated dressing × 2 overnight. Photo on file.',                                  time: '5h ago',  source: 'CNA note' },
  { residentId: 'r5', kind: 'nutrition',severity: 'watch',    title: 'PO intake < 25% × 3 meals', detail: 'Refusing solids, accepting fluids. Consider supplement order.',                    time: '6h ago',  source: 'eMAR' },
  { residentId: 'r2', kind: 'fall',     severity: 'high',     title: 'Witnessed fall — bathroom', detail: 'No injury. Morse 65 → 80. Bed alarm reordered.',                                   time: '12h ago', source: 'Incident report' },
  { residentId: 'r7', kind: 'rehab',    severity: 'watch',    title: 'PT session shortened', detail: 'Pain 7/10 at incision site. PRN oxycodone given, plan to retry in PM.',                 time: '14h ago', source: 'Rehab note' },
];

Object.assign(window, { TEST_USERS, FACILITY, RISK_CATEGORIES, RISK_DOMAINS, WATCHLISTS, RESIDENTS, CARE_TEAMS, NOTES_SEED, CAREPLAN_SEED, OPERATIONAL_ACTIONS_SEED, SCHEDULE_EVENTS_SEED, FACILITY_CHANGES, priorityResidents });


// ---- app/shell.jsx ----
// Shell — Header + SideNav for Otangeles Intelligent System (responsive)

const NAV_PRIMARY = [
  { id: 'home',      label: 'Home',       icon: 'home' },
  { id: 'residents', label: 'Residents',  icon: 'users' },
  { id: 'watchlist', label: 'Watchlists', icon: 'eye' },
  { id: 'actions',   label: 'Actions',    icon: 'check' },
];
const NAV_SECONDARY = [
  { id: 'changes',   label: 'Changes',        icon: 'activity' },
  { id: 'messages',  label: 'Messages',        icon: 'message' },
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

function HeaderIconButton({ icon, title, active, onClick, badge, badgeColor = '#845EC2' }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 36,
      height: 36,
      borderRadius: 9999,
      border: `1px solid ${active ? '#CDB8F0' : 'transparent'}`,
      background: active ? '#F5F2FD' : 'transparent',
      color: active ? '#67568C' : '#6A7282',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'background 150ms, border-color 150ms, color 150ms',
    }}>
      <Icon name={icon} size={18} color={active ? '#67568C' : '#6A7282'} />
      {active && <span style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 9999, background: '#845EC2' }} />}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, padding: '0 4px',
          borderRadius: 9999, background: badgeColor, color: '#fff', fontSize: 9, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', pointerEvents: 'none',
        }}>{badge}</span>
      )}
    </button>
  );
}

function AppHeader({ user, onLogout, onNav, onOpenResident, counts, mobile, active }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const unread = NOTIFICATIONS_SEED.filter(n => n.unread).length;
  const messageUnread = counts && counts.messages ? counts.messages : 0;
  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    const pool = RESIDENTS.filter(r => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q)
        || r.mrn.toLowerCase().includes(q)
        || r.room.toLowerCase().includes(q)
        || r.unit.toLowerCase().includes(q);
    });
    return pool.slice(0, 6);
  }, [searchQ]);

  function openSearch() {
    setSearchOpen(true);
    setNotifOpen(false);
  }

  function openResidentFromSearch(id) {
    setSearchOpen(false);
    setSearchQ('');
    onOpenResident(id);
  }

  return (
    <header style={{
      height: 60, background: '#fff', borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', padding: mobile ? '0 8px' : '0 24px', gap: mobile ? 6 : 12,
      position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
        <Brand height={mobile ? 28 : 34} />
      </div>
      <div style={{ flex: 1 }} />

      <HeaderIconButton icon="search" title="Search" active={searchOpen} onClick={openSearch} />
      {searchOpen && (
        <>
          <div onClick={() => setSearchOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 45 }} />
          <div style={{
            position: 'fixed', top: 68, left: mobile ? 8 : 16, right: mobile ? 8 : 16, maxWidth: 680, margin: '0 auto',
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 60, overflow: 'hidden', maxHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: 12, borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="search" size={16} color="#99A1AF" />
              <input autoFocus value={searchQ} onInput={e => setSearchQ(e.target.value)}
                placeholder="Search residents, MRN, room, unit..."
                style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', font: '15px Inter', color: '#1C192E' }} />
              <IconButton icon="x" size={28} onClick={() => { setSearchQ(''); setSearchOpen(false); }} />
            </div>
            <div style={{ overflowY: 'auto', padding: 8 }}>
              {searchResults.map(r => (
                <button key={r.id} onClick={() => openResidentFromSearch(r.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 8px', border: 0, background: '#fff', borderRadius: 8,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <Avatar initials={r.initials} seed={r.id} size={34} isResident />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>Rm {r.room} · {r.unit} · MRN {r.mrn}</div>
                  </div>
                  <RiskBadge level={r.risk} score={r.score} compact />
                </button>
              ))}
              {searchResults.length === 0 && (
                <div style={{ padding: 22, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>No residents found.</div>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ position: 'relative' }}>
        <HeaderIconButton icon="bell" title="Notifications" active={notifOpen} badge={unread} badgeColor="#E53E3E" onClick={() => { setSearchOpen(false); setNotifOpen(o => !o); }} />
        {notifOpen && (
          <>
            <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'fixed', top: 68, left: mobile ? 8 : 'auto', right: mobile ? 8 : 16,
              width: mobile ? 'auto' : 360, maxWidth: mobile ? 'calc(100vw - 16px)' : 360,
              maxHeight: 'calc(100vh - 84px)', overflowY: 'auto',
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

      <HeaderIconButton icon="calendar" title="Schedule" active={active === 'schedule'} onClick={() => { setNotifOpen(false); setSearchOpen(false); onNav('schedule'); }} />

      <div style={{ position: 'relative' }}>
        <HeaderIconButton icon="message" title="Messages" active={active === 'messages'} badge={messageUnread} onClick={() => { setNotifOpen(false); setSearchOpen(false); onNav('messages'); }} />
      </div>

      <button title="Profile" onClick={() => { setNotifOpen(false); setSearchOpen(false); onNav('profile'); }} style={{
        display: 'flex', alignItems: 'center', gap: 10, border: 0, background: 'transparent',
        cursor: 'pointer', padding: mobile ? 0 : '4px 6px', borderRadius: 8, minWidth: 0,
      }}>
        <Avatar initials={user.initials} seed={user.id} size={34} />
        {!mobile && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1C192E' }}>{user.name}</span>
            <span style={{ fontSize: 11, color: '#6A7282' }}>{user.role}</span>
          </div>
        )}
      </button>
      {!mobile && <IconButton icon="logout" title="Sign out" onClick={onLogout} />}
    </header>
  );
}

function SideNav({ active, onNav, counts }) {
  const items = NAV_PRIMARY.map(it => it.id === 'actions' ? { ...it, badge: counts.actions } : it);
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
          <Icon name="activity" size={14} color="#00B295" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#00795E' }}>Facility Status</span>
        </div>
        <div style={{ fontSize: 11, lineHeight: '16px', color: '#00795E' }}>
          117 residents · 14 active threads · 3 awaiting response
        </div>
      </div>
    </aside>
  );
}

function MobileDrawer({ open, active, onNav, counts, user, onLogout, onClose }) {
  if (!open) return null;
  const items = NAV_SECONDARY.map(it => it.id === 'messages' ? { ...it, badge: counts.messages } : it);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(28,25,46,0.5)', zIndex: 80,
    }}>
      <aside onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(86vw, 320px)',
        background: '#fff', display: 'flex', flexDirection: 'column', padding: 16, gap: 16,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflowY: 'auto',
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
        <button onClick={() => { onNav('profile'); onClose(); }} style={{
          padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
          color: '#1C192E', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="user" size={16} color="#845EC2" /> Open profile & security
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em' }}>MORE</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(it => <NavItem key={it.id} item={it} active={active === it.id} onClick={() => { onNav(it.id); onClose(); }} />)}
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

function MobileTabBar({ active, onNav, onMenu, counts }) {
  const items = [
    { id: 'home',      label: 'Home',       icon: 'home' },
    { id: 'residents', label: 'Residents',  icon: 'users' },
    { id: 'watchlist', label: 'Watchlists', icon: 'eye' },
    { id: 'actions',   label: 'Actions',    icon: 'check', badge: counts.actions },
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
          <button key={it.id} onClick={() => onNav(it.id)} title={it.label} style={{
            flex: 1, background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 2px', position: 'relative',
            color, fontFamily: 'Inter', fontSize: 10, fontWeight: 700,
          }}>
            <div style={{
              position: 'relative',
              width: 'auto',
              height: 'auto',
              borderRadius: 9999,
              background: 'transparent',
              boxShadow: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 0,
            }}>
              <Icon name={it.icon} size={21} color={color} strokeWidth={isActive ? 2.4 : 2} />
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap', minHeight: 16 }}>
              {it.label}
              {it.badge > 0 && (
                <span style={{
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 9999, background: '#E53E3E', color: '#fff', fontSize: 9, fontWeight: 800,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{it.badge}</span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MenuPage({ active, onNav, counts, user, onLogout }) {
  const items = [
    ...NAV_SECONDARY.map(it => it.id === 'messages' ? { ...it, badge: counts.messages } : it),
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Menu"
        subtitle={`${user.name} · ${user.role}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        {items.map(item => {
          const selected = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              width: '100%',
              minHeight: 58,
              border: `1px solid ${selected ? '#00C9A7' : '#E5E7EB'}`,
              background: selected ? '#E7F5EF' : '#fff',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: selected ? '#fff' : '#F4F4F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={item.icon} size={17} color={selected ? '#00795E' : '#6A7282'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#00795E' : '#1C192E' }}>{item.label}</div>
              </div>
              {item.badge > 0 && (
                <span style={{
                  minWidth: 22, height: 22, padding: '0 6px', borderRadius: 9999,
                  background: '#845EC2', color: '#fff', fontSize: 11, fontWeight: 800,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{item.badge}</span>
              )}
              <Icon name="chevronRight" size={16} color="#99A1AF" />
            </button>
          );
        })}
      </div>

      <button onClick={onLogout} style={{
        minHeight: 46,
        border: '1px solid #E5E7EB',
        background: '#fff',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        color: '#1C192E',
        fontSize: 13,
        fontWeight: 800,
      }}>
        <Icon name="logout" size={16} color="#1C192E" /> Sign out
      </button>
    </div>
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

Object.assign(window, { AppHeader, HeaderIconButton, SideNav, MobileDrawer, MobileTabBar, MenuPage, PageHeader });


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

function HomePage({ user, actions, onOpenResident, onOpenAction, onNav }) {
  const priority = priorityResidentsWithActions(actions);
  const critical = priority.filter(r => r.risk === 'critical');
  const high     = priority.filter(r => r.risk === 'high');
  const actionCounts = actionStatusCounts(actions);
  const openActions = (actions || [])
    .filter(a => a.status !== 'Completed')
    .slice()
    .sort((a, b) => {
      const rank = { Overdue: 0, Escalated: 1, 'No Action': 2, Assigned: 3, 'In Progress': 4 };
      return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    })
    .slice(0, 4);
  const domainCounts = RISK_DOMAINS.map(domain => ({
    domain,
    count: RESIDENTS.filter(r =>
      (r.drivers || []).includes(domain.id) ||
      residentEvidenceItems(r).some(item => item.domain === domain.id)
    ).length,
  })).filter(item => item.count > 0);
  const occPct = Math.round(FACILITY.occupied / FACILITY.beds * 100);
  const [showHuddle, setShowHuddle] = useState(false);
  const v = useViewport();
  const isPhone = v.isMobile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 34 : 42 }}>
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
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#99A1AF' }}>{greeting()} · DON COMMAND CENTER</div>
              <div style={{ fontSize: isPhone ? 25 : 30, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6, color: '#1C192E' }}>Operational Intelligence</div>
              <div style={{ fontSize: 13, color: '#6A7282', marginTop: 4, lineHeight: '18px' }}>
                {FACILITY.name} · persistent continuity across resident risk, evidence, action ownership, and closure.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, width: isPhone ? '100%' : 'auto' }}>
              <Button variant="secondary" icon="message" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => setShowHuddle(true)}>Start Huddle</Button>
              <Button variant="primary" icon="check" style={{ flex: isPhone ? 1 : 'none' }} onClick={() => onNav('actions')}>Open Actions</Button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isPhone ? 14 : 20, borderTop: '1px solid #EEEEEE', paddingTop: 18 }}>
            <HeroStat label="Beds occupied" value={`${FACILITY.occupied} / ${FACILITY.beds}`} sub={`${occPct}% capacity`} />
            <HeroStat label="High concern" value={critical.length + high.length} sub={`${critical.length} critical · ${high.length} high`} />
            <HeroStat label="Open actions" value={actionCounts.open} sub={`${actionCounts.overdue} overdue · ${actionCounts.escalated} escalated`} />
            <HeroStat label="Pending provider" value={FACILITY.pendingProvider} sub="2 over 4h" />
          </div>
        </div>

        <OperationalCognitionPanel actions={actions} compact={isPhone} />
      </div>

      {/* Priority list */}
      <div>
        <SectionHeader
          title="Top Priority Residents"
          subtitle="Ranked by overall risk, deterioration trend, and whether follow-through is owned."
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip tone="critical" dot>{critical.length} Critical</Chip>
              <Chip tone="high" dot>{high.length} High</Chip>
            </div>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {priority.slice(0, 5).map(r => (
            <OperationalResidentCard key={r.id} r={r} actions={actions} onClick={() => onOpenResident(r.id)} />
          ))}
          {priority.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>
              No resident risk signals are active right now.
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

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) minmax(280px, 0.75fr)', gap: isPhone ? 18 : 24 }}>
        <div>
          <SectionHeader title="Unit Risk Heatmap" subtitle="Tap a unit to narrow the resident directory." />
          <UnitRiskHeatmap actions={actions} onSelectUnit={unit => { emitToast(`Opening residents for ${unit}.`, 'info'); onNav('residents'); }} />
        </div>
        <div>
          <SectionHeader title="Open Actions" subtitle="Execution and accountability queue." />
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              <ActionMiniStat label="Overdue" value={actionCounts.overdue} tone="critical" />
              <ActionMiniStat label="Unassigned" value={actionCounts.unassigned} tone="watch" />
              <ActionMiniStat label="Escalated" value={actionCounts.escalated} tone="high" />
              <ActionMiniStat label="Due today" value={actionCounts.dueToday} tone="info" />
            </div>
            {openActions.map(action => {
              const r = RESIDENTS.find(x => x.id === action.residentId);
              return (
                <button key={action.id} onClick={() => onOpenAction(action.id)} style={{
                  border: '1px solid #E5E7EB', borderRadius: 9, padding: 10,
                  background: '#fff', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <ActionStatusBadge status={action.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.type}</div>
                    <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{r ? `${r.name} · Rm ${r.room}` : 'Resident'} · {action.owner}</div>
                  </div>
                  <Icon name="chevronRight" size={14} color="#99A1AF" />
                </button>
              );
            })}
            <Button variant="secondary" icon="check" onClick={() => onNav('actions')}>View Action Queue</Button>
          </Card>
        </div>
      </div>

      <div>
        <SectionHeader title="What's New Today" subtitle="Risk domains are one unified intelligence system, not separate dashboards." />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isPhone ? 148 : 190}px, 1fr))`, gap: 10 }}>
          {domainCounts.map(item => (
            <RiskDomainSummaryCard key={item.domain.id} item={item} onClick={() => onNav('watchlist')} />
          ))}
        </div>
      </div>

      {showHuddle && <HuddleModal user={user} onClose={() => setShowHuddle(false)} onOpenResident={onOpenResident} />}
    </div>
  );
}

function ActionMiniStat({ label, value, tone }) {
  const color = tone === 'critical' ? '#B91C1C'
    : tone === 'high' ? '#C2410C'
    : tone === 'watch' ? '#92703A'
    : '#67568C';
  return (
    <div style={{ border: '1px solid #EEEEEE', borderRadius: 8, padding: 10, background: '#FAFAFC' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6A7282' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginTop: 2, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function RiskDomainSummaryCard({ item, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Icon name={RISK_CATEGORIES.find(c => c.id === item.domain.id)?.icon || 'activity'} size={18} color="#52525B" />
        <div style={{ fontSize: 24, fontWeight: 900, color: '#1C192E', lineHeight: 1 }}>{item.count}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E', lineHeight: '17px' }}>{item.domain.label}</div>
        <div style={{ fontSize: 11, color: '#6A7282', marginTop: 3 }}>residents with active signals</div>
      </div>
    </Card>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
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
          <Button variant="lavender" icon="check" onClick={() => { emitToast(`Huddle ended — summary saved to ${agenda.length} resident records.`); onClose(); }}>End & Save Summary</Button>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 8 }}>AGENDA · LIVE CAPTURE</div>
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
    <ModalShell title="Start Huddle" subtitle="Quick standup with on-shift care team. Notes and resident follow-ups stay attached to the chart." onClose={onClose} width={680}
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
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6A7282', marginBottom: 6 }}>AGENDA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {agenda.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, padding: '8px 10px', border: '1px solid #EEEEEE', borderRadius: 6, fontSize: 13, alignItems: 'center' }}>
                <Icon name="fileText" size={12} color="#845EC2" />
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

Object.assign(window, { HomePage });


// ---- app/agent-runtime.jsx ----
// Markdown-driven skill registry + browser agent tool loop

const RESIDENT_BASELINE_SKILL_ID = '72-hour-post-hospital-return-watch';
const DEFAULT_SKILL_PATHS = ['skills/post_hospital_watch/SKILL.md'];

const EMBEDDED_POST_HOSPITAL_WATCH_SKILL = [
  '---',
  'id: 72-hour-post-hospital-return-watch',
  'name: 72-Hour Post-Hospital Return Watch',
  'version: 1.1.0',
  'tools:',
  '  - fetch_resident_baseline',
  '  - get_recent_pcc_vitals',
  '  - read_latest_nursing_notes',
  '---',
  '',
  '# 72-Hour Post-Hospital Return Watch',
  '',
  '## System Prompt',
  'You are an SNF clinical intelligence agent working as decision support for licensed staff. Compare the resident current stream against that resident dynamic baseline after an acute-care return. Do not score by static thresholds alone. Return cautious clinical decision support. Do not diagnose.',
  '',
  '## Required Data Triggers',
  '- post_hospital_return: Resident admitted or returned from acute hospitalization within the last 72 hours.',
  '- vitals_deviation: Blood pressure, oxygen saturation, temperature, pulse, or respiratory rate changes from baseline.',
  '- nursing_note_signal: Nursing or CNA documentation mentions refusal, wound drainage, altered mentation, pain, intake decline, or provider notification.',
  '- medication_hold_or_change: eMAR shows held doses, high-risk medication changes, anticoagulant change, insulin variance, or diuretic hold.',
  '',
  '## Expected Output Schema',
  '```json',
  '{"type":"object","required":["normal","deviations","implications","recommendedActions","confidence"],"properties":{"normal":{"type":"array","items":{"type":"string"}},"deviations":{"type":"array","items":{"type":"string"}},"implications":{"type":"array","items":{"type":"string"}},"recommendedActions":{"type":"array","items":{"type":"string"}},"confidence":{"type":"string","enum":["low","medium","high"]}}}',
  '```',
].join('\n');

function skillSlugFromPath(filePath) {
  const parts = String(filePath || 'skill').split('/').filter(Boolean);
  const parent = parts.length > 1 ? parts[parts.length - 2] : parts[0] || 'skill';
  return parent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'skill';
}

function parseSkillFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, body: markdown };

  const data = {};
  let currentKey = null;
  match[1].split('\n').forEach(rawLine => {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) return;

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      data[currentKey] = value === '' ? [] : value.replace(/^["']|["']$/g, '');
      return;
    }

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(listMatch[1].trim().replace(/^["']|["']$/g, ''));
    }
  });

  return { data, body: markdown.slice(match[0].length) };
}

function parseSkillSections(markdown) {
  const sections = {};
  let current = null;

  markdown.split('\n').forEach(line => {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim().toLowerCase();
      sections[current] = [];
      return;
    }
    if (current) sections[current].push(line);
  });

  return Object.fromEntries(
    Object.entries(sections).map(([key, lines]) => [key, lines.join('\n').trim()])
  );
}

function parseSkillTriggers(section = '') {
  return section
    .split('\n')
    .map(line => line.trim().match(/^-\s+([^:]+):\s*(.+)$/))
    .filter(Boolean)
    .map(match => ({ id: match[1].trim(), description: match[2].trim() }));
}

function parseSkillOutputSchema(section = '') {
  const fenced = section.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1] : section;
  try {
    return JSON.parse(raw);
  } catch {
    return { type: 'object', properties: {}, raw: raw.trim() };
  }
}

function parseSkillMarkdown(markdown, filePath = 'SKILL.md') {
  const { data: frontmatter, body } = parseSkillFrontmatter(markdown);
  const sections = parseSkillSections(body);
  const systemPrompt = sections['system prompt'] || frontmatter.system_prompt || '';
  const requiredDataTriggers = parseSkillTriggers(
    sections['required data triggers'] || sections['data triggers'] || ''
  );
  const expectedOutputSchema = parseSkillOutputSchema(
    sections['expected output schema'] || sections['output schema'] || ''
  );

  return {
    id: frontmatter.id || skillSlugFromPath(filePath),
    name: frontmatter.name || frontmatter.id || skillSlugFromPath(filePath),
    version: frontmatter.version || '0.0.0',
    tools: Array.isArray(frontmatter.tools) ? frontmatter.tools : [],
    systemPrompt: systemPrompt.replace(/\s+/g, ' ').trim(),
    requiredDataTriggers,
    expectedOutputSchema,
    filePath,
    rawMarkdown: markdown,
  };
}

class SkillRegistry {
  constructor({ skillPaths = DEFAULT_SKILL_PATHS } = {}) {
    this.skillPaths = skillPaths;
    this.skills = new Map();
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return this.list();
    const loaded = [];

    for (const filePath of this.skillPaths) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Unable to load ${filePath}`);
        loaded.push(this.register(parseSkillMarkdown(await response.text(), filePath)));
      } catch {
        loaded.push(this.register(parseSkillMarkdown(EMBEDDED_POST_HOSPITAL_WATCH_SKILL, filePath)));
      }
    }

    this.loaded = true;
    return loaded;
  }

  register(skill) {
    this.skills.set(skill.id, skill);
    return skill;
  }

  get(id) {
    return this.skills.get(id);
  }

  list() {
    return [...this.skills.values()];
  }
}

const agentSkillRegistry = new SkillRegistry();

function waitForAgentStep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function issueForResident(resident, kind) {
  return (resident.issues || []).find(issue => issue.kind === kind)
    || FACILITY_CHANGES.find(change => change.residentId === resident.id && change.kind === kind)
    || null;
}

const AgentTools = {
  fetch_resident_baseline: {
    runningLabel: 'Fetching baseline from PCC',
    completeLabel: 'Baseline loaded',
    description: 'Resident-specific profile, diagnosis, room, code status, and known risk domains.',
    async execute({ residentId }) {
      const resident = RESIDENTS.find(r => r.id === residentId);
      if (!resident) throw new Error(`Unknown resident: ${residentId}`);
      const drivers = (resident.drivers || []).map(id => RISK_CATEGORIES.find(c => c.id === id)).filter(Boolean);
      return {
        resident: {
          id: resident.id,
          name: resident.name,
          mrn: resident.mrn,
          location: `Rm ${resident.room} - ${resident.unit}`,
          codeStatus: resident.code,
          diagnoses: resident.dx,
          admitted: resident.admitted,
        },
        baseline: [
          `${resident.name.split(' ')[0]}'s baseline is anchored to ${resident.dx}.`,
          `Current code status: ${resident.code}.`,
          drivers.length ? `Recurring risk domains: ${drivers.map(d => d.label).join(', ')}.` : 'No active recurring risk domain beyond routine monitoring.',
        ],
      };
    },
  },
  get_recent_pcc_vitals: {
    runningLabel: 'Reading recent PCC vitals',
    completeLabel: 'Vitals stream loaded',
    description: 'Recent BP, pulse, temperature, oxygen, and respiratory trend signals.',
    async execute({ residentId }) {
      const resident = RESIDENTS.find(r => r.id === residentId);
      const vitalIssue = resident ? issueForResident(resident, 'vitals') || issueForResident(resident, 'sepsis') : null;
      if (!resident) throw new Error(`Unknown resident: ${residentId}`);

      if (/spo|oxygen|o2|wheeze/i.test(`${vitalIssue?.title || ''} ${vitalIssue?.detail || ''}`)) {
        return {
          source: vitalIssue.source,
          latest: vitalIssue.title,
          readings: [
            { time: '06:00', bp: '116/68', hr: 92, spo2: 93, rr: 20 },
            { time: '08:00', bp: '110/64', hr: 104, spo2: 88, rr: 24 },
          ],
        };
      }

      if (/temp|qsofa|sepsis/i.test(`${vitalIssue?.title || ''} ${vitalIssue?.detail || ''}`)) {
        return {
          source: vitalIssue.source,
          latest: vitalIssue.title,
          readings: [
            { time: '06:40', temp: '38.9 C', hr: 108, rr: 24, mentation: 'AMS noted' },
          ],
        };
      }

      if (vitalIssue) {
        return {
          source: vitalIssue.source,
          latest: vitalIssue.title,
          readings: [
            { time: '02:00', bp: '98/60', hr: 96, spo2: 94, rr: 18 },
            { time: '06:00', bp: '88/52', hr: 112, spo2: 91, rr: 20 },
            { time: '08:00', bp: '84/49', hr: 114, spo2: 90, rr: 22 },
          ],
        };
      }

      return {
        source: 'PCC vitals',
        latest: 'No acute vital deviation in the current feed',
        readings: [{ time: '08:00', bp: '118/70', hr: 78, spo2: 96, rr: 16 }],
      };
    },
  },
  read_latest_nursing_notes: {
    runningLabel: 'Reading latest nursing notes',
    completeLabel: 'Nursing notes loaded',
    description: 'Narrative note signals from nursing, CNA, wound care, and rehab.',
    async execute({ residentId }) {
      const resident = RESIDENTS.find(r => r.id === residentId);
      if (!resident) throw new Error(`Unknown resident: ${residentId}`);
      const seeded = NOTES_SEED[residentId] || [];
      const issueNotes = (resident.issues || []).slice(0, 3).map(issue => ({
        id: issue.id,
        time: issue.time,
        user: issue.source,
        body: issue.detail,
      }));
      return {
        notes: seeded.length ? seeded.slice(0, 5) : issueNotes,
      };
    },
  },
};

function planAgentToolCalls(skill) {
  const allowed = new Set(skill.tools || []);
  const triggers = (skill.requiredDataTriggers || []).map(t => `${t.id} ${t.description}`.toLowerCase());
  const plan = [];

  if (allowed.has('fetch_resident_baseline') || triggers.some(t => /baseline|hospital|return/.test(t))) {
    plan.push('fetch_resident_baseline');
  }
  if (allowed.has('get_recent_pcc_vitals') || triggers.some(t => /vitals|oxygen|blood pressure|temperature|pulse/.test(t))) {
    plan.push('get_recent_pcc_vitals');
  }
  if (allowed.has('read_latest_nursing_notes') || triggers.some(t => /note|nursing|cna|wound|refusal|mentation|pain/.test(t))) {
    plan.push('read_latest_nursing_notes');
  }

  return plan.length ? plan : Object.keys(AgentTools);
}

function summarizeToolResult(toolName, result) {
  if (toolName === 'fetch_resident_baseline') return `${result.resident.name} baseline plus code status loaded.`;
  if (toolName === 'get_recent_pcc_vitals') return result.latest || 'Recent vitals loaded.';
  if (toolName === 'read_latest_nursing_notes') return `${(result.notes || []).length} recent notes loaded.`;
  return 'Evidence loaded.';
}

function normalizeAgentAssessment(skill, resident, evidence) {
  const baseline = evidence.fetch_resident_baseline?.baseline || [];
  const vitals = evidence.get_recent_pcc_vitals?.readings || [];
  const latestVital = vitals[vitals.length - 1] || {};
  const notes = evidence.read_latest_nursing_notes?.notes || [];
  const primaryIssue = (resident.issues && resident.issues[0]) || FACILITY_CHANGES.find(c => c.residentId === resident.id);
  const codeStatus = evidence.fetch_resident_baseline?.resident?.codeStatus || resident.code;
  const vitalSummary = Object.entries(latestVital)
    .map(([key, value]) => `${key} ${value}`)
    .join(', ');
  const noteSummary = notes[0] ? notes[0].body : 'No nursing narrative signal was available.';

  return {
    skillId: skill.id,
    skillName: skill.name,
    status: 'complete',
    normal: baseline.length ? baseline : [`Baseline loaded for ${resident.name}.`, `Code status: ${codeStatus}.`],
    deviations: [
      primaryIssue ? `${primaryIssue.title}: ${primaryIssue.detail}` : 'No acute deviation identified in current facility feed.',
      vitalSummary ? `Latest vital stream: ${vitalSummary}.` : noteSummary,
    ],
    implications: [
      'This pattern may represent a meaningful baseline shift and should be verified by licensed staff before escalation.',
      `Code status is ${codeStatus}; include it in any provider handoff.`,
    ],
    recommendedActions: [
      'Repeat focused vitals and verify the narrative signal with the charge nurse.',
      'Bundle baseline, vitals, notes, and code status before provider outreach.',
    ],
    confidence: primaryIssue && notes.length ? 'medium' : 'low',
  };
}

function makeAgentStep(status, label, detail, toolName) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    status,
    label,
    detail,
    toolName,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

async function invokeAgentSkill(skillId, input, options = {}) {
  const residentId = input.residentId || input.resident?.id;
  return runResidentAgentSkill({ skillId, residentId, input, onStep: options.onStep, stepDelay: options.stepDelay });
}

async function evaluateResidentBaselineWithSkill(resident, options = {}) {
  return runResidentAgentSkill({
    skillId: RESIDENT_BASELINE_SKILL_ID,
    residentId: resident.id,
    input: { residentId: resident.id },
    onStep: options.onStep,
    stepDelay: options.stepDelay,
  });
}

async function runResidentAgentSkill({ skillId = RESIDENT_BASELINE_SKILL_ID, residentId, input = {}, onStep, stepDelay = 220 }) {
  await agentSkillRegistry.load();
  const skill = agentSkillRegistry.get(skillId);
  const resident = RESIDENTS.find(r => r.id === residentId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  if (!resident) throw new Error(`Unknown resident: ${residentId}`);

  const steps = [];
  const evidence = {};
  const emit = (status, label, detail, toolName) => {
    const step = makeAgentStep(status, label, detail, toolName);
    steps.push(step);
    onStep && onStep(step, [...steps]);
    return step;
  };

  emit('running', `Triggered ${skill.name}`, `${resident.name} matched ${skill.requiredDataTriggers.length} markdown data triggers.`);
  await waitForAgentStep(stepDelay);

  const plan = planAgentToolCalls(skill);
  emit('running', 'Planning tool calls', `Selected ${plan.join(', ')} from SKILL.md instructions.`);
  await waitForAgentStep(stepDelay);

  for (const toolName of plan) {
    const tool = AgentTools[toolName];
    if (!tool) continue;
    emit('running', tool.runningLabel, tool.description, toolName);
    await waitForAgentStep(stepDelay);
    evidence[toolName] = await tool.execute({ residentId, ...input[toolName] });
    emit('complete', tool.completeLabel, summarizeToolResult(toolName, evidence[toolName]), toolName);
    await waitForAgentStep(Math.max(90, stepDelay / 2));
  }

  const vitalText = JSON.stringify(evidence.get_recent_pcc_vitals || {});
  const analysisLabel = /spo2":\s*(8|9[01])|oxygen|o2|wheeze/i.test(vitalText)
    ? 'Analyzing recent O2 drops'
    : 'Analyzing baseline deviation';
  emit('running', analysisLabel, 'Combining baseline, vitals, and note evidence against the expected output schema.');
  await waitForAgentStep(stepDelay);

  const assessment = normalizeAgentAssessment(skill, resident, evidence);
  emit('complete', 'Risk Assessment Complete', `Generated ${assessment.confidence}-confidence decision support for licensed review.`);
  return { skill, evidence, assessment, steps };
}

function AgentExecutionLog({ steps = [], title = 'Agent Execution Trace', subtitle, compact = false, framed = true }) {
  const body = (
    <div style={{
      padding: framed ? (compact ? 12 : 14) : 0,
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 8 : 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color: '#1C192E' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, lineHeight: '17px' }}>{subtitle}</div>}
        </div>
        <Chip tone={steps.some(s => s.status === 'running') ? 'pending' : 'signed'} dot>
          {steps.some(s => s.status === 'running') ? 'Running' : 'Ready'}
        </Chip>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>
        {(steps.length ? steps : [makeAgentStep('running', 'Waiting for skill trigger', 'The agent will show each tool call here.')]).map((step, index) => {
          const complete = step.status === 'complete';
          const failed = step.status === 'error';
          const color = failed ? '#E53E3E' : complete ? '#29BB89' : '#845EC2';
          return (
            <div key={step.id || index} style={{
              display: 'grid',
              gridTemplateColumns: '24px minmax(0, 1fr)',
              gap: 9,
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 9999,
                background: complete ? '#E7F5EF' : failed ? '#FDECEC' : '#F5F2FD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={complete ? 'check' : failed ? 'alertTriangle' : 'clock'} size={13} color={color} />
              </div>
              <div style={{ minWidth: 0, paddingBottom: compact ? 2 : 5, borderBottom: index === steps.length - 1 ? 0 : '1px solid #F4F4F5' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: compact ? 'nowrap' : 'normal' }}>{step.label}</div>
                  {!compact && <div style={{ fontSize: 10, color: '#99A1AF', flexShrink: 0 }}>{step.time}</div>}
                </div>
                {!compact && <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2, lineHeight: '16px' }}>{step.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!framed) return body;
  return <Card style={{ padding: 0, overflow: 'hidden', borderLeft: '4px solid #845EC2' }}>{body}</Card>;
}

Object.assign(window, {
  RESIDENT_BASELINE_SKILL_ID,
  DEFAULT_SKILL_PATHS,
  SkillRegistry,
  agentSkillRegistry,
  parseSkillMarkdown,
  AgentTools,
  runResidentAgentSkill,
  invokeAgentSkill,
  evaluateResidentBaselineWithSkill,
  AgentExecutionLog,
});


// ---- app/operations.jsx ----
// Operational intelligence layer — resident risk, actions, continuity thread

const ACTION_STATUS_TONES = {
  'No Action': 'critical',
  Assigned: 'assigned',
  'In Progress': 'inProgress',
  Overdue: 'critical',
  Completed: 'completed',
  Escalated: 'high',
  Reviewed: 'stable',
  'Monitoring Continued': 'watch',
};

function riskLabelForResident(r) {
  if (r.risk === 'critical' || r.risk === 'high') return 'High';
  if (r.risk === 'watch') return 'Moderate';
  return 'Low';
}

function riskToneForResident(r) {
  if (r.risk === 'critical') return 'critical';
  if (r.risk === 'high') return 'high';
  if (r.risk === 'watch') return 'watch';
  return 'stable';
}

function trendLabelForResident(r) {
  if (r.trend === 'up') return 'worsening';
  if (r.trend === 'down') return 'improving';
  return 'stable';
}

function domainById(id) {
  return RISK_DOMAINS.find(d => d.id === id) || RISK_DOMAINS[0];
}

function domainForIssue(issue) {
  if (!issue) return 'condition';
  const map = {
    sepsis: 'sepsis',
    vitals: 'condition',
    wound: 'skin',
    med: 'med',
    lab: 'med',
    fall: 'fall',
    nutrition: 'nutrition',
    rehab: 'rehab',
  };
  return map[issue.kind] || 'condition';
}

function residentActions(actions, residentId) {
  return (actions || []).filter(a => a.residentId === residentId);
}

function residentActionStatus(r, actions) {
  const list = residentActions(actions, r.id);
  if (!list.length) return 'No Action';
  if (list.some(a => a.status === 'Overdue')) return 'Overdue';
  if (list.some(a => a.status === 'Escalated')) return 'Escalated';
  if (list.some(a => a.status === 'No Action')) return 'No Action';
  if (list.some(a => a.status === 'In Progress')) return 'In Progress';
  if (list.some(a => a.status === 'Assigned')) return 'Assigned';
  if (list.every(a => a.status === 'Completed')) return 'Completed';
  return list[0].status;
}

function actionStatusCounts(actions) {
  const counts = { overdue: 0, unassigned: 0, escalated: 0, dueToday: 0, open: 0, completed: 0 };
  (actions || []).forEach(a => {
    if (a.status === 'Overdue') counts.overdue += 1;
    if (a.status === 'No Action') counts.unassigned += 1;
    if (a.status === 'Escalated') counts.escalated += 1;
    if (/today|shift|overdue/i.test(a.due)) counts.dueToday += 1;
    if (a.status === 'Completed') counts.completed += 1;
    else counts.open += 1;
  });
  return counts;
}

function priorityResidentsWithActions(actions) {
  const order = { critical: 0, high: 1, watch: 2, stable: 3 };
  return [...RESIDENTS].sort((a, b) => {
    const statusRank = { Overdue: 0, Escalated: 1, 'No Action': 2, Assigned: 3, 'In Progress': 4, Completed: 5, Reviewed: 6 };
    const aStatus = residentActionStatus(a, actions);
    const bStatus = residentActionStatus(b, actions);
    return (order[a.risk] - order[b.risk])
      || ((statusRank[aStatus] ?? 9) - (statusRank[bStatus] ?? 9))
      || b.score - a.score;
  });
}

function residentEvidenceItems(r) {
  const issueEvidence = (r.issues || []).map(issue => ({
    id: issue.id,
    domain: domainForIssue(issue),
    title: issue.title,
    detail: issue.detail,
    source: issue.source,
    time: issue.time,
    severity: issue.severity,
  }));
  const noteEvidence = (NOTES_SEED[r.id] || []).slice(0, 3).map(note => ({
    id: note.id,
    domain: /wound|dressing|exudate/i.test(note.body) ? 'skin' : /held|dose|furosemide/i.test(note.body) ? 'med' : 'condition',
    title: 'Nursing note signal',
    detail: note.body,
    source: 'Nursing note',
    time: note.time,
    severity: 'watch',
  }));
  return [...issueEvidence, ...noteEvidence];
}

function residentTimelineEvents(r, actions) {
  const issues = (r.issues || []).slice(0, 3).map((issue, i) => ({
    id: `issue-${issue.id}`,
    when: i === 0 ? 'Today' : issue.time,
    title: issue.title,
    detail: issue.detail,
  }));
  const actionEvents = residentActions(actions, r.id).slice(0, 3).map(action => ({
    id: `action-${action.id}`,
    when: action.due,
    title: `${action.status}: ${action.type}`,
    detail: `${action.owner} owns this follow-through.`,
  }));
  return [
    { id: 'baseline', when: 'Baseline', title: r.dx, detail: `Code status: ${r.code}.` },
    ...issues,
    ...actionEvents,
  ];
}

function suggestedActionForResident(r) {
  const domainId = (r.drivers && r.drivers[0]) || domainForIssue((r.issues || [])[0]);
  const domain = domainById(domainId);
  return {
    type: domain.action,
    domain: domain.id,
    ownerRole: domain.owner,
    priority: riskLabelForResident(r),
    due: riskLabelForResident(r) === 'High' ? 'This shift' : 'Today',
    reason: `${domain.label} is active for ${r.name}; follow-through needs an accountable owner.`,
  };
}

function ActionStatusBadge({ status }) {
  return <Chip tone={ACTION_STATUS_TONES[status] || 'todo'} dot>{status}</Chip>;
}

function DomainChip({ domainId, label }) {
  const domain = domainById(domainId);
  return <Chip tone="domain" style={{ border: '1px solid #D8C7F2', fontWeight: 800 }}>{label || domain.short}</Chip>;
}

function OperationalResidentCard({ r, actions, onClick, focusDomain }) {
  const status = residentActionStatus(r, actions);
  const evidence = residentEvidenceItems(r).filter(item => !focusDomain || item.domain === focusDomain);
  const drivers = focusDomain
    ? evidence.slice(0, 3).map(item => item.title)
    : (r.drivers || []).slice(0, 4).map(id => domainById(id).short);
  const tone = RISK[r.risk] || RISK.watch;
  return (
    <Card hoverable onClick={onClick} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 5, background: tone.dot }} />
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Avatar initials={r.initials} seed={r.id} size={38} isResident />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>{r.name}</div>
                <RiskBadge level={r.risk} score={r.score} compact />
              </div>
              <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>Room {r.room} · {r.unit}</div>
            </div>
            <ActionStatusBadge status={status} />
          </div>
          <div style={{ fontSize: 13, color: '#1C192E', lineHeight: '18px', fontWeight: 700 }}>
            {riskLabelForResident(r)} · {trendLabelForResident(r)} over 24-48h
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(drivers.length ? drivers : ['No active driver beyond routine monitoring']).slice(0, 4).map((driver, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
                <span style={{ width: 5, height: 5, borderRadius: 9999, background: tone.dot, marginTop: 6, flexShrink: 0 }} />
                <span>{driver}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(r.drivers || []).slice(0, 4).map(id => <DomainChip key={id} domainId={id} />)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function UnitRiskHeatmap({ actions, onSelectUnit }) {
  const units = ['East · Skilled', 'West · LTC', 'Memory Care'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
      {units.map(unit => {
        const residents = RESIDENTS.filter(r => r.unit === unit);
        const high = residents.filter(r => ['critical','high'].includes(r.risk)).length;
        const overdue = residents.filter(r => residentActionStatus(r, actions) === 'Overdue').length;
        const level = high > 1 || overdue ? 'High' : high ? 'Moderate' : 'Stable';
        const color = level === 'High' ? RISK.high.dot : level === 'Moderate' ? '#E9C05F' : '#29BB89';
        return (
          <button key={unit} onClick={() => onSelectUnit(unit)} style={{
            minWidth: 0, border: `1px solid ${color}`, background: '#fff', borderRadius: 10,
            padding: '12px 10px', textAlign: 'left', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit}</div>
            <div style={{ color, fontSize: 15, fontWeight: 900, marginTop: 4 }}>{level}</div>
            <div style={{ fontSize: 11, color: '#6A7282', marginTop: 3 }}>{high} high · {overdue} overdue</div>
          </button>
        );
      })}
    </div>
  );
}

function OperationalCognitionPanel({ resident, actions, compact }) {
  const [step, setStep] = useState(0);
  const steps = [
    'Observing clinical changes, handoffs, and open work.',
    'Structuring risk drivers around resident continuity threads.',
    'Checking whether high-risk changes have accountable owners.',
    'Preserving context for huddle, escalation, and closure.',
  ];
  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % steps.length), 2200);
    return () => clearInterval(timer);
  }, []);
  const target = resident || priorityResidentsWithActions(actions)[0];
  return (
    <Card style={{ padding: compact ? 12 : 14, borderLeft: '4px solid #67568C', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={16} color="#67568C" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>Operational Cognition Layer</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 2 }}>{steps[step]}</div>
        </div>
        <Chip tone="online" dot>Live</Chip>
      </div>
      {target && (
        <div style={{ padding: 10, background: '#FAFAFC', borderRadius: 8, border: '1px solid #EEEEEE' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#67568C', letterSpacing: '0.05em' }}>CURRENT CONTEXT</div>
          <div style={{ fontSize: 13, color: '#1C192E', fontWeight: 800, marginTop: 4 }}>{target.name} · {residentActionStatus(target, actions)}</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 3 }}>{suggestedActionForResident(target).reason}</div>
        </div>
      )}
    </Card>
  );
}

function ContinuityThreadPanel({ r, actions, onOpenAction }) {
  const timeline = residentTimelineEvents(r, actions);
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Continuity Thread</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, lineHeight: '17px' }}>
          Persistent operational memory for communication, decisions, escalations, AI observations, and closure.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeline.map((event, i) => (
          <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: i === timeline.length - 1 ? '#67568C' : '#D1D5DC', marginTop: 4 }} />
              {i < timeline.length - 1 && <span style={{ width: 1, flex: 1, background: '#E5E7EB', marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#99A1AF', fontWeight: 900 }}>{event.when}</div>
              <div style={{ fontSize: 13, color: '#1C192E', fontWeight: 800, marginTop: 2 }}>{event.title}</div>
              <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 2 }}>{event.detail}</div>
            </div>
          </div>
        ))}
      </div>
      {residentActions(actions, r.id).map(action => (
        <button key={action.id} onClick={() => onOpenAction && onOpenAction(action.id)} style={{
          border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, padding: 10,
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer',
        }}>
          <Icon name="check" size={14} color="#00795E" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
            <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{action.owner} · {action.status}</div>
          </div>
          <Icon name="chevronRight" size={14} color="#99A1AF" />
        </button>
      ))}
    </Card>
  );
}

function EvidenceSummaryPanel({ r }) {
  const grouped = residentEvidenceItems(r).reduce((acc, item) => {
    acc[item.domain] = acc[item.domain] || [];
    acc[item.domain].push(item);
    return acc;
  }, {});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.keys(grouped).map(domainId => (
        <Card key={domainId} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E' }}>{domainById(domainId).label}</div>
            <DomainChip domainId={domainId} />
          </div>
          {grouped[domainId].map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: (RISK[item.severity] || RISK.watch).dot, marginTop: 6 }} />
              <span><b style={{ color: '#1C192E' }}>{item.title}</b> · {item.detail} <span style={{ color: '#99A1AF' }}>({item.source} · {item.time})</span></span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function SuggestedActionPanel({ r, actions, onAssign, onOpenAction }) {
  const suggestion = suggestedActionForResident(r);
  const [notes, setNotes] = useState('');
  const open = residentActions(actions, r.id).filter(a => a.status !== 'Completed');
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '4px solid #00C9A7' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Suggested Action</div>
        <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 3 }}>AI converts the interpreted risk into accountable follow-through. Humans still decide.</div>
      </div>
      <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 10, background: '#FAFAFC', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DomainChip domainId={suggestion.domain} />
          <Chip tone={suggestion.priority === 'High' ? 'high' : 'watch'}>{suggestion.priority}</Chip>
          <Chip tone="todo">{suggestion.due}</Chip>
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>{suggestion.type}</div>
        <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>Suggested owner: <b>{suggestion.ownerRole}</b></div>
        <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>{suggestion.reason}</div>
        <textarea value={notes} onInput={e => setNotes(e.target.value)} placeholder="Add handoff notes..." style={{
          minHeight: 70, border: '1px solid #E5E7EB', borderRadius: 8, padding: 10,
          font: '13px Inter', resize: 'vertical', outline: 0, color: '#1C192E',
        }} />
        <Button variant="primary" icon="check" onClick={() => onAssign && onAssign(r.id, { ...suggestion, notes })}>Assign & Track</Button>
      </div>
      {open.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#52525B', letterSpacing: '0.06em' }}>OPEN FOLLOW-THROUGH</div>
          {open.map(action => (
            <button key={action.id} onClick={() => onOpenAction && onOpenAction(action.id)} style={{
              border: '1px solid #E5E7EB', background: '#fff', borderRadius: 8, padding: 10,
              display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
            }}>
              <ActionStatusBadge status={action.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{action.type}</div>
                <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{action.owner} · {action.due}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

Object.assign(window, {
  ACTION_STATUS_TONES,
  riskLabelForResident,
  riskToneForResident,
  trendLabelForResident,
  domainById,
  domainForIssue,
  residentActions,
  residentActionStatus,
  actionStatusCounts,
  priorityResidentsWithActions,
  residentEvidenceItems,
  residentTimelineEvents,
  suggestedActionForResident,
  ActionStatusBadge,
  DomainChip,
  OperationalResidentCard,
  UnitRiskHeatmap,
  OperationalCognitionPanel,
  ContinuityThreadPanel,
  EvidenceSummaryPanel,
  SuggestedActionPanel,
});


// ---- app/ai.jsx ----
// AI workspace — proactive clinical driver + resident-aware assistant

function residentCareTeam(residentId) {
  const ids = CARE_TEAMS[residentId] || CARE_TEAMS.r1 || [];
  return ids.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean);
}

function residentPrimaryIssue(r) {
  return (r.issues && r.issues[0]) || FACILITY_CHANGES.find(c => c.residentId === r.id) || null;
}

function pendingSkillAssessment(r) {
  const skillName = (agentSkillRegistry.get(RESIDENT_BASELINE_SKILL_ID) || {}).name || '72-Hour Post-Hospital Return Watch';
  return {
    skillId: RESIDENT_BASELINE_SKILL_ID,
    skillName,
    status: 'evaluating',
    normal: [`Evaluating ${r.name}'s current data against the resident baseline.`],
    deviations: ['Skill evaluation in progress.'],
    implications: ['Waiting for multidimensional assessment.'],
    recommendedActions: ['Review the latest chart evidence while the skill completes.'],
    confidence: 'pending',
  };
}

function nextActionsForResident(r) {
  const issue = residentPrimaryIssue(r);
  const actions = [];
  if (r.risk === 'critical') actions.push('Notify charge nurse and DON for same-shift review.');
  if (issue && issue.kind === 'vitals') actions.push('Repeat focused vitals and compare to resident baseline before provider outreach.');
  if (issue && issue.kind === 'wound') actions.push('Ask wound nurse to confirm dressing status and whether care plan needs revision.');
  if (issue && issue.kind === 'med') actions.push('Route medication variance to provider/pharmacy with eMAR evidence.');
  if (issue && issue.kind === 'rehab') actions.push('Ask rehab lead whether refusal is pain, fatigue, cognition, or clinical decline.');
  if (issue && issue.kind === 'nutrition') actions.push('Ask dietary/RD to review meal intake, fluids, weight, and supplement options.');
  if (!actions.length) actions.push('Continue baseline monitoring and wait for a meaningful deviation before escalating.');
  actions.push('If human team chooses an intervention, save outcome as a workflow pattern for future skill tuning.');
  return actions;
}

function proactiveQueue() {
  return priorityResidents().slice(0, 5).map(r => {
    const issue = residentPrimaryIssue(r);
    return {
      resident: r,
      issue,
      action: nextActionsForResident(r)[0],
    };
  });
}

function matchCareTeamMember(text, residentId) {
  const q = text.toLowerCase();
  return residentCareTeam(residentId).find(u => {
    const first = u.name.split(' ')[0].toLowerCase();
    const last = u.name.split(' ').slice(-1)[0].toLowerCase();
    return q.includes(u.name.toLowerCase()) || q.includes(first) || q.includes(last) || q.includes((u.short || '').toLowerCase()) || q.includes(u.role.toLowerCase());
  });
}

function isConversationRequest(text) {
  const q = text.toLowerCase();
  return ['message', 'chat', 'thread', 'discuss', 'talk to', 'open conversation', 'start conversation', 'ask '].some(x => q.includes(x));
}

function AIAssistantPage({ user, residentId, onOpenResident, onOpenChat, onNav }) {
  const taggedResident = residentId ? RESIDENTS.find(r => r.id === residentId) : null;
  const queue = proactiveQueue();
  const heroResident = taggedResident || (queue[0] && queue[0].resident);
  const [input, setInput] = useState('');
  const [baselineAssessment, setBaselineAssessment] = useState(() => taggedResident ? pendingSkillAssessment(taggedResident) : null);
  const [agentRun, setAgentRun] = useState({ status: 'idle', steps: [], assessment: null });
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: taggedResident
        ? `${taggedResident.name} is tagged. I can explain the baseline shift, recommend next actions, or open a tagged conversation with anyone on the care team.`
        : `I am watching resident baselines, deviations, risk implications, and care-team workflow patterns for ${FACILITY.name}. Ask what needs action next.`,
    },
  ]);

  const team = taggedResident ? residentCareTeam(taggedResident.id) : [];

  useEffect(() => {
    let cancelled = false;
    const target = taggedResident || heroResident;
    if (!target) {
      setBaselineAssessment(null);
      setAgentRun({ status: 'idle', steps: [], assessment: null });
      return;
    }

    if (taggedResident) setBaselineAssessment(pendingSkillAssessment(taggedResident));
    setAgentRun({ status: 'running', steps: [], assessment: null });

    runResidentAgentSkill({
      skillId: RESIDENT_BASELINE_SKILL_ID,
      residentId: target.id,
      onStep: (step, steps) => {
        if (!cancelled) setAgentRun(s => ({ ...s, status: 'running', steps }));
      },
    }).then(run => {
      if (cancelled) return;
      setAgentRun({ status: 'complete', steps: run.steps, assessment: run.assessment, skill: run.skill });
      if (taggedResident) setBaselineAssessment(run.assessment);
    }).catch(error => {
      if (cancelled) return;
      const step = { id: 'agent-error', status: 'error', label: 'Agent run failed', detail: error.message, time: 'now' };
      setAgentRun({ status: 'error', steps: [step], assessment: null });
      if (taggedResident) setBaselineAssessment(pendingSkillAssessment(taggedResident));
    });

    return () => { cancelled = true; };
  }, [taggedResident ? `tagged-${taggedResident.id}` : heroResident ? `facility-${heroResident.id}` : 'none']);

  function addMessage(role, text) {
    setMessages(m => [...m, { role, text }]);
  }

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    addMessage('me', q);
    setInput('');

    if (taggedResident && isConversationRequest(q)) {
      const member = matchCareTeamMember(q, taggedResident.id);
      if (member) {
        onOpenChat(taggedResident, member);
        addMessage('ai', `Opened a conversation with ${member.name}. ${taggedResident.name} remains tagged, and I included the active baseline deviation plus recommended next step.`);
        return;
      }
      addMessage('ai', `I can open a tagged conversation for ${taggedResident.name}. Try a name or role from the care team: ${team.map(u => `${u.name} (${u.short})`).join(', ')}.`);
      return;
    }

    if (taggedResident) {
      const assessment = baselineAssessment || pendingSkillAssessment(taggedResident);
      const action = (assessment.recommendedActions && assessment.recommendedActions[0]) || 'Confirm findings with the care team.';
      addMessage('ai', `${taggedResident.name}: ${assessment.skillName} shows ${assessment.deviations[0]} ${assessment.implications[0]} Recommended next action: ${action}`);
      return;
    }

    const top = queue[0];
    addMessage('ai', `Top proactive item: ${top.resident.name}. Signal: ${top.issue ? top.issue.title : top.resident.dx}. Recommended driver action: ${top.action}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="AI Command"
        subtitle={taggedResident ? `Resident context active · ${taggedResident.name} is tagged` : 'Proactive work queue from PCC signals, resident baselines, and care-team patterns.'}
        actions={[
          taggedResident && <Button key="profile" variant="secondary" icon="user" onClick={() => onOpenResident(taggedResident.id)}>Open Profile</Button>,
        ].filter(Boolean)}
      />

      <AgentCommandBanner queue={queue} taggedResident={taggedResident} assessment={baselineAssessment} onOpenResident={onOpenResident} />
      <AgentExecutionLog
        steps={agentRun.steps}
        title="Agent Work Log"
        subtitle={heroResident ? `${heroResident.name} - markdown skill registry plus autonomous tool calls.` : 'Waiting for a resident trigger.'}
      />

      {taggedResident ? (
        <ResidentAICard r={taggedResident} baseline={baselineAssessment || pendingSkillAssessment(taggedResident)} team={team} onOpenChat={onOpenChat} />
      ) : (
        <FacilityAIDriver queue={queue} onOpenResident={onOpenResident} />
      )}

      <AgentOperatingLoop />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Command AI</div>
            <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>
              {taggedResident ? `${taggedResident.name} stays tagged in this conversation.` : 'Ask about priorities, patterns, risks, or what to do next.'}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', background: '#FAFAFA' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'me' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '86%', padding: '10px 12px', borderRadius: 12,
                background: m.role === 'me' ? '#845EC2' : '#fff',
                color: m.role === 'me' ? '#fff' : '#1C192E',
                border: m.role === 'me' ? 0 : '1px solid #E5E7EB',
                fontSize: 13, lineHeight: '18px',
              }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #EEEEEE', display: 'flex', gap: 8, flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(taggedResident
              ? ['What changed from baseline?', `Message ${team[0]?.name.split(' ')[0] || 'the nurse'} about this`, 'What should the care team do next?']
              : ['Who needs action before noon?', 'What patterns are repeating?', 'Which skill should be created next?']
            ).map(s => (
              <button key={s} onClick={() => send(s)} style={{
                border: '1px solid #E5E7EB', background: '#fff', borderRadius: 9999, padding: '7px 10px',
                font: '600 12px Inter', color: '#52525B', cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder={taggedResident ? `Ask about ${taggedResident.name} or say "message Dr. Cole"` : 'Ask what needs action next...'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
            <Button variant="lavender" icon="send" onClick={() => send()}>Send</Button>
          </div>
        </div>
      </Card>

      <SkillLearningCard />
    </div>
  );
}

function AgentCommandBanner({ queue, taggedResident, assessment, onOpenResident }) {
  const target = taggedResident || (queue[0] && queue[0].resident);
  const issue = taggedResident ? residentPrimaryIssue(taggedResident) : queue[0] && queue[0].issue;
  const nextAction = taggedResident && assessment && assessment.recommendedActions
    ? assessment.recommendedActions[0]
    : target
      ? nextActionsForResident(target)[0]
      : 'Continue baseline monitoring.';
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '4px solid #845EC2' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="sparkles" size={20} color="#845EC2" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1C192E' }}>Next work item</div>
          <div style={{ fontSize: 13, lineHeight: '19px', color: '#1C192E', marginTop: 5 }}>
            {target ? `${target.name}: ${issue ? issue.title : target.dx}` : 'No active work item.'}
          </div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 4 }}>
            {nextAction}
          </div>
        </div>
        {target && <RiskBadge level={target.risk} score={target.score} compact />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 8 }}>
        <AiMiniStat label="Baseline shifts" value={FACILITY_CHANGES.length} icon="activity" />
        <AiMiniStat label="Same-shift decisions" value={priorityResidents().filter(r => ['critical','high'].includes(r.risk)).length} icon="alertTriangle" />
        <AiMiniStat label="Skills learning" value="3" icon="fileText" />
      </div>
      {target && (
        <Button variant="secondary" icon="user" onClick={() => onOpenResident(target.id)}>Open Work Item</Button>
      )}
    </Card>
  );
}

function AiMiniStat({ label, value, icon }) {
  return (
    <div style={{ padding: 12, border: '1px solid #EEEEEE', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={16} color="#845EC2" />
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1C192E', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function FacilityAIDriver({ queue, onOpenResident }) {
  const statusMap = ['Now', 'Next', 'Before noon', 'This shift', 'Watch'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader title="Proactive Queue" subtitle="AI-initiated work ordered by risk, trend, and workflow timing." />
      {queue.map(item => (
        <Card key={item.resident.id} hoverable onClick={() => onOpenResident(item.resident.id)} style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar initials={item.resident.initials} seed={item.resident.id} size={42} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{item.resident.name}</div>
                <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>Rm {item.resident.room} · {item.resident.unit}</div>
              </div>
              <RiskBadge level={item.resident.risk} score={item.resident.score} compact />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Chip tone={item.resident.risk} dot>{statusMap[queue.indexOf(item)] || 'Queued'}</Chip>
              <Chip tone="todo">{item.issue ? item.issue.source : 'Baseline'}</Chip>
            </div>
            <div style={{ fontSize: 13, lineHeight: '18px', color: '#1C192E', marginTop: 10, fontWeight: 700 }}>{item.issue ? item.issue.title : item.resident.dx}</div>
            <div style={{ fontSize: 12, lineHeight: '17px', color: '#6A7282', marginTop: 4 }}>{item.action}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AgentOperatingLoop() {
  const stages = [
    { icon: 'fileText', title: 'PCC Digest', body: 'vitals, eMAR, notes, labs, wounds' },
    { icon: 'activity', title: 'Baseline Compare', body: 'resident-specific normal range' },
    { icon: 'alertTriangle', title: 'Risk Shift', body: 'decline, transfer, sepsis, fall, wound' },
    { icon: 'users', title: 'Human Decision', body: 'team accepts, edits, or rejects plan' },
    { icon: 'refresh', title: 'Skill Update', body: 'trigger, response, outcome pattern' },
  ];
  return (
    <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E' }}>Agent Loop</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3 }}>Every recommendation stays tied to evidence, owner, decision, and outcome.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {stages.map((s, i) => (
          <div key={s.title} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, background: i === 2 ? '#FFF3EF' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name={s.icon} size={15} color={i === 2 ? '#FF6E6C' : '#845EC2'} />
              <div style={{ fontSize: 12, fontWeight: 900, color: '#1C192E' }}>{s.title}</div>
            </div>
            <div style={{ fontSize: 11, color: '#6A7282', lineHeight: '15px', marginTop: 6 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ResidentAICard({ r, baseline, team, onOpenChat }) {
  const actions = baseline.recommendedActions || [];
  const statusLabel = baseline.status === 'evaluating'
    ? 'Evaluating'
    : baseline.status === 'fallback'
      ? 'Fallback'
      : `Confidence ${baseline.confidence}`;
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials={r.initials} seed={r.id} size={46} isResident />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#6A7282' }}>{baseline.skillName} · MRN {r.mrn} · Rm {r.room}</div>
        </div>
        <Chip tone={baseline.status === 'fallback' ? 'watch' : 'info'}>{statusLabel}</Chip>
        <RiskBadge level={r.risk} score={r.score} compact />
      </div>
      <AiEvidenceBlock title="Baseline Model" items={baseline.normal} />
      <AiEvidenceBlock title="Meaningful Change" items={baseline.deviations} />
      <AiEvidenceBlock title="Likely Implication" items={baseline.implications} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#52525B', letterSpacing: '0.05em', marginBottom: 8 }}>NEXT HUMAN DECISION</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#1C192E', lineHeight: '18px' }}>
              <Icon name={i === 0 ? 'arrowRight' : 'check'} size={14} color={i === 0 ? '#845EC2' : '#29BB89'} />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 2 }}>
        {team.slice(0, 5).map(u => (
          <button key={u.id} onClick={() => onOpenChat(r, u)} style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            border: '1px solid #E5E7EB', background: '#fff', borderRadius: 9999, padding: '7px 10px',
            font: '600 12px Inter', color: '#1C192E', cursor: 'pointer',
          }}>
            <Avatar initials={u.initials} seed={u.id} size={24} />
            {u.short}
          </button>
        ))}
      </div>
    </Card>
  );
}

function AiEvidenceBlock({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#52525B', letterSpacing: '0.05em', marginBottom: 6 }}>{title.toUpperCase()}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
            <span style={{ width: 5, height: 5, borderRadius: 9999, background: '#845EC2', marginTop: 6, flexShrink: 0 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillLearningCard() {
  return (
    <Card style={{ padding: 16, background: '#fff' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E7F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="fileText" size={16} color="#00795E" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1C192E' }}>Skill learning loop</div>
          <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px', marginTop: 4 }}>
            When the team accepts, edits, or rejects an AI recommendation, the pattern is saved as a reusable facility workflow: trigger, PCC evidence, intervention, outcome, and escalation policy.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <Chip tone="signed">72h return watch</Chip>
            <Chip tone="signed">Sepsis deviation review</Chip>
            <Chip tone="signed">Wound exudate escalation</Chip>
          </div>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { AIAssistantPage });


// ---- app/residents.jsx ----
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
              <Button size="sm" variant="secondary" icon="calendar" style={{ width: '100%' }} onClick={() => setShowSchedule(true)}>Schedule</Button>
              <Button size="sm" variant="coral" icon="alertTriangle" style={{ width: '100%' }} onClick={() => setShowEscalate(true)}>Escalate</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, width: '100%' }}>
            <ProfileDetailTile icon="mapPin" label="Location" value={`Rm ${r.room} · ${r.unit}`} wide />
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
        <div class="ois-profile-trend">
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
  const lineColor = '#B91C1C';
  const softRed = 'rgba(229,62,62,0.14)';
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
    <div style={{
      padding: 10,
      border: '1px solid rgba(229,62,62,0.2)',
      borderRadius: 10,
      background: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#99A1AF', letterSpacing: '0.08em' }}>14-DAY TREND</div>
        <div style={{ fontSize: 11, color: '#6A7282' }}>Score · driven by vitals, labs, ADL change, med adherence</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.56" />
            <stop offset="54%" stopColor="#E53E3E" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#E53E3E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={P} y1={P + (1 - 0.6) * (H - 2 * P)} x2={W - P} y2={P + (1 - 0.6) * (H - 2 * P)} stroke={softRed} strokeDasharray="3 3" />
        <line x1={P} y1={P + (1 - 0.8) * (H - 2 * P)} x2={W - P} y2={P + (1 - 0.8) * (H - 2 * P)} stroke="#FCA5A5" strokeDasharray="3 3" />
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={lineColor} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
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
          <textarea value={reason} onInput={e => setReason(e.target.value)}
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


// ---- app/changes.jsx ----
// Changes feed + Watchlist pages

function ChangesPage({ onOpenResident, onOpenIssue }) {
  const [filter, setFilter] = useState('all');
  const priorityRank = { critical: 0, high: 1, watch: 2, stable: 3 };
  const severityCounts = FACILITY_CHANGES.reduce((acc, c) => {
    acc[c.severity] = (acc[c.severity] || 0) + 1;
    return acc;
  }, {});
  const filtered = FACILITY_CHANGES
    .filter(c => filter === 'all' || c.severity === filter)
    .slice()
    .sort((a, b) => (priorityRank[a.severity] ?? 9) - (priorityRank[b.severity] ?? 9));
  const v = useViewport();
  const isPhone = v.isMobile;
  const topChange = filtered[0];
  const topResident = topChange ? RESIDENTS.find(x => x.id === topChange.residentId) : null;
  const [alertAgentRun, setAlertAgentRun] = useState({ status: 'idle', steps: [] });

  useEffect(() => {
    let cancelled = false;
    if (!topResident) {
      setAlertAgentRun({ status: 'idle', steps: [] });
      return;
    }

    setAlertAgentRun({ status: 'running', steps: [] });
    runResidentAgentSkill({
      skillId: RESIDENT_BASELINE_SKILL_ID,
      residentId: topResident.id,
      stepDelay: 160,
      onStep: (step, steps) => {
        if (!cancelled) setAlertAgentRun({ status: 'running', steps });
      },
    }).then(run => {
      if (!cancelled) setAlertAgentRun({ status: 'complete', steps: run.steps, assessment: run.assessment });
    }).catch(error => {
      if (!cancelled) setAlertAgentRun({ status: 'error', steps: [{ id: 'alert-agent-error', status: 'error', label: 'Alert agent failed', detail: error.message, time: 'now' }] });
    });

    return () => { cancelled = true; };
  }, [topResident ? `${filter}-${topResident.id}` : filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Changes"
        subtitle="Clinical deviations across all residents in the last 24 hours. Click any card to open the resident."
        actions={[
          <Button key="filter" variant="secondary" icon="filter" onClick={() => emitToast('Advanced filters coming soon.', 'info')}>Filter</Button>,
        ]}
      />

      <Card style={{ padding: isPhone ? 12 : 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <ChangeFilterGrid
          value={filter}
          onChange={setFilter}
          counts={{ all: FACILITY_CHANGES.length, ...severityCounts }}
          isPhone={isPhone}
        />
        <div style={{ fontSize: 12, color: '#6A7282', display: 'flex', alignItems: 'center', gap: 6, width: isPhone ? '100%' : 'auto', justifyContent: isPhone ? 'flex-start' : 'flex-end' }}>
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#29BB89' }} />
          Live · updated 14s ago
        </div>
      </Card>

      {topResident && (
        <AgentExecutionLog
          steps={alertAgentRun.steps}
          title="Alert Agent Trace"
          subtitle={`${topResident.name} - top ${filter === 'all' ? 'priority' : filter} alert is being checked with tool calls.`}
          compact={isPhone}
        />
      )}

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

function ChangeFilterGrid({ value, onChange, counts, isPhone }) {
  const options = [
    { id: 'all', label: 'All', tone: 'todo' },
    { id: 'critical', label: 'Critical', tone: 'critical' },
    { id: 'high', label: 'High', tone: 'high' },
    { id: 'watch', label: 'Watch', tone: 'watch' },
    { id: 'stable', label: 'Stable', tone: 'stable' },
  ];
  return (
    <div style={{
      flex: 1, minWidth: 0, display: 'grid',
      gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
      gap: 8,
    }}>
      {options.map(o => {
        const active = value === o.id;
        const tone = o.tone === 'todo' ? { dot: '#845EC2', bg: '#F5F2FD', fg: '#67568C' } : RISK[o.tone];
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            minWidth: 0, minHeight: 42, borderRadius: 8,
            border: `1px solid ${active ? tone.dot : '#E5E7EB'}`,
            background: active ? tone.bg : '#fff',
            color: active ? tone.fg : '#52525B',
            cursor: 'pointer', padding: '8px 9px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            font: '700 12px Inter',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: tone.dot, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
            </span>
            <span style={{
              minWidth: 22, height: 22, padding: '0 6px', borderRadius: 9999,
              background: active ? '#fff' : '#F4F4F5', color: active ? tone.fg : '#6A7282',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{counts[o.id] || 0}</span>
          </button>
        );
      })}
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

function WatchlistPage({ actions, onOpenResident }) {
  const [active, setActive] = useState('condition');
  const v = useViewport();
  const isPhone = v.isMobile;
  const domain = domainById(active);
  const residents = priorityResidentsWithActions(actions).filter(r =>
    (r.drivers || []).includes(active) ||
    residentEvidenceItems(r).some(item => item.domain === active)
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isPhone ? 20 : 28 }}>
      <PageHeader
        title="Watchlists"
        subtitle="Domain-focused views inside the same operational intelligence system. Residents stay ranked by overall risk."
        actions={[
          <Button key="actions" variant="primary" icon="check" onClick={() => emitToast('Use Actions to assign and close follow-through from each resident.', 'info')}>Track Follow-through</Button>,
        ]}
      />

      <Card style={{ padding: 12, display: 'flex', gap: 8, overflowX: 'auto' }}>
        {RISK_DOMAINS.map(d => {
          const count = RESIDENTS.filter(r =>
            (r.drivers || []).includes(d.id) ||
            residentEvidenceItems(r).some(item => item.domain === d.id)
          ).length;
          const selected = active === d.id;
          return (
            <button key={d.id} onClick={() => setActive(d.id)} style={{
              flex: '0 0 auto',
              minWidth: isPhone ? 128 : 150,
              borderRadius: 10,
              border: `1px solid ${selected ? '#00C9A7' : '#E5E7EB'}`,
              background: selected ? '#E7F5EF' : '#fff',
              color: selected ? '#00795E' : '#1C192E',
              padding: '10px 11px',
              cursor: 'pointer',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.short}</span>
                <span style={{
                  minWidth: 22, height: 22, borderRadius: 9999,
                  background: selected ? '#fff' : '#F4F4F5',
                  color: selected ? '#00795E' : '#6A7282',
                  fontSize: 11, fontWeight: 900,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{count}</span>
              </div>
              <div style={{ fontSize: 11, color: selected ? '#3F6B4E' : '#6A7282', marginTop: 5, lineHeight: '15px' }}>{d.label}</div>
            </button>
          );
        })}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) 300px', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionHeader
            title={domain.label}
            subtitle={`${residents.length} residents with active signals. Cards show domain evidence, action status, and global risk priority.`}
          />
          {residents.map(r => (
            <OperationalResidentCard key={r.id} r={r} actions={actions} focusDomain={active} onClick={() => onOpenResident(r.id)} />
          ))}
          {residents.length === 0 && (
            <Card style={{ padding: 28, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>
              No residents are currently on this watchlist.
            </Card>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OperationalCognitionPanel actions={actions} compact={isPhone} />
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#1C192E' }}>Suggested owner rule</div>
            <div style={{ fontSize: 12, color: '#6A7282', lineHeight: '17px' }}>
              {domain.label} signals normally route to <b>{domain.owner}</b> with a recommended action of <b>{domain.action}</b>.
            </div>
            <DomainChip domainId={active} />
          </Card>
        </div>
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

function ChatDock({ chats, onClose, onSendCall, mobile }) {
  if (!chats || chats.length === 0) return null;
  const visibleChats = mobile ? chats.slice(-1) : chats;
  return (
    <div style={{
      position: 'fixed',
      left: mobile ? 8 : 'auto',
      right: mobile ? 8 : 24,
      bottom: mobile ? 'calc(76px + env(safe-area-inset-bottom))' : 0,
      zIndex: 60,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      pointerEvents: 'none',
    }}>
      {visibleChats.map(c => <ChatWindow key={c.id} chat={c} mobile={mobile} onClose={() => onClose(c.id)} onCall={() => onSendCall(c.id)} />)}
    </div>
  );
}

function ChatWindow({ chat, onClose, onCall, mobile }) {
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
      width: mobile ? '100%' : 340, height: mobile ? 'min(68vh, 500px)' : 480, background: '#fff', borderRadius: mobile ? 12 : '12px 12px 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
      border: '1px solid #E5E7EB', borderBottom: mobile ? '1px solid #E5E7EB' : 0, overflow: 'hidden',
      pointerEvents: 'auto',
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
            <Icon name="mic" size={12} color="#fff" /> Call capture active — patient {chat.resident.name} auto-tagged.
          </div>
        </div>
      ) : callState === 'summary' && callSummary ? (
        <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="fileText" size={14} color="#845EC2" />
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


// ---- app/actions.jsx ----
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
        <ClosureField label="What was reviewed"><textarea value={reviewed} onInput={e => setReviewed(e.target.value)} style={textareaStyle} /></ClosureField>
        <ClosureField label="What action was taken"><textarea value={taken} onInput={e => setTaken(e.target.value)} style={textareaStyle} /></ClosureField>
        <ClosureField label="Provider/family notification"><textarea value={notified} onInput={e => setNotified(e.target.value)} style={textareaStyle} /></ClosureField>
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


// ---- app/huddle.jsx ----
// Huddle page — facility-wide huddle history + saved summaries

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
        subtitle="Every shift handoff, clinical round, and care plan meeting in one place, with summaries and follow-ups attached to resident charts."
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
            <Icon name="check" size={12} color="#845EC2" />
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
              <Icon name="fileText" size={14} color="#845EC2" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#67568C', letterSpacing: '0.04em' }}>SUMMARY</span>
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
// Messages page - full-height care-team, huddle, and tagged resident threads

const RECENT_THREADS_SEED = [
  { id: 't1', kind: 'direct', userId: 'u11', residentId: 'r1', preview: 'Reviewing labs now - back to you in 5.', time: '4m', unread: 2 },
  { id: 't2', kind: 'direct', userId: 'u9', residentId: 'r5', preview: 'New wound photo uploaded.', time: '22m', unread: 1 },
  { id: 't3', kind: 'direct', userId: 'u4', residentId: 'r2', preview: 'Cultures drawn, awaiting results.', time: '1h', unread: 0 },
  { id: 't4', kind: 'direct', userId: 'u10', residentId: 'r3', preview: 'Approved - restart at 5mg AM.', time: '2h', unread: 0 },
  { id: 't5', kind: 'direct', userId: 'u14', residentId: 'r7', preview: 'PT eval scheduled for tomorrow 10am.', time: '4h', unread: 0 },
];

const HUDDLE_MESSAGE_THREADS = [
  {
    id: 'huddle-h1',
    kind: 'huddle',
    title: 'Morning shift huddle',
    residentIds: ['r1','r2','r3'],
    participants: ['u1','u2','u3','u4','u5','u8','u9','u11'],
    preview: 'Open items: BP recheck, sepsis pathway confirmation, INR follow-up.',
    time: '18m',
    unread: 3,
  },
  {
    id: 'huddle-h2',
    kind: 'huddle',
    title: 'Wound care rounds',
    residentIds: ['r1','r5','r8'],
    participants: ['u9','u4','u5','u11','u18'],
    preview: 'Photos uploaded. Wound nurse requesting nutrition review for two residents.',
    time: '1h',
    unread: 1,
  },
  {
    id: 'huddle-h3',
    kind: 'huddle',
    title: 'West LTC safety huddle',
    residentIds: ['r2','r8','r10'],
    participants: ['u2','u3','u4','u6','u15'],
    preview: 'Falls and staffing-sensitive follow-through for evening shift.',
    time: 'Yesterday',
    unread: 0,
  },
];

const ONLINE_USER_IDS = new Set(['u2', 'u3', 'u4', 'u8', 'u9', 'u11', 'u14', 'u18']);

function messageUnreadCount() {
  return [...RECENT_THREADS_SEED, ...HUDDLE_MESSAGE_THREADS].reduce((n, t) => n + (t.unread || 0), 0);
}

function hydrateDirectThread(t) {
  return {
    ...t,
    user: TEST_USERS.find(u => u.id === t.userId),
    resident: RESIDENTS.find(r => r.id === t.residentId),
  };
}

function hydrateHuddleThread(t) {
  return {
    ...t,
    users: t.participants.map(id => TEST_USERS.find(u => u.id === id)).filter(Boolean),
    residents: t.residentIds.map(id => RESIDENTS.find(r => r.id === id)).filter(Boolean),
  };
}

function MessagesPage({ user, onOpenThread, onOpenChat, taggedResidentId }) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('threads');
  const [showStartHuddle, setShowStartHuddle] = useState(false);
  const unread = messageUnreadCount();
  const taggedResident = taggedResidentId ? RESIDENTS.find(r => r.id === taggedResidentId) : null;

  const directThreads = RECENT_THREADS_SEED.map(hydrateDirectThread).filter(t => t.user && t.resident);
  const huddleThreads = HUDDLE_MESSAGE_THREADS.map(hydrateHuddleThread);
  const allUsers = TEST_USERS.filter(u => u.id !== 'u1');
  const lowerQ = q.trim().toLowerCase();

  const filteredDirect = directThreads.filter(t =>
    !lowerQ || t.user.name.toLowerCase().includes(lowerQ)
      || t.resident.name.toLowerCase().includes(lowerQ)
      || t.preview.toLowerCase().includes(lowerQ)
  );
  const filteredHuddles = huddleThreads.filter(t =>
    !lowerQ || t.title.toLowerCase().includes(lowerQ)
      || t.preview.toLowerCase().includes(lowerQ)
      || t.residents.some(r => r.name.toLowerCase().includes(lowerQ))
      || t.users.some(u => u.name.toLowerCase().includes(lowerQ))
  );
  const filteredUsers = allUsers
    .filter(u => !lowerQ || u.name.toLowerCase().includes(lowerQ) || u.role.toLowerCase().includes(lowerQ))
    .sort((a, b) => Number(ONLINE_USER_IDS.has(b.id)) - Number(ONLINE_USER_IDS.has(a.id)) || a.name.localeCompare(b.name));

  function pickUser(u) {
    const r = taggedResident || RESIDENTS.find(x => x.risk === 'critical') || RESIDENTS[0];
    onOpenChat(r, u);
    setQ('');
  }

  return (
    <div style={{ height: 'calc(100vh - 86px)', minHeight: 620, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1C192E' }}>Messages</div>
          <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {taggedResident ? `${taggedResident.name} is tagged for new conversations.` : 'Care-team and huddle conversations with resident context preserved.'}
          </div>
        </div>
        {unread > 0 && <Chip tone="high" dot>{unread} unread</Chip>}
        <Button size="sm" variant="lavender" icon="video" onClick={() => setShowStartHuddle(true)}>Start Huddle</Button>
      </div>

      {taggedResident && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #EEEEEE', display: 'flex', gap: 10, alignItems: 'center', background: '#FAFAFC' }}>
          <Avatar initials={taggedResident.initials} seed={taggedResident.id} size={34} isResident />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#67568C' }}>Tagged resident</div>
            <div style={{ fontSize: 12, color: '#1C192E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {taggedResident.name} - Rm {taggedResident.room} - MRN {taggedResident.mrn}
            </div>
          </div>
          <RiskBadge level={taggedResident.risk} score={taggedResident.score} compact />
        </div>
      )}

      <div style={{ padding: '8px 10px 0', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, borderBottom: '1px solid #EEEEEE' }}>
        {[
          { id: 'threads', label: 'Threads', badge: RECENT_THREADS_SEED.reduce((n, t) => n + t.unread, 0) },
          { id: 'huddles', label: 'Huddles', badge: HUDDLE_MESSAGE_THREADS.reduce((n, t) => n + t.unread, 0) },
          { id: 'new', label: 'New' },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setQ(''); }} style={{
              minWidth: 0,
              background: 'transparent',
              border: 0,
              padding: '9px 8px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 900,
              color: active ? '#00795E' : '#6A7282',
              borderBottom: `2px solid ${active ? '#00C9A7' : 'transparent'}`,
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              {t.badge > 0 && (
                <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999, background: '#FF6E6C', color: '#fff', fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
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
            value={q}
            onInput={e => setQ(e.target.value)}
            placeholder={tab === 'new' ? 'Search team by name or role...' : 'Search messages, huddles, residents...'}
            style={{
              width: '100%', height: 38, padding: '0 12px 0 32px',
              border: '1px solid #E5E7EB', borderRadius: 8, font: '13px Inter',
              outline: 0, color: '#1C192E', background: '#FAFAFA',
            }}
          />
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, background: '#fff' }}>
        {tab === 'threads' && filteredDirect.map(t => (
          <DirectThreadRow key={t.id} t={t} onClick={() => onOpenThread(t.id)} />
        ))}
        {tab === 'threads' && filteredDirect.length === 0 && <EmptyMessages text="No messages match." />}

        {tab === 'huddles' && filteredHuddles.map(t => (
          <HuddleThreadRow key={t.id} t={t} onClick={() => onOpenThread(t.id)} />
        ))}
        {tab === 'huddles' && filteredHuddles.length === 0 && <EmptyMessages text="No huddle threads match." />}

        {tab === 'new' && filteredUsers.map(u => {
          const online = ONLINE_USER_IDS.has(u.id);
          return (
            <button key={u.id} onClick={() => pickUser(u)} style={{
              width: '100%', display: 'flex', gap: 12, alignItems: 'center',
              padding: '12px 16px', border: 0, background: online ? '#FBFFFD' : '#fff',
              borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar initials={u.initials} seed={u.id} size={34} />
                {online && <span style={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 9999, background: '#29BB89', border: '2px solid #fff' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2 }}>{u.role}</div>
              </div>
              <Chip tone={online ? 'online' : 'todo'} dot={online}>{online ? 'Online' : 'Offline'}</Chip>
              <Icon name="chevronRight" size={14} color="#99A1AF" />
            </button>
          );
        })}
        {tab === 'new' && filteredUsers.length === 0 && <EmptyMessages text="No team members match." />}
      </div>

      {showStartHuddle && <HuddleModal user={user || TEST_USERS[0]} onClose={() => setShowStartHuddle(false)} onOpenResident={() => {}} />}
    </div>
  );
}

function DirectThreadRow({ t, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', gap: 12, alignItems: 'center',
      padding: '13px 16px', border: 0, background: t.unread ? '#FAFAFC' : '#fff',
      borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
    }}>
      <Avatar initials={t.user.initials} seed={t.user.id} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user.name}</div>
          <div style={{ fontSize: 11, color: '#99A1AF', flexShrink: 0 }}>{t.time}</div>
        </div>
        <div style={{ fontSize: 11, color: '#67568C', fontWeight: 800, marginTop: 2 }}>Re: {t.resident.name} - Rm {t.resident.room}</div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
      </div>
      {t.unread > 0 && <UnreadBadge count={t.unread} />}
    </button>
  );
}

function HuddleThreadRow({ t, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', gap: 12, alignItems: 'center',
      padding: '13px 16px', border: 0, background: t.unread ? '#FAFAFC' : '#fff',
      borderBottom: '1px solid #F4F4F5', cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', marginLeft: 2, flexShrink: 0 }}>
        {t.users.slice(0, 3).map((u, i) => (
          <div key={u.id} style={{ marginLeft: i ? -10 : 0, border: '2px solid #fff', borderRadius: 9999 }}>
            <Avatar initials={u.initials} seed={u.id} size={34} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
          <div style={{ fontSize: 11, color: '#99A1AF', flexShrink: 0 }}>{t.time}</div>
        </div>
        <div style={{ fontSize: 11, color: '#00795E', fontWeight: 900, marginTop: 2 }}>
          {t.users.length} participants - {t.residents.map(r => r.name).join(', ')}
        </div>
        <div style={{ fontSize: 12, color: '#6A7282', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
      </div>
      {t.unread > 0 && <UnreadBadge count={t.unread} />}
    </button>
  );
}

function UnreadBadge({ count }) {
  return (
    <span style={{ width: 19, height: 19, borderRadius: 9999, background: '#845EC2', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{count}</span>
  );
}

function EmptyMessages({ text }) {
  return <div style={{ padding: 36, textAlign: 'center', color: '#6A7282', fontSize: 13 }}>{text}</div>;
}

function MessageThreadPage({ threadId, onBack, onOpenChat }) {
  const directSeed = RECENT_THREADS_SEED.find(t => t.id === threadId);
  const huddleSeed = HUDDLE_MESSAGE_THREADS.find(t => t.id === threadId);
  const isHuddle = !!huddleSeed;
  const seed = directSeed || huddleSeed || RECENT_THREADS_SEED[0];
  const direct = directSeed ? hydrateDirectThread(directSeed) : null;
  const huddle = huddleSeed ? hydrateHuddleThread(huddleSeed) : null;
  const user = direct ? direct.user : huddle.users[0];
  const resident = direct ? direct.resident : huddle.residents[0];
  const participants = isHuddle ? huddle.users : [user];
  const [draft, setDraft] = useState('');
  const [artifactMenuOpen, setArtifactMenuOpen] = useState(false);
  const [artifactView, setArtifactView] = useState(null);
  const conversationKind = isHuddle ? 'Huddle' : seed.id === 't5' ? 'Video Call' : 'Voice Call';
  const artifactTitle = artifactView === 'summary'
    ? `${conversationKind} Summary`
    : artifactView === 'transcription'
      ? `${conversationKind} Transcription`
      : `${conversationKind} Insight`;
  const [messages, setMessages] = useState(isHuddle ? [
    { id: 'm1', from: 'them', user: participants[1]?.name || 'Team', body: huddle.preview, time: seed.time },
    { id: 'm2', from: 'me', user: 'Sarah Chen', body: 'Please keep the open action owner and follow-up time visible in this thread.', time: 'now' },
    { id: 'm3', from: 'them', user: participants[2]?.name || 'Team', body: 'Acknowledged. I will update once the follow-up is complete.', time: 'now' },
  ] : [
    { id: 'm1', from: 'them', user: user.name, body: `I am reviewing ${resident.name}'s latest documentation now.`, time: seed.time },
    { id: 'm2', from: 'me', user: 'Sarah Chen', body: 'The baseline change was flagged. Can you confirm what changed clinically?', time: 'now' },
    { id: 'm3', from: 'them', user: user.name, body: seed.preview, time: seed.time },
  ]);

  function send() {
    if (!draft.trim()) return;
    setMessages(m => [...m, { id: 'm' + Date.now(), from: 'me', user: 'Sarah Chen', body: draft, time: 'now' }]);
    setDraft('');
  }

  return (
    <div style={{ height: 'calc(100vh - 176px)', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconButton icon="chevronLeft" title="Back to Messages" onClick={onBack} />
        {isHuddle ? (
          <div style={{ display: 'flex', marginLeft: -2, flexShrink: 0 }}>
            {participants.slice(0, 3).map((u, i) => (
              <div key={u.id} style={{ marginLeft: i ? -10 : 0, border: '2px solid #fff', borderRadius: 9999 }}>
                <Avatar initials={u.initials} seed={u.id} size={36} />
              </div>
            ))}
          </div>
        ) : (
          <Avatar initials={user.initials} seed={user.id} size={38} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1C192E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isHuddle ? huddle.title : user.name}
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button title="Conversation artifacts" onClick={() => setArtifactMenuOpen(o => !o)} style={{
                width: 28, height: 28, borderRadius: 9999, border: '1px solid #E5E7EB', background: artifactMenuOpen ? '#F5F2FD' : '#fff',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="moreVert" size={15} color={artifactMenuOpen ? '#67568C' : '#6A7282'} />
              </button>
              {artifactMenuOpen && (
                <div style={{
                  position: 'absolute', top: 32, right: 0, zIndex: 20, width: 190,
                  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                  boxShadow: '0 12px 22px -12px rgba(0,0,0,0.28)', padding: 5,
                }}>
                  {[
                    ['summary', 'View summary', 'fileText'],
                    ['transcription', 'View transcription', 'message'],
                    ['insight', 'View insight', 'sparkles'],
                  ].map(([id, label, icon]) => (
                    <button key={id} onClick={() => { setArtifactMenuOpen(false); setArtifactView(id); }} style={{
                      width: '100%', border: 0, background: 'transparent', borderRadius: 6, padding: '9px 10px',
                      display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', font: '800 12px Inter', color: '#1C192E', textAlign: 'left',
                    }}>
                      <Icon name={icon} size={14} color="#67568C" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#6A7282', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isHuddle ? `${participants.length} participants - ${huddle.residents.map(r => r.name).join(', ')}` : `${user.role} - re: ${resident.name}`}
          </div>
        </div>
        {isHuddle ? (
          <Button size="sm" variant="lavender" icon="video" onClick={() => emitToast('Opening huddle room.', 'info')}>Join</Button>
        ) : (
          <Button variant="secondary" size="sm" icon="message" onClick={() => onOpenChat(resident, user)}>Live Chat</Button>
        )}
      </div>

      <div style={{ padding: '9px 12px', borderBottom: '1px solid #EEEEEE', display: 'flex', gap: 10, alignItems: 'center', background: '#FAFAFC' }}>
        <Avatar initials={resident.initials} seed={resident.id} size={34} isResident />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#67568C' }}>{isHuddle ? 'Primary resident context' : 'Tagged resident'}</div>
          <div style={{ fontSize: 12, color: '#1C192E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resident.name} - Rm {resident.room} - MRN {resident.mrn}
          </div>
        </div>
        <RiskBadge level={resident.risk} score={resident.score} compact />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ alignSelf: 'center', fontSize: 11, color: '#67568C', background: '#F5F2FD', padding: '5px 10px', borderRadius: 9999 }}>
          Resident context and follow-up state preserved in this thread
        </div>
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
            {isHuddle && m.from !== 'me' && <div style={{ fontSize: 10, color: '#6A7282', margin: '0 0 3px 4px', fontWeight: 800 }}>{m.user}</div>}
            <div style={{
              padding: '9px 12px', borderRadius: m.from === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.from === 'me' ? '#845EC2' : '#fff', color: m.from === 'me' ? '#fff' : '#1C192E',
              border: m.from === 'me' ? 0 : '1px solid #E5E7EB',
              fontSize: 13, lineHeight: '18px',
            }}>{m.body}</div>
            <div style={{ fontSize: 10, color: '#99A1AF', marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid #EEEEEE', display: 'flex', gap: 8, alignItems: 'center', background: '#fff', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 3, boxShadow: '0 -10px 18px -18px rgba(0,0,0,0.45)' }}>
        <input value={draft} onInput={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={isHuddle ? 'Message the huddle...' : `Reply to ${user.short || user.name.split(' ')[0]}...`}
          style={{ flex: 1, minWidth: 0, border: '1px solid #E5E7EB', borderRadius: 9999, padding: '10px 14px', font: '13px Inter', outline: 0 }} />
        <button onClick={send} style={{ width: 38, height: 38, borderRadius: 9999, border: 0, background: '#845EC2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="send" size={15} color="#fff" />
        </button>
      </div>

      {artifactView && (
        <ModalShell title={artifactTitle} subtitle={`${isHuddle ? huddle.title : user.name} - completed ${conversationKind.toLowerCase()}`} onClose={() => setArtifactView(null)} width={560}>
          <ConversationArtifactContent kind={artifactView} isHuddle={isHuddle} huddle={huddle} user={user} resident={resident} messages={messages} />
        </ModalShell>
      )}
    </div>
  );
}

function ConversationArtifactContent({ kind, isHuddle, huddle, user, resident, messages }) {
  const speaker = isHuddle ? huddle.title : user.name;
  if (kind === 'transcription') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(m => (
          <div key={m.id} style={{ padding: 12, borderRadius: 9, border: '1px solid #EEEEEE', background: '#FAFAFC' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#6A7282' }}>{m.user || (m.from === 'me' ? 'Sarah Chen' : speaker)} · {m.time}</div>
            <div style={{ fontSize: 13, color: '#1C192E', lineHeight: '19px', marginTop: 5 }}>{m.body}</div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'insight') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          `${resident.name} remains the primary resident context for this conversation.`,
          isHuddle ? 'Multiple disciplines participated; keep the action owner and follow-up time explicit.' : `${user.short || user.role} should confirm the next documented follow-up.`,
          'Suggested continuity check: verify the outcome is reflected in Actions before shift handoff.',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#1C192E', lineHeight: '19px' }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#845EC2', marginTop: 7, flexShrink: 0 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 9, background: '#F5F2FD', border: '1px solid #D8C7F2', fontSize: 13, lineHeight: '19px', color: '#1C192E' }}>
        Conversation completed with resident context preserved for <b>{resident.name}</b>. Open items remain tied to follow-up ownership, timing, and handoff visibility.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Chip tone="domain">Resident: {resident.room}</Chip>
        <Chip tone="online" dot>Completed</Chip>
      </div>
    </div>
  );
}

function MessagesFab() {
  return null;
}

Object.assign(window, { MessagesPage, MessageThreadPage, ConversationArtifactContent, MessagesFab, RECENT_THREADS_SEED, HUDDLE_MESSAGE_THREADS, messageUnreadCount });


// ---- app/profile.jsx ----
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


// ---- app/app.jsx ----
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
        active={activeNav}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <main class="ois-page" style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 1024 }}>
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
HeaderIconButton = defineReactComponent(HeaderIconButton);
AppHeader = defineReactComponent(AppHeader);
SideNav = defineReactComponent(SideNav);
MobileDrawer = defineReactComponent(MobileDrawer);
MobileTabBar = defineReactComponent(MobileTabBar);
MenuPage = defineReactComponent(MenuPage);
NavItem = defineReactComponent(NavItem);
PageHeader = defineReactComponent(PageHeader);
LoginScreen = defineReactComponent(LoginScreen);
Field = defineReactComponent(Field);
DemoUserRow = defineReactComponent(DemoUserRow);
HomePage = defineReactComponent(HomePage);
ActionMiniStat = defineReactComponent(ActionMiniStat);
RiskDomainSummaryCard = defineReactComponent(RiskDomainSummaryCard);
HeroStat = defineReactComponent(HeroStat);
BriefBullet = defineReactComponent(BriefBullet);
SectionHeader = defineReactComponent(SectionHeader);
PriorityRow = defineReactComponent(PriorityRow);
RiskCategoryCard = defineReactComponent(RiskCategoryCard);
HuddleModal = defineReactComponent(HuddleModal);
AgentExecutionLog = defineReactComponent(AgentExecutionLog);
ActionStatusBadge = defineReactComponent(ActionStatusBadge);
DomainChip = defineReactComponent(DomainChip);
OperationalResidentCard = defineReactComponent(OperationalResidentCard);
UnitRiskHeatmap = defineReactComponent(UnitRiskHeatmap);
OperationalCognitionPanel = defineReactComponent(OperationalCognitionPanel);
ContinuityThreadPanel = defineReactComponent(ContinuityThreadPanel);
EvidenceSummaryPanel = defineReactComponent(EvidenceSummaryPanel);
SuggestedActionPanel = defineReactComponent(SuggestedActionPanel);
AIAssistantPage = defineReactComponent(AIAssistantPage);
AgentCommandBanner = defineReactComponent(AgentCommandBanner);
AiMiniStat = defineReactComponent(AiMiniStat);
FacilityAIDriver = defineReactComponent(FacilityAIDriver);
AgentOperatingLoop = defineReactComponent(AgentOperatingLoop);
ResidentAICard = defineReactComponent(ResidentAICard);
AiEvidenceBlock = defineReactComponent(AiEvidenceBlock);
SkillLearningCard = defineReactComponent(SkillLearningCard);
ResidentsList = defineReactComponent(ResidentsList);
ActiveFilterSummary = defineReactComponent(ActiveFilterSummary);
ResidentFilterSheet = defineReactComponent(ResidentFilterSheet);
FilterSelect = defineReactComponent(FilterSelect);
FilterRow = defineReactComponent(FilterRow);
SegmentedControl = defineReactComponent(SegmentedControl);
ViewBtn = defineReactComponent(ViewBtn);
ResidentRow = defineReactComponent(ResidentRow);
ResidentGridCard = defineReactComponent(ResidentGridCard);
ResidentProfile = defineReactComponent(ResidentProfile);
ProfileDetailTile = defineReactComponent(ProfileDetailTile);
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
ChangeFilterGrid = defineReactComponent(ChangeFilterGrid);
ChangeFeedCard = defineReactComponent(ChangeFeedCard);
WatchlistPage = defineReactComponent(WatchlistPage);
WatchlistCard = defineReactComponent(WatchlistCard);
WatchlistDetail = defineReactComponent(WatchlistDetail);
ChatDock = defineReactComponent(ChatDock);
ChatWindow = defineReactComponent(ChatWindow);
ActionsPage = defineReactComponent(ActionsPage);
ActionMetric = defineReactComponent(ActionMetric);
OperationalActionCard = defineReactComponent(OperationalActionCard);
ActionDetailPage = defineReactComponent(ActionDetailPage);
ClosurePage = defineReactComponent(ClosurePage);
ClosureField = defineReactComponent(ClosureField);
HuddlePage = defineReactComponent(HuddlePage);
StatCard = defineReactComponent(StatCard);
HuddleRow = defineReactComponent(HuddleRow);
HuddleDetail = defineReactComponent(HuddleDetail);
MessagesPage = defineReactComponent(MessagesPage);
DirectThreadRow = defineReactComponent(DirectThreadRow);
HuddleThreadRow = defineReactComponent(HuddleThreadRow);
UnreadBadge = defineReactComponent(UnreadBadge);
EmptyMessages = defineReactComponent(EmptyMessages);
MessageThreadPage = defineReactComponent(MessageThreadPage);
ConversationArtifactContent = defineReactComponent(ConversationArtifactContent);
MessagesFab = defineReactComponent(MessagesFab);
ProfilePage = defineReactComponent(ProfilePage);
SecurityField = defineReactComponent(SecurityField);
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
  HeaderIconButton,
  AppHeader,
  SideNav,
  MobileDrawer,
  MobileTabBar,
  MenuPage,
  NavItem,
  PageHeader,
  LoginScreen,
  Field,
  DemoUserRow,
  HomePage,
  ActionMiniStat,
  RiskDomainSummaryCard,
  HeroStat,
  BriefBullet,
  SectionHeader,
  PriorityRow,
  RiskCategoryCard,
  HuddleModal,
  AgentExecutionLog,
  ActionStatusBadge,
  DomainChip,
  OperationalResidentCard,
  UnitRiskHeatmap,
  OperationalCognitionPanel,
  ContinuityThreadPanel,
  EvidenceSummaryPanel,
  SuggestedActionPanel,
  AIAssistantPage,
  AgentCommandBanner,
  AiMiniStat,
  FacilityAIDriver,
  AgentOperatingLoop,
  ResidentAICard,
  AiEvidenceBlock,
  SkillLearningCard,
  ResidentsList,
  ActiveFilterSummary,
  ResidentFilterSheet,
  FilterSelect,
  FilterRow,
  SegmentedControl,
  ViewBtn,
  ResidentRow,
  ResidentGridCard,
  ResidentProfile,
  ProfileDetailTile,
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
  ChangeFilterGrid,
  ChangeFeedCard,
  WatchlistPage,
  WatchlistCard,
  WatchlistDetail,
  ChatDock,
  ChatWindow,
  ActionsPage,
  ActionMetric,
  OperationalActionCard,
  ActionDetailPage,
  ClosurePage,
  ClosureField,
  HuddlePage,
  StatCard,
  HuddleRow,
  HuddleDetail,
  MessagesPage,
  DirectThreadRow,
  HuddleThreadRow,
  UnreadBadge,
  EmptyMessages,
  MessageThreadPage,
  ConversationArtifactContent,
  MessagesFab,
  ProfilePage,
  SecurityField,
  App,
  ComingSoon,
});

createApp(App).mount('#root');
