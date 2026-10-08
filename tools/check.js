#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { validateCase } = require('../src/core');

const dir = path.resolve(process.argv[2] || '');
if (!dir || !fs.existsSync(dir)) { console.error('用法：node tools/check.js cases/<slug>'); process.exit(2); }
const result = validateCase(dir);
for (const e of result.errors) console.log(`✗ ${e}`);
for (const w of result.warnings) console.log(`! ${w}`);
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'check.json'), JSON.stringify({ ok: result.errors.length === 0, errors: result.errors, warnings: result.warnings }, null, 2) + '\n');
console.log(result.errors.length ? `\n不通过：${result.errors.length} 个错误` : `\n通过：${result.warnings.length} 个警告`);
process.exit(result.errors.length ? 1 : 0);
