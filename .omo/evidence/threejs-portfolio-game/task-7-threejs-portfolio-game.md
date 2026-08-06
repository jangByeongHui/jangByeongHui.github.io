# Todo 7 — static/js/ui.js — QA Evidence

Tool: Playwright MCP `browser_evaluate` against the real `index.html` page served by
`python3 -m http.server 4173`, dynamic-importing `./static/js/content.js` and
`./static/js/ui.js` directly (no detached-canvas harness needed — `#info-panel`/`#hud`
already exist in the real DOM).

## Happy path

Dispatched all 5 `data-orbit:node-select` events in `NODE_ORDER` sequence
(`about, career, techStack, oss, play`) via `window.dispatchEvent(new CustomEvent(...))`.

Per-event results:

| id | `#hud` textContent | `#info-panel-heading` exists | heading text |
|---|---|---|---|
| about | `1 / 5 explored` | true | `장병희` |
| career | `2 / 5 explored` | true | `Data Engineer @ KIA` |
| techStack | `3 / 5 explored` | true | `Tech Stack` |
| oss | `4 / 5 explored` | true | `OSS` |
| play | `5 / 5 explored` | true | `진행 상황` |

- Final `#hud` textContent: `5 / 5 explored` ✅ (matches acceptance criteria)
- `data-orbit:complete` events observed: **exactly 1** ✅ (listener counter, incremented once)
- `#info-panel-heading` non-empty after every one of the 5 selections ✅
- Re-dispatched `about` after the full run and confirmed
  `#info-panel .info-body` textContent includes the motto string
  `"날 죽이지 못한 고통은"` → `true` ✅
- `visited.size` after happy run: `5`

Rendered `about` body (verbatim `innerHTML` snapshot, confirms h2 heading is the
FIRST element with `id="info-panel-heading"`, followed by photo/tagline/keyword
chips/hobby/motto/location, all sourced from `content.about`):

```html
<h2 id="info-panel-heading">장병희</h2>
<img class="info-photo" alt="장병희" src="./static/media/profile.jpg">
<p class="info-tagline">심심함을 프로젝트로 바꾸는 사람, 장병희</p>
<ul class="info-keyword-chips">
  <li class="info-chip">Build Fast</li>
  <li class="info-chip">Curious Maker</li>
  <li class="info-chip">Playful Thinking</li>
  <li class="info-chip">하고 싶은게 생기면 당장 해봐야 직성이 풀려요</li>
</ul>
<p class="info-hobby">취미: 영화 보기</p>
<p class="info-motto">날 죽이지 못한 고통은 날 강하게 만들 뿐이다</p>
<p class="info-location">인천, Republic of Korea</p>
```

Rendered `techStack` body (confirms 3 labeled groups as lists):

```html
<h2 id="info-panel-heading">Tech Stack</h2>
<h3 class="info-group-label">Data Engineering</h3>
<ul class="info-group-items"><li>Python</li><li>Apache Spark</li><li>Apache Airflow</li><li>Apache Kafka</li><li>Hadoop</li></ul>
<h3 class="info-group-label">Backend &amp; Frontend</h3>
<ul class="info-group-items"><li>Java</li><li>Spring Boot</li><li>TypeScript</li><li>React</li></ul>
<h3 class="info-group-label">Infra &amp; Monitoring</h3>
<ul class="info-group-items"><li>Grafana</li><li>Docker</li></ul>
```

Rendered `oss` body (confirms 3 PR cards as `target="_blank" rel="noopener"` links):

```html
<h2 id="info-panel-heading">OSS</h2>
<div class="info-oss-list">
  <a class="info-oss-card" href="https://github.com/code-yeongyu/oh-my-openagent/pull/4176" target="_blank" rel="noopener">
    <span class="info-oss-repo">code-yeongyu/oh-my-openagent #4176</span>
    <span class="info-oss-title">fix(skill-mcp-manager): trust explicit skill MCP env vars</span>
  </a>
  <a class="info-oss-card" href="https://github.com/apache/airflow/pull/67225" target="_blank" rel="noopener">
    <span class="info-oss-repo">apache/airflow #67225</span>
    <span class="info-oss-title">Fix DockerOperator on_kill to respect auto_remove='force'</span>
  </a>
  <a class="info-oss-card" href="https://github.com/danny-avila/LibreChat/pull/13154" target="_blank" rel="noopener">
    <span class="info-oss-repo">danny-avila/LibreChat #13154</span>
    <span class="info-oss-title">fix: Honor OPENID_REUSE_TOKENS in Admin OAuth Exchange</span>
  </a>
</div>
```

Rendered `play` body (standalone progress panel — `CONTENT.play.title` +
`CONTENT.play.description` + current "N / 5 explored" count, NOT the Todo-8 finale):

```html
<h2 id="info-panel-heading">진행 상황</h2>
<p class="info-play-description">지금까지 몇 개의 노드를 탐험했는지 보여주는 진행 카드예요. 다른 노드도 마저 둘러보시면 마지막에 재미있는 게 기다리고 있어요 👀</p>
<p class="info-play-progress">5 / 5 explored</p>
```

## Close interactions

- `.close` button click: `#info-panel` `hidden` class `false → true` ✅
- Re-opened via a new `data-orbit:node-select` (`career`): `hidden` `true → false` ✅
- `Escape` keydown: `hidden` `false → true` ✅

## Console messages during full run

- `[ERROR] Failed to load resource: the server responded with a status of 404 (File not found) @ .../static/media/profile.jpg`
  — EXPECTED. `static/media/profile.jpg` is a user-supplied asset that genuinely does
  not exist yet (confirmed in Todo 3/5 learnings); the `about` template's `<img>`
  naturally 404s and the browser logs this network-level resource error. This is not
  an uncaught JS exception from `ui.js` and does not affect rendering (fallback image
  swap is wired via the `error` listener but was not separately re-verified here since
  Todo 5 already covers the identical fallback pattern for the node's own photo sprite).
- `[WARNING] [ui] Unrecognized node id: doesnotexist @ .../static/js/ui.js` — EXPECTED,
  produced by the failure-path QA scenario (see `.txt` evidence), confirms the
  `console.warn` no-op path per the "Must NOT throw" requirement.

No other console errors or warnings were observed across the happy-path run.

## Server

`python3 -m http.server 4173`, killed after QA (`pkill -f "http.server 4173"`).
