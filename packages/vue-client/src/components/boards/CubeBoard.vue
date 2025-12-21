<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
  nextTick,
} from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
import {
  CubeBadukConfig,
  createBoard,
  Intersection,
  createGraph,
  indexToMove,
  DefaultBoardState,
  netPositionToFaceCoords,
  faceCoordsTo3DPosition,
  projectToSquircle,
  calculateSquircleNormal,
} from "@ogfcommunity/variants-shared";

const props = withDefaults(
  defineProps<{
    config: CubeBadukConfig;
    gamestate?: DefaultBoardState;
    power?: number;
    showNormals?: boolean;
  }>(),
  {
    power: 4,
    showNormals: false,
  },
);

const emit = defineEmits<{
  (e: "move", pos: string): void;
  (e: "hover", index: number): void;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLDivElement>();
const hoveredIntersection = ref<number>(-1);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let intersectionMeshes: THREE.Mesh[] = [];
let stoneMeshes: (THREE.Mesh | null)[] = [];
let squircleMesh: THREE.Mesh | null = null;
let cubeMesh: THREE.Mesh | null = null;
let normalHelper: VertexNormalsHelper | null = null;
let connectionLines: THREE.Line[] = [];
let animationId: number;

const intersections = computed(() => {
  if (!props.config?.board) return [];
  return createBoard(props.config.board, Intersection);
});

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value || !containerRef.value || !props.config) return;
  initThreeJS();
  createCubeBoard();
  animate();
});

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener("resize", onWindowResize);
  if (canvasRef.value) {
    canvasRef.value.removeEventListener("mousemove", onMouseMove);
    canvasRef.value.removeEventListener("click", onClick);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});

// Watch for board_config to become available
watch(
  () => props.config,
  async (newConfig) => {
    if (newConfig && canvasRef.value && containerRef.value && !scene) {
      await nextTick();
      initThreeJS();
      createCubeBoard();
      animate();
    }
  },
  { immediate: true },
);

// Watch for power changes and rebuild the board
watch(
  () => props.power,
  () => {
    if (scene && props.config) {
      createCubeBoard();
      // Also need to re-render stones with new positions
      if (props.gamestate?.board) {
        updateStones();
      }
    }
  },
);

/**
 * Create a squircle geometry using the superellipse equation
 * |x|^p + |y|^p + |z|^p = r^p
 */
function createSquircleGeometry(
  radius: number,
  power: number,
  segments = 32,
): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  // Use spherical-like parametrization but with squircle projection
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI; // 0 to π (vertical angle)

    for (let j = 0; j <= segments; j++) {
      const phi = (j / segments) * 2 * Math.PI; // 0 to 2π (horizontal angle)

      // Start with sphere coordinates
      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.cos(theta);
      const z = Math.sin(theta) * Math.sin(phi);

      // Project onto squircle surface
      const projected = projectToSquircle({ x, y, z }, power, radius);
      vertices.push(projected.x, projected.y, projected.z);

      // Calculate normal at this point
      const normal = calculateSquircleNormal(projected, power);
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  // Generate indices for triangles (reversed winding order for outward-facing)
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      const c = a + 1;
      const d = b + 1;

      // Two triangles per quad (winding order reversed)
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);

  // Ensure normals are normalized
  geometry.normalizeNormals();

  return geometry;
}

function initThreeJS() {
  if (!canvasRef.value || !containerRef.value) return;

  // Scene
  scene = new THREE.Scene();
  // Transparent background
  scene.background = null;

  const width = containerRef.value.clientWidth || 800;
  const height = containerRef.value.clientHeight || 600;

  // Camera
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(20, 20, 30);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0); // Transparent background
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Attach directional light to camera so it moves with the view
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(10, 10, 5);
  camera.add(directionalLight);
  scene.add(camera);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Raycaster for mouse interaction
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Mouse events
  canvasRef.value.addEventListener("mousemove", onMouseMove);
  canvasRef.value.addEventListener("click", onClick);

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

function createCubeBoard() {
  if (!props.config?.board) return;

  const size = props.config.board.faceSize;
  const cubeSize = size - 1; // Physical size of cube
  const faceOffset = cubeSize / 2;

  // Remove old squircle mesh if it exists
  if (squircleMesh) {
    scene.remove(squircleMesh);
    squircleMesh.geometry.dispose();
    (squircleMesh.material as THREE.Material).dispose();
    squircleMesh = null;
  }

  // Remove old cube mesh if it exists
  if (cubeMesh) {
    scene.remove(cubeMesh);
    cubeMesh.geometry.dispose();
    (cubeMesh.material as THREE.Material).dispose();
    cubeMesh = null;
  }

  // Remove old normal helper if it exists
  if (normalHelper) {
    scene.remove(normalHelper);
    normalHelper.dispose();
    normalHelper = null;
  }

  // Use perfect cube geometry when power >= 10, otherwise use squircle
  if (props.power >= 10) {
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Go board color
      roughness: 0.7,
      metalness: 0,
    });
    cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cubeMesh);

    // Add normal helper if enabled
    if (props.showNormals) {
      normalHelper = new VertexNormalsHelper(cubeMesh, 0.3, 0x00ff00);
      scene.add(normalHelper);
    }
  } else {
    // Create squircle geometry with go board color
    const squircleGeometry = createSquircleGeometry(faceOffset, props.power);
    const squircleMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Go board color
      roughness: 0.7,
      metalness: 0,
    });
    squircleMesh = new THREE.Mesh(squircleGeometry, squircleMaterial);
    scene.add(squircleMesh);

    // Add normal helper if enabled
    if (props.showNormals) {
      normalHelper = new VertexNormalsHelper(squircleMesh, 0.3, 0x00ff00);
      scene.add(normalHelper);
    }
  }

  // Remove old intersection meshes
  intersectionMeshes.forEach((mesh) => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });

  // Remove old connection lines
  connectionLines.forEach((line) => {
    scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  });

  // Create intersection points on the cube faces
  intersectionMeshes = [];
  connectionLines = [];

  for (let i = 0; i < intersections.value.length; i++) {
    const position = getIntersectionPosition3D(i, size, faceOffset);

    // Create a small sphere for each intersection
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x8b7355,
      transparent: true,
      opacity: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.userData = { index: i, type: "intersection" };

    scene.add(mesh);
    intersectionMeshes.push(mesh);
  }

  // Draw lines between connected intersections
  const graph = createGraph(intersections.value, null);
  graph.forEach((neighbors, idx) => {
    if (!neighbors) return;

    const pos1 = getIntersectionPosition3D(idx, size, faceOffset);
    const neighborList: number[] = neighbors;

    neighborList.forEach((neighborIdx: number) => {
      // Draw each line only once
      if (neighborIdx > idx) {
        const pos2 = getIntersectionPosition3D(neighborIdx, size, faceOffset);

        const geometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        connectionLines.push(line);
      }
    });
  });
}

/**
 * Convert flat index to 3D position on cube surface
 * Uses the actual intersection position data
 */
function getIntersectionPosition3D(
  index: number,
  size: number,
  faceOffset: number,
): THREE.Vector3 {
  const intersection = intersections.value[index];
  if (!intersection) {
    return new THREE.Vector3(0, 0, 0);
  }

  // Convert the intersection's 2D net position back to face-x-y coordinates
  const pos = intersection.position;
  const coords = netPositionToFaceCoords({ x: pos.X, y: pos.Y }, size);
  if (!coords) {
    console.warn(
      `Could not map intersection ${index} position to face coords:`,
      intersection.position,
    );
    return new THREE.Vector3(0, 0, 0);
  }

  const [face, x, y] = coords;

  // Convert face-x-y to 3D position on cube
  const pos3d = faceCoordsTo3DPosition(face, x, y, size, faceOffset);

  // For perfect cube (power >= 10), don't project onto squircle
  if (props.power >= 10) {
    return new THREE.Vector3(pos3d.x, pos3d.y, pos3d.z);
  }

  // Project onto squircle surface
  const projected = projectToSquircle(pos3d, props.power, faceOffset);
  return new THREE.Vector3(projected.x, projected.y, projected.z);
}

function onMouseMove(event: MouseEvent) {
  if (!canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(intersectionMeshes);

  // Reset previous hover
  if (hoveredIntersection.value >= 0) {
    const mesh = intersectionMeshes[hoveredIntersection.value];
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.opacity = 0.3;
  }

  if (intersects.length > 0) {
    const index = intersects[0].object.userData.index;
    hoveredIntersection.value = index;
    const material = (intersects[0].object as THREE.Mesh)
      .material as THREE.MeshPhongMaterial;
    material.opacity = 0.6;
    emit("hover", index);
  } else {
    hoveredIntersection.value = -1;
  }
}

function onClick(event: MouseEvent) {
  if (!canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(intersectionMeshes);

  if (intersects.length > 0) {
    const index = intersects[0].object.userData.index;
    emit("move", indexToMove(index));
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  if (!containerRef.value || !camera || !renderer) return;

  const width = containerRef.value.clientWidth || 800;
  const height = containerRef.value.clientHeight || 600;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function updateStones() {
  if (!props.gamestate?.board || !props.config?.board || !scene) return;

  const size = props.config.board.faceSize;
  const faceOffset = (size - 1) / 2;

  // Remove old stones
  stoneMeshes.forEach((mesh) => {
    if (mesh) scene.remove(mesh);
  });
  stoneMeshes = [];

  // Add new stones
  props.gamestate.board.forEach((stone, index) => {
    // Handle both single stone and array of stones (for 2D boards)
    const singleStone = Array.isArray(stone) ? stone[0] : stone;

    if (!singleStone || singleStone.colors.length === 0) {
      stoneMeshes.push(null);
      return;
    }

    const position = getIntersectionPosition3D(index, size, faceOffset);

    // Create stone
    const geometry = new THREE.SphereGeometry(0.35, 32, 32);
    const color = singleStone.colors.includes("black") ? 0x000000 : 0xffffff;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    // Calculate normal at stone position for proper orientation
    const normal = calculateSquircleNormal(
      { x: position.x, y: position.y, z: position.z },
      props.power,
    );

    // Add annotation if present
    if (singleStone.annotation === "CR") {
      const ringGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: singleStone.colors.includes("black") ? 0xffffff : 0x000000,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);

      // Orient ring perpendicular to the surface using the normal
      const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normalVector,
      );

      mesh.add(ring);
    }

    scene.add(mesh);
    stoneMeshes.push(mesh);
  });
}

// Watch for board updates to render stones
watch(() => props.gamestate?.board, updateStones, { immediate: true });
</script>

<template>
  <div ref="containerRef" class="cube-board-container">
    <canvas ref="canvasRef" class="cube-board-canvas"></canvas>
  </div>
</template>

<style scoped>
.cube-board-container {
  width: 100%;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cube-board-canvas {
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
