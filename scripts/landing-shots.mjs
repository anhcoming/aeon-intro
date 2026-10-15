// Chụp màn hình app cho trang giới thiệu (shots/) trên giao diện iPad thật (isMobile + hasTouch + UA iPad),
// tài khoản TC mẫu, ẩn dải môi trường/phiên bản, ô ngày hệ thống, "Đổi TK" và nút (i) — chỉ ẩn lúc chụp, không sửa app.
//   PROJECT="tên dự án trong hộp Tài khoản mẫu" node scripts/landing-shots.mjs [thư-mục-ra]   (cần chạy app retail-pm ở http://localhost:3000 với DB demo; mặc định ghi vào shots/)
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.argv[2] || new URL("../shots", import.meta.url).pathname;
const PROJECT = process.env.PROJECT || "";
const EMAIL = process.env.EMAIL || "tc.kiet@retailpm.local";
fs.mkdirSync(OUT, { recursive: true });
const UA = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const b = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1194, height: 830 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA, locale: "vi-VN" });
const p = await ctx.newPage();

async function login() {
  await p.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await p.locator("button:visible", { hasText: "Tài khoản mẫu" }).first().click();
  if (PROJECT) await p.locator("button:visible", { hasText: PROJECT }).first().click();
  const s = p.locator('input[type="search"]:visible').first();
  await s.fill(EMAIL.split("@")[0]);
  await p.locator("button:visible", { hasText: EMAIL }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
  await p.waitForTimeout(1500);
}

const hide = () => p.evaluate(() => {
  for (const d of document.querySelectorAll("div.fixed")) if (/LOCAL|DEV|STAGING|v\d+\.\d+/.test(d.textContent || "") && (d.textContent || "").length < 60) d.style.display = "none";
  const tt = document.querySelector('[title^="Đổi ngày hệ thống"]');
  if (tt && tt.parentElement) { const kids = [...tt.parentElement.children]; kids.slice(0, -1).forEach((k) => (k.style.display = "none")); }
});
async function shot(name, setup) {
  if (setup) await setup();
  await p.waitForTimeout(1200);
  await hide();
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log("ok", name);
}
const go = async (path) => { await p.goto(BASE + path, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1800); };
const tab = (name) => p.getByRole("tab", { name: new RegExp("^" + name) }).first().click().then(() => p.waitForTimeout(1200));

await login();
await shot("s01-viec-cua-toi", () => go("/my-work"));
await shot("s02-gian-hang", () => go("/tenants"));
let tenantUrl;
await shot("s03-chi-tiet", async () => {
  await go("/tenants");
  await p.locator("a:visible, tr:visible", { hasText: "KICHI KICHI" }).first().click();
  await p.waitForURL(/\/tenants\/[^/]+/, { timeout: 20000 });
  await p.waitForTimeout(2000);
  tenantUrl = p.url();
});
await shot("s04-ho-so", () => tab("Hồ sơ"));
// Mẫu Form 1 trong Tài liệu dự án — file nộp của dữ liệu demo là trang trắng nên không dùng làm ảnh.
await shot("s05-xem-file", async () => {
  await go("/library");
  for (const t of ["2. Thông tin Khách thuê", "1. FORMS"]) {
    await p.getByText(t, { exact: true }).filter({ visible: true }).first().click();
    await p.waitForTimeout(2000);
  }
  await p.getByText("Form 1 – mẫu ký.pdf", { exact: true }).filter({ visible: true }).first().click();
  await p.waitForTimeout(4000);
});
await shot("s06-loi", async () => { await go(new URL(tenantUrl).pathname); await tab("Lỗi kỹ thuật"); });
await shot("s07-tien-do", () => go("/programme"));
await shot("s08-bao-cao", () => go("/report/summary"));
await shot("s09-ban-do", () => go("/report/map"));
await shot("s10-hoi-dap", () => go("/qna"));
await b.close();
