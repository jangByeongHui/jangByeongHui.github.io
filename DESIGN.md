# WEDDING // BUILD 2027 Design System

## 0. Research Log
- Embedded refs: shortlisted `warp.md`, `vercel.md`, and `ollama.md` → picked `brutalist-skill.md` for execution discipline. IntelliJ IDEA's Darcula theme is not in the curated Layer B brand list, so its widely documented public color values (editor background, keyword/string/comment syntax colors) are used directly as the token source per explicit user direction ("IntelliJ 느낌"); no JetBrains logos, icons, or trademarked assets are reproduced — only the generic color relationships of a dark code editor.
- Lazyweb: attempted one desktop search for developer portfolio terminal landing pages; no usable response was returned, so no screen was consumed.
- Imagen drafts: skipped — no image-generation tool is available in this workspace; the signature is rendered as live HTML/CSS rather than a raster reference.
- Iteration: the project moved from a warm terminal aesthetic → a black/green shell aesthetic → the current IntelliJ-editor aesthetic, each at explicit user request. This file reflects only the current, shipped direction.

## 1. Atmosphere & Identity
An invitation that behaves like an actual code editor: a title bar, a row of open file tabs, a syntax-highlighted `ceremony.yml`, and a Run console that really executes when a guest presses it. The signature is the **file-tab flow**: pressing "Run 'invitation'" plays a real build log in the console, then opens a new tab (`ceremony_details.kt`) the guest can jump into — mirroring how a project actually gets built and navigated, not just decorated to look like one.

## 2. Color

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Canvas | `--canvas` | `#2b2b2b` | Editor background (Darcula) |
| Surface | `--surface` | `#313335` | Panels, terminal/tab bodies |
| Surface raised | `--surface-raised` | `#3c3f41` | Title bar, status bar, tab bar, buttons |
| Ink | `--ink` | `#a9b7c6` | Default editor text |
| Muted ink | `--ink-muted` | `#9fb0b8` | Comments, secondary/meta text (≥4.5:1 on both `--canvas` and `--surface-raised`) |
| Rule | `--rule` | `#4b4f52` | Borders, dividers, tab separators |
| Signal | `--signal` | `#cc7832` | Keywords, active tab, primary actions |
| Signal soft | `--signal-soft` | `#ffc66d` | Annotations/function-style accents, cursor |
| Success | `--success` | `#6a8759` | String literals, completed run state |
| Info | `--info` | `#6897bb` | Numbers/keys, focus outline, links |

The signal color only denotes a real action, active tab, or key ceremony datum.

## 3. Typography

| Level | Token | Size | Usage |
| --- | --- | --- | --- |
| Display | `--type-display` | `clamp(3.5rem, 12vw, 9.5rem)` | Couple names |
| Heading | `--type-heading` | `clamp(1.5rem, 3vw, 2.25rem)` | Section titles |
| Body | `--type-body` | `1rem` | Korean body copy |
| Meta | `--type-meta` | `0.75rem` | Chrome, tabs, labels, code |

- Display/body: `Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`.
- Utility/code: `"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace` — JetBrains Mono is named first (no external font load) because it is the real IntelliJ IDEA default; it silently falls back to system monospace where unavailable, at zero network cost.

## 4. Spacing & Layout
- Base unit: 4px; named steps use 8, 12, 16, 24, 32, 48, 64, and 96px.
- Content width: 1440px; desktop uses three asymmetric tracks (1:5:5) separated by 1px technical grid lines; mobile collapses to one column with 20px inline padding.
- The page is framed as an IDE window: title bar → sticky file-tab bar → editor content (hero, build gate, ceremony, location, access) → status bar. The hero itself starts as nothing but a centered "Run 'invitation'" button — the couple's name, tagline, and live countdown are wedding info too, and stay hidden until a successful build reveals them (see Hero Launch below); only then does the rest of the page unlock (see Build Gate below) and the new file tab open for the guest to continue from.
- Every anchorable section (`#top`, `#ceremony`, `#location`, `#access`) carries `scroll-margin-top: 96px` so a tab click or `.scroll-link` jump lands the section below the sticky tab bar instead of flush underneath it.

## 5. Components

### IDE Title Bar
- **Structure**: traffic-light dots (decorative) + project path text + a menu string, visible at ≥761px and hidden below that width to save space.
- **States**: static.
- **Accessibility**: the traffic lights and menu string are `aria-hidden`; they are not interactive and never receive focus or a pointer cursor, so they cannot be mistaken for real controls.

### File Tab Bar
- **Structure**: sticky `nav` of real anchor links, each with a colored file-type dot and filename, to `invitation.tsx` (hero, `id="top"` on the section itself), `ceremony.yml`, `location.json`, `access.log`.
- **States**: default, hover (brightens text), focus-visible (info-color outline), active tab (signal underline + canvas background). The active tab updates on click for immediate feedback, and independently via an `IntersectionObserver` that tracks which section is actually in view while scrolling — so the indicator always reflects the "open file" the guest is currently reading, not just the last thing they clicked.
- **Accessibility**: real `<a href="#...">` elements; keyboard reachable and functional, not decorative chrome.
- **Motion**: 160ms color/border transitions only.

### Terminal Panel (ceremony.yml)
- **Structure**: `section > header (file-type dot + filename) + pre.has-gutter/code`.
- **States**: static with selectable text; CSS-counter line numbers render in the gutter.
- **Accessibility**: real headings/text; syntax colors are decorative only, the underlying text still reads correctly without color.
- **Motion**: cursor has a subtle opacity pulse, removed for reduced motion.

### Command Button
- **Structure**: native `button` with an icon marker and live status text.
- **Variants**: default (Copy address, 48px min-height, `--type-meta` size); `.build-trigger` (the hero Run button — the only interactive element on the first screen, so it scales up with the viewport via `clamp()` font-size/padding/min-height (mechanics, per Section 4's clamp() exemption) instead of sitting at the same small size as every other button on the page).
- **States**: hover brightens rule, active shifts 1px, focus uses an info-color outline.
- **Accessibility**: 44px+ target (both variants; `.build-trigger` clamps up from 52px), explicit label, live result text.
- **Motion**: 160ms transition; reduced motion remains functional without transition.

### Hero Launch
- **Structure**: `.hero` starts centered (`justify-content/align-items: center`, `text-align: center`) with only `.hero-actions` (the Run button) visible; `.hero-intro` (eyebrow, name, tagline), `.watches-panel`, and `#build-console` all start `hidden`.
- **States**: idle (button only, centered) → clicking adds `.hero.is-launched` (switches to the normal top-aligned, left-aligned layout used everywhere else on the page) and unhides `#build-console` so the guest watches it run → on success, `.hero-intro` and `.watches-panel` are revealed one after another using the same Type Reveal stagger as every other section, immediately followed by the existing next-tab/unlock sequence.
- **Accessibility**: nothing here is a live region; the sequence relies on `hidden` (excludes content from the accessibility tree until it genuinely exists) plus the Type Reveal system's non-destructive fade, so no content is ever announced before it is meant to be seen, and no content is permanently unreachable if `prefers-reduced-motion` skips the fade (it still unhides, just instantly).
- **Motion**: identical rules to Type Reveal — skipped entirely under `prefers-reduced-motion`, in which case the hero content simply appears at full opacity the instant the build succeeds.

### Build Gate
- **Structure**: an `access_denied.log` panel (reusing the Terminal Panel + Access Note anatomy) sits between the hero and the rest of the page; a sibling `<div data-gated-content hidden>` wraps every section past the hero (ceremony, location, access, footer).
- **States**: idle (default) — gate panel itself also `hidden`, since the first screen shows nothing but the Run button; running — the gate panel unhides alongside the Run console, explaining why the file tabs are dimmed while the build plays out; unlocked — set once, permanently, the instant the Run console reaches exit code 0, at which point the gate panel hides again and the gated content unhides. Throughout locked/running, the three non-hero file tabs carry `is-locked`/`aria-disabled="true"`/`tabindex="-1"`.
- **Accessibility**: locked tabs are removed from the tab order and CSS `pointer-events: none` blocks mouse activation; a JS click guard additionally blocks keyboard-triggered activation (Enter on a link ignores `pointer-events`). Hidden content is excluded from the accessibility tree via the native `hidden` attribute, not a visual-only trick, so no locked content is ever exposed to assistive tech before it should be.
- **Motion**: none of its own; unlocking simply flips `hidden` and tab lock classes, then the existing per-section Type Reveal and focus-to-`ceremony_details.kt` behavior take over exactly as if the guest had always been able to scroll there.

### Invitation Run Console
- **Structure**: native trigger button ("Run 'invitation'") plus `output` lines inside an always-visible console panel.
- **States**: idle, running, exit code 0 (success), then a new file tab opens; trigger disables after a successful run to prevent duplicate output.
- **Accessibility**: the visible output is `aria-live="off"` because its text mutates character-by-character while typing — an atomic `status` region would otherwise force assistive tech to re-read the whole growing line on every keystroke. A separate visually-hidden `aria-live="polite"` node announces each line's full text exactly once, right after it finishes typing (mirroring the Live Watches Panel's throttled-announcement pattern). On success, keyboard focus moves to the newly opened tab's detail link so keyboard/screen-reader users never lose their place; the status bar's `Run:` field also updates in text.
- **Motion**: each build line is typed in character-by-character (~18ms/char) rather than appearing instantly, reinforcing that the build is actively running; `prefers-reduced-motion` renders each line instantly instead of typing it, with no loss of information. Console entrance itself uses opacity and transform only.

### Live Watches Panel
- **Structure**: a `Debug — Watches` terminal-bar header over a `dl` of two live-evaluated expressions: `daysUntilWedding()` and `liveCountdown()`.
- **States**: both values recompute every second from a real target `Date` (2027-06-27 12:00 KST) — genuine countdown, not a looping animation.
- **Accessibility**: the two ticking values are `aria-hidden` (a second-by-second announcement would be noise); a visually hidden `aria-live="polite"` sibling announces the day count only when it changes, giving screen-reader users the same information without spam.
- **Motion**: none — values update via text content changes only, so `prefers-reduced-motion` does not need to alter this component.

### Fact Row
- **Structure**: `dl > div > dt + dd`.
- **States**: responsive wrapping.
- **Accessibility**: semantic description list.

### Access Note
- **Structure**: `aside > status label + parking state + subway state + build-session state`.
- **States**: parking capacity and subway route confirmed; build-session status mirrors the Run console.
- **Accessibility**: status remains understandable in text rather than by color alone.

### IDE Status Bar
- **Structure**: fixed-to-bottom-of-flow bar with encoding/line-ending/branch text, a decorative live clock, and a live `Run:` field.
- **States**: `Run: idle` → `Run: invitation (running)` → `Run: invitation (exit code 0)`; the clock ticks every second independent of the run state.
- **Accessibility**: `aria-live="polite"` on the run field so its state change is announced without moving focus; the clock is `aria-hidden` since it duplicates information already available on the guest's own device.

## 6. Motion & Interaction
- Micro interaction: 160ms ease-out for hover/press feedback.
- Cursor pulse: 900ms steps(1, end), disabled by `prefers-reduced-motion`.
- Status-dot pulse: 1.8s ease-in-out opacity pulse on every `.status-dot` ("READY" indicators), signaling a live/monitored state; disabled by `prefers-reduced-motion`.
- Build console lines type in character-by-character (~18ms/char) instead of appearing instantly, so the Run console reads as an active process; disabled (lines render instantly) by `prefers-reduced-motion`.
- **Type Reveal**: every static heading/paragraph/panel block (hero, manifest, location, access, footer, and the newly opened `ceremony_details.kt` tab) fades and lifts in as a whole (opacity + `translateY(6px)→0`, .38s ease-out), staggered element-by-element within its section, so the page still reads as content actively rendering in. The hero trio (eyebrow, name, tagline) plays on load as the one big entrance moment; every other block plays once via `IntersectionObserver` the first time it scrolls into view (never re-triggers). No text node is ever split or touched — only the CSS transition runs — so screen readers, find-in-page, text selection, and kerning/letter-spacing are completely unaffected, and the whole system is skipped entirely under `prefers-reduced-motion`. An earlier iteration wrapped every individual character in its own span for a literal typing effect; it was reverted after it visibly glitched on tight negative-letter-spacing headings (overlapping semi-transparent glyphs mid-fade) — this whole-block version keeps the "actively rendering" feel without that risk. The `ceremony.yml` code block intentionally keeps its original static render plus blinking cursor rather than any reveal wrapper, since character-splitting a syntax-highlighted, monospace block carries the same risk for no real benefit. Excluded on purpose: persistent chrome (title bar, tab bar, status bar) for stable navigation, and every element already driven by its own live logic (Run console output, countdown values, live clock, copy/build button labels).
- Copy action and the invitation build follow the beui `action-swap` principle: labels change only after their corresponding state transition occurs.
- No decorative scroll effects or layout animation.

## 7. Depth & Surface
- Strategy: **borders-only**. Panels use 1px `--rule` lines and tonal shifts between `--canvas`/`--surface`/`--surface-raised`. No shadows, glass, or rounded corners beyond small status/file-type dots.

## 8. Accessibility Constraints & Accepted Debt
- WCAG 2.2 AA target: high contrast text, visible focus, semantic landmarks, 44px+ command targets, keyboard reachability, and reduced-motion support. `--ink-muted` is calibrated to clear 4.5:1 against both `--canvas` and the lighter `--surface-raised`, since it is also used for real Korean body copy (manifest/location paragraphs), not just decorative chrome.
- Personas: a mobile guest finding venue information; a keyboard-only guest running the build and copying the address; a guest reading Korean text at enlarged browser zoom.
- Accepted debt: bride name is intentionally shown as `PJG` until the couple supplies the final public name. Owner: couple; exit: replace before invitations are shared.
