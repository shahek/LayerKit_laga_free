// Renders a still of every template (dev helper): node scripts/contact-sheet.mjs <frame> <outDir> [filter]
import { bundle } from '@remotion/bundler';
import { getCompositions, openBrowser, renderStill } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const frame = Number(process.argv[2] ?? 75);
const outDir = process.argv[3] ?? 'out/sheet';
const filter = process.argv[4] ?? '';
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/remotion/index.ts') });
const browser = await openBrowser('chrome');
const comps = (await getCompositions(serveUrl, { puppeteerInstance: browser })).filter((c) => c.id.includes(filter));
for (const c of comps) {
  await renderStill({ composition: c, serveUrl, output: path.join(outDir, `${c.id}.png`), frame: Math.min(frame, c.durationInFrames - 1), puppeteerInstance: browser, scale: 0.5 });
  process.stdout.write('.');
}
await browser.close({ silent: true });
console.log('\n', comps.length, 'rendered');
