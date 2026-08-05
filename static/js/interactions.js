import * as THREE from 'three';

/** Uniform scale multiplier applied to a hovered node (or the About node's Group). */
const HOVER_SCALE = 1.1;
/** Emissive color is boosted to this fraction of the material's own base color while hovered. */
const HOVER_EMISSIVE_INTENSITY = 0.6;
/** pointerdown -> pointerup movement below this many CSS pixels counts as a click, not a drag. */
const CLICK_MOVEMENT_THRESHOLD_PX = 6;
/** Camera fly-to tween duration, in milliseconds (see `update(deltaTime)` doc below for units). */
const FLY_DURATION_MS = 600;
/** Fixed camera offset from the target node's position once a fly-to completes. */
const FLY_TO_OFFSET = new THREE.Vector3(0, 2, 8);
const NODE_CENTER_PICK_RADIUS_NDC = 0.15;

/**
 * Resolves which object a hover/click highlight should actually be applied to, and how,
 * based on the hit object's material type:
 * - `THREE.MeshStandardMaterial` (career/techStack/oss/play): highlight the mesh itself
 *   (`type: 'mesh'`), supports both scale and emissive.
 * - `THREE.SpriteMaterial` (about's two child sprites): `SpriteMaterial` has no `emissive`
 *   property, so the highlight target is the sprite's parent `THREE.Group` instead
 *   (`type: 'sprite'`), scaled as a whole to keep both sprites in sync; no emissive call.
 *
 * @param {THREE.Object3D} hitObject
 * @returns {{ target: THREE.Object3D, type: 'mesh' | 'sprite' } | null}
 */
function resolveHighlightTarget(hitObject) {
  const material = hitObject.material;
  if (!material) return null;
  if (material.isSpriteMaterial) {
    return { target: hitObject.parent, type: 'sprite' };
  }
  if (material.isMeshStandardMaterial) {
    return { target: hitObject, type: 'mesh' };
  }
  return null;
}

/**
 * Bootstraps pointer-driven raycasting interactions for the DATA ORBIT node scene:
 * hover highlight (with type-aware un-highlight/reset), click-vs-drag discrimination,
 * and a camera fly-to tween on a valid node click. Does NOT start any internal
 * `requestAnimationFrame` loop - the returned `update(deltaTime)` must be driven
 * externally (by `main.js`'s own render loop) every frame.
 *
 * @param {{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   controls: import('three/addons/controls/OrbitControls.js').OrbitControls,
 *   nodes: THREE.Object3D[],
 *   isReducedMotion: boolean,
 * }} params
 * @returns {{ update: (deltaTime: number) => void, dispose: () => void }}
 */
export function initInteractions({ scene, camera, renderer, controls, nodes, isReducedMotion }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const nodeWorldPosition = new THREE.Vector3();

  /** Currently-highlighted { target, originalScale, meshForEmissive, originalEmissive } or null. */
  let currentHighlight = null;
  /** { x, y } client coordinates recorded on pointerdown, or null between gestures. */
  let pointerDownPosition = null;
  /** Active camera fly-to tween state, or null when idle. */
  let tween = null;

  /** Updates the shared normalized-device-coordinate `pointer` Vector2 from a pointer event. */
  function updatePointerFromEvent(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function getHitObject() {
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(nodes, true);
    if (intersections.length > 0) return intersections[0].object;

    let fallbackNode = null;
    let nearestDistanceSquared = NODE_CENTER_PICK_RADIUS_NDC ** 2;
    for (const node of nodes) {
      node.getWorldPosition(nodeWorldPosition);
      nodeWorldPosition.project(camera);
      const distanceSquared = pointer.distanceToSquared(nodeWorldPosition);
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared;
        fallbackNode = node;
      }
    }
    return fallbackNode;
  }

  /** Resets the currently-highlighted target back to its pre-hover scale/emissive, if any. */
  function clearHighlight() {
    if (!currentHighlight) return;
    currentHighlight.target.scale.copy(currentHighlight.originalScale);
    if (currentHighlight.meshForEmissive) {
      currentHighlight.meshForEmissive.material.emissive.copy(currentHighlight.originalEmissive);
    }
    currentHighlight = null;
  }

  /** Applies the hover highlight to `hitObject` per its resolved `{ target, type }`. */
  function applyHighlight(hitObject, resolved) {
    const { target, type } = resolved;
    const originalScale = target.scale.clone();
    target.scale.multiplyScalar(HOVER_SCALE);

    let meshForEmissive = null;
    let originalEmissive = null;
    if (type === 'mesh') {
      meshForEmissive = hitObject;
      originalEmissive = hitObject.material.emissive.clone();
      hitObject.material.emissive
        .copy(hitObject.material.color)
        .multiplyScalar(HOVER_EMISSIVE_INTENSITY);
    }

    currentHighlight = { target, originalScale, meshForEmissive, originalEmissive };
  }

  function onPointerMove(event) {
    updatePointerFromEvent(event);
    const hit = getHitObject();
    const resolved = hit ? resolveHighlightTarget(hit) : null;

    const isSameTarget = currentHighlight && resolved && currentHighlight.target === resolved.target;
    if (!isSameTarget) {
      clearHighlight();
      if (resolved) {
        applyHighlight(hit, resolved);
      }
    }

    renderer.domElement.style.cursor = hit ? 'pointer' : 'default';
  }

  function onPointerDown(event) {
    pointerDownPosition = { x: event.clientX, y: event.clientY };
  }

  /**
   * Starts (or restarts, if one is already in flight) the camera fly-to tween toward `node`.
   * Restarting reuses the camera/controls' CURRENT live position/target as the new tween's
   * start, so clicking a second node mid-flight smoothly redirects rather than jumping.
   */
  function flyToNode(node) {
    // Once any node has been selected, auto-rotation never resumes for the rest of the session.
    controls.autoRotate = false;

    const endTarget = node.position.clone();
    const endCameraPosition = node.position.clone().add(FLY_TO_OFFSET);

    if (isReducedMotion) {
      controls.target.copy(endTarget);
      camera.position.copy(endCameraPosition);
      controls.enabled = true;
      tween = null;
      return;
    }

    controls.enabled = false;
    tween = {
      elapsed: 0,
      duration: FLY_DURATION_MS,
      startTarget: controls.target.clone(),
      endTarget,
      startCameraPosition: camera.position.clone(),
      endCameraPosition,
    };
  }

  function onPointerUp(event) {
    if (!pointerDownPosition) return;
    const dx = event.clientX - pointerDownPosition.x;
    const dy = event.clientY - pointerDownPosition.y;
    pointerDownPosition = null;

    const movedDistance = Math.sqrt(dx * dx + dy * dy);
    if (movedDistance >= CLICK_MOVEMENT_THRESHOLD_PX) {
      // Orbit-drag, not a click - do not raycast, do not fire node-select.
      return;
    }

    updatePointerFromEvent(event);
    const hitObject = getHitObject();
    if (!hitObject) return;
    const id = hitObject.userData && hitObject.userData.id;
    if (!id) return;

    const node = nodes.find((candidate) => candidate.userData.id === id);
    if (!node) return;

    window.dispatchEvent(new CustomEvent('data-orbit:node-select', { detail: { id } }));
    flyToNode(node);
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);

  /**
   * Advances the active camera fly-to tween, if any. No-ops when idle. Must be called
   * externally every frame (this module never schedules its own `requestAnimationFrame`).
   *
   * @param {number} deltaTime - Elapsed time since the last call, in MILLISECONDS (matching
   *   `performance.now()` delta convention and this module's ~600ms tween duration).
   */
  function update(deltaTime) {
    if (!tween) return;

    tween.elapsed += deltaTime;
    const progress = Math.min(tween.elapsed / tween.duration, 1);

    controls.target.lerpVectors(tween.startTarget, tween.endTarget, progress);
    camera.position.lerpVectors(tween.startCameraPosition, tween.endCameraPosition, progress);

    if (progress >= 1) {
      controls.enabled = true;
      tween = null;
    }
  }

  /** Removes all pointer listeners and resets any active highlight. Idempotent-safe to call once. */
  function dispose() {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    clearHighlight();
  }

  return { update, dispose };
}
