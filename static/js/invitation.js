const address = '서울특별시 서초구 헌릉로 12, 현대자동차기아빌딩 그랜드 홀';
const copyButton = document.querySelector('[data-copy-address]');
const copyStatus = document.querySelector('#copy-status');
const buildButton = document.querySelector('[data-build-invitation]');
const heroEl = document.querySelector('.hero');
const heroIntro = document.querySelector('[data-hero-intro]');
const heroWatches = document.querySelector('[data-hero-watches]');
const buildConsole = document.querySelector('#build-console');
const buildStatus = document.querySelector('[data-build-status]');
const buildOutput = document.querySelector('[data-build-output]');
const buildSr = document.querySelector('[data-build-sr]');
const nextWindow = document.querySelector('[data-next-window]');
const gatedContent = document.querySelector('[data-gated-content]');
const lockedGate = document.querySelector('[data-locked-gate]');
const runStatusBar = document.querySelector('[data-run-status]');
const liveClock = document.querySelector('[data-live-clock]');
const countdownDays = document.querySelector('[data-countdown-days]');
const countdownClock = document.querySelector('[data-countdown-clock]');
const countdownSr = document.querySelector('[data-countdown-sr]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let buildInProgress = false;

const buildSteps = [
  '› resolving two people...',
  '› merging paths: success',
  '› compiling 2027.06.27 / 12:00 PM',
  '› deploying to GRAND HALL',
  '✓ Process finished, exit code 0.',
];

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(address);
    copyStatus.textContent = '주소를 클립보드에 복사했습니다.';
    copyButton.classList.add('copied');
    copyButton.innerHTML = '<span aria-hidden="true">✓</span> Copied';
  } catch {
    copyStatus.textContent = `주소: ${address}`;
  }
}

copyButton?.addEventListener('click', copyAddress);

/** Generic clipboard-copy handler for the account-number "Copy account" buttons in CONTRIBUTING.md. */
document.querySelectorAll('[data-copy-account]').forEach((button) => {
  const statusEl = document.getElementById(button.getAttribute('aria-describedby'));
  button.addEventListener('click', async () => {
    const value = button.dataset.copyAccount;
    try {
      await navigator.clipboard.writeText(value);
      if (statusEl) statusEl.textContent = '계좌번호를 클립보드에 복사했습니다.';
      button.classList.add('copied');
      button.innerHTML = '<span aria-hidden="true">✓</span> Copied';
    } catch {
      if (statusEl) statusEl.textContent = `계좌: ${value}`;
    }
  });
});

/** Ceremony schedule constants shared by the "Add to Google Calendar" / ".ics download" actions. */
const EVENT_TITLE = '장병희 ♥ PJG 결혼식';
const EVENT_LOCATION = '서울특별시 서초구 헌릉로 12, 현대자동차기아빌딩 그랜드 홀';
const EVENT_DESCRIPTION = '장병희와 PJG의 결혼식에 초대합니다. 그랜드 홀에서 뵙겠습니다.';
const EVENT_START_UTC = '20270627T030000Z'; // 2027-06-27 12:00 KST
const EVENT_END_UTC = '20270627T050000Z'; // 2027-06-27 14:00 KST

const googleCalendarButton = document.querySelector('[data-add-google-calendar]');
const icsButton = document.querySelector('[data-download-ics]');
const calendarStatus = document.querySelector('#calendar-status');

googleCalendarButton?.addEventListener('click', () => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    dates: `${EVENT_START_UTC}/${EVENT_END_UTC}`,
    details: EVENT_DESCRIPTION,
    location: EVENT_LOCATION,
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
});

/** Escapes text per RFC 5545 (commas, semicolons, and newlines must be backslash-escaped in ICS values). */
function escapeIcsText(text) {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

function formatIcsTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

icsButton?.addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JANG-PJG-WEDDING//invitation//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:jang-pjg-wedding-20270627@jangbyeonghui.github.io',
    `DTSTAMP:${formatIcsTimestamp(new Date())}`,
    `DTSTART:${EVENT_START_UTC}`,
    `DTEND:${EVENT_END_UTC}`,
    `SUMMARY:${escapeIcsText(EVENT_TITLE)}`,
    `DESCRIPTION:${escapeIcsText(EVENT_DESCRIPTION)}`,
    `LOCATION:${escapeIcsText(EVENT_LOCATION)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jang-pjg-wedding.ics';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  if (calendarStatus) calendarStatus.textContent = '캘린더 파일(.ics)을 다운로드했습니다.';
});

/** Types `text` into `element` one character at a time; instant when reduced motion is preferred. */
function typeLine(element, text, speed = 18) {
  return new Promise((resolve) => {
    if (prefersReducedMotion) {
      element.textContent = text;
      resolve();
      return;
    }
    let index = 0;
    const tick = () => {
      element.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) {
        window.setTimeout(tick, speed);
      } else {
        resolve();
      }
    };
    tick();
  });
}

async function runInvitationBuild() {
  if (!buildButton || !buildConsole || !buildStatus || !buildOutput || buildInProgress || buildButton.disabled) return;

  buildInProgress = true;
  heroEl?.classList.add('is-launched');
  buildConsole.hidden = false;
  if (lockedGate) lockedGate.hidden = false;
  buildButton.setAttribute('aria-busy', 'true');
  buildButton.classList.add('is-running');
  buildButton.innerHTML = '<span aria-hidden="true">■</span> Running...';
  window.requestAnimationFrame(() => buildConsole.classList.add('is-active'));
  buildStatus.textContent = 'running';
  if (runStatusBar) runStatusBar.textContent = 'Run: invitation (running)';
  buildOutput.replaceChildren();

  for (let index = 0; index < buildSteps.length; index += 1) {
    const step = buildSteps[index];
    const line = document.createElement('span');
    if (index === buildSteps.length - 1) line.classList.add('is-final');
    buildOutput.append(line);
    // eslint-disable-next-line no-await-in-loop
    await typeLine(line, step);
    if (buildSr) buildSr.textContent = step;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => window.setTimeout(resolve, 90));
  }

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  buildOutput.append(cursor);
  buildButton.classList.remove('is-running');
  buildButton.classList.add('is-complete');
  buildButton.innerHTML = '<span aria-hidden="true">✓</span> Finished';
  buildButton.removeAttribute('aria-busy');
  buildButton.disabled = true;
  buildStatus.textContent = 'exit code 0';
  if (runStatusBar) runStatusBar.textContent = 'Run: invitation (exit code 0)';

  revealHeroContent();

  window.setTimeout(() => {
    if (!nextWindow) return;
    nextWindow.hidden = false;
    window.requestAnimationFrame(() => nextWindow.classList.add('is-open'));
    if (!prefersReducedMotion) {
      nextWindow.querySelectorAll('p').forEach((paragraph, index) => {
        prepareTypeReveal(paragraph, index * 140);
        playTypeReveal(paragraph);
      });
    }
    nextWindow.querySelector('a')?.focus();
    unlockContent();
  }, 700);
}

/**
 * Reveals the couple's name, tagline, and the live countdown only after a
 * successful build — the hero starts as just the Run button, so "wedding
 * info" appears one section at a time instead of all at once. Order matters:
 * `prepareTypeReveal` runs while these elements are still `hidden` (so the
 * opacity-0 class is already applied before they render), then they unhide,
 * then the reveal animation plays — this sequencing avoids a one-frame flash
 * of fully-visible content before the fade-in class takes effect.
 */
function revealHeroContent() {
  const sequence = [
    document.querySelector('.eyebrow'),
    document.querySelector('#invitation-title'),
    document.querySelector('.hero-tagline'),
    heroWatches,
  ];
  if (!prefersReducedMotion) sequence.forEach((element, index) => prepareTypeReveal(element, index * 160));
  if (heroIntro) heroIntro.hidden = false;
  if (heroWatches) heroWatches.hidden = false;
  if (!prefersReducedMotion) window.requestAnimationFrame(() => sequence.forEach(playTypeReveal));
}

buildButton?.addEventListener('click', runInvitationBuild);

/** Live "Debug — Watches" panel: real countdown to the ceremony, ticking every second. */
const WEDDING_AT = new Date('2027-06-27T12:00:00+09:00').getTime();
let lastAnnouncedDays = null;

function updateCountdown() {
  if (!countdownDays || !countdownClock) return;
  const remaining = Math.max(0, WEDDING_AT - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  countdownDays.textContent = `D-${days}`;
  countdownClock.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  if (countdownSr && lastAnnouncedDays !== days) {
    lastAnnouncedDays = days;
    countdownSr.textContent = `결혼식까지 ${days}일 남았습니다.`;
  }
}

function updateLiveClock() {
  if (!liveClock) return;
  liveClock.textContent = new Date().toLocaleTimeString('ko-KR', { hour12: false });
}

updateCountdown();
updateLiveClock();
window.setInterval(updateCountdown, 1000);
window.setInterval(updateLiveClock, 1000);

/** File tab bar: the active tab tracks both direct clicks and which "file" (section) is in view. */
const tabLinks = Array.from(document.querySelectorAll('.ide-tabbar .ide-tab'));
const tabSections = tabLinks
  .map((tab) => document.querySelector(tab.getAttribute('href')))
  .filter((section) => section !== null);

function setActiveTab(sectionId) {
  tabLinks.forEach((tab) => {
    tab.classList.toggle('is-active', tab.getAttribute('href') === `#${sectionId}`);
  });
}

/**
 * The invitation must be built before any section past the hero can be
 * reached: every other tab starts `is-locked`/`aria-disabled`/`tabindex="-1"`,
 * and the gated content stays `hidden` until a successful build calls this.
 * CSS `pointer-events: none` blocks mouse clicks on locked tabs; the click
 * guard below additionally blocks keyboard-triggered activation, since
 * `pointer-events` has no effect on a synthetic click from pressing Enter.
 */
let isUnlocked = false;

function unlockContent() {
  if (isUnlocked) return;
  isUnlocked = true;
  if (lockedGate) lockedGate.hidden = true;
  if (gatedContent) gatedContent.hidden = false;
  tabLinks.forEach((tab) => {
    if (tab.getAttribute('href') === '#top') return;
    tab.classList.remove('is-locked');
    tab.removeAttribute('aria-disabled');
    tab.removeAttribute('tabindex');
  });
}

tabLinks.forEach((tab) => {
  tab.addEventListener('click', (event) => {
    if (!isUnlocked && tab.classList.contains('is-locked')) {
      event.preventDefault();
      return;
    }
    setActiveTab(tab.getAttribute('href').slice(1));
  });
});

if ('IntersectionObserver' in window && tabSections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible) setActiveTab(mostVisible.target.id);
    },
    { rootMargin: '-96px 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  tabSections.forEach((section) => sectionObserver.observe(section));
}

/**
 * Type-reveal system: fades and slightly lifts each static content block in
 * as a whole, so the page still reads as "content actively rendering in"
 * without ever splitting a heading or paragraph's text into per-character
 * spans. An earlier per-character version caused a real visual defect: tight
 * negative letter-spacing (the hero name, headings) plus many overlapping
 * semi-transparent single-glyph boxes mid-fade produced visible glitching.
 * Because no text node is ever touched here, there is zero risk to kerning,
 * CJK line-wrapping, screen readers, find-in-page, or text selection — only
 * a CSS opacity/transform transition runs, once, per element. Skipped
 * entirely under `prefers-reduced-motion` (fully visible, static text).
 */
function prepareTypeReveal(element, delayMs = 0) {
  if (!element || element.dataset.typePrepared) return;
  element.dataset.typePrepared = 'true';
  element.classList.add('type-target');
  if (delayMs) element.style.setProperty('animation-delay', `${delayMs}ms`);
}

function playTypeReveal(element) {
  element?.classList.add('type-ready');
}

if (!prefersReducedMotion) {
  const scrollGroups = [
    ['#manifest-title', '.manifest-copy > p', '.manifest-copy dl'],
    ['#location-title', '.location-copy > p', '.map-links', '.location-details', '.location-status'],
    ['#access-title', '.access-copy dl', '.calendar-actions', '.access-note'],
    ['#contribute-title', '.contribute-copy > p', '.contribute-accounts'],
    ['main footer p'],
  ];
  const scrollTypeEls = [];
  scrollGroups.forEach((selectors) => {
    selectors.forEach((selector, index) => {
      document.querySelectorAll(selector).forEach((element) => {
        prepareTypeReveal(element, index * 120);
        scrollTypeEls.push(element);
      });
    });
  });

  const typeObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        playTypeReveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
  );
  scrollTypeEls.forEach((element) => typeObserver.observe(element));
}
