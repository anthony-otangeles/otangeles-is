import fs from 'node:fs/promises';
import path from 'node:path';

function slugFromPath(filePath) {
  const parent = path.basename(path.dirname(filePath || 'skill'));
  return parent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'skill';
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, body: markdown };

  const data = {};
  let currentKey = null;
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      data[currentKey] = value === '' ? [] : value.replace(/^["']|["']$/g, '');
      continue;
    }

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(listMatch[1].trim().replace(/^["']|["']$/g, ''));
    }
  }

  return { data, body: markdown.slice(match[0].length) };
}

function parseSections(markdown) {
  const sections = {};
  let current = null;

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim().toLowerCase();
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, lines]) => [key, lines.join('\n').trim()])
  );
}

function parseTriggerSection(section = '') {
  return section
    .split('\n')
    .map(line => line.trim().match(/^-\s+([^:]+):\s*(.+)$/))
    .filter(Boolean)
    .map(match => ({ id: match[1].trim(), description: match[2].trim() }));
}

function parseJsonFence(section = '') {
  const fenced = section.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1] : section;
  try {
    return JSON.parse(raw);
  } catch {
    return { type: 'object', properties: {}, raw: raw.trim() };
  }
}

export class SkillRegistry {
  constructor({ rootDir = path.resolve(process.cwd(), 'skills') } = {}) {
    this.rootDir = rootDir;
    this.skills = new Map();
  }

  static parseSkillMarkdown(markdown, filePath = 'SKILL.md') {
    const { data: frontmatter, body } = parseFrontmatter(markdown);
    const sections = parseSections(body);
    const systemPrompt = sections['system prompt'] || frontmatter.system_prompt || '';
    const requiredDataTriggers = parseTriggerSection(
      sections['required data triggers'] || sections['data triggers'] || ''
    );
    const expectedOutputSchema = parseJsonFence(
      sections['expected output schema'] || sections['output schema'] || ''
    );

    return {
      id: frontmatter.id || slugFromPath(filePath),
      name: frontmatter.name || frontmatter.id || slugFromPath(filePath),
      version: frontmatter.version || '0.0.0',
      tools: Array.isArray(frontmatter.tools) ? frontmatter.tools : [],
      systemPrompt: systemPrompt.replace(/\s+/g, ' ').trim(),
      requiredDataTriggers,
      expectedOutputSchema,
      filePath,
      rawMarkdown: markdown,
    };
  }

  async loadSkill(fileOrDir) {
    const filePath = fileOrDir.endsWith('SKILL.md') ? fileOrDir : path.join(fileOrDir, 'SKILL.md');
    const markdown = await fs.readFile(filePath, 'utf8');
    const skill = SkillRegistry.parseSkillMarkdown(markdown, filePath);
    this.skills.set(skill.id, skill);
    return skill;
  }

  async loadAll() {
    const entries = await fs.readdir(this.rootDir, { withFileTypes: true });
    const skillDirs = entries.filter(entry => entry.isDirectory());
    const loaded = [];

    for (const dir of skillDirs) {
      const filePath = path.join(this.rootDir, dir.name, 'SKILL.md');
      try {
        loaded.push(await this.loadSkill(filePath));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }

    return loaded;
  }

  get(id) {
    return this.skills.get(id);
  }

  list() {
    return [...this.skills.values()];
  }
}
