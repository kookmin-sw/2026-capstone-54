/**
 * 면접관 아바타 PNG 추출 스크립트 (투명 배경)
 *
 * 사용법:
 *   cd frontend
 *   bun install puppeteer    (최초 1회)
 *   node scripts/export-avatars/capture.mjs
 *
 * 결과: frontend/scripts/export-avatars/output/ 에 PNG 생성
 *   - avatar-friendly.png
 *   - avatar-normal.png
 *   - avatar-pressure.png
 */

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "output");
const HTML_DIR = __dirname;

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const types = ["friendly", "normal", "pressure"];

  for (const type of types) {
    console.log(`📸 Capturing ${type} avatar...`);

    const page = await browser.newPage();
    // 2x 해상도로 고화질 캡처 (512x512 viewport → 1024x1024 PNG)
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });

    const htmlPath = path.join(HTML_DIR, `avatar-${type}.html`);
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

    // Tailwind CDN 로딩 + 렌더링 대기
    await page.waitForFunction("window.__AVATAR_READY__ === true", {
      timeout: 15000,
    });

    // 애니메이션 안정화 대기
    await new Promise((r) => setTimeout(r, 800));

    // 투명 배경 PNG 캡처
    const outputPath = path.join(OUTPUT_DIR, `avatar-${type}.png`);
    await page.screenshot({
      path: outputPath,
      omitBackground: true,
      type: "png",
    });

    console.log(`  ✅ Saved: ${outputPath}`);
    await page.close();
  }

  await browser.close();
  console.log("\n🎉 모든 아바타 PNG 추출 완료!");
  console.log(`   출력 폴더: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
