import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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
 * Builds a `THREE.MeshPhysicalMaterial` from `overrides`, tagged with a shared
 * `envMapIntensity` (relies on `scene.environment` set in scene.js for
 * reflections to read correctly). `MeshPhysicalMaterial` extends
 * `MeshStandardMaterial` and still sets `isMeshStandardMaterial = true` on its
 * instances, so `interactions.js`'s `material.isMeshStandardMaterial`
 * hover-highlight check keeps working unchanged for every part built with
 * this helper. Each node below tunes its own roughness/clearcoat/iridescence
 * combination so its parts read as a distinct physical material rather than
 * the previous identical high-iridescence "gem" finish shared by all nodes.
 */
function physicalMaterial(overrides) {
  return new THREE.MeshPhysicalMaterial({ envMapIntensity: 1.1, ...overrides });
}

/** Builds a `THREE.Mesh(geometry, material)` tagged `.userData = { id }` (leaf raycast contract). */
function taggedMesh(id, geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { id };
  return mesh;
}

/**
 * Builds the `career` node: a security/CCTV camera, matching the real
 * content ("OpenCV 기반 주차장 관제 및 보행자 측위 시스템 개발" - an OpenCV-based
 * parking-lot surveillance system). Four primitives along the local +X axis
 * (the "lens points forward" direction): a tapered body, a protruding lens
 * barrel, a glossy lens rim, and a small wall-mount bracket underneath.
 * Segment counts are pre-baked into the geometries (via `.rotateZ`/`.rotateY`/
 * `.translate`) so every part mesh can sit at the Group's local origin.
 */
function createCameraNode(THEME, lowTier) {
  const group = new THREE.Group();
  group.userData = { id: 'career' };

  const radialSegments = lowTier ? 10 : 20;
  const torusRadial = lowTier ? 6 : 10;
  const torusTubular = lowTier ? 12 : 24;

  // Body: a tapered cylinder (narrower toward the lens) built along +Y by
  // default, rotated onto the local +X ("forward") axis and shifted back so
  // the lens assembly can sit in front of its narrow cap.
  const bodyGeometry = new THREE.CylinderGeometry(0.36, 0.46, 1.2, radialSegments);
  bodyGeometry.rotateZ(-Math.PI / 2);
  bodyGeometry.translate(-0.15, 0, 0);
  const bodyMaterial = physicalMaterial({
    color: THEME.nodeColors.career,
    roughness: 0.55,
    metalness: 0.05,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    iridescence: 0.1,
  });

  // Lens barrel: a shorter, narrower cylinder protruding from the body's
  // front cap, slightly overlapped so there's no visible seam gap.
  const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.34, 0.5, radialSegments);
  barrelGeometry.rotateZ(-Math.PI / 2);
  barrelGeometry.translate(0.6, 0, 0);
  const barrelMaterial = physicalMaterial({
    color: '#2b2b30',
    roughness: 0.35,
    metalness: 0.15,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
    iridescence: 0.05,
  });

  // Lens rim: a torus whose axis is rotated from Z onto X so it caps the
  // barrel's front face like a glass lens ring - glossier and darker than
  // the body/barrel so it reads as glass rather than plastic housing.
  const rimGeometry = new THREE.TorusGeometry(0.3, 0.05, torusRadial, torusTubular);
  rimGeometry.rotateY(Math.PI / 2);
  rimGeometry.translate(0.86, 0, 0);
  const rimMaterial = physicalMaterial({
    color: '#111114',
    roughness: 0.15,
    metalness: 0.3,
    clearcoat: 0.9,
    clearcoatRoughness: 0.05,
    iridescence: 0.2,
  });

  // Mount bracket: a small box hanging from the body's back-underside,
  // reading as the wall/ceiling mount arm a surveillance camera sits on.
  const bracketGeometry = new THREE.BoxGeometry(0.18, 0.4, 0.18);
  bracketGeometry.translate(-0.55, -0.35, 0);
  const bracketMaterial = physicalMaterial({
    color: THEME.nodeColors.career,
    roughness: 0.6,
    metalness: 0.1,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    iridescence: 0.05,
  });

  group.add(
    taggedMesh('career', bodyGeometry, bodyMaterial),
    taggedMesh('career', barrelGeometry, barrelMaterial),
    taggedMesh('career', rimGeometry, rimMaterial),
    taggedMesh('career', bracketGeometry, bracketMaterial)
  );

  return group;
}

/**
 * Builds a closed `THREE.Shape` tracing a gear silhouette: `toothCount` teeth
 * alternating between `outerRadius` (tooth tips) and `innerRadius` (valleys),
 * plus a circular `boreRadius` hole through the center for the axle.
 */
function createGearShape(outerRadius, innerRadius, boreRadius, toothCount) {
  const shape = new THREE.Shape();
  const toothAngle = (Math.PI * 2) / toothCount;

  for (let i = 0; i < toothCount; i += 1) {
    const base = i * toothAngle;
    // Four angles per tooth: tip-start, tip-end (flat tooth top), then
    // valley-start, valley-end (flat gap bottom) before the next tooth rises.
    const tipStart = base;
    const tipEnd = base + toothAngle * 0.28;
    const valleyStart = base + toothAngle * 0.5;
    const valleyEnd = base + toothAngle * 0.78;

    const outer1 = [Math.cos(tipStart) * outerRadius, Math.sin(tipStart) * outerRadius];
    const outer2 = [Math.cos(tipEnd) * outerRadius, Math.sin(tipEnd) * outerRadius];
    const inner1 = [Math.cos(valleyStart) * innerRadius, Math.sin(valleyStart) * innerRadius];
    const inner2 = [Math.cos(valleyEnd) * innerRadius, Math.sin(valleyEnd) * innerRadius];

    if (i === 0) shape.moveTo(outer1[0], outer1[1]);
    else shape.lineTo(outer1[0], outer1[1]);
    shape.lineTo(outer2[0], outer2[1]);
    shape.lineTo(inner1[0], inner1[1]);
    shape.lineTo(inner2[0], inner2[1]);
  }
  shape.closePath();

  const bore = new THREE.Path();
  bore.absarc(0, 0, boreRadius, 0, Math.PI * 2, false);
  shape.holes.push(bore);

  return shape;
}

/**
 * Builds the `techStack` node: a mechanical gear/cog, extruded from a
 * `THREE.Shape` gear silhouette (see `createGearShape`) plus a center axle
 * cylinder poking through the bore. Two primitives total. Tooth count and
 * extrude smoothness both fold into `lowTier`'s device-tier reduction, same
 * pattern as the old `TorusKnotGeometry` segment-halving it replaces.
 */
function createGearNode(THEME, lowTier) {
  const group = new THREE.Group();
  group.userData = { id: 'techStack' };

  const toothCount = lowTier ? 8 : 12;
  const curveSegments = lowTier ? 4 : 8;
  const thickness = 0.42;

  const gearShape = createGearShape(0.85, 0.62, 0.28, toothCount);
  const gearGeometry = new THREE.ExtrudeGeometry(gearShape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: lowTier ? 1 : 2,
    curveSegments,
  });
  gearGeometry.translate(0, 0, -thickness / 2);
  // Machined-metal feel: higher metalness and lower iridescence than the
  // rest of the cast (a gear should read as milled steel, not a gem).
  const gearMaterial = physicalMaterial({
    color: THEME.nodeColors.techStack,
    roughness: 0.35,
    metalness: 0.55,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
    iridescence: 0.08,
  });

  const axleGeometry = new THREE.CylinderGeometry(0.22, 0.22, thickness + 0.3, lowTier ? 8 : 14);
  axleGeometry.rotateX(Math.PI / 2); // Y-axis cylinder -> Z-axis, through the bore.
  const axleMaterial = physicalMaterial({
    color: THEME.nodeColors.techStack,
    roughness: 0.25,
    metalness: 0.7,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    iridescence: 0.05,
  });

  group.add(taggedMesh('techStack', gearGeometry, gearMaterial), taggedMesh('techStack', axleGeometry, axleMaterial));

  return group;
}

/**
 * Builds one hinged book panel (a cover or a nested page slab): a
 * `RoundedBoxGeometry` whose spine edge is translated onto the local Y axis
 * (x=0) and then swung open by `hingeAngle` around that same axis, so the
 * panel behaves like a door hinged at the book's spine. `hingeSign` is -1 for
 * the left panel (opens toward -X) or +1 for the right panel (opens toward
 * +X); `zOffset` (applied before the hinge translate/rotate, so it swings
 * with the panel) lets nested pages sit proud of their cover's front face.
 */
function createBookPanelGeometry({ width, height, thickness, segments, radius, hingeSign, hingeAngle, zOffset = 0 }) {
  const geometry = new RoundedBoxGeometry(width, height, thickness, segments, radius);
  if (zOffset) geometry.translate(0, 0, zOffset);
  geometry.translate(hingeSign * (width / 2), 0, 0);
  geometry.rotateY(-hingeSign * hingeAngle);
  return geometry;
}

/**
 * Builds the `oss` node: an open book (two hinged covers + two nested paper
 * slabs), chosen over a git-branch/commit-graph sculpture (the other option
 * this node's spec allowed) because a book's silhouette reads as a concrete,
 * identifiable object at this node's small on-screen scale even while
 * tumbling, whereas a cluster of small spheres joined by thin cylinders reads
 * as abstract dot-and-stick art - too close to the abstract primitives this
 * whole pass is replacing. Four primitives: left/right covers (semi-gloss
 * "bound cover" material, THEME-colored) and left/right paper slabs (matte
 * off-white, nested just in front of each cover's face) for a two-material
 * "colored cover + white pages" contrast.
 */
function createBookNode(THEME, lowTier) {
  const group = new THREE.Group();
  group.userData = { id: 'oss' };

  const segments = lowTier ? 1 : 2;
  const hingeAngle = 0.5;

  const coverMaterial = physicalMaterial({
    color: THEME.nodeColors.oss,
    roughness: 0.4,
    metalness: 0.05,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    iridescence: 0.12,
  });
  const pageMaterial = physicalMaterial({
    color: '#fbf8ef',
    roughness: 0.75,
    metalness: 0,
    clearcoat: 0.05,
    clearcoatRoughness: 0.4,
    iridescence: 0,
  });

  const coverParams = { width: 0.85, height: 1.3, thickness: 0.09, segments, radius: 0.06, hingeAngle };
  const pageParams = {
    width: 0.78,
    height: 1.2,
    thickness: 0.05,
    segments,
    radius: 0.04,
    hingeAngle,
    zOffset: coverParams.thickness / 2 + 0.05 / 2 + 0.005,
  };

  const leftCover = createBookPanelGeometry({ ...coverParams, hingeSign: -1 });
  const rightCover = createBookPanelGeometry({ ...coverParams, hingeSign: 1 });
  const leftPages = createBookPanelGeometry({ ...pageParams, hingeSign: -1 });
  const rightPages = createBookPanelGeometry({ ...pageParams, hingeSign: 1 });

  group.add(
    taggedMesh('oss', leftCover, coverMaterial),
    taggedMesh('oss', rightCover, coverMaterial),
    taggedMesh('oss', leftPages, pageMaterial),
    taggedMesh('oss', rightPages, pageMaterial)
  );

  return group;
}

/**
 * Builds the `play` node: a die (dice). A `RoundedBoxGeometry` cube body
 * plus a single `THREE.InstancedMesh` of small pip spheres embedded (each
 * sphere's center sits exactly on the cube's flat face, so half of it reads
 * as "carved into" the surface) across three visible faces in 5/3/1 pip
 * patterns - enough to read as a die without needing all six faces
 * physically correct. Two primitives total (body + one InstancedMesh for
 * every pip), so the pips don't blow past the "small number of parts"
 * budget despite there being nine of them.
 */
function createDieNode(THEME, lowTier) {
  const group = new THREE.Group();
  group.userData = { id: 'play' };

  const segments = lowTier ? 1 : 2;
  const half = 0.65; // Half the 1.3-unit cube edge length.
  const corner = 0.32; // Lateral offset for corner pips, well inside the flat (non-rounded) face area.
  const surface = half + 0.006; // Tiny epsilon proud of the face to avoid z-fighting.

  const bodyGeometry = new RoundedBoxGeometry(1.3, 1.3, 1.3, segments, 0.14);
  const bodyMaterial = physicalMaterial({
    color: THEME.nodeColors.play,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    iridescence: 0.25,
  });
  const body = taggedMesh('play', bodyGeometry, bodyMaterial);

  const pipGeometry = new THREE.SphereGeometry(0.09, lowTier ? 6 : 10, lowTier ? 5 : 8);
  const pipMaterial = physicalMaterial({
    color: '#26262b',
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
    iridescence: 0,
  });

  // Face pip layouts, each [x, y, z] in local space:
  const pipPositions = [
    // Front face (+Z): "5" - four corners plus center.
    [-corner, -corner, surface],
    [-corner, corner, surface],
    [corner, -corner, surface],
    [corner, corner, surface],
    [0, 0, surface],
    // Top face (+Y): "3" - diagonal.
    [-corner, surface, -corner],
    [0, surface, 0],
    [corner, surface, corner],
    // Right face (+X): "1" - center only.
    [surface, 0, 0],
  ];

  const pips = new THREE.InstancedMesh(pipGeometry, pipMaterial, pipPositions.length);
  pips.userData = { id: 'play' };
  const matrix = new THREE.Matrix4();
  pipPositions.forEach(([x, y, z], index) => {
    matrix.makeTranslation(x, y, z);
    pips.setMatrixAt(index, matrix);
  });

  group.add(body, pips);

  return group;
}

/**
 * Builds the `about` node: a faceted geometric gem - an `IcosahedronGeometry`
 * backing solid (THEME-colored, 20 flat triangular facets, `detail=0` so the
 * facets stay large and legible rather than sphere-smooth) with a thin
 * `PlaneGeometry` photo mesh floating just in front of it. Replaces the
 * earlier flat `RoundedBoxGeometry` "card" - a rectangular box read as a
 * plain flat square next to it, whereas a faceted polyhedron reads as an
 * actual 3D geometric shape (matching this node's sibling nodes' "distinct
 * physical object" brief while still being the one deliberately abstract
 * shape, since a floating photo needs *some* legible flat face to sit in
 * front of - a real-world "photo-holding object" like a frame doesn't have
 * this project's abstract-geometry identity, which is what this specific
 * shape swap was requested to restore). The whole Group is still tagged
 * `.userData = { id: 'about' }`, and BOTH child meshes are ALSO tagged
 * directly, because `raycaster.intersectObjects(nodes, true)` returns the
 * actual leaf object hit (one of the two meshes) as `intersection.object`,
 * never the parent Group - without this, `hitObject.userData.id` would
 * resolve to `undefined` for this node specifically.
 *
 * Sprites used to auto-billboard toward the camera for free; a real Group
 * does not, so `main.js`'s render loop calls `node.lookAt(camera.position)`
 * on this node every frame instead (see the `about`-specific branch there).
 * `Object3D.lookAt` orients an object so its local -Z axis points at the
 * target, which means (a) the photo plane must sit on the gem's local -Z
 * side to face the camera, and (b) the photo mesh itself needs an extra
 * 180-degree Y rotation - baked in below - so its "right" edge lines up with
 * the *viewer's* right rather than mirroring once the whole gem is
 * re-oriented toward wherever the camera currently is.
 */
function createAboutNode(THEME, CONTENT) {
  const group = new THREE.Group();
  group.userData = { id: 'about' };

  const gemRadius = 1.4;
  const backingGeometry = new THREE.IcosahedronGeometry(gemRadius, 0);
  const backingMaterial = physicalMaterial({
    color: THEME.nodeColors.about,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15,
    iridescence: 0.4,
    iridescenceIOR: 1.3,
  });
  const backing = taggedMesh('about', backingGeometry, backingMaterial);
  group.add(backing);

  // MeshBasicMaterial (unlit) keeps the photo's own colors accurate instead
  // of tinting/darkening it under the scene's studio lighting or washing it
  // out with a clearcoat highlight.
  const photoMaterial = new THREE.MeshBasicMaterial({
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
  const photoGeometry = new THREE.PlaneGeometry(1.7, 1.95);
  const photo = taggedMesh('about', photoGeometry, photoMaterial);
  photo.position.z = -(gemRadius + 0.08);
  photo.rotation.y = Math.PI;
  group.add(photo);

  return group;
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
 * @param {boolean} [lowTier=false] - device-tier flag computed ONCE at boot
 *   by main.js. Halves segment/tessellation counts across every node's
 *   geometry (cylinder/torus radial segments, gear tooth count and extrude
 *   smoothness, rounded-box corner segments, pip sphere segments); desktop
 *   mouse users (lowTier=false) always get the full-detail geometry.
 * @returns {THREE.Object3D[]} the 5 node objects, each (and every
 *   raycastable leaf child) tagged `.userData.id`
 */
export function createNodes(scene, THEME, CONTENT, lowTier = false) {
  const nodes = NODE_ORDER.map((id) => {
    switch (id) {
      case 'about':
        return createAboutNode(THEME, CONTENT);
      case 'career':
        return createCameraNode(THEME, lowTier);
      case 'techStack':
        return createGearNode(THEME, lowTier);
      case 'oss':
        return createBookNode(THEME, lowTier);
      case 'play':
        return createDieNode(THEME, lowTier);
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
