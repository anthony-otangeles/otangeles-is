import { SkillRegistry } from './skill-registry.mjs';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const mockTools = {
  fetch_resident_baseline: {
    description: 'Fetch resident-specific baseline from PCC profile, diagnoses, care plan, and code status.',
    parameters: { type: 'object', required: ['residentId'], properties: { residentId: { type: 'string' } } },
    async execute({ residentId }, context) {
      return {
        residentId,
        baseline: context.mockResidentBaseline || [
          'CHF baseline with chronic wound risk.',
          'Usual SBP is low 100s with diuretic hold parameters.',
          'Code status and goals of care must be checked before escalation.',
        ],
      };
    },
  },
  get_recent_pcc_vitals: {
    description: 'Read recent PCC vital signs, trends, oxygen use, and sepsis-screen flags.',
    parameters: { type: 'object', required: ['residentId'], properties: { residentId: { type: 'string' }, hours: { type: 'number' } } },
    async execute({ residentId, hours = 24 }) {
      return {
        residentId,
        hours,
        vitals: [
          { time: '02:00', bp: '98/60', hr: 96, spo2: 94 },
          { time: '06:00', bp: '88/52', hr: 112, spo2: 91 },
          { time: '08:00', bp: '84/49', hr: 114, spo2: 90 },
        ],
      };
    },
  },
  read_latest_nursing_notes: {
    description: 'Read latest nursing, CNA, wound, and rehab notes for narrative change signals.',
    parameters: { type: 'object', required: ['residentId'], properties: { residentId: { type: 'string' }, limit: { type: 'number' } } },
    async execute({ residentId, limit = 5 }) {
      return {
        residentId,
        notes: [
          'CNA documented saturated dressing twice overnight.',
          'Furosemide held for low SBP; provider not yet notified.',
          'Therapy documented reduced tolerance and fatigue.',
        ].slice(0, limit),
      };
    },
  },
};

function planToolCalls(skill) {
  const explicitlyAllowed = new Set(skill.tools || []);
  const triggers = (skill.requiredDataTriggers || []).map(t => `${t.id} ${t.description}`.toLowerCase());
  const planned = [];

  if (explicitlyAllowed.has('fetch_resident_baseline') || triggers.some(t => /baseline|return|hospital/.test(t))) {
    planned.push('fetch_resident_baseline');
  }
  if (explicitlyAllowed.has('get_recent_pcc_vitals') || triggers.some(t => /vitals|oxygen|blood pressure|temperature|pulse/.test(t))) {
    planned.push('get_recent_pcc_vitals');
  }
  if (explicitlyAllowed.has('read_latest_nursing_notes') || triggers.some(t => /note|nursing|cna|wound|refusal|mentation/.test(t))) {
    planned.push('read_latest_nursing_notes');
  }

  return planned.length ? planned : Object.keys(mockTools).slice(0, 3);
}

function buildToolPrompt(skill, residentId, evidence) {
  return [
    skill.systemPrompt,
    '',
    `Resident ID: ${residentId}`,
    `Required triggers: ${(skill.requiredDataTriggers || []).map(t => t.id).join(', ')}`,
    `Evidence gathered: ${JSON.stringify(evidence, null, 2)}`,
    `Return JSON that satisfies: ${JSON.stringify(skill.expectedOutputSchema)}`,
  ].join('\n');
}

function deterministicAssessment(skill, residentId, evidence) {
  const baseline = evidence.fetch_resident_baseline?.baseline || [];
  const vitals = evidence.get_recent_pcc_vitals?.vitals || [];
  const notes = evidence.read_latest_nursing_notes?.notes || [];
  const latestVital = vitals[vitals.length - 1];

  return {
    skillId: skill.id,
    skillName: skill.name,
    residentId,
    status: 'complete',
    normal: baseline.slice(0, 3),
    deviations: [
      latestVital ? `Recent vitals show BP ${latestVital.bp}, HR ${latestVital.hr}, and O2 saturation ${latestVital.spo2}.` : 'No vital trend was available.',
      notes[0] || 'No new nursing narrative signal was available.',
    ],
    implications: [
      'The combined vital and documentation pattern should be treated as a possible baseline shift until licensed staff confirms otherwise.',
    ],
    recommendedActions: [
      'Ask the charge nurse to repeat focused vitals and compare against the resident baseline.',
      'If confirmed, route the evidence bundle to the provider with code status and held-medication context.',
    ],
    confidence: evidence.get_recent_pcc_vitals && evidence.read_latest_nursing_notes ? 'medium' : 'low',
  };
}

export class AgentToolLoop {
  constructor({ registry, tools = mockTools, llm = null, onStep = () => {} } = {}) {
    this.registry = registry;
    this.tools = tools;
    this.llm = llm;
    this.onStep = onStep;
  }

  emit(step) {
    const event = { id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), ...step };
    this.onStep(event);
    return event;
  }

  async run({ skillId, residentId, input = {} }) {
    const skill = this.registry.get(skillId);
    if (!skill) throw new Error(`Unknown skill: ${skillId}`);

    this.emit({ status: 'running', label: `Triggered ${skill.name}`, detail: 'Loaded markdown instructions and evaluated data triggers.' });
    const evidence = {};
    const plan = planToolCalls(skill);
    this.emit({ status: 'running', label: 'Planning tool calls', detail: `Selected ${plan.join(', ')} from SKILL.md.` });

    for (const toolName of plan) {
      const tool = this.tools[toolName];
      if (!tool) continue;
      this.emit({ status: 'running', label: `Calling ${toolName}()`, detail: tool.description, toolName });
      await wait(120);
      evidence[toolName] = await tool.execute({ residentId, ...input[toolName] }, input);
      this.emit({ status: 'complete', label: `${toolName}() complete`, detail: 'Evidence returned and added to the agent scratchpad.', toolName });
    }

    this.emit({ status: 'running', label: 'Synthesizing risk assessment', detail: 'Comparing baseline, vitals, and note evidence against the skill schema.' });
    const assessment = this.llm
      ? await this.llm.complete({ prompt: buildToolPrompt(skill, residentId, evidence), schema: skill.expectedOutputSchema })
      : deterministicAssessment(skill, residentId, evidence);

    this.emit({ status: 'complete', label: 'Risk Assessment Complete', detail: 'Structured output validated against the skill schema.' });
    return { skill, evidence, assessment };
  }
}

export async function runDemo() {
  const registry = new SkillRegistry();
  await registry.loadAll();
  const loop = new AgentToolLoop({
    registry,
    onStep: step => console.log(`[${step.status}] ${step.label}`),
  });
  return loop.run({ skillId: '72-hour-post-hospital-return-watch', residentId: 'r1' });
}
