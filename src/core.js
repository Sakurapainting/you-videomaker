const fs = require('node:fs');
const path = require('node:path');

const STATUSES = new Set(['supported', 'inference', 'open']);
const REQUIRED = ['slug', 'title', 'question', 'audience', 'sources', 'claims', 'options', 'decision'];

function readCase(caseDir) {
  const file = path.join(caseDir, 'case.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { data, file };
}

function list(value) { return Array.isArray(value) ? value : []; }
function strings(value) { return list(value).filter((x) => typeof x === 'string' && x.trim()); }
function ids(items) { return new Set(list(items).map((x) => x && x.id).filter(Boolean)); }
function duplicateIds(items) {
  const seen = new Set(), dup = new Set();
  for (const item of list(items)) { if (!item || !item.id) continue; if (seen.has(item.id)) dup.add(item.id); seen.add(item.id); }
  return [...dup];
}

function validateCase(caseDir) {
  const errors = [], warnings = [];
  let data;
  try { ({ data } = readCase(caseDir)); } catch (err) { return { errors: [`无法读取 case.json：${err.message}`], warnings: [], data: null }; }
  for (const key of REQUIRED) if (data[key] == null || data[key] === '') errors.push(`缺少字段 ${key}`);
  if (data.slug && !/^[a-z0-9][a-z0-9-]*$/.test(data.slug)) errors.push('slug 只能使用小写字母、数字和连字符');

  const sourceIds = ids(data.sources), claimIds = ids(data.claims), optionIds = ids(data.options);
  for (const group of [['sources', data.sources], ['claims', data.claims], ['options', data.options]]) {
    for (const id of duplicateIds(group[1])) errors.push(`${group[0]} 有重复 ID：${id}`);
  }
  if (data.sources && !Array.isArray(data.sources)) errors.push('sources 必须是数组');
  if (data.claims && !Array.isArray(data.claims)) errors.push('claims 必须是数组');
  if (data.options && !Array.isArray(data.options)) errors.push('options 必须是数组');

  const sourceRoot = path.resolve(caseDir, 'sources');
  for (const source of list(data.sources)) {
    if (!source || !source.id || !source.file) { errors.push('每个 source 需要 id 和 file'); continue; }
    const file = path.resolve(sourceRoot, source.file);
    if (file !== sourceRoot && !file.startsWith(sourceRoot + path.sep)) errors.push(`source ${source.id} 路径越过 sources 目录`);
    else if (!fs.existsSync(file)) errors.push(`source ${source.id} 文件不存在：${source.file}`);
    else if (!fs.readFileSync(file, 'utf8').trim()) errors.push(`source ${source.id} 文件为空：${source.file}`);
  }
  for (const claim of list(data.claims)) {
    if (!claim || !claim.id || !claim.text) { errors.push('每个 claim 需要 id 和 text'); continue; }
    if (!STATUSES.has(claim.status)) errors.push(`claim ${claim.id} 的 status 无效`);
    const refs = strings(claim.sources);
    for (const ref of refs) if (!sourceIds.has(ref)) errors.push(`claim ${claim.id} 引用了不存在的 source：${ref}`);
    if (claim.status === 'supported' && !refs.length) errors.push(`supported claim ${claim.id} 必须有 source`);
    if (claim.status === 'open') warnings.push(`claim ${claim.id} 仍是 open：${claim.text}`);
  }
  for (const option of list(data.options)) {
    if (!option || !option.id || !option.name) { errors.push('每个 option 需要 id 和 name'); continue; }
    if (!strings(option.benefits).length) errors.push(`option ${option.id} 缺少 benefits`);
    if (!strings(option.costs).length) errors.push(`option ${option.id} 缺少 costs`);
    if (!strings(option.risks).length) errors.push(`option ${option.id} 缺少 risks`);
    for (const ref of strings(option.evidence)) if (!claimIds.has(ref)) errors.push(`option ${option.id} 引用了不存在的 claim：${ref}`);
    if (option.score != null && (!Number.isFinite(option.score) || option.score < 0 || option.score > 5)) errors.push(`option ${option.id} 的 score 必须是 0 到 5`);
  }
  const decision = data.decision || {};
  if (!optionIds.has(decision.choice)) errors.push(`decision.choice 不是有效 option：${decision.choice || '（空）'}`);
  for (const ref of strings(decision.why)) if (!claimIds.has(ref)) errors.push(`decision.why 引用了不存在的 claim：${ref}`);
  if (!strings(decision.why).length) errors.push('decision.why 不能为空');
  for (const ref of strings(decision.open_questions)) if (!claimIds.has(ref)) errors.push(`decision.open_questions 引用了不存在的 claim：${ref}`);
  for (const [key, label] of [['conditions', 'conditions'], ['next_steps', 'next_steps'], ['acceptance', 'acceptance']]) if (!strings(decision[key]).length) errors.push(`decision.${label} 不能为空`);
  return { errors, warnings, data };
}

function renderCase(caseDir, result = validateCase(caseDir)) {
  if (!result.data) throw new Error(result.errors.join('\n'));
  const d = result.data, sourceById = new Map(d.sources.map((s) => [s.id, s]));
  const option = d.options.find((x) => x.id === d.decision.choice);
  const claimById = new Map(d.claims.map((c) => [c.id, c]));
  const confidence = d.claims.length ? Math.round(d.claims.filter((c) => c.status === 'supported').length / d.claims.length * 100) : 0;
  const lines = [`# ${d.title}`, '', `> ${d.question}`, '', `**受众**：${d.audience}  `, `**证据覆盖率**：${confidence}%（仅统计标记为 supported 的 claim）`, '', '## 结论', '', `选择 **${option.name}**。`, '', ...(d.decision.why || []).map((id) => `- ${claimById.get(id)?.text || id} [${id}]`), '', '## 方案比较', '', '| 方案 | 得分 | 优点 | 成本 | 风险 |', '|---|---:|---|---|---|'];
  for (const item of d.options) lines.push(`| ${item.name} | ${item.score ?? '—'} | ${strings(item.benefits).join('；')} | ${strings(item.costs).join('；')} | ${strings(item.risks).join('；')} |`);
  lines.push('', '## 执行条件', '', ...strings(d.decision.conditions).map((x) => `- ${x}`), '', '## 下一步', '', ...strings(d.decision.next_steps).map((x, i) => `${i + 1}. ${x}`), '', '## 验收标准', '', ...strings(d.decision.acceptance).map((x) => `- [ ] ${x}`));
  if (strings(d.decision.open_questions).length) lines.push('', '## 未决问题', '', ...d.decision.open_questions.map((id) => `- ${claimById.get(id)?.text || id} [${id}]`));
  lines.push('', '## Claims 与来源', '', '| ID | 状态 | 陈述 | 来源 |', '|---|---|---|---|');
  for (const claim of d.claims) lines.push(`| ${claim.id} | ${claim.status} | ${claim.text} | ${strings(claim.sources).map((id) => sourceById.get(id)?.title || id).join('；') || '—'} |`);
  lines.push('', '## 来源', '');
  for (const source of d.sources) lines.push(`- **${source.id}** ${source.title}（${source.kind || '未分类'}）：\`${source.file}\`${source.url ? `，${source.url}` : ''}`);
  return lines.join('\n') + '\n';
}

module.exports = { validateCase, renderCase };
