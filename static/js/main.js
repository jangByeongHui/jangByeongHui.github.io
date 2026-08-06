// DATA ORBIT - application entry point
// Wires every module together (theme/content data, three.js scene bootstrap,
// node geometry, pointer interactions, and the info-panel/finale UI), and is
// the ONLY place in the app that owns a `requestAnimationFrame` render loop.
// No other module may schedule its own frames.

import { THEME } from './theme.js';
import { CONTENT, NODE_ORDER } from './content.js';
import { initScene } from './scene.js';
import { createNodes } from './nodes.js';
import { initInteractions } from './interactions.js';
import { initUI } from './ui.js';

/** Human-readable fallback headings for content entries that carry no `title` field. */
const FALLBACK_HEADINGS = {
  techStack: 'Tech Stack',
  oss: 'OSS',
};

/** Appends a `<p>` with `text` to `parent`, skipping falsy/empty text entirely. */
function appendParagraph(parent, text) {
  if (!text) return;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  parent.appendChild(paragraph);
}

/** Appends a `<ul>` of `<li>` items to `parent`, skipping empty/missing lists entirely. */
function appendList(parent, items) {
  if (!items || items.length === 0) return;
  const list = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  parent.appendChild(list);
}

/**
 * Builds a plain, static HTML summary of `content` for the no-WebGL fallback
 * path (`#fallback`): all 5 nodes' key fields as readable text/lists, in
 * `NODE_ORDER`, sourced entirely from `content` - no hardcoded content data.
 */
function renderFallbackSummary(container, content) {
  container.replaceChildren();

  const heading = document.createElement('h1');
  heading.textContent = (content.about && content.about.title) || 'DATA ORBIT';
  container.appendChild(heading);

  NODE_ORDER.forEach((id) => {
    const data = content[id];
    if (!data) return;

    const section = document.createElement('section');

    const sectionHeading = document.createElement('h2');
    sectionHeading.textContent = data.title || FALLBACK_HEADINGS[id] || id;
    section.appendChild(sectionHeading);

    switch (id) {
      case 'about': {
        appendParagraph(section, data.tagline);
        appendList(section, data.keywords);
        appendParagraph(section, data.hobby ? `취미: ${data.hobby}` : null);
        appendParagraph(section, data.motto);
        appendParagraph(section, data.location);
        break;
      }
      case 'career': {
        appendParagraph(section, data.location);
        appendParagraph(section, data.highlight);
        break;
      }
      case 'techStack': {
        (data.groups || []).forEach((group) => {
          const groupHeading = document.createElement('h3');
          groupHeading.textContent = group.label;
          section.appendChild(groupHeading);
          appendList(section, group.items);
        });
        break;
      }
      case 'oss': {
        const list = document.createElement('ul');
        (data.contributions || []).forEach((contribution) => {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.href = contribution.url;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = `${contribution.repo} ${contribution.pr} — ${contribution.title}`;
          li.appendChild(link);
          list.appendChild(li);
        });
        section.appendChild(list);
        break;
      }
      case 'play': {
        appendParagraph(section, data.description);
        break;
      }
      default:
        break;
    }

    container.appendChild(section);
  });
}

/**
 * Boots the DATA ORBIT app: bootstraps the three.js scene, and either falls
 * back to a plain static HTML summary (no WebGL) or wires nodes +
 * interactions + UI together and starts the single owned render loop.
 */
function boot() {
  const canvas = document.getElementById('scene');
  // Device-tier decided ONCE here at boot - never recomputed on resize.
  const lowTier = navigator.maxTouchPoints > 0 || window.innerWidth < 768;
  const sceneResult = initScene(canvas, lowTier);

  if (!sceneResult.isWebGLAvailable) {
    const fallback = document.getElementById('fallback');
    canvas.classList.add('hidden');
    if (fallback) {
      fallback.classList.remove('hidden');
      renderFallbackSummary(fallback, CONTENT);
    }
    window.__DATA_ORBIT_DEBUG__ = { isWebGLAvailable: false };
    return; // No further three.js calls.
  }

  const { scene, camera, renderer, controls, isReducedMotion } = sceneResult;

  const nodes = createNodes(scene, THEME, CONTENT, lowTier);
  const interactions = initInteractions({ scene, camera, renderer, controls, nodes, isReducedMotion });
  initUI({ content: CONTENT });

  window.__DATA_ORBIT_DEBUG__ = {
    isWebGLAvailable: sceneResult.isWebGLAvailable,
    isReducedMotion,
    renderer,
    scene,
    camera,
    nodes,
  };

  if (isReducedMotion) {
    // No continuous loop under reduced motion - but each one-off render below
    // fires via requestAnimationFrame (never a direct synchronous
    // renderer.render() call, never self-rescheduling), one per discrete
    // state change, so the canvas doesn't go stale after a click/resize:
    // `flyToNode` snaps the camera synchronously BEFORE our next paint runs,
    // and scene.js's own resize listener (registered earlier, inside
    // `initScene`) updates aspect/background before ours (registered after)
    // schedules the repaint.
    const scheduleReducedMotionRender = () => {
      requestAnimationFrame(() => {
        renderer.render(scene, camera);
      });
    };

    scheduleReducedMotionRender();
    window.addEventListener('data-orbit:node-select', scheduleReducedMotionRender);
    window.addEventListener('resize', scheduleReducedMotionRender);
    return;
  }

  // Single continuous render loop, owned exclusively by main.js.
  let previousTimestamp = null;
  function renderLoop(timestamp) {
    const deltaTime = previousTimestamp === null ? 0 : timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    controls.update();
    interactions.update(deltaTime);
    renderer.render(scene, camera);

    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);
}

boot();
