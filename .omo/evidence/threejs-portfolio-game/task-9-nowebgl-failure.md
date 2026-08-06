# Todo 9 — no-WebGL failure QA (Todo-4-style monkey-patch)

## Setup
- `page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = function () { return null; }; })` installed before `main.js` runs (forces `initScene`'s `!renderer.getContext()` branch to `return { isWebGLAvailable: false }`).
- `page.reload()` + `networkidle` wait, then inspected the live DOM.

## Result

```json
{
  "sceneHidden": true,
  "fallbackHidden": false,
  "debug": { "isWebGLAvailable": false },
  "hasMotto": true,
  "hasCareerHighlight": true,
  "hasOssLink": true,
  "hasFinaleCta": false,
  "sectionCount": 5
}
```

- `#scene` gained `.hidden` (`display:none!important`); `#fallback` had `.hidden` removed and is visible.
- `#fallback` contains exactly 5 `<section>` elements, one per `NODE_ORDER` entry (`about`, `career`, `techStack`, `oss`, `play`), each built directly from `CONTENT` fields (no hardcoded content strings).
- Motto text (`날 죽이지 못한 고통은 날 강하게 만들 뿐이다`) present verbatim — confirms the plain-text summary rendered `CONTENT.about.motto` correctly.
- Career highlight text (`OpenCV 기반 주차장 관제 및 보행자 측위 시스템 개발`) present verbatim.
- OSS contribution link to `https://github.com/apache/airflow/pull/67225` present as a real `<a href>`.
- `window.__DATA_ORBIT_DEBUG__` is `{ isWebGLAvailable: false }` only — no `renderer`/`scene`/`camera`/`nodes` keys, confirming **no further three.js calls were made** past the WebGL-availability check (`createNodes`/`initInteractions`/`initUI` were never invoked).
- `hasFinaleCta: false` is expected — the fallback summary intentionally renders only the standalone `play` node's `description` field (per spec: "all 5 nodes' key fields"), not the separate finale-only fields (`finaleTitle`/`finaleMessage`/`ctaLabel`/`ctaUrl`), which belong exclusively to the in-scene finale overlay that never fires in the no-WebGL path.

## Console check

`browser_console_messages(level=error)` returned exactly ONE entry:

```
[ERROR] THREE.WebGLRenderer: THREE.WebGLRenderer: Error creating WebGL context. @ https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.core.js:2038
```

This is THREE's own internal diagnostic log emitted synchronously inside the `WebGLRenderer` constructor before `initScene`'s `try/catch` intercepts the thrown error and returns `{ isWebGLAvailable: false }` — documented precedent from Todo 4's learnings (same exact caught-and-handled failure path, now exercised end-to-end through the real `main.js` entry point instead of a standalone `scene.js` unit test). No uncaught exception, no unhandled promise rejection.

## Screenshot

`.omo/evidence/threejs-portfolio-game/task-9-fallback-nowebgl.png` — full-page screenshot showing the rendered plain-text fallback summary (About/Career/Tech Stack/OSS/Play sections) with `#scene` canvas hidden.
