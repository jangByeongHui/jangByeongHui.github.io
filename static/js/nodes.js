import * as THREE from 'three';
import { NODE_ORDER } from './content.js';

/**
 * Computes the hub-and-spoke position for node index `i` (0..4) on a circle
 * of radius 6 in the XZ plane: x = 6*cos(i*2*Math.PI/5), z = 6*sin(i*2*Math.PI/5), y = 0.
 */
function computePosition(index) {
  const angle = index * ((2 * Math.PI) / 5);
  return {
    x: 6 * Math.cos(angle),
    y: 0,
    z: 6 * Math.sin(angle),
  };
}

/**
 * Builds the hub-and-spoke THREE.Line edges connecting each node position to
 * the origin and adds them (as a THREE.Group) directly to the scene.
 */
function createEdges(scene, THEME, positions) {
  const edgeGroup = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: THEME.edgeColor,
    transparent: true,
    opacity: THEME.edgeOpacity,
  });

  positions.forEach((position) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(position.x, position.y, position.z),
    ]);
    edgeGroup.add(new THREE.Line(geometry, material));
  });

  scene.add(edgeGroup);
  return edgeGroup;
}

/**
 * Builds the `about` node: a THREE.Group tagged `.userData = { id: 'about' }`
 * containing two auto-billboarding THREE.Sprite children (no manual lookAt
 * needed) - a backing-plate sprite rendered first, and a photo sprite in
 * front of it. Both child sprites are ALSO tagged `.userData = { id: 'about' }`
 * directly (not just the group), because Todo 6's
 * `raycaster.intersectObjects(nodes, true)` returns the actual leaf object
 * hit (one of the two Sprites) as `intersection.object`, never the parent
 * Group - without this, `hitObject.userData.id` would resolve to `undefined`
 * for this node specifically.
 */
function createAboutNode(THEME, CONTENT) {
  const group = new THREE.Group();
  group.userData = { id: 'about' };

  const plateMaterial = new THREE.SpriteMaterial({ color: THEME.nodeColors.about });
  const plateSprite = new THREE.Sprite(plateMaterial);
  plateSprite.scale.set(2.3, 2.3, 1);
  plateSprite.renderOrder = 0;
  plateSprite.userData = { id: 'about' };
  group.add(plateSprite);

  const photoMaterial = new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load(
      CONTENT.about.photo,
      undefined,
      undefined,
      () => {
        // Graceful fallback: never let a failed photo load throw or block scene setup.
        photoMaterial.map = new THREE.TextureLoader().load(CONTENT.about.photoFallback);
        photoMaterial.needsUpdate = true;
      }
    ),
  });
  const photoSprite = new THREE.Sprite(photoMaterial);
  photoSprite.scale.set(2, 2, 1);
  photoSprite.renderOrder = 1;
  photoSprite.userData = { id: 'about' };
  group.add(photoSprite);

  return group;
}

/**
 * Builds a procedural-geometry mesh node with a THREE.MeshStandardMaterial
 * colored from THEME, tagged `.userData = { id }`.
 */
function createMeshNode(id, geometry, color) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { id };
  return mesh;
}

/**
 * Creates the 5 DATA ORBIT nodes (procedural geometry, no external
 * GLTF/model files), lays them out hub-and-spoke on a radius-6 circle in the
 * XZ plane, wires connecting edge lines, adds everything to `scene`, and
 * returns the 5 node objects in NODE_ORDER order.
 *
 * @param {THREE.Scene} scene
 * @param {object} THEME
 * @param {object} CONTENT
 * @returns {THREE.Object3D[]} the 5 node objects, each tagged `.userData.id`
 */
export function createNodes(scene, THEME, CONTENT) {
  const nodes = NODE_ORDER.map((id) => {
    switch (id) {
      case 'about':
        return createAboutNode(THEME, CONTENT);
      case 'career':
        return createMeshNode('career', new THREE.IcosahedronGeometry(1, 0), THEME.nodeColors.career);
      case 'techStack':
        return createMeshNode(
          'techStack',
          new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16),
          THEME.nodeColors.techStack
        );
      case 'oss':
        return createMeshNode('oss', new THREE.OctahedronGeometry(1, 0), THEME.nodeColors.oss);
      case 'play':
        return createMeshNode('play', new THREE.TorusGeometry(0.9, 0.3, 16, 48), THEME.nodeColors.play);
      default:
        throw new Error(`Unknown node id: ${id}`);
    }
  });

  const positions = NODE_ORDER.map((_, index) => computePosition(index));

  nodes.forEach((node, index) => {
    const position = positions[index];
    node.position.set(position.x, position.y, position.z);
    scene.add(node);
  });

  createEdges(scene, THEME, positions);

  return nodes;
}
