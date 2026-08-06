# F2 final-review fix — reduced-motion canvas staleness after click/resize

## Issue

`static/js/main.js`'s reduced-motion branch scheduled exactly ONE
`requestAnimationFrame` render at boot and never again. A node click causes
`interactions.js`'s `flyToNode()` to snap `camera.position`/`controls.target`
**instantly** under reduced motion (no tween), and a window resize causes
`scene.js`'s resize listener to update `camera.aspect` and repaint the
background gradient texture — but neither of those state changes triggered a
new render. Result: the DOM (info panel/HUD) updated correctly, but the
canvas kept showing the ORIGINAL boot-time frame forever.

## Fix

`main.js`'s reduced-motion branch now schedules a render (still always via
`requestAnimationFrame`, never a direct synchronous `renderer.render()` call)
on THREE occasions instead of one, via a single shared
`scheduleReducedMotionRender()` helper:

1. Once at boot (unchanged from before).
2. On `window`'s `data-orbit:node-select` event (fired synchronously by
   `interactions.js` right before it calls `flyToNode()` — by the time our
   `requestAnimationFrame` callback actually runs on the next paint,
   `flyToNode()` has already completed its instant snap, so the new camera
   position is what gets rendered).
3. On the native `window` `resize` event (registered in `main.js` AFTER
   `initScene()` has already registered `scene.js`'s own resize listener, so
   by call order the aspect/background update always happens first, and our
   listener's scheduled frame picks up the finished state).

Each of these three triggers produces exactly ONE additional one-off
`requestAnimationFrame` call — none of them re-schedule another frame from
inside their own callback, so the "reduced motion never runs a continuous
loop" invariant from Todo 11 still holds. Normal motion is entirely
unaffected: the new listeners are registered only inside the
`if (isReducedMotion)` branch.

## QA

All QA below re-verified WebGL availability (`window.__DATA_ORBIT_DEBUG__.isWebGLAvailable`)
immediately after each fresh page load/reload, since this Playwright/Chromium
environment intermittently drops its GPU context between heavy scene-creation
sessions (documented in Todo 10's learnings) — a `browser_close()` + fresh
`navigate()` reliably restores it.

### Reduced-motion: idle / click / resize (single clean pass, one page load)

Two independent instruments were used and cross-checked:
- `window.__RAF_CALLS__`: counts every REAL `requestAnimationFrame` call
  (installed via `page.addInitScript` BEFORE `main.js` runs, so it captures
  the very first boot-time call too).
- `window.__RENDER_LOG__`: records the live `camera.position` at every
  `renderer.render()` call, installed via monkey-patching `renderer.render`
  AFTER boot (so it only captures calls from this point forward, but proves
  the render actually painted the POST-state-change camera).

| Phase | `rafCalls` (cumulative) | new `renderer.render()` calls since post-boot wrap | live camera position rendered |
|---|---|---|---|
| Idle, 1.2s after load | **1** | 0 (the 1 real call already fired before the wrap was installed) | — |
| After real click on `about` | **2** (+1) | **1** | `[6, 2, 8]` — exactly `about`'s world position `(6,0,0)` (index 0 on the radius-6 hub circle) + `FLY_TO_OFFSET(0,2,8)`, proving the frame painted the POST-snap camera, not the stale pre-click one |
| Idle, 1.2s after click | **2** (flat) | **1** (flat) | no growth → confirms NO continuous loop resumed |
| After `setViewportSize(900,700)` (native `resize`) | **3** (+1) | **2** (+1) | `camera.aspect === 1.2857142857142858` (`900/700`), confirming the render happened after `scene.js`'s aspect/background update |
| Idle, 1.2s after resize | **3** (flat) | **2** (flat) | no growth → confirms NO continuous loop resumed |

Exact command trace and raw JSON output are in this task's session log; the
key invariant confirmed is: **idle → 1, +1 per discrete state change, 0
growth while idle between changes** — never a self-perpetuating chain.

(Note: an earlier attempt at this same measurement showed inflated counts of
1/2/3 → 3/6/9 because `page.addInitScript` accumulates additively across
repeated `run_code_unsafe` calls reusing the same long-lived Playwright page
object, each layer double/triple-counting the same real calls. The numbers
above are from a single clean pass — one `addInitScript` registration, one
page load, all phases measured in the same script invocation — and are the
authoritative result.)

### Screenshots

- `f2-fix-01-idle.png` — initial reduced-motion load, all 5 nodes visible in
  the default overview camera.
- `f2-fix-02-after-click.png` — after a real click on `about` (info panel
  closed via Escape before the screenshot so the canvas itself is visible):
  camera now framed close on the About node/photo sprite, matching the
  `[6,2,8]` render-log camera position above — this is the frame that was
  STALE before the fix (it would have kept showing `f2-fix-01`'s wide
  overview forever).
- `f2-fix-03-after-resize.png` — after resizing the viewport to 900x700: the
  canvas now matches the new aspect ratio/gradient repaint instead of
  continuing to show the pre-resize framing.

### Normal motion (regression check, fresh page)

- `isReducedMotion: false`
- `rafCalls` at +500ms: 63, at +1000ms: 127 → **delta ≈ 64 calls / 500ms**,
  consistent with a single continuous ~60fps loop (unchanged from the
  pre-fix baseline of ~60-61/500ms measured in Todo 9's original evidence).
- After an additional real click + resize + 500ms more wait: count grew to
  212 (delta ≈ 85 over ~700ms, i.e. still ~1x the frame rate, not ~2x) —
  confirms the reduced-motion-only listeners never attach in normal motion
  and no second loop was introduced.

### No-WebGL fallback (regression check, untouched code path)

`HTMLCanvasElement.prototype.getContext` monkey-patched to `null` (Todo-4-style):
`window.__DATA_ORBIT_DEBUG__ = { isWebGLAvailable: false }`, `#scene` hidden,
`#fallback` visible with all 5 `<section>` elements — unchanged from Todo 9's
original behavior, confirming this fix did not touch or regress that path.

### Console

`browser_console_messages(level=error)` showed only the two expected,
documented `static/media/profile.jpg` 404s (same as every prior todo's
QA — the asset is still not supplied) — zero new errors introduced by this
fix.
