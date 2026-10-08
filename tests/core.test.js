const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateCase, renderCase } = require('../src/core');

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-forge-'));
  fs.mkdirSync(path.join(dir, 'sources'));
  fs.writeFileSync(path.join(dir, 'sources', 's.md'), 'source');
  fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify({
    slug: 'x', title: '标题', question: '问题', audience: '团队',
    sources: [{ id: 's1', title: '来源', file: 's.md' }],
    claims: [{ id: 'c1', text: '事实', status: 'supported', sources: ['s1'] }],
    options: [{ id: 'a', name: '方案', benefits: ['快'], costs: ['维护'], risks: ['遗漏'], evidence: ['c1'], score: 4 }],
    decision: { choice: 'a', why: ['c1'], conditions: ['条件'], next_steps: ['动作'], acceptance: ['检查'] },
  }, null, 2));
  return dir;
}

test('valid case passes and renders', () => {
  const dir = fixture(); const result = validateCase(dir);
  assert.deepEqual(result.errors, []);
  assert.match(renderCase(dir, result), /# 标题/);
});

test('supported claim without a source fails', () => {
  const dir = fixture(); const data = JSON.parse(fs.readFileSync(path.join(dir, 'case.json')));
  data.claims[0].sources = []; fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify(data));
  assert.ok(validateCase(dir).errors.some((x) => x.includes('必须有 source')));
});

test('missing source file fails', () => {
  const dir = fixture(); const data = JSON.parse(fs.readFileSync(path.join(dir, 'case.json')));
  data.sources[0].file = 'missing.md'; fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify(data));
  assert.ok(validateCase(dir).errors.some((x) => x.includes('文件不存在')));
});
