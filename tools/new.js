#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const [slug, ...rest] = process.argv.slice(2);
const arg = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : ''; };
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('用法：node tools/new.js <slug> --title "..." --question "..."'); process.exit(2); }
const dir = path.resolve('cases', slug); if (fs.existsSync(dir)) { console.error(`已存在：${dir}`); process.exit(1); }
fs.mkdirSync(path.join(dir, 'sources'), { recursive: true }); fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
const data = {
  slug, title: arg('title') || slug, question: arg('question') || '待定义的问题', audience: '项目决策者',
  sources: [{ id: 's1', title: '第一份来源', file: 'source-1.md', kind: 'primary' }],
  claims: [{ id: 'c1', text: '待从来源中提炼的事实', status: 'open', sources: [] }],
  options: [{ id: 'a', name: '待定义方案', benefits: ['待补充'], costs: ['待补充'], risks: ['待补充'], evidence: [], score: 0 }],
  decision: { choice: 'a', why: [], conditions: ['待补充'], next_steps: ['待补充'], acceptance: ['待补充'], open_questions: ['c1'] },
};
fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'sources', 'source-1.md'), '# 第一份来源\n\n记录原始材料、版本和日期。\n');
console.log(`已创建 cases/${slug}`);
