import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { THEME } from './theme.js';

/**
 * Paints a vertical pastel gradient (top -> mid -> bottom, from THEME.background)
 * into an offscreen canvas sized to the given aspect ratio and wraps it in a
 * THREE.CanvasTexture for use as scene.background.
 */
function createBackgroundTexture(aspect) {
  const height = 256;
  const width = Math.max(2, Math.round(height * aspect));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, THEME.background.top);
  gradient.addColorStop(0.5, THEME.background.mid);
  gradient.addColorStop(1, THEME.background.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Bootstraps the three.js scene graph: renderer, camera, OrbitControls,
 * lights, and the pastel background gradient. Does NOT start a render loop
 * (owned exclusively by main.js).
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls, isReducedMotion: boolean, isWebGLAvailable: true} | {isWebGLAvailable: false}}
 */
export function initScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (error) {
    return { isWebGLAvailable: false };
  }

  if (!renderer.getContext()) {
    return { isWebGLAvailable: false };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2, 14);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * 0.49;

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate = !isReducedMotion;
  controls.autoRotateSpeed = 0.4;

  const ambientLight = new THREE.AmbientLight(THEME.ambientLightColor, THEME.ambientLightIntensity);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(THEME.pointLightColor, THEME.pointLightIntensity);
  pointLight.position.set(0, 10, 0);
  scene.add(pointLight);

  scene.background = createBackgroundTexture(camera.aspect);

  function handleResize() {
    // Order is mandatory: aspect -> updateProjectionMatrix -> setSize -> repaint gradient.
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const previousBackground = scene.background;
    scene.background = createBackgroundTexture(camera.aspect);
    if (previousBackground && typeof previousBackground.dispose === 'function') {
      previousBackground.dispose();
    }
  }

  window.addEventListener('resize', handleResize);

  return {
    scene,
    camera,
    renderer,
    controls,
    isReducedMotion,
    isWebGLAvailable: true,
  };
}
