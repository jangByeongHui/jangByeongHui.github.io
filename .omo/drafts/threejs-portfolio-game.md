---
slug: threejs-portfolio-game
status: drafting
intent: unclear
review_required: true
plan_path: .omo/plans/threejs-portfolio-game.md
plan_sha256: null
review_round_id: null
pending-action: write and review .omo/plans/threejs-portfolio-game.md
review:
  momus:
    status: pending
    workspace_root: null
    runtime_home: null
    target: .omo/plans/threejs-portfolio-game.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
  independent:
    status: pending
    workspace_root: null
    runtime_home: null
    target: .omo/plans/threejs-portfolio-game.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
approach: >
  Replace the current (non-functional) index.html quiz page with a single-page,
  no-build three.js "DATA ORBIT" hub-and-node exploration game: a 3D scene of
  floating procedurally-generated nodes (About, Career, Tech Stack clusters,
  OSS Contributions, Personality) connected by pipeline-style lines, navigated
  with OrbitControls (mouse-drag/touch-drag + wheel/pinch zoom), where
  click/tap raycasting on a node flies the camera to it and opens a DOM info
  panel populated with the user's real, already-public bio data. Shipped as
  plain ES modules + an import map pinned to three@0.185.1 from a CDN (no
  npm/Vite/CI), matching this repo's existing "hand-committed static files"
  history and GitHub Pages' zero-config serving of the main branch.
---

# Draft: threejs-portfolio-game

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 | Three.js scene bootstrap (renderer, camera, OrbitControls, resize/DPR handling, reduced-motion + no-WebGL fallback) loads and renders on desktop + mobile | active | index.html (current, broken references), README.md:3
- C2 | Procedural "node" geometry + pipeline-edge visualization for 5 content clusters (About, Career, Tech Stack, OSS Contributions, Personality) | active | static/js (old CRA bundle, superseded), asset-manifest.json
- C3 | Raycasting interaction: hover highlight + click/tap -> camera fly-to + DOM info panel keyed by `userData` | active | librarian research (Pattern A/B/C canonical raycasting shape)
- C4 | Real content data module populated from verified public bio facts (GitHub profile README, existing site hero copy) | active | https://github.com/jangByeongHui/jangByeongHui README.md (fetched), index.html:41-50 (existing hero/keywords)
- C5 | Gamified progress affordance (scoreboard-style "N / 5 explored" counter + completion state), echoing the current repo's stated purpose | active | README.md:3 ("게임처럼 탐험"), index.html:60-69 (existing scoreboard markup/idea)
- C6 | Static deploy correctness on GitHub Pages user site (no build step, asset-manifest.json / old CRA artifacts retired or left inert, mobile+desktop QA) | active | asset-manifest.json, static/ (CRA leftovers), git log (68d1c3b..97aa6c6 history)

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
- Delivery mechanism | No-build ES modules + import map, three@0.185.1 pinned via a CDN (jsdelivr), zero npm/Vite/GitHub Actions | Matches this repo's entire history (hand-committed static build output, no CI ever existed); three.js's own manual officially sanctions this path for zero-build sites; librarian research found real precedent (`sabpdo/sabpdo.github.io`) shipping an almost-identical setup this way | Reversible - can migrate to Vite later without touching the game's runtime code shape (same ESM imports)
- Concept/genre | "DATA ORBIT": low-poly hub-and-node scene (Pattern C: solar-system/orb-hub navigation) with a data-pipeline visual metaphor, not a walkable 3D room or WASD hub-world | Lowest implementation risk (procedural geometry, no 3D-asset-authoring pipeline needed) while still being an original, personally-themed concept (matches the user's real Data Engineer identity) rather than a copy of a generic template; librarian research confirms Pattern C is buildable without custom modeling skill | Reversible at the plan-approval stage only (changing concept after implementation starts is a rebuild, not a tweak) - flagged loudly in the brief for veto now
- Content source | Populate all bio content from what the user has ALREADY made public (github.com/jangByeongHui profile README: "Data Engineer @ KIA", Incheon, tech-stack badges, 3 real OSS PRs; plus this repo's own existing hero copy "심심함을 프로젝트로 바꾸는 사람 / Build Fast / Curious Maker / Playful Thinking") | Nothing here is new disclosure - it is already public under the user's own name; using it avoids fabricating biography while still resolving what would otherwise be a blocking content gap (no source of truth existed for the old, half-built quiz game) | Reversible - all copy lives in one data module, trivially editable later
- Scope replaces vs. coexists | REPLACE `index.html`'s current quiz UI entirely (it is already non-functional: references `./app.js` and `./styles.css`, neither of which exists anywhere in git history) rather than keep it alongside the new game | Confirmed via git history (`app.js`/`styles.css` never committed) that the current page cannot render its intended UI at all; nothing functional is lost by replacing it | Reversible via git revert
- Legacy CRA artifacts (`static/js/main.*.js`, `static/css/main.*.css`, old fruit-game media) | **SUPERSEDED**: originally "leave in place, stop referencing" - now moot, since the repo owner's own local commit `65fee0f` already deleted all of these files entirely (see the dedicated Findings entry above). This plan's todos only create new files and never need to touch/delete/unlink anything legacy. | See Findings entry on commit `65fee0f` | N/A (already done, outside this plan)
- Platform/controls | Responsive desktop + mobile: OrbitControls-style drag-to-orbit + wheel/pinch-to-zoom as primary input, click/tap for node selection; no keyboard-only (WASD) requirement | Portfolio sites need to work for any recruiter/visitor on any device; librarian research flags mobile GPU/DPR/quality-tiering as a common real-world gotcha to handle explicitly | Reversible
- Contact/links | Single verifiable CTA linking to `https://github.com/jangByeongHui` (already public, already the canonical identity anchor for this exact GitHub Pages user site) | No other contact channel (email/LinkedIn) is discoverable from any public source; inventing one would be fabrication | Reversible - easy to add more links later
- three.js version | Pin exactly `0.185.1` (latest npm `three` as of research date) via import map, both `three` and `three/addons/` from the same CDN + version, per three.js's own compatibility warning | Verified via `https://registry.npmjs.org/three/latest` | Reversible (bump the two import-map URLs together)
- CDN single point of failure | Accepted risk, not mitigated in this plan: the entire site depends on jsdelivr serving `three@0.185.1` - no vendoring/local copy, no Subresource Integrity (SRI) pin, no fallback CDN | Matches the "no build tooling" decision (vendoring would mean committing a minified `three.js` build by hand, which is exactly the kind of manual build-artifact management this plan is trying to move away from); jsdelivr has high uptime in practice and this is the same risk every no-build three.js example the librarian research found also accepts | Reversible (swap to a different CDN host, or vendor a local copy, without touching any application code)
- Visual mood | **OVERRIDDEN BY USER**: bright/cheerful pastel palette (not the dark-neon default originally proposed) - soft pastel background gradient + pastel-colored node geometry per cluster; keep existing font stack from current `index.html` (Black Han Sans / Space Grotesk / Pretendard) | User explicitly chose "밝고 경쾌한 파스텔" over the recommended dark-neon option | Reversible (palette is a single constants module)
- Profile photo | **OVERRIDDEN BY USER**: use a real photo, not an icon/initial. Concrete path decision: `static/media/profile.jpg` (fallback-checked `.png`), loaded via `THREE.TextureLoader`, rendered as a circular billboard/sprite at the "About" node position, and also shown as a circular avatar inside the About info panel. The photo FILE ITSELF is not produced by this plan (no image-generation capability) - the plan's first relevant todo documents the exact required path/aspect ratio so the user can drop the file in before running the site; a checked-in placeholder (simple pastel circle SVG/PNG) ships so the site never 404s if the real photo isn't added yet | User explicitly requested a real photo over the recommended no-photo default | Reversible (swap the file)
- Completion finale tone | Light/humorous copy (user's explicit choice) paired with the GitHub profile link CTA (user's explicit choice, matches the earlier-adopted default) | User selected "가볍고 유머러스한 느낌" | Reversible (copy lives in content.js)

## Findings (cited - path:lines)
- `README.md:3` - repo's own stated purpose: "자기소개를 게임처럼 탐험할 수 있는 인터랙티브 프로필 페이지" (an intro that can be explored like a game).
- `index.html:1-129` - current page is a 2D quiz-card game shell (hero copy, scoreboard, mission-card, choice-grid, profile-card templates) that references `./app.js` and `./styles.css` via `<script src="./app.js">` / `<link href="./styles.css">` (lines 34, 127) - **neither file exists anywhere in the repo or git history** (confirmed via `git log --all --full-history -- app.js styles.css` returning no output), so the page is currently non-functional (blank/broken on load).
- `asset-manifest.json:1-21` + `static/js/main.09e02706.js`, `static/js/main.118c427d.js` (the repo's very first "init" commit build output, superseded by `main.09e02706.js` but still present on disk - confirmed via directory listing), `static/css/main.bb4222ce.css`, `static/media/*` - leftover Create-React-App production build output from an unrelated, earlier "fruit-merge" game (Suika-style: WATERMELON/MELON/STRAWBERRY/AVOCADO/KOREANMELON/GOLDWATERMELON assets + pop sound effects), committed Dec 2023 (`68d1c3b init`, `64c7016 [feat]: Avocado`). No `src/`, `package.json`, or build config exists in the repo - only compiled/minified output was ever committed.
- Git history (`git log --oneline --all`): `a98313c` (bare README) -> `68d1c3b` "init" (CRA fruit-game build) -> `cf7e3fb`/`0ea7dce`/`64c7016` (fruit-game tweaks, Dec 2023) -> `97aa6c6` "REFACTOR: 소개 게임" (May 2026, current quiz shell, HEAD). Working tree is clean; single branch `main`; remote `github.com/jangByeongHui/jangByeongHui.github.io`. This is a GitHub Pages **user site** (`<user>.github.io` naming convention), which GitHub serves directly from the `main` branch root with no build step required.
- `https://github.com/jangByeongHui/jangByeongHui` `README.md` (fetched via GitHub API) - real, public bio: "Data Engineer @ KIA", Incheon, Republic of Korea; tech badges: Python, Apache Spark, Apache Airflow, Apache Kafka, Hadoop (data engineering); Java, Spring Boot, TypeScript, React (backend/frontend); Grafana, Docker (infra/monitoring); an auto-updated OSS-contributions table listing 3 real merged/opened PRs with their exact titles as displayed in that table:
  - `code-yeongyu/oh-my-openagent#4176` - "fix(skill-mcp-manager): trust explicit skill MCP env vars (#3995)" (title truncated to "fix(skill-mcp-manager): trust explicit skill MCP env vars" in-game for length)
  - `apache/airflow#67225` - "Fix DockerOperator on_kill to respect auto_remove='force' and remove …" (title truncated in the source table itself; in-game copy uses the same truncated form: "Fix DockerOperator on_kill to respect auto_remove='force'")
  - `danny-avila/LibreChat#13154` - "🤝 fix: Honor OPENID_REUSE_TOKENS in Admin OAuth Exchange" (in-game copy drops the leading emoji: "fix: Honor OPENID_REUSE_TOKENS in Admin OAuth Exchange")
  These three title strings are the direct, verified source for `CONTENT.oss.contributions[].title` in the plan's Todo 1 - independently re-verified against live GitHub during the dual high-accuracy review (both reviewers confirmed all three PRs are real, merged/opened, and authored by `jangByeongHui`).
- `index.html:41-50` - existing on-brand copy worth reusing verbatim: H1 "심심함을 프로젝트로 바꾸는 사람, 장병희"; hero-stats keywords "Build Fast", "Curious Maker", "Playful Thinking".
- `https://registry.npmjs.org/three/latest` - current published `three` npm version is `0.185.1`.
- Librarian research (external, see task session `ses_02da1d20dffe7OTqpEtezQR4zz`): three real GitHub precedents for no-build, CDN-import-map three.js portfolios (`sabpdo/sabpdo.github.io`, plus import-map patterns in `Fennec-hub/three-viewport-gizmo`, `vasturiano/three-globe`); three.js's own manual (threejs.org/manual/en/installation.html) explicitly documents and endorses the import-map + CDN path, with the explicit warning to pin `three` and `three/addons/` to the identical version/CDN; canonical raycasting-for-click-info-panel code shape confirmed across `sabpdo`, `KlausWeigele/alex-zimmer-portfolio`, `griffinhampton/PSX-Portfolio`, `Prathameshh12/SpacePortfolio`; mobile/perf/accessibility gotchas (DPR capping, `prefers-reduced-motion` static-frame fallback, WebGL-unavailable fallback, deferred/idle-loaded heavy assets) documented with real-repo citations.
- User-supplied personal content (direct answers, this session, verbatim intent preserved):
  - 취미: "주로 영화보기" (watching movies) -> About/Personality node.
  - 좌우명: "날 죽이지 못한 고통은 날 강하게 만들 뿐이다" -> About/Personality node.
  - 대표 프로젝트 에피소드: "OpenCV 기반에 주차장 관제 및 보행자 측위 시스템 개발" -> one-line story on the Career node, alongside the "Data Engineer @ KIA" title.
  - 성격 키워드/자기 서술: "하고 싶은게 생기면 당장해봐야 직성이 풀려요" -> About/Personality node, alongside the existing "Build Fast / Curious Maker / Playful Thinking" tags.
  - Visual mood: explicit choice "밝고 경쾌한 파스텔" (bright cheerful pastel) - overrides the earlier-proposed dark-neon default.
  - Photo: explicit choice "실제 사진 사용" (use a real photo) - overrides the earlier-proposed no-photo default.
  - Completion tone: explicit choice "가볍고 유머러스한 느낌" (light/humorous), keep GitHub link CTA.

- **[Discovered during dual high-accuracy review, post-approval]** `git log --oneline -20` on the live repo shows a NEW local commit `65fee0f` ("chore: 레거시 프로젝트 파일 전체 삭제 (신규 프로젝트 구성 준비)", author `BennyJang <jbh@kia.com>` - the repo owner themselves, matching the KIA email domain - dated the same day as this planning session) that deletes ALL 27 remaining files: `index.html`, `README.md`, `robots.txt`, `asset-manifest.json`, `thumbnail.png`, every `static/*` file, and the `.idea/` directory. `git ls-tree -r HEAD` is now empty. This commit is **local-only, NOT pushed** (`git status`: "ahead of origin/main by 1 commit"; `origin/main` still points at the prior `97aa6c6`). This is the repo owner proactively clearing legacy cruft in anticipation of the new project (the commit message literally says "preparing new project structure") - not an external/hostile change - but it means every plan todo that referenced "the current index.html" / "the existing README.md" to preserve/reuse parts of now targets a file that doesn't exist at HEAD; those todos were rewritten to CREATE fresh files reproducing the needed pre-deletion content verbatim (captured in this Findings section before the deletion) rather than to modify/diff-against an existing file. Pre-deletion content remains recoverable via `git show 97aa6c6:<path>` if ever needed. The user should be informed this local commit exists and is unpushed, in case they want to review/amend it before this plan's todos build on top of it.

## Decisions (with rationale)
- Ship as a single-page no-build ES-module app (no framework, no bundler) - see Open assumptions "Delivery mechanism".
- Concept = "DATA ORBIT" hub-and-node scene, five clusters: About/Personality, Career (KIA Data Engineer), Tech Stack (grouped by the three badge categories from the real README), OSS Contributions (the 3 real PRs), and a "Play"/progress affordance that tracks how many of the 5 clusters have been opened (mirrors the current site's existing scoreboard idea, C5) and hosts the completion finale.
- Content is 100% sourced from already-public GitHub data (C4) PLUS the user's own direct answers this session (hobby, motto, career-highlight story, personality line) - no invented biography beyond what the user stated.
- File architecture (all new, ES modules, no bundler): `index.html` (shell + import map + canvas + DOM overlay containers), `static/css/game.css`, `static/js/content.js` (all copy/data), `static/js/theme.js` (pastel palette constants), `static/js/scene.js` (renderer/camera/OrbitControls/resize/DPR/fallbacks), `static/js/nodes.js` (procedural node+edge geometry, photo sprite), `static/js/interactions.js` (raycasting/hover/click/camera fly-to), `static/js/ui.js` (info panel, progress tracker, completion finale), `static/js/main.js` (entry point, wires everything, mounted as the sole `<script type="module">` in `index.html`). Splitting into these modules is what makes the todo waves below genuinely parallelizable instead of N people editing one file.
- Node content (final, decision-complete):
  - **About/Personality**: hero line "심심함을 프로젝트로 바꾸는 사람, 장병희" (reused verbatim from current `index.html:41`); keyword tags "Build Fast" / "Curious Maker" / "Playful Thinking" (reused verbatim from `index.html:47-49`) PLUS new personality line "하고 싶은게 생기면 당장 해봐야 직성이 풀려요"; hobby "영화 보기"; motto "날 죽이지 못한 고통은 날 강하게 만들 뿐이다"; location "인천, Republic of Korea"; circular photo billboard/avatar (see Photo decision above).
  - **Career**: title "Data Engineer @ KIA"; one-line highlight story "OpenCV 기반 주차장 관제 및 보행자 측위 시스템 개발".
  - **Tech Stack**: three sub-groups exactly as in the real GitHub README - Data Engineering (Python, Apache Spark, Apache Airflow, Apache Kafka, Hadoop); Backend & Frontend (Java, Spring Boot, TypeScript, React); Infra & Monitoring (Grafana, Docker).
  - **OSS Contributions**: the 3 real PRs with titles + links - `code-yeongyu/oh-my-openagent#4176`, `apache/airflow#67225`, `danny-avila/LibreChat#13154`.
  - **Play/Progress**: "N / 5 explored" counter; on reaching 5/5, shows a light/humorous finale message (exact copy to be authored in the content.js todo, tone = playful/self-aware, e.g. acknowledging the visitor actually explored everything) plus a GitHub-profile-link button to `https://github.com/jangByeongHui`.
- **SUPERSEDED**: legacy CRA build output/media are no longer in the repo at all - the owner's commit `65fee0f` already deleted them before this plan's execution begins (see Findings entry above). This plan's todos only create new files.
- Accessibility/perf baseline is mandatory, not optional: DPR cap, `prefers-reduced-motion` static-frame mode, WebGL-capability fallback to a static HTML summary, mobile quality tiering - these become explicit acceptance criteria on relevant todos, not an afterthought.
- QA/dev-serving decision: use an ad hoc static file server for local QA only (e.g. `npx serve` or `python3 -m http.server`) - ES module import maps require `http://`, not `file://`. This is a QA-time tool invocation, NOT a new repo dependency; no `package.json` is added.

## Scope IN
- New `index.html` (or equivalent) three.js "DATA ORBIT" experience replacing the current quiz shell.
- Scene bootstrap: renderer/camera/OrbitControls/resize/DPR handling.
- Procedural node + connecting-edge geometry for the 5 content clusters.
- Raycasting hover/click interaction with camera fly-to + DOM info-panel overlay.
- Real content data module (About/Personality, Career, Tech Stack, OSS Contributions) sourced from the verified public bio.
- Progress/completion affordance ("X / 5 explored").
- Responsive input handling (mouse drag/wheel + touch drag/pinch), mobile quality tier.
- `prefers-reduced-motion` fallback + no-WebGL static fallback for accessibility/robustness.
- Creating `README.md`/meta tags in `index.html` fresh (both files were deleted by the owner's commit `65fee0f` before this plan runs - see Findings) reproducing the pre-deletion premise verbatim plus new lines describing the 3D game.
- Manual/agent-executed QA across desktop + a mobile viewport emulation (e.g. Playwright).

## Scope OUT (Must NOT have)
- No npm/Vite/webpack build pipeline, no `package.json`, no GitHub Actions CI/CD (Open assumptions: Delivery mechanism).
- No custom 3D asset modeling/GLTF authoring pipeline (Blender scenes, character rigs) - the concept is procedural-geometry-only by design.
- No further deletion of files needed: the repo owner's own local (unpushed) commit `65fee0f` already deleted every legacy CRA/fruit-game file (`static/js/main.*`, `static/css/main.*`, `static/media/*`, `asset-manifest.json`) plus the old `index.html`/`README.md`/`robots.txt`/`thumbnail.png`/`.idea/` - `git ls-tree -r HEAD` is empty. This plan's todos only CREATE new files; see the dedicated Findings entry above for full detail.
- No fabricated biography, employer/project claims, or contact info beyond what is already public.
- No WASD/first-person locomotion, no physics engine, no multiplayer/backend/server component.
- No expansion into unrelated portfolio features (blog, comments, analytics dashboards) not implied by "3D self-introduction game".

## Open questions
(none surviving research - see Open assumptions ledger; the two decisions with real personal/creative weight - concept direction and public-content selection - are resolved from verified public sources and surfaced for veto at the approval gate rather than asked as interview questions, per the UNCLEAR-intent routing.)

## Approval gate
status: approved
<!-- User replied "진행해줘" (proceed) to the brief presented in this session - approval authorizes writing .omo/plans/threejs-portfolio-game.md ONLY, never implementation. -->
<!-- User also answered a follow-up personalization round (hobby/motto/career story/personality line/visual mood/photo/finale tone), folded into Open assumptions + Decisions above before plan generation, per their explicit invitation "나랑 관련된 질문을 하면 내가 답해줄게". -->
next workflow action: COMPLETE. Plan generated at `.omo/plans/threejs-portfolio-game.md` (12 implementation todos + F1-F4 final verification, TL;DR filled last). Metis gap analysis ran once (10 must-fix findings, all folded in). Dual high-accuracy review ran 5 rounds total (momus + independent oracle in parallel each round) due to a mid-review discovery that the live repo owner made a local, unpushed commit (`65fee0f`) deleting all remaining legacy files - this required plan rewrites beyond the original Metis-fix set. Round 5: BOTH momus and oracle returned VERDICT: APPROVE with no remaining blocking issues. status: review-approved. Ready for handoff to the user; execution begins only via a separate worker session (`$start-work threejs-portfolio-game`).
