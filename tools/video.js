#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { validateCase, renderCase } = require('../src/core');

const caseDir = path.resolve(process.argv[2] || '');
const flags = new Set(process.argv.slice(3));
const fpsOverride = Number(process.env.VIDEOMAKER_FPS || 0);

function fail(message) { console.error(`视频生产失败：${message}`); process.exit(1); }
function exists(file) { try { return fs.existsSync(file); } catch { return false; } }
function commandWorks(command, args = ['-version']) {
  try { return spawnSync(command, args, { stdio: 'ignore' }).status === 0; } catch { return false; }
}
function walkFor(root, filename, maxDepth = 5, depth = 0) {
  if (!root || depth > maxDepth || !exists(root)) return null;
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return null; }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) return full;
    if (entry.isDirectory()) { const hit = walkFor(full, filename, maxDepth, depth + 1); if (hit) return hit; }
  }
  return null;
}
function findTool(kind) {
  const envKey = `VIDEOMAKER_${kind.toUpperCase()}`;
  if (process.env[envKey] && exists(process.env[envKey])) return process.env[envKey];
  const name = `${kind}.exe`;
  if (commandWorks(kind)) return kind;
  const candidates = kind === 'chrome'
    ? [
        path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ]
    : [
        path.join(process.env.ProgramFiles || '', 'ffmpeg', 'bin', name),
        walkFor(path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages'), name),
      ];
  return candidates.find((candidate) => candidate && exists(candidate)) || null;
}
function spawnChecked(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: options.stdio || ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    if (child.stdout) child.stdout.on('data', (x) => { stdout += x; });
    if (child.stderr) child.stderr.on('data', (x) => { stderr += x; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exited ${code}: ${stderr.trim()}`)));
  });
}
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x])); }
function srtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}
function htmlFor(video) {
  const scenes = JSON.stringify(video.scenes);
  const theme = JSON.stringify(video.theme);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:${video.format.width}px;height:${video.format.height}px;overflow:hidden;background:${video.theme.background};color:${video.theme.ink};font-family:Arial,"Microsoft YaHei",sans-serif}#stage{position:relative;width:100%;height:100%;overflow:hidden;background:${video.theme.background}}#grain{position:absolute;inset:0;opacity:.07;background-image:repeating-linear-gradient(0deg,transparent 0 7px,rgba(255,255,255,.22) 8px),repeating-linear-gradient(90deg,transparent 0 11px,rgba(0,0,0,.18) 12px)}#brand{position:absolute;left:72px;top:74px;font-size:44px;font-weight:800;letter-spacing:1px;z-index:4}#brand b{color:${video.theme.accent}}#progress{position:absolute;left:72px;right:72px;bottom:72px;height:5px;background:rgba(255,255,255,.2);z-index:5}#progress i{display:block;height:100%;width:0;background:${video.theme.accent};transform-origin:left}#scene{position:absolute;inset:0;opacity:0;transform:translateY(32px) scale(.98);z-index:2}#kicker{position:absolute;left:72px;top:315px;color:${video.theme.accent};font-size:30px;font-weight:700;letter-spacing:2px}#headline{position:absolute;left:72px;right:72px;top:390px;font-size:74px;line-height:1.1;font-weight:800;white-space:pre-wrap}#body{position:absolute;left:72px;right:72px;top:560px;font-size:42px;line-height:1.35;color:${video.theme.muted || '#9bb2aa'};white-space:pre-wrap}#orb{position:absolute;right:80px;top:215px;width:260px;height:260px;border-radius:50%;border:8px solid ${video.theme.accent};opacity:.22}#orb:after{content:"";position:absolute;inset:42px;border-radius:50%;border:8px solid ${video.theme.ink};background:${video.theme.accent};opacity:.6}.chat{position:absolute;left:72px;right:72px;top:350px}.prompt,.reply{border-radius:28px;padding:30px 34px;line-height:1.25;white-space:pre-wrap}.prompt{margin-left:90px;background:#edf5f1;color:#18261f;font-size:37px;box-shadow:0 16px 45px rgba(0,0,0,.15)}.reply{margin-top:34px;margin-right:90px;background:#20352e;border:2px solid ${video.theme.accent};font-size:38px}.reply small{display:block;color:${video.theme.accent};font-size:24px;letter-spacing:2px;margin-bottom:15px}.cta{position:absolute;left:72px;right:72px;top:580px;text-align:center}.cta #headline{position:static;font-size:72px}.cta #body{position:static;margin-top:34px;font-size:40px}.visible{opacity:1!important;transform:none!important}
</style></head><body><div id="stage"><div id="grain"></div><div id="brand">Chat<b>GPT</b></div><div id="orb"></div><div id="scene"><div id="kicker"></div><div id="headline"></div><div id="body"></div><div class="chat"><div class="prompt"></div><div class="reply"><small>CHATGPT</small><span></span></div></div><div class="cta"><div id="headline"></div><div id="body"></div></div></div><div id="progress"><i></i></div></div><script>
const scenes=${scenes};const theme=${theme};const root=document.getElementById('scene'),orb=document.getElementById('orb'),kicker=document.getElementById('kicker'),headline=document.querySelector('#scene>\#headline'),body=document.querySelector('#scene>\#body'),chat=document.querySelector('.chat'),prompt=document.querySelector('.prompt'),reply=document.querySelector('.reply'),replyText=document.querySelector('.reply span'),cta=document.querySelector('.cta'),ctaHead=document.querySelector('.cta #headline'),ctaBody=document.querySelector('.cta #body'),progress=document.querySelector('#progress i'),duration=${video.format.duration};
function clamp(v){return Math.max(0,Math.min(1,v))}function ease(v){return 1-Math.pow(1-v,3)}function seek(t){const s=scenes.find(x=>t>=x.from&&t<=x.to)||scenes[scenes.length-1];const p=clamp((t-s.from)/(s.to-s.from));const on=s.kind==='conversation';root.className='visible';root.style.opacity=String(Math.min(1,p*5,(1-p)*5+0.2));root.style.transform='translateY('+((1-ease(clamp(p*3)))*32)+'px) scale('+(.98+ease(clamp(p*3))*.02)+')';orb.style.opacity=s.kind==='hook'?String(.12+ease(p)*.3):'0';kicker.textContent=s.kind==='hook'?'A CONVERSATION':s.kind==='cta'?'FROM IDEA TO ACTION':'';headline.textContent=s.kind==='hook'?s.body:'';body.textContent='';chat.style.display=on?'block':'none';cta.style.display=s.kind==='cta'?'block':'none';if(on){kicker.textContent=s.title;prompt.textContent=s.prompt;replyText.textContent=s.reply;chat.style.transform='translateY('+((1-ease(p))*42)+'px)';reply.style.transform='translateX('+((1-ease(clamp((p-.22)*2.2)))*80)+'px)';reply.style.opacity=String(ease(clamp((p-.22)*2.2)));}if(s.kind==='cta'){ctaHead.textContent=s.title;ctaBody.textContent=s.body;cta.style.transform='translateY('+((1-ease(p))*34)+'px)';}progress.style.width=(t/duration*100)+'%';}window.seek=seek;seek(0);document.body.dataset.ready='1';
</script></body></html>`;
}
function parseProbe(text) {
  const duration = Number((text.match(/duration=([\d.]+)/) || [])[1]);
  const stream = { width: Number((text.match(/width=(\d+)/) || [])[1]), height: Number((text.match(/height=(\d+)/) || [])[1]), codec: (text.match(/codec_name=([^\r\n]+)/) || [])[1] };
  return { duration, stream };
}
async function renderFrames(htmlFile, video, silentFile, chrome, ffmpeg) {
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: video.format.width, height: video.format.height, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const frames = Math.round(video.format.duration * video.format.fps);
  const encoder = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(video.format.fps), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-t', String(video.format.duration), silentFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  let sent = 0;
  try {
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.seek(t), i / video.format.fps);
      const image = await page.screenshot({ type: 'png' });
      if (!encoder.stdin.write(image)) await once(encoder.stdin, 'drain');
      sent++;
    }
  } finally { encoder.stdin.end(); await once(encoder, 'close'); await browser.close(); }
  if (sent !== frames) throw new Error(`只渲染了 ${sent}/${frames} 帧`);
}
async function makeVoice(video, output, python) {
  const env = { ...process.env, VIDEOMAKER_TTS_TEXT: video.voice.text, VIDEOMAKER_TTS_VOICE: video.voice.voice, VIDEOMAKER_TTS_RATE: video.voice.rate, VIDEOMAKER_TTS_OUTPUT: output };
  await spawnChecked(python, [path.join(__dirname, 'tts.py')], { env, stdio: ['ignore', 'inherit', 'inherit'] });
}
async function main() {
  if (!caseDir) fail('用法：node tools/video.js cases/<slug>');
  const result = validateCase(caseDir);
  if (result.errors.length) fail(result.errors.join('\n'));
  const data = result.data, video = data.video;
  if (!video || !video.format || !Array.isArray(video.scenes) || !video.voice) fail('case.json 缺少 video.format、video.scenes 或 video.voice');
  const format = { ...video.format, fps: fpsOverride || video.format.fps };
  if (![format.width, format.height, format.fps, format.duration].every(Number.isFinite)) fail('video.format 的 width、height、fps、duration 必须是数字');
  if (!Number.isInteger(format.width) || !Number.isInteger(format.height) || format.width < 256 || format.height < 256 || format.fps < 1 || format.duration <= 0) fail('video.format 数值超出范围');
  if (typeof video.voice.text !== 'string' || !video.voice.text.trim()) fail('video.voice.text 不能为空');
  const sceneKinds = new Set(['hook', 'conversation', 'cta']);
  let previous = 0;
  for (const scene of video.scenes) {
    if (!scene || !sceneKinds.has(scene.kind) || !Number.isFinite(scene.from) || !Number.isFinite(scene.to) || Math.abs(scene.from - previous) > 1e-6 || scene.to <= scene.from || scene.to > format.duration) fail(`场景 ${scene?.id || '（未知）'} 的时间段不连续或越界`);
    previous = scene.to;
  }
  if (!video.scenes.length) fail('video.scenes 不能为空');
  if (previous !== format.duration) fail(`场景只覆盖到 ${previous} 秒，目标是 ${format.duration} 秒`);
  const chrome = findTool('chrome'), ffmpeg = findTool('ffmpeg'), ffprobe = findTool('ffprobe');
  if (!chrome) fail('找不到 Chrome；设置 VIDEOMAKER_CHROME');
  if (!ffmpeg || !ffprobe) fail('找不到 FFmpeg/FFprobe；设置 VIDEOMAKER_FFMPEG 和 VIDEOMAKER_FFPROBE');
  const python = process.env.VIDEOMAKER_PYTHON || 'python';
  if (!commandWorks(python, ['-c', 'import edge_tts'])) fail('找不到 edge-tts；安装 edge-tts，或设置 VIDEOMAKER_PYTHON 指向可用 Python');
  const out = path.join(caseDir, 'out'); fs.mkdirSync(out, { recursive: true });
  const htmlFile = path.join(out, 'video.html'), planFile = path.join(out, 'video.json'), silent = path.join(out, `${data.slug}-silent.mp4`), voice = path.join(out, `${data.slug}-voice.mp3`), final = path.join(out, `${data.slug}-${format.width}x${format.height}-${format.duration}s.mp4`);
  const normalized = { ...video, format };
  fs.writeFileSync(htmlFile, htmlFor(normalized)); fs.writeFileSync(planFile, JSON.stringify(normalized, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'brief.md'), renderCase(caseDir, result));
  console.log(`1/5 计划与 brief 已写入 ${path.relative(caseDir, out)}`);
  await renderFrames(htmlFile, normalized, silent, chrome, ffmpeg); console.log(`2/5 画面完成 ${format.duration}s @ ${format.fps}fps`);
  await makeVoice(normalized, voice, python); console.log('3/5 旁白完成');
  await spawnChecked(ffmpeg, ['-y', '-loglevel', 'error', '-i', silent, '-i', voice, '-filter_complex', `[1:a]apad=pad_dur=${format.duration},atrim=duration=${format.duration}[a]`, '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(format.duration), '-movflags', '+faststart', final], { stdio: ['ignore', 'inherit', 'inherit'] });
  console.log('4/5 画面与旁白已封装');
  const probe = await spawnChecked(ffprobe, ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_name,r_frame_rate', '-of', 'default=nw=1', final]);
  const info = parseProbe(probe.stdout), durationOk = Math.abs(info.duration - format.duration) <= 0.1, sizeOk = info.stream.width === format.width && info.stream.height === format.height;
  const check = { ok: durationOk && sizeOk, expected: format, actual: info, files: { html: path.basename(htmlFile), plan: path.basename(planFile), silent: path.basename(silent), voice: path.basename(voice), video: path.basename(final) }, warnings: result.warnings };
  fs.writeFileSync(path.join(out, 'video-check.json'), JSON.stringify(check, null, 2) + '\n');
  if (!check.ok) fail(`视频验收失败：${JSON.stringify(info)}`);
  console.log(`5/5 视频验收通过：${format.width}x${format.height} ${info.duration.toFixed(2)}s`);
  if (flags.has('--srt')) { const srt = `1\n${srtTime(0)} --> ${srtTime(format.duration)}\n${video.voice.text}\n`; fs.writeFileSync(path.join(out, `${data.slug}.srt`), srt); }
}
main().catch((err) => fail(err.message));
