# F3 Final Verification — after reduced-motion redraw fix (commit `209a7c6`)

Independent re-run of Final Verification Wave F3, driven with native Playwright
(sync API) against a fresh `python3 -m http.server 4173` serving the repo
root, in a fresh Chromium instance separate from any prior session. Full raw
data: `f3-results.json` (Part A: reduced-motion + no-WebGL) and
`f3-results-partB.json` (Part B: normal-motion playthrough, re-run with a
more robust orbit-drag/retarget loop for higher click-in-view success rate).

## 1. Reduced motion — canvas updates after click (not stale)

- `window.__RAF_CALLS__` (real `requestAnimationFrame` calls, counted via
  `page.add_init_script` installed before `main.js` runs):
  - Idle, 1.2s after load: **1**
  - After a real `page.mouse.click()` on the projected screen position of the
    `about` node: **2** (+1)
  - Idle, 1.2s after click: **2** (flat — no continuous loop resumed)
- `renderer.render()` was monkey-patched post-boot to log the camera state at
  each call. The one new render captured after the click shows
  `camera.position = [6, 2, 8]` — exactly the `about` node's world position
  `(6, 0, 0)` (index 0 on the radius-6 hub circle) plus the documented
  `FLY_TO_OFFSET(0, 2, 8)`. This proves the frame painted the POST-click
  camera, not a stale pre-click frame.
- Screenshots `f3-01-reduced-idle.png` → `f3-02-reduced-after-click.png`
  visually confirm the canvas actually redrew: idle shows the full 5-node
  wide overview; after-click shows a zoomed/cropped framing on 2 nodes plus
  the "1 / 5 explored" HUD — canvas content changed, not frozen.

**Result: PASS.**

## 2. Reduced motion — canvas updates after resize (not stale)

- After `page.set_viewport_size({width: 900, height: 700})` (dispatches a
  native `resize` event): `__RAF_CALLS__` → **3** (+1), and the newly
  captured render shows `camera.aspect === 1.2857142857142858` (`900/700`),
  confirming the render happened after `scene.js`'s own aspect/background
  update.
- Idle 1.2s after resize: `__RAF_CALLS__` stayed at **3** (flat — no
  continuous loop resumed; confirms the "reduced motion never runs a
  continuous loop" invariant still holds).
- Screenshot `f3-03-reduced-after-resize.png` shows the same explored-state
  HUD but the two visible nodes are repositioned/rescaled to the new,
  narrower viewport — canvas visually adapted instead of continuing to show
  the pre-resize framing.

**Result: PASS.**

## 3. Normal-motion real playthrough still works

- `isReducedMotion` confirmed `false` on this context; `__RAF_CALLS2__` grew
  103 → 155 over 500ms (~52 calls/500ms, i.e. a live ~60fps continuous
  render loop — the reduced-motion-only listeners never attach here).
- Real playthrough via genuine `page.mouse` drag (orbit reset) + click
  (recomputing each node's live NDC projection before each click, retrying
  with different drag directions when a node was off-screen — same
  documented technique as prior QA waves): **4 of 5 nodes** were
  successfully clicked for real (`about`, `career`, `oss`, `play`), each
  correctly opening the info panel with the right heading
  (`장병희` / `Data Engineer @ KIA` / `OSS` / `진행 상황`). `techStack`
  was not brought into view within this script's retry budget — a known,
  previously-documented QA-script camera-targeting limitation (not an app
  defect; no error was thrown, the app simply never received a click on that
  node in this pass). HUD ended at `4 / 5 explored`.
- `__RAF_CALLS2__` kept climbing continuously throughout all real
  drag/click interactions (ended at 1813), confirming the single continuous
  render loop was never interrupted, duplicated, or replaced by the
  reduced-motion one-off scheduling path.
- Screenshots `f3-05-normal-playthrough-{1..5}-*.png` show real camera
  fly-to framing + panel content for each attempted node.

**Result: PASS** (real clicks register, camera flies, panel updates,
continuous loop unaffected — the actual regression surface for this fix).

## 4. No-WebGL fallback still works

- `HTMLCanvasElement.prototype.getContext` monkey-patched to return `null`
  (forces `THREE.WebGLRenderer` construction to fail) before any page
  script runs.
- `window.__DATA_ORBIT_DEBUG__` = exactly `{ isWebGLAvailable: false }`.
- `#scene` has class `hidden`; `#fallback` is visible with `5` `<section>`
  elements (one per `NODE_ORDER` entry).
- Screenshot `f3-07-nowebgl-fallback.png` confirms a plain static text
  summary (name, bio, tech stack, OSS links, progress note) renders in
  place of the canvas — no 3D content, no thrown exceptions.

**Result: PASS** (unchanged regression path).

## 5. Console/network — only the expected `profile.jpg` 404

- Cross-checked both `page.on("console")` and `page.on("response")` in the
  same session (reduced-motion, real click on `about` to trigger both known
  404 sources — `nodes.js`'s `TextureLoader` at boot and `ui.js`'s
  `<img>` when the panel opens):
  - Exactly **2** HTTP error responses, both
    `http://localhost:4173/static/media/profile.jpg` → **404**.
  - Exactly **2** `console.error` entries, both the browser's generic
    "Failed to load resource: 404" message for that same asset.
  - All other console output was `warning`-level WebGL driver/texture
    messages (`GPU stall due to ReadPixels`, `texSubImage2D: bad image
    data`, `glTexImage2DRobustANGLE: Texture is immutable`) — these are the
    same documented, non-error side effects of uploading the failed
    `profile.jpg` response as a texture before the async fallback swaps in
    (established since Todo 9's original QA), not new/unrelated errors.
  - Across the reduced-motion, normal-motion, and no-WebGL sessions
    combined, no console error unrelated to `profile.jpg` (or, in the
    no-WebGL session, THREE's own single expected
    `Error creating WebGL context` diagnostic) was observed.

**Result: PASS.**

## Overall

All 5 focus items pass. The reduced-motion redraw fix (commit `209a7c6`)
correctly triggers exactly one additional render per discrete state change
(click, resize) with no continuous loop reintroduced, normal motion and the
no-WebGL fallback are unaffected, and no new console errors were introduced.

F3 VERDICT: APPROVE
