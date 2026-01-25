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
  getHoshi,
} from "@ogfcommunity/variants-shared";

const props = withDefaults(
  defineProps<{
    config: CubeBadukConfig;
    gamestate?: DefaultBoardState;
    nextToPlay?: number[];
    power?: number;
    debugGraphics?: boolean;
  }>(),
  {
    power: 4,
    debugGraphics: false,
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
let connectionLines: THREE.Mesh[] = [];
let faceLabels: THREE.Sprite[] = [];
let starPoints: THREE.Mesh[] = [];
let ghostStone: THREE.Mesh | null = null;
let animationId: number;

// Track drag state to distinguish clicks from drags
let pointerDownPosition: { x: number; y: number } | null = null;
const DRAG_THRESHOLD = 5; // pixels

const intersections = computed(() => {
  if (!props.config?.board) return [];
  return createBoard(props.config.board, Intersection);
});

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value || !containerRef.value || !props.config) return;
  initThreeJS();
  createCubeBoard();
  updateStones(); // Render initial stones after board is created
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
    canvasRef.value.removeEventListener("pointerdown", onPointerDown);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
  if (ghostStone) {
    scene.remove(ghostStone);
    ghostStone.geometry.dispose();
    (ghostStone.material as THREE.Material).dispose();
    ghostStone = null;
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
      updateStones(); // Render stones after board is created
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

// Watch for debugGraphics changes and rebuild the board
watch(
  () => props.debugGraphics,
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
  segments = 96,
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
  canvasRef.value.addEventListener("pointerdown", onPointerDown);

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

  // Remove old face labels
  faceLabels.forEach((sprite) => {
    scene.remove(sprite);
    sprite.material.dispose();
    if (sprite.material.map) {
      sprite.material.map.dispose();
    }
  });
  faceLabels = [];

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
    if (props.debugGraphics) {
      normalHelper = new VertexNormalsHelper(cubeMesh, 0.3, 0x00ff00);
      scene.add(normalHelper);
    }

    // Add face labels if debug mode is enabled
    if (props.debugGraphics) {
      addFaceLabels(cubeSize);
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
    if (props.debugGraphics) {
      normalHelper = new VertexNormalsHelper(squircleMesh, 0.3, 0x00ff00);
      scene.add(normalHelper);
    }

    // Add face labels if debug mode is enabled
    if (props.debugGraphics) {
      addFaceLabels(faceOffset);
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

  // Remove old star points
  starPoints.forEach((star) => {
    scene.remove(star);
    star.geometry.dispose();
    (star.material as THREE.Material).dispose();
  });

  // Create intersection points on the cube faces
  intersectionMeshes = [];
  connectionLines = [];
  starPoints = [];

  for (let i = 0; i < intersections.value.length; i++) {
    const position = getIntersectionPosition3D(i, size, faceOffset);

    // Create a larger invisible sphere for each intersection (for clicking)
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x8b7355,
      transparent: true,
      opacity: 0,
      visible: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.userData = { index: i, type: "intersection" };

    scene.add(mesh);
    intersectionMeshes.push(mesh);
  }

  // Draw lines between connected intersections
  const graph = createGraph(intersections.value, null);

  for (let idx = 0; idx < intersections.value.length; idx++) {
    const neighbors = graph.neighbors(idx);
    if (!neighbors || neighbors.length === 0) continue;

    const pos1 = getIntersectionPosition3D(idx, size, faceOffset);

    neighbors.forEach((neighborIdx: number) => {
      // Draw each line only once
      if (neighborIdx > idx) {
        const pos2 = getIntersectionPosition3D(neighborIdx, size, faceOffset);

        // Create ribbon that follows the curvature
        const segments = 10;
        const ribbonWidth = 0.015;
        const offset = 0.02;

        const vertices: number[] = [];
        const indices: number[] = [];

        // Generate vertices along the curve
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;

          // Interpolate between pos1 and pos2
          const interpPos = new THREE.Vector3(
            pos1.x + (pos2.x - pos1.x) * t,
            pos1.y + (pos2.y - pos1.y) * t,
            pos1.z + (pos2.z - pos1.z) * t,
          );

          // Re-project onto squircle surface (for perfect cube, skip this)
          let surfacePos;
          if (props.power >= 10) {
            surfacePos = interpPos;
          } else {
            const projected = projectToSquircle(
              { x: interpPos.x, y: interpPos.y, z: interpPos.z },
              props.power,
              faceOffset,
            );
            surfacePos = new THREE.Vector3(
              projected.x,
              projected.y,
              projected.z,
            );
          }

          // Calculate normal at the projected surface position
          const normal = calculateSquircleNormal(
            { x: surfacePos.x, y: surfacePos.y, z: surfacePos.z },
            props.power,
          );

          const centerPos = new THREE.Vector3(
            surfacePos.x + normal.x * offset,
            surfacePos.y + normal.y * offset,
            surfacePos.z + normal.z * offset,
          );

          // Calculate perpendicular direction for ribbon width
          // Use cross product of normal with line direction
          const lineDir = new THREE.Vector3()
            .subVectors(pos2, pos1)
            .normalize();
          const perpDir = new THREE.Vector3()
            .crossVectors(
              new THREE.Vector3(normal.x, normal.y, normal.z),
              lineDir,
            )
            .normalize();

          // Create two vertices for the ribbon width
          const v1 = new THREE.Vector3()
            .copy(centerPos)
            .add(perpDir.clone().multiplyScalar(ribbonWidth / 2));
          const v2 = new THREE.Vector3()
            .copy(centerPos)
            .sub(perpDir.clone().multiplyScalar(ribbonWidth / 2));

          vertices.push(v1.x, v1.y, v1.z);
          vertices.push(v2.x, v2.y, v2.z);
        }

        // Generate indices for triangles
        for (let i = 0; i < segments; i++) {
          const base = i * 2;
          // Two triangles per segment
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
          color: 0x000000,
          side: THREE.DoubleSide,
        });
        const ribbon = new THREE.Mesh(geometry, material);

        scene.add(ribbon);
        connectionLines.push(ribbon);
      }
    });
  }

  // Add star points (hoshi)
  addStarPoints(size, faceOffset);
}

/**
 * Add star points to each face of the cube
 */
function addStarPoints(size: number, faceOffset: number) {
  const hoshiCoords = getHoshi(size, size);

  // For each of the 6 faces, add star points
  for (let face = 0; face < 6; face++) {
    hoshiCoords.forEach((coord) => {
      const x = coord.x;
      const y = coord.y;

      // Convert face coordinates to 3D position
      const pos3d = faceCoordsTo3DPosition(face, x, y, size, faceOffset);

      // Project onto squircle surface (or cube if power >= 10)
      let surfacePos;
      if (props.power >= 10) {
        surfacePos = new THREE.Vector3(pos3d.x, pos3d.y, pos3d.z);
      } else {
        const projected = projectToSquircle(pos3d, props.power, faceOffset);
        surfacePos = new THREE.Vector3(projected.x, projected.y, projected.z);
      }

      // Calculate normal at this position
      const normal = calculateSquircleNormal(
        { x: surfacePos.x, y: surfacePos.y, z: surfacePos.z },
        props.power,
      );

      // Create a small circle for the star point
      const starRadius = 0.08;
      const geometry = new THREE.CircleGeometry(starRadius, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
      });
      const star = new THREE.Mesh(geometry, material);

      // Orient the star point to face outward from the surface
      const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
      star.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normalVector,
      );

      // Position on the surface (slightly offset outward to avoid z-fighting)
      const offsetDistance = 0.015;
      star.position.set(
        surfacePos.x + normal.x * offsetDistance,
        surfacePos.y + normal.y * offsetDistance,
        surfacePos.z + normal.z * offsetDistance,
      );

      scene.add(star);
      starPoints.push(star);
    });
  }
}

/**
 * Create a canvas texture with text for face labels
 */
function createTextTexture(
  text: string,
  color: string = "#000000",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (context) {
    // Semi-transparent background
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fillRect(0, 0, size, size);

    // Draw text
    context.fillStyle = color;
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, size / 2, size / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Add face labels to show which face is which (0-5)
 */
function addFaceLabels(offset: number) {
  const faceNames = ["Front", "Right", "Back", "Left", "Top", "Bottom"];
  const scale = offset * 0.4; // Scale labels relative to cube size

  // Face positions and orientations
  // 0=Front(+Z), 1=Right(+X), 2=Back(-Z), 3=Left(-X), 4=Top(+Y), 5=Bottom(-Y)
  const faceConfigs = [
    {
      face: 0,
      position: { x: 0, y: 0, z: offset + 0.5 },
    }, // Front
    {
      face: 1,
      position: { x: offset + 0.5, y: 0, z: 0 },
    }, // Right
    {
      face: 2,
      position: { x: 0, y: 0, z: -(offset + 0.5) },
    }, // Back
    {
      face: 3,
      position: { x: -(offset + 0.5), y: 0, z: 0 },
    }, // Left
    {
      face: 4,
      position: { x: 0, y: offset + 0.5, z: 0 },
    }, // Top
    {
      face: 5,
      position: { x: 0, y: -(offset + 0.5), z: 0 },
    }, // Bottom
  ];

  faceConfigs.forEach(({ face, position }) => {
    const texture = createTextTexture(`${face}\n${faceNames[face]}`, "#000000");
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(scale, scale, 1);

    scene.add(sprite);
    faceLabels.push(sprite);
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
  if (!canvasRef.value || !props.config?.board) return;

  const rect = canvasRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(intersectionMeshes);

  if (intersects.length > 0) {
    const index = intersects[0].object.userData.index;
    hoveredIntersection.value = index;
    emit("hover", index);

    // Show ghost stone
    const size = props.config.board.faceSize;
    const faceOffset = (size - 1) / 2;
    const position = getIntersectionPosition3D(index, size, faceOffset);
    const normal = calculateSquircleNormal(
      { x: position.x, y: position.y, z: position.z },
      props.power,
    );

    // Determine the color of the ghost stone (current player's color)
    // Player 0 = black, Player 1 = white
    const currentPlayer = props.nextToPlay?.[0] ?? 0;
    const ghostColor = currentPlayer === 0 ? 0x000000 : 0xffffff;

    if (!ghostStone) {
      // Create ghost stone
      const stoneRadiusXZ = 0.35;
      const stoneRadiusY = 0.12;
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: ghostColor,
        roughness: 0.3,
        metalness: 0,
        transparent: true,
        opacity: 0.5,
      });
      ghostStone = new THREE.Mesh(geometry, material);
      ghostStone.scale.set(stoneRadiusXZ, stoneRadiusY, stoneRadiusXZ);
      scene.add(ghostStone);
    } else {
      // Update ghost stone color if needed
      const material = ghostStone.material as THREE.MeshStandardMaterial;
      material.color.setHex(ghostColor);
    }

    // Orient the ghost stone
    const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
    ghostStone.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normalVector,
    );

    // Position on top of the surface
    const offsetDistance = 0.12;
    ghostStone.position.set(
      position.x + normal.x * offsetDistance,
      position.y + normal.y * offsetDistance,
      position.z + normal.z * offsetDistance,
    );
  } else {
    hoveredIntersection.value = -1;
    // Hide ghost stone
    if (ghostStone) {
      scene.remove(ghostStone);
      ghostStone.geometry.dispose();
      (ghostStone.material as THREE.Material).dispose();
      ghostStone = null;
    }
  }
}

function onPointerDown(event: PointerEvent) {
  // Record the pointer down position to detect drags
  pointerDownPosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

function onClick(event: MouseEvent) {
  if (!canvasRef.value) return;

  // Check if this was a drag operation
  if (pointerDownPosition) {
    const dx = event.clientX - pointerDownPosition.x;
    const dy = event.clientY - pointerDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If pointer moved more than threshold, treat as drag, not click
    if (distance > DRAG_THRESHOLD) {
      pointerDownPosition = null;
      return;
    }
  }

  pointerDownPosition = null;

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

    // Calculate normal at stone position for proper orientation
    const normal = calculateSquircleNormal(
      { x: position.x, y: position.y, z: position.z },
      props.power,
    );

    // Create stone as an oblate spheroid (go stone shape)
    // Go stones are about 1/3 as tall as they are wide
    const stoneRadiusXZ = 0.35; // width
    const stoneRadiusY = 0.15; // height
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const color = singleStone.colors.includes("black") ? 0x000000 : 0xffffff;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Orient the stone so its flattened axis aligns with the surface normal
    const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), // default up direction
      normalVector,
    );

    // Scale to create oblate spheroid
    mesh.scale.set(stoneRadiusXZ, stoneRadiusY, stoneRadiusXZ);

    // Position the stone on top of the surface (offset along normal)
    const offsetDistance = stoneRadiusY; // offset by half the height
    mesh.position.set(
      position.x + normal.x * offsetDistance,
      position.y + normal.y * offsetDistance,
      position.z + normal.z * offsetDistance,
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
watch(
  () => props.gamestate?.board,
  () => {
    // Only update if scene is ready
    if (scene) {
      updateStones();
    }
  },
  { deep: true },
);
</script>

<template>
  <div ref="containerRef" class="cube-board-container">
    <canvas ref="canvasRef" class="cube-board-canvas" />
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
