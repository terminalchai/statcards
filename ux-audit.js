/**
 * StatCards — UX / Design Audit
 * Checks: touch targets, visual hierarchy, contrast, spacing, focus indicators,
 * CTA hierarchy, layout proportions, idle/loading/error states, card quality,
 * theme system, export buttons, font rendering, motion readiness.
 */

import { chromium } from 'playwright';

const PORT = 5176;
const BASE = `http://localhost:${PORT}`;

const VIEWPORTS = [
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'Tablet',  width: 768,  height: 1024 },
  { name: 'Mobile',  width: 375,  height: 812 },
];

const PASS = '✅';
const WARN = '⚠️ ';
const FAIL = '❌';

const MOCK_USER = {
  login: 'terminalchai',
  name: 'Terminal Chai',
  bio: 'Developer. Builder. Coffee-powered.',
  avatar_url: 'https://avatars.githubusercontent.com/u/213856599',
  public_repos: 12,
  followers: 42,
  following: 5,
  location: 'India',
};
const MOCK_REPOS = Array.from({ length: 10 }, (_, i) => ({
  name: `repo-${i}`,
  fork: false,
  stargazers_count: i * 3,
  forks_count: i,
  language: ['JavaScript','TypeScript','Python','CSS','Rust'][i % 5],
}));

async function mockGitHub(page) {
  await page.route('**/users/terminalchai', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
  );
  await page.route('**/users/terminalchai/repos**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPOS) })
  );
  await page.route('**/search/issues**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total_count: 7, items: [] }) })
  );
}

async function audit(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await mockGitHub(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // ── Screenshot: idle state ─────────────────────────────────────────────────
  await page.screenshot({ path: `ux-${vp.name.toLowerCase()}-idle.png` });

  const idleResults = await page.evaluate((vpWidth) => {
    const findings = [];

    function find(label, ok, warn, detail) {
      findings.push({ label, status: ok ? 'PASS' : warn ? 'WARN' : 'FAIL', detail });
    }

    // ─── 1. TOUCH TARGETS ─────────────────────────────────────────────────
    const interactives = Array.from(document.querySelectorAll('button, input, a[href]'));
    const small = interactives.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      if (el.tagName === 'A' && el.closest('footer')) return false;
      return r.width < 44 || r.height < 44;
    }).map(el => ({
      tag: el.tagName,
      text: (el.textContent.trim() || el.getAttribute('title') || el.getAttribute('placeholder') || '').slice(0, 24),
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    }));
    find(
      'Touch targets ≥ 44×44px',
      small.length === 0,
      small.length <= 2,
      small.length === 0
        ? 'All interactive elements meet WCAG minimum touch target'
        : `${small.length} too small: ` + small.map(t => `${t.tag}("${t.text}") ${t.w}×${t.h}px`).join(', ')
    );

    // ─── 2. H1 VISUAL HIERARCHY ───────────────────────────────────────────
    const h1   = document.querySelector('h1');
    const h1sz = h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
    const bsz  = parseFloat(getComputedStyle(document.body).fontSize);
    const ratio = h1sz / bsz;
    find(
      'H1 vs body size ratio ≥ 1.5×',
      ratio >= 1.5, ratio >= 1.2,
      `H1=${h1sz}px, body=${bsz}px, ratio=${ratio.toFixed(2)}×`
    );

    // ─── 3. COLOR CONTRAST — opacity check ────────────────────────────────
    const textEls = Array.from(document.querySelectorAll('.ctrl-group-label, .field-label, .theme-name'));
    const low = textEls.filter(el => {
      const c = getComputedStyle(el).color;
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return false;
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      return a < 0.25;
    }).map(el => ({ clz: el.className.slice(0, 30), txt: el.textContent.trim().slice(0, 20), col: getComputedStyle(el).color }));
    find('Text contrast — no critically low opacity text', low.length === 0, low.length <= 2,
      low.length === 0 ? 'All sampled text elements have usable contrast' : `${low.length} low-contrast: ` + low.map(x => `"${x.txt}"(${x.col})`).join(', ')
    );

    // ─── 4. SPACING CONSISTENCY ───────────────────────────────────────────
    const groups = Array.from(document.querySelectorAll('.ctrl-group'));
    const gaps = [];
    for (let i = 1; i < groups.length; i++) {
      gaps.push(Math.round(groups[i].getBoundingClientRect().top - groups[i-1].getBoundingClientRect().bottom));
    }
    find('Section spacing is consistent (ctrl-groups)', [...new Set(gaps)].length <= 1, [...new Set(gaps)].length <= 2,
      gaps.length ? `Gaps: [${gaps.join(', ')}]px` : 'Only one section visible'
    );

    // ─── 5. FOCUS INDICATORS ─────────────────────────────────────────────
    let focusRules = 0;
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const r of Array.from(sheet.cssRules || [])) {
            if (r.selectorText && r.selectorText.includes('focus-visible')) focusRules++;
          }
        } catch(e) {}
      }
    } catch(e) {}
    find('Focus indicators present (:focus-visible rules)', focusRules >= 3, focusRules >= 1,
      focusRules > 0 ? `✓ ${focusRules} :focus-visible rules found` : 'No :focus-visible rules found'
    );

    // ─── 6. CTA HIERARCHY — PNG button must dominate ─────────────────────
    const pngBtn  = document.querySelector('.btn-export-primary');
    const hdrBtns = Array.from(document.querySelectorAll('header button'));
    if (pngBtn && hdrBtns.length > 1) {
      const pngArea = pngBtn.getBoundingClientRect().width * pngBtn.getBoundingClientRect().height;
      const others  = hdrBtns.filter(b => b !== pngBtn).map(b => b.getBoundingClientRect().width * b.getBoundingClientRect().height);
      const avgOther = others.reduce((a,b) => a+b, 0) / others.length;
      find('CTA (PNG) is visually dominant vs secondary actions', pngArea > avgOther * 1.3, !!pngBtn,
        `PNG area=${Math.round(pngArea)}px² vs avg secondary=${Math.round(avgOther)}px²`
      );
    }

    // ─── 7. LAYOUT PROPORTION (desktop) ──────────────────────────────────
    const sidebar = document.querySelector('aside');
    const main    = document.querySelector('main');
    if (sidebar && main && vpWidth >= 1024) {
      const sw = sidebar.getBoundingClientRect().width;
      const mw = main.getBoundingClientRect().width;
      const r  = mw / sw;
      find('Canvas/sidebar ratio ≥ 2× (preview-dominant)', r >= 2, r >= 1.5,
        `Canvas=${Math.round(mw)}px, Sidebar=${Math.round(sw)}px, ratio=${r.toFixed(2)}×`
      );
    }

    // ─── 8. HEADER OVERFLOW ───────────────────────────────────────────────
    const header = document.querySelector('header');
    const docW   = document.documentElement.scrollWidth;
    find('Header does not cause horizontal overflow', docW <= vpWidth + 1, docW <= vpWidth + 10,
      `Document scrollWidth=${docW}px, viewport=${vpWidth}px`
    );

    // ─── 9. IDLE STATE QUALITY ────────────────────────────────────────────
    const idleEl = document.querySelector('main .text-center');
    find('Idle state is present and descriptive', !!idleEl, !!idleEl,
      idleEl ? `Idle state: "${idleEl.textContent.trim().slice(0, 60)}…"` : 'No idle state found'
    );

    // ─── 10. THEME PICKER ─────────────────────────────────────────────────
    const themeBtns = document.querySelectorAll('.theme-btn');
    find('6 theme options present', themeBtns.length === 6, themeBtns.length >= 4,
      `Found ${themeBtns.length} theme buttons`
    );

    // ─── 11. SEARCH INPUT ACCESSIBLE ─────────────────────────────────────
    const searchInp = document.querySelector('.search-input');
    const hasPlaceholder = searchInp?.placeholder?.length > 0;
    // React handles autoFocus programmatically — check if element already
    // has focus OR has the autofocus HTML attribute
    const hasFocus = document.activeElement === searchInp;
    const hasAutoFocus = hasFocus || searchInp?.hasAttribute('autofocus');
    find('Search input has placeholder + autofocus', hasPlaceholder && hasAutoFocus, hasPlaceholder,
      `placeholder="${searchInp?.placeholder}", hasFocus=${hasFocus}`
    );

    // ─── 12. LOGO / BRAND AREA ────────────────────────────────────────────
    const logo = document.querySelector('header h1');
    find('Brand H1 is in header and visible', !!logo && logo.offsetParent !== null, !!logo,
      logo ? `"${logo.textContent.trim()}" — ${getComputedStyle(logo).fontSize}` : 'H1 not found in header'
    );

    // ─── 13. FONT DISTINCTIVENESS ─────────────────────────────────────────
    const bodyFont = getComputedStyle(document.body).fontFamily.toLowerCase();
    const hasGenericFont = bodyFont.includes('inter') || bodyFont.includes('roboto') || bodyFont.includes('arial');
    find('Font is distinctive (not generic Inter/Roboto)', !hasGenericFont, false,
      `Body font-family: ${bodyFont.slice(0, 60)}`
    );

    // ─── 14. ANIMATION / TRANSITION PRESENCE ─────────────────────────────
    let transitionRuleCount = 0;
    let animationRuleCount = 0;
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            const css = rule.cssText || '';
            if (css.includes('transition')) transitionRuleCount++;
            if (css.includes('@keyframes') || css.includes('animation')) animationRuleCount++;
          }
        } catch(e) {}
      }
    } catch(e) {}
    find('Micro-interactions present (transitions)', transitionRuleCount >= 5, transitionRuleCount >= 2,
      `${transitionRuleCount} transition rules, ${animationRuleCount} animation rules found`
    );

    // ─── 15. CARD REVEAL ANIMATION ────────────────────────────────────────
    let hasCardAnimation = false;
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            const css = rule.cssText || '';
            if (css.includes('card-enter') || css.includes('fadeInUp') || css.includes('slideUp')) {
              hasCardAnimation = true;
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
    find('Card entrance animation defined in CSS', hasCardAnimation, false,
      hasCardAnimation ? 'Card entrance keyframe animation found' : 'No card entrance animation — card appears abruptly'
    );

    return findings;
  }, vp.width);

  // ── Now trigger a card generation ─────────────────────────────────────────
  await page.fill('.search-input', 'terminalchai');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `ux-${vp.name.toLowerCase()}-card.png` });

  const cardResults = await page.evaluate(() => {
    const findings = [];
    function find(label, ok, warn, detail) {
      findings.push({ label, status: ok ? 'PASS' : warn ? 'WARN' : 'FAIL', detail });
    }

    // ─── C1. Card rendered ─────────────────────────────────────────────────
    const card = document.querySelector('[data-testid="stats-card"]') ||
                 document.querySelector('.w-full.max-w-2xl > div[style]') ||
                 document.querySelector('main .relative.z-10 > div');
    find('Stats card renders in canvas', !!card, false,
      card ? `Card found: ${card.tagName} with ${card.childElementCount} children` : 'No card element found after search'
    );

    // ─── C2. Export buttons enabled after card ─────────────────────────────
    const pngBtn = document.querySelector('.btn-export-primary');
    const disabled = pngBtn?.disabled || pngBtn?.getAttribute('disabled') !== null;
    find('Export buttons enabled after card loads', !disabled, false,
      pngBtn ? `PNG button disabled=${pngBtn.disabled}` : 'PNG button not found'
    );

    // ─── C3. Stats summary shown in sidebar ───────────────────────────────
    const summary = document.querySelector('.ctrl-group .text-xs');
    find('Stats summary shown in sidebar after load', !!summary, false,
      summary ? `"${summary.textContent.trim().slice(0, 50)}"` : 'No stats summary element found'
    );

    // ─── C4. Canvas ambient glow ──────────────────────────────────────────
    const glow = document.querySelector('.absolute.pointer-events-none');
    find('Canvas ambient glow effect present', !!glow, false,
      glow ? 'Ambient glow div found with pointer-events-none' : 'No ambient glow behind card'
    );

    return findings;
  });

  return [...idleResults, ...cardResults];
}

(async () => {
  const browser = await chromium.launch();
  const allResults = {};

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  📐 ${vp.name} (${vp.width}×${vp.height})`);
    console.log(`${'─'.repeat(60)}`);

    const results = await audit(page, vp);
    allResults[vp.name] = results;

    const pass = results.filter(r => r.status === 'PASS').length;
    const warn = results.filter(r => r.status === 'WARN').length;
    const fail = results.filter(r => r.status === 'FAIL').length;

    for (const r of results) {
      const icon = r.status === 'PASS' ? PASS : r.status === 'WARN' ? WARN : FAIL;
      console.log(`${icon} ${r.label}`);
      if (r.status !== 'PASS') {
        console.log(`   → ${r.detail}`);
      }
    }
    console.log(`\n  Score: ${pass}/${results.length} pass, ${warn} warn, ${fail} fail`);
    await page.close();
  }

  await browser.close();

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  STATCARDS UX AUDIT — SUMMARY');
  console.log(`${'═'.repeat(60)}`);
  let totalPass = 0, totalAll = 0, failItems = [];
  for (const [vp, results] of Object.entries(allResults)) {
    const p = results.filter(r => r.status === 'PASS').length;
    totalPass += p; totalAll += results.length;
    const fails = results.filter(r => r.status !== 'PASS');
    if (fails.length) {
      console.log(`\n  ${vp} — Issues:`);
      for (const f of fails) {
        const icon = f.status === 'WARN' ? WARN : FAIL;
        console.log(`  ${icon} ${f.label}`);
        console.log(`     → ${f.detail}`);
        if (!failItems.find(x => x.label === f.label)) failItems.push(f);
      }
    }
  }
  const pct = Math.round(totalPass / totalAll * 100);
  console.log(`\n  Overall: ${totalPass}/${totalAll} (${pct}/100)`);
  console.log(`${'═'.repeat(60)}\n`);
})();
