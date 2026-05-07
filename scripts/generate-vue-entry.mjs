import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'app/primitives.jsx',
  'app/data.jsx',
  'app/shell.jsx',
  'app/login.jsx',
  'app/home.jsx',
  'app/residents.jsx',
  'app/changes.jsx',
  'app/huddle.jsx',
  'app/messages-fab.jsx',
  'app/app.jsx',
];

const header = `import { createApp, defineComponent, isVNode, nextTick, onUnmounted, ref as vueRef, shallowRef } from 'vue';

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

`;

const wrapFooter = names => `
${names.map(name => `${name} = defineReactComponent(${name});`).join('\n')}

Object.assign(window, {
${names.map(name => `  ${name},`).join('\n')}
});

createApp(App).mount('#root');
`;

let body = '';
const componentNames = new Set();

for (const file of files) {
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  source = source
    .replace("const { useState, useEffect, useRef, useMemo } = React;\n\n", '')
    .replace(/ReactDOM\.createRoot\(document\.getElementById\('root'\)\)\.render\(<App \/>\);\n?/g, '')
    .replace(/\bclassName=/g, 'class=')
    .replace(/<textarea([^>]*?)\sonChange=/g, '<textarea$1 onInput=')
    .replace(/<input(\s+(?!type="radio")[^>]*?)\sonChange=/g, '<input$1 onInput=')
    .replace("function Input({ icon, rightIcon, placeholder, value, onChange, type = 'text', style, onFocus, onBlur })", "function Input({ icon, rightIcon, placeholder, value, onChange, type = 'text', style, onFocus, onBlur, onKeyDown })")
    .replace('<input type={type} value={value} onInput={onChange} placeholder={placeholder}', '<input type={type} value={value} onInput={onChange} onKeyDown={onKeyDown} placeholder={placeholder}')
    .replace("function Button({ variant = 'primary', icon, rightIcon, children, onClick, style, size = 'md' })", "function Button({ variant = 'primary', icon, rightIcon, children, onClick, style, size = 'md', disabled })")
    .replace('<button onClick={onClick}\\n      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}', '<button onClick={onClick} disabled={disabled}\\n      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}')
    .replace("borderRadius: 5, cursor: 'pointer', display: 'inline-flex',", "borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, display: 'inline-flex',");

  for (const match of source.matchAll(/^function ([A-Z][A-Za-z0-9_]*)\b/gm)) {
    componentNames.add(match[1]);
  }

  body += `\n// ---- ${file} ----\n${source}\n`;
}

fs.writeFileSync(
  path.join(root, 'src/main.jsx'),
  header + body + wrapFooter([...componentNames]),
);
