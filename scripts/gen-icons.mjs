// PWA/TWA 用の PNG アイコンを favicon.svg から生成する。
// 使い方: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(resolve(root, "public/favicon.svg"));
const outDir = resolve(root, "public/icons");
mkdirSync(outDir, { recursive: true });

const pink = { r: 196, g: 81, b: 111, alpha: 1 };

async function render(size, file, { maskablePad = 0 } = {}) {
  const inner = Math.round(size * (1 - maskablePad * 2));
  const logo = await sharp(svg).resize(inner, inner).png().toBuffer();
  const base = sharp({
    create: { width: size, height: size, channels: 4, background: maskablePad > 0 ? pink : { r: 0, g: 0, b: 0, alpha: 0 } },
  });
  await base
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(resolve(outDir, file));
  console.log("wrote", file);
}

await render(192, "icon-192.png");
await render(512, "icon-512.png");
// maskable: セーフゾーン確保のため内側に余白（背景はピンクで塗りつぶし）
await render(512, "icon-maskable-512.png", { maskablePad: 0.12 });
console.log("done");
