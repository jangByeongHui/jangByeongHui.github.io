# Task 8 — Completion finale (humorous copy + GitHub CTA) — QA Evidence

Server: `python3 -m http.server 4173` from repo root. Playwright MCP navigated to `http://localhost:4173/`.

## Implementation summary

- Extended `static/js/ui.js` (NO new file) with `renderFinaleFlourish()` + `renderFinale()`, wired via a new `window.addEventListener('data-orbit:complete', handleComplete)` inside `initUI()`, alongside the existing `data-orbit:node-select` listener from Todo 7.
- `renderFinale(content)` guards defensively at the render layer: `if (document.getElementById('finale-overlay')) return;` before creating anything — independent of `ui.js`'s Todo-7 `completeDispatched` source-side guard.
- Overlay renders `CONTENT.play.finaleTitle` (`<h2 class="finale-title" id="finale-heading">`), `CONTENT.play.finaleMessage` (`<p class="finale-message">`), and a CTA `<a class="finale-cta" target="_blank" rel="noopener">` with `href = CONTENT.play.ctaUrl` and text `CONTENT.play.ctaLabel`. Dismissible via its own `.close` button (same pattern as `#info-panel`'s close button), which adds `.hidden` to the overlay.
- `static/css/game.css`: added `.finale-overlay` (distinct gradient card using existing `THEME.nodeColors.career`/`THEME.nodeColors.play` hex values `#FFE8A3`/`#E3D1FF`, not `#info-panel`'s plain white), `.finale-flourish`/`.finale-spark` (6 sparkle spans, staggered `@keyframes finale-sparkle` fly-up animation), and `@media (prefers-reduced-motion: reduce) { .finale-spark { display: none; } }` to skip the flourish entirely (static card shown immediately) under reduced motion.
- **Bug caught and fixed during QA**: `.finale-flourish` (absolutely positioned, `inset: 0`, layered over the whole card) initially had no `pointer-events: none`, which caused it to intercept real pointer clicks on the `.close` button and `.finale-cta` link underneath (Playwright's real `locator.click()` timed out with "intercepts pointer events"; a JS-level `.click()` call had masked this in an earlier check since it bypasses hit-testing). Fixed by adding `pointer-events: none` to `.finale-flourish`, matching the same pattern already used for `#hud`/`#hud > *` in the existing CSS. Re-verified with a real Playwright click after the fix — see below.

## Happy-path QA

Single `browser_evaluate` call (per Todo 7's "state doesn't persist across separate evaluate calls" gotcha — avoided by doing the full sequence in one call): dynamic-imported `content.js` + `ui.js`, called `initUI({ content: CONTENT })`, dispatched all 5 `data-orbit:node-select` events via `NODE_ORDER`, then inspected the resulting DOM.

Results:
```json
{
  "hudText": "5 / 5 explored",
  "visitedSize": 5,
  "completeEventCountAfterFirstPlaythrough": 1,
  "overlayCountAfterFirstComplete": 1,
  "overlayExists": true,
  "overlayHidden": false,
  "finaleTitleText": "🎉 5개 노드 완주!",
  "finaleMessageText": "여기까지 다 눌러보셨다니... 진짜 궁금한 게 많으신 분이거나, 그냥 저처럼 \"일단 해보고 보는\" 스타일이시겠네요. 실제 이야기는 여기서 이어집니다 👇",
  "ctaText": "GitHub에서 만나기",
  "ctaHref": "https://github.com/jangByeongHui",
  "ctaResolvedHref": "https://github.com/jangByeongHui",
  "ctaTarget": "_blank",
  "ctaRel": "noopener",
  "finaleTitleMatchesContent": true,
  "finaleMessageMatchesContent": true,
  "ctaLabelMatchesContent": true,
  "elementsMatchingFinaleTitleCount": 1,
  "linksResolvingToGithubCount": 1,
  "overlayHiddenAfterClose": true,
  "completeEventCountAfterManualSecondDispatch": 2,
  "overlayCountAfterSecondDispatch": 1,
  "sparkCountNormal": 6,
  "sparkComputedDisplayNormal": "block"
}
```

Acceptance criteria (plan line 176) both satisfied:
- "exactly one DOM element contains `CONTENT.play.finaleTitle` text" → `elementsMatchingFinaleTitleCount: 1` ✅
- "exactly one link/button resolves to `https://github.com/jangByeongHui`" → `linksResolvingToGithubCount: 1` ✅

`browser_snapshot` after the full playthrough (a11y tree) confirmed the finale `dialog` with heading "🎉 5개 노드 완주!", the message paragraph, and the `link "GitHub에서 만나기"` pointing at `/url: https://github.com/jangByeongHui`, stacked above the standalone `play` info-panel (both are simultaneously present and non-blocking — the `play` node-select's own standalone panel is a separate, expected UI element per Todo 7, not part of this todo).

### Real-click verification (post pointer-events fix)

Fresh page load → full playthrough via `browser_evaluate` → then real Playwright interactions (not synthetic JS calls):
- `browser_click` on `a.finale-cta` succeeded (previously timed out pre-fix) and opened a new tab: `browser_tabs list` showed tab 1 as `jangByeongHui (장병희) · GitHub` at `https://github.com/jangByeongHui` — confirms the CTA link target + resolution for real user interaction, not just attribute inspection.
- `browser_click` on `#finale-overlay .close` succeeded and hid the overlay (`.hidden` class added).
- Screenshots: `task-8-finale-overlay-normal-motion.png` (full flourish + card visible), `task-8-finale-overlay-reduced-motion.png` (via `page.emulateMedia({ reducedMotion: 'reduce' })` + full playthrough — card visible immediately, sparkles present in DOM but `display: none`).

### Reduced-motion QA

Via `playwright_browser_run_code_unsafe` with `page.emulateMedia({ reducedMotion: 'reduce' })` before navigation, then full 5-node playthrough:
```json
{"overlayExists":true,"overlayVisible":true,"titleText":"🎉 5개 노드 완주!","sparkComputedDisplay":"none","sparkCount":6}
```
Confirms: overlay + finale text render immediately regardless of motion preference; sparkle flourish elements exist in the DOM (created by JS) but are `display: none` via the `prefers-reduced-motion: reduce` CSS media query, so no animation plays and no visual flash occurs — the "static card shown immediately" requirement is satisfied.

## Failure-path QA (duplicate-dispatch guard)

After the happy-path playthrough + real close-button click (overlay hidden), manually dispatched `data-orbit:complete` a SECOND time via `browser_evaluate`:
```json
{
  "finaleOverlayCount": 1,
  "overlayHiddenStillAfterDuplicate": true
}
```
Confirms the render-layer defensive guard (`renderFinale`'s `document.getElementById('finale-overlay')` check) works independently of `ui.js`'s Todo-7 source-side `completeDispatched` guard: even with the overlay already dismissed and `data-orbit:complete` fired again, **only one `#finale-overlay` DOM node ever exists** — no duplicate created, and dismissing it does not re-show it on a subsequent duplicate event (acceptable — the requirement is "at most once per session render", not "always visible on every complete event").

## Console check

`browser_console_messages(level=error)` after the full run showed exactly one error, the pre-existing documented benign 404 for `static/media/profile.jpg` (real asset not yet supplied — see Todo 5/7 learnings). No other console errors were introduced by this change.

## Files changed

- `static/js/ui.js` (extended — no new file created)
- `static/css/game.css` (extended)
