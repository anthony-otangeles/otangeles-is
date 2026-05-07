const pages = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = pages.find(p => p.type === 'page' && p.url.startsWith('http://localhost:5173/'));

if (!page) {
  throw new Error('Could not find the Vite page in Chrome DevTools.');
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const problems = [];
let nextId = 1;

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }

  if (message.method === 'Runtime.exceptionThrown') {
    problems.push(message.params.exceptionDetails.text);
  }

  if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
    problems.push(message.params.entry.text);
  }

  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    problems.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
  }
});

await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});

await send('Page.navigate', { url: `http://localhost:5173/?smoke=${Date.now()}` });

async function evaluate(expression) {
  return send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
}

async function waitForText(text, timeout = 3000) {
  const result = await evaluate(`new Promise(resolve => {
    const start = Date.now();
    const timer = setInterval(() => {
      const bodyText = document.body.innerText;
      if (bodyText.includes(${JSON.stringify(text)}) || Date.now() - start > ${timeout}) {
        clearInterval(timer);
        resolve(bodyText.includes(${JSON.stringify(text)}));
      }
    }, 50);
  })`);
  return result.result.value;
}

async function clickButton(label) {
  const result = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')]
      .find(el => el.textContent.trim().includes(${JSON.stringify(label)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  return result.result.value;
}

async function clickNav(label) {
  const result = await evaluate(`(() => {
    const button = [...document.querySelectorAll('nav button')]
      .find(el => el.textContent.trim().includes(${JSON.stringify(label)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  return result.result.value;
}

async function openDrawer() {
  const result = await evaluate(`(() => {
    const button = document.querySelector('button[title="Menu"]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  return result.result.value;
}

if (!await waitForText('Sign in')) {
  throw new Error('Login screen did not render.');
}

const loginCardStyled = await evaluate(`(() => {
  const card = [...document.querySelectorAll('div')]
    .find(el => {
      const styles = getComputedStyle(el);
      return el.textContent.includes('Continue to your facility workspace.')
        && styles.backgroundColor === 'rgb(255, 255, 255)'
        && styles.borderRadius === '12px';
    });
  if (!card) return false;
  const styles = getComputedStyle(card);
  return styles.borderRadius === '12px' && styles.paddingTop === '36px';
})()`);

if (!loginCardStyled.result.value) {
  throw new Error('Login screen styles did not normalize correctly.');
}

if (!await clickButton('Sign In')) {
  throw new Error('Could not click the Sign In button.');
}

if (!await waitForText("Today's Priority")) {
  throw new Error('Sign-in did not reach the home dashboard.');
}

const dashboardStyled = await evaluate(`(() => {
  const header = document.querySelector('header');
  if (!header) return false;
  return getComputedStyle(header).height === '60px';
})()`);

if (!dashboardStyled.result.value) {
  throw new Error('Dashboard shell styles did not normalize correctly.');
}

const compactShell = await evaluate(`(() => {
  const hasBottomNav = [...document.querySelectorAll('nav button')]
    .some(el => el.textContent.includes('Home'))
    && [...document.querySelectorAll('nav button')].some(el => el.textContent.includes('Residents'));
  const hasDesktopSideNav = [...document.querySelectorAll('aside')]
    .some(el => getComputedStyle(el).position === 'sticky');
  return hasBottomNav && !hasDesktopSideNav;
})()`);

if (!compactShell.result.value) {
  throw new Error('Compact phone shell did not render.');
}

const routes = [
  ['Changes', 'Generate AI Brief'],
  ['Residents', 'Add Resident'],
  ['Watch', 'Custom Watchlist'],
];

for (const [button, expectedText] of routes) {
  if (!await clickNav(button)) {
    throw new Error(`Could not click ${button}.`);
  }
  if (!await waitForText(expectedText)) {
    throw new Error(`${button} page did not render.`);
  }
}

if (!await openDrawer()) {
  throw new Error('Could not open the mobile drawer.');
}

if (!await clickNav('Huddle')) {
  throw new Error('Could not click Huddle from the mobile drawer.');
}

if (!await waitForText('Start Huddle')) {
  throw new Error('Huddle page did not render.');
}

await send('Emulation.setDeviceMetricsOverride', {
  width: 820,
  height: 1180,
  deviceScaleFactor: 1,
  mobile: false,
});

const tabletShell = await evaluate(`(() => {
  const hasBottomNav = [...document.querySelectorAll('nav button')]
    .some(el => el.textContent.includes('Home'))
    && [...document.querySelectorAll('nav button')].some(el => el.textContent.includes('Watch'));
  const hasDesktopSideNav = [...document.querySelectorAll('aside')]
    .some(el => getComputedStyle(el).position === 'sticky');
  const main = document.querySelector('main.ois-page');
  return hasBottomNav && !hasDesktopSideNav && main && main.getBoundingClientRect().width <= 1024;
})()`);

if (!tabletShell.result.value) {
  throw new Error('Tablet shell did not stay compact.');
}

if (problems.length) {
  throw new Error(`Browser reported issues:\n${problems.join('\n')}`);
}

socket.close();
console.log('Vue smoke test passed: phone/tablet shell, styles, and main routes rendered.');
