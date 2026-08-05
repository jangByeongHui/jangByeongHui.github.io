# Learnings — threejs-portfolio-game

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## [ORCHESTRATION START] Repo state and conventions
- Repo root: /Users/kia2936767/Github/jangByeongHui.github.io
- `git ls-tree -r HEAD` is EMPTY (repo owner's local unpushed commit `65fee0f` "chore: 레거시 프로젝트 파일 전체 삭제" deleted all legacy files). Every file this plan needs is CREATED FRESH - nothing to "keep"/"preserve" from an existing file on disk. Do NOT try to read an existing `index.html`/`README.md` for context; the exact pre-deletion content needed is already reproduced verbatim inside each todo's text in `.omo/plans/threejs-portfolio-game.md`.
- Zero-build project by design: ES modules + `<script type="importmap">`, `three@0.185.1` pinned via jsdelivr CDN. NO package.json, NO npm, NO bundler. Never introduce one.
- Local static server required for QA (ES module import maps need `http://`, not `file://`): `npx --yes serve -l 4173 .` or `python3 -m http.server 4173`, then Playwright navigates to `http://localhost:4173/`.
- Evidence path convention: `.omo/evidence/threejs-portfolio-game/task-<N>-threejs-portfolio-game.<ext>` (create the `.omo/evidence/threejs-portfolio-game/` directory if it doesn't exist yet).
- One commit per todo, Conventional Commits style, exact `Commit:` line given in each todo.
- File architecture (closed set, do not add other files): `index.html`, `static/css/game.css`, `static/js/content.js`, `static/js/theme.js`, `static/js/scene.js`, `static/js/nodes.js`, `static/js/interactions.js`, `static/js/ui.js`, `static/js/main.js`, `static/media/profile-placeholder.svg` (+ `static/media/profile.jpg` is a user-supplied asset, not created by any todo - a placeholder SVG covers it until supplied).

## [Todo 3] index.html shell + game.css + main.js stub + placeholder.svg
- Created `index.html`, `static/css/game.css`, `static/js/main.js` (stub), `static/media/profile-placeholder.svg` per plan lines 107-133. Defined `--font-body`/`--font-display` CSS vars in `game.css` (`:root`) since the plan's exact base rule `font-family:var(--font-body)` needs the variable declared somewhere; kept consistent with `static/js/theme.js`'s `fonts.body`/`fonts.display` values (that file already existed from a parallel Todo, was NOT modified).
- Browser auto-requests `/favicon.ico` and gets a 404, which fails the "console_messages(level=error) returns empty" happy-path QA check even though it's unrelated to any plan-required asset. Fix: add `<link rel="icon" href="data:," />` in `<head>` to suppress the default favicon request. Future todos creating/editing `index.html` should keep this tag.
- Import-map URLs (`three@0.185.1` build + `examples/jsm/`) are NOT actually fetched by `browser_network_requests` during page load while `main.js` is still the console.log-only stub, since nothing `import`s from `'three'` yet. To satisfy the plan's "confirm both import-map URLs return 200" QA scenario before Todo 9 adds real three.js imports, verified via `browser_evaluate` doing a direct `fetch()` of both CDN URLs from the page context (200/200) instead of relying on passive network capture. Once Todo 9 wires up real imports, the normal `browser_network_requests` capture will show them directly.
- Accessibility snapshot (`browser_snapshot`) is empty `{}` on the bare shell — `#hud` has no content yet, `#info-panel`/`#fallback` carry `class="hidden"` (display:none) by design until later todos reveal them, and `#scene` is intentionally `aria-hidden`. Verified all four ids exist via `browser_evaluate` DOM query instead of relying solely on the a11y tree for the empty-shell state.
- Local static server for QA: `python3 -m http.server 4173` worked fine (no need for `npx serve`); remember to `pkill -f "http.server 4173"` when done so later todos' QA doesn't collide on the port.

## [Todo 1] static/js/content.js — DONE
- Created `static/js/content.js` exporting `NODE_ORDER` and `CONTENT` (keys: about, career, techStack, oss, play) with the exact verbatim content from the plan's Todo 1 text (no paraphrasing, no added/omitted fields).
- Confirmed `.omo/` and `.idea/` are NOT git-tracked in this repo (only `static/js/theme.js` was in `git ls-tree -r HEAD` before this commit) — evidence/notepad files under `.omo/` are local orchestration scratch space, not committed deliverables. Only stage/commit the actual deliverable file(s) named in each todo's "What to do", never the whole working tree.
- Acceptance criteria both passed: (1) `node --input-type=module -e "..."` CONTENT-keys check exited 0; (2) `grep -c "날 죽이지 못한 고통은" static/js/content.js` returned `1`.
- QA failure scenario passed: `grep -riE "TODO|lorem ipsum|여기에 내용을" static/js/content.js` produced empty output (grep exit 1 = no matches = pass).
- Evidence saved to `.omo/evidence/threejs-portfolio-game/task-1-threejs-portfolio-game.txt` (commands + full output).
- Committed as `bee4fed` — "feat(content): add DATA ORBIT content module with real bio data" — staged only `static/js/content.js`, left other agents' in-flight parallel-wave files (`index.html`, `static/css/`, `static/js/main.js`, `static/media/`) untouched/unstaged.

## [Todo 2] static/js/theme.js pastel palette module
- Gotcha: `grep -c "A\|B\|C"` counts MATCHING LINES, not total occurrences. Todo 2's acceptance criteria expects `grep -c ... static/js/theme.js` to return `9` (one per hex color). If multiple hex values are written on the same source line (e.g. `background: { top:'#FDEFF9', mid:'#EAF6FF', bottom:'#E9FBEF' }` all on one line), that line only counts ONCE toward grep -c, undercounting the total. Fix: format the object literal so each of the 9 target hex values (`FDEFF9, EAF6FF, E9FBEF, FFC1CC, FFE8A3, AEE2FF, B8F2D0, E3D1FF, D8D3E8`) sits on its own line (multi-line nested objects, one key per line). Any future todo whose acceptance criteria uses `grep -c` with an alternation pattern over multiple target strings should be double-checked the same way - write one-value-per-line if the count must equal the number of distinct values.
