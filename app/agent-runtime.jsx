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
