// DATA ORBIT - info panel rendering and 5-node progress tracker
// Renders `content[id]` into `#info-panel .info-body` on `data-orbit:node-select`,
// tracks session-only visited node ids, and fires `data-orbit:complete` once all
// nodes have been explored. Renders only from the `content` argument - no
// hardcoded content strings.

/** Human-readable fallback headings for content entries that carry no `title` field. */
const FALLBACK_TITLES = {
  techStack: 'Tech Stack',
  oss: 'OSS',
};

/**
 * Resolves the `<h2 id="info-panel-heading">` text for a given node id.
 * Prefers `data.title` when present, otherwise a small structural fallback label,
 * otherwise the raw id.
 */
function getHeadingTitle(id, data) {
  if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
    return data.title;
  }
  return FALLBACK_TITLES[id] || id;
}

/** About: photo (with fallback) + tagline + keyword chips + hobby + motto + location. */
function renderAbout(container, data) {
  const photo = document.createElement('img');
  photo.className = 'info-photo';
  photo.alt = data.title || '';
  photo.src = data.photo;
  photo.addEventListener(
    'error',
    () => {
      if (photo.dataset.fallbackApplied === 'true') return;
      photo.dataset.fallbackApplied = 'true';
      photo.src = data.photoFallback;
    },
    { once: true }
  );
  container.appendChild(photo);

  const tagline = document.createElement('p');
  tagline.className = 'info-tagline';
  tagline.textContent = data.tagline;
  container.appendChild(tagline);

  const chipList = document.createElement('ul');
  chipList.className = 'info-keyword-chips';
  (data.keywords || []).forEach((keyword) => {
    const chip = document.createElement('li');
    chip.className = 'info-chip';
    chip.textContent = keyword;
    chipList.appendChild(chip);
  });
  container.appendChild(chipList);

  const hobby = document.createElement('p');
  hobby.className = 'info-hobby';
  hobby.textContent = `취미: ${data.hobby}`;
  container.appendChild(hobby);

  const motto = document.createElement('p');
  motto.className = 'info-motto';
  motto.textContent = data.motto;
  container.appendChild(motto);

  const location = document.createElement('p');
  location.className = 'info-location';
  location.textContent = data.location;
  container.appendChild(location);
}

/** Career: highlight only (title is already rendered as the panel heading). */
function renderCareer(container, data) {
  const highlight = document.createElement('p');
  highlight.className = 'info-highlight';
  highlight.textContent = data.highlight;
  container.appendChild(highlight);
}

/** techStack: 3 labeled groups, each rendered as a heading + list. */
function renderTechStack(container, data) {
  (data.groups || []).forEach((group) => {
    const label = document.createElement('h3');
    label.className = 'info-group-label';
    label.textContent = group.label;
    container.appendChild(label);

    const list = document.createElement('ul');
    list.className = 'info-group-items';
    (group.items || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    container.appendChild(list);
  });
}

/** oss: 3 PR cards as external links showing repo + PR number + title. */
function renderOss(container, data) {
  const list = document.createElement('div');
  list.className = 'info-oss-list';
  (data.contributions || []).forEach((contribution) => {
    const card = document.createElement('a');
    card.className = 'info-oss-card';
    card.href = contribution.url;
    card.target = '_blank';
    card.rel = 'noopener';

    const repoLine = document.createElement('span');
    repoLine.className = 'info-oss-repo';
    repoLine.textContent = `${contribution.repo} ${contribution.pr}`;
    card.appendChild(repoLine);

    const titleLine = document.createElement('span');
    titleLine.className = 'info-oss-title';
    titleLine.textContent = contribution.title;
    card.appendChild(titleLine);

    list.appendChild(card);
  });
  container.appendChild(list);
}

/**
 * play: standalone progress panel shown when the `play` node itself is clicked.
 * Uses ONLY `data.title`/`data.description` (the panel heading already consumes
 * `data.title`) - the separate Todo-8 finale overlay owns `finaleTitle`/
 * `finaleMessage`/`ctaLabel`/`ctaUrl` and is not rendered here.
 */
function renderPlay(container, data, visitedCount, totalNodes) {
  const description = document.createElement('p');
  description.className = 'info-play-description';
  description.textContent = data.description;
  container.appendChild(description);

  const progress = document.createElement('p');
  progress.className = 'info-play-progress';
  progress.textContent = `${visitedCount} / ${totalNodes} explored`;
  container.appendChild(progress);
}

const RENDERERS = {
  about: renderAbout,
  career: renderCareer,
  techStack: renderTechStack,
  oss: renderOss,
  play: renderPlay,
};

/** Class prefix used to tag `#info-panel` with the currently selected node id,
 * so `game.css` can render a per-id top accent strip (`.info-panel--about`, etc).
 * Purely presentational - carries no behavior. */
const INFO_PANEL_ID_CLASS_PREFIX = 'info-panel--';

/** Removes any previously-applied `info-panel--*` id class from `#info-panel`,
 * so a stale accent color never leaks into the next selection or a closed panel. */
function clearInfoPanelIdClass(panel) {
  if (!panel) return;
  Array.from(panel.classList)
    .filter((cls) => cls.startsWith(INFO_PANEL_ID_CLASS_PREFIX))
    .forEach((cls) => panel.classList.remove(cls));
}

const FINALE_OVERLAY_ID = 'finale-overlay';
const FINALE_HEADING_ID = 'finale-heading';
const FINALE_SPARK_COUNT = 6;

/**
 * Builds the decorative sparkle flourish inside the finale overlay. Purely
 * cosmetic (no content data) - the CSS `@media (prefers-reduced-motion:
 * reduce)` rule in `game.css` hides these elements entirely, so reduced-motion
 * users see the static finale card immediately with no animation.
 */
function renderFinaleFlourish(container) {
  const flourish = document.createElement('div');
  flourish.className = 'finale-flourish';
  flourish.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < FINALE_SPARK_COUNT; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'finale-spark';
    spark.style.setProperty('--finale-spark-left', `${8 + i * (84 / (FINALE_SPARK_COUNT - 1))}%`);
    spark.style.setProperty('--finale-spark-delay', `${i * 0.08}s`);
    spark.textContent = i % 2 === 0 ? '✨' : '🎉';
    flourish.appendChild(spark);
  }

  container.appendChild(flourish);
}

/**
 * Renders the completion finale overlay from `content.play`'s finale fields
 * (`finaleTitle`/`finaleMessage`/`ctaLabel`/`ctaUrl`) - distinct from the
 * standalone `play` info-panel body, which uses `title`/`description` only.
 *
 * Defensively guards against duplicate DOM nodes: if a finale overlay already
 * exists (by id), this is a no-op, even though `initUI`'s own
 * `completeDispatched` guard should already prevent `data-orbit:complete`
 * from firing more than once per session.
 */
function renderFinale(content) {
  if (document.getElementById(FINALE_OVERLAY_ID)) {
    return;
  }

  const playData = content && content.play;
  if (!playData) {
    console.warn('[ui] Missing content.play data for finale overlay.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = FINALE_OVERLAY_ID;
  overlay.className = 'finale-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-labelledby', FINALE_HEADING_ID);
  overlay.setAttribute('tabindex', '-1');

  renderFinaleFlourish(overlay);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close';
  closeButton.setAttribute('aria-label', '닫기');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });
  overlay.appendChild(closeButton);

  const heading = document.createElement('h2');
  heading.id = FINALE_HEADING_ID;
  heading.className = 'finale-title';
  heading.textContent = playData.finaleTitle;
  overlay.appendChild(heading);

  const message = document.createElement('p');
  message.className = 'finale-message';
  message.textContent = playData.finaleMessage;
  overlay.appendChild(message);

  const cta = document.createElement('a');
  cta.className = 'finale-cta';
  cta.href = playData.ctaUrl;
  cta.target = '_blank';
  cta.rel = 'noopener';
  cta.textContent = playData.ctaLabel;
  overlay.appendChild(cta);

  document.body.appendChild(overlay);
  overlay.focus();
}

/**
 * Clears `#info-panel .info-body` and rebuilds it: an `<h2 id="info-panel-heading">`
 * first, followed by the per-id body produced by `RENDERERS[id]`.
 */
function renderInfoBody(infoBody, id, data, visitedCount, totalNodes) {
  infoBody.replaceChildren();

  const heading = document.createElement('h2');
  heading.id = 'info-panel-heading';
  heading.textContent = getHeadingTitle(id, data);
  infoBody.appendChild(heading);

  const renderer = RENDERERS[id];
  if (renderer) {
    renderer(infoBody, data, visitedCount, totalNodes);
  }
}

/**
 * Wires up the info panel + progress tracker.
 * @param {{ content: Record<string, object> }} options - `content` is the
 *   `CONTENT` map from `content.js` (keyed by node id).
 * @returns {{ visited: Set<string> }} the in-memory (session-only) visited set,
 *   exposed mainly for QA introspection.
 */
export function initUI({ content }) {
  const infoPanel = document.getElementById('info-panel');
  const infoBody = infoPanel ? infoPanel.querySelector('.info-body') : null;
  const closeButton = infoPanel ? infoPanel.querySelector('.close') : null;
  const hud = document.getElementById('hud');

  const visited = new Set();
  let completeDispatched = false;

  const totalNodes =
    content && content.play && typeof content.play.totalNodes === 'number'
      ? content.play.totalNodes
      : 5;

  function openPanel() {
    if (!infoPanel) return;
    infoPanel.classList.remove('hidden');
    if (!infoPanel.hasAttribute('tabindex')) {
      infoPanel.setAttribute('tabindex', '-1');
    }
    infoPanel.focus();
  }

  function closePanel() {
    if (!infoPanel) return;
    infoPanel.classList.add('hidden');
    clearInfoPanelIdClass(infoPanel);
  }

  function handleNodeSelect(event) {
    const detail = event && event.detail;
    const id = detail && detail.id;
    const data = content ? content[id] : undefined;

    if (!data) {
      console.warn(`[ui] Unrecognized node id: ${id}`);
      return;
    }

    const isNew = !visited.has(id);
    visited.add(id);

    if (infoBody) {
      renderInfoBody(infoBody, id, data, visited.size, totalNodes);
    }
    if (infoPanel) {
      clearInfoPanelIdClass(infoPanel);
      infoPanel.classList.add(`${INFO_PANEL_ID_CLASS_PREFIX}${id}`);
    }
    openPanel();

    if (isNew && hud) {
      hud.textContent = `${visited.size} / ${totalNodes} explored`;
    }

    if (isNew && !completeDispatched && visited.size === totalNodes) {
      completeDispatched = true;
      window.dispatchEvent(new CustomEvent('data-orbit:complete'));
    }
  }

  function handleComplete() {
    renderFinale(content);
  }

  window.addEventListener('data-orbit:node-select', handleNodeSelect);
  window.addEventListener('data-orbit:complete', handleComplete);

  if (closeButton) {
    closeButton.addEventListener('click', closePanel);
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePanel();
    }
  });

  return { visited };
}
