#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { validateCase, renderCase } = require('../src/core');

const dir = path.resolve(process.argv[2] || '');
if (!dir || !fs.existsSync(dir)) { console.error('用法：node tools/render.js cases/<slug>'); process.exit(2); }
const result = validateCase(dir);
if (result.errors.length) { console.error(result.errors.map((x) => `✗ ${x}`).join('\n')); process.exit(1); }
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'brief.md'); fs.writeFileSync(file, renderCase(dir, result));
console.log(`已生成 ${path.relative(process.cwd(), file).replace(/\\/g, '/')}`);
