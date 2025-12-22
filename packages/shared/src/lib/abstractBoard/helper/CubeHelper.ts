import { Intersection } from "../intersection";
import { Vector2D } from "./types/Vector2D";
import type { CubeBoardConfig, IntersectionConstructor } from "../boardFactory";
import { Coordinate, type CoordinateLike } from "../../coordinate";

/**
 * Get the 2D position for displaying a cube net
 * Used for visualization and coordinate mapping
 */
export function getCubeNetPosition(
  face: number,
  x: number,
  y: number,
  size: number,
): Coordinate {
  // Cube net layout:
  //       [4: Top]
  // [3: Left][0: Front][1: Right][2: Back]
  //       [5: Bottom]

  const spacing = size + 1; // Add spacing between faces
  let baseX = 0,
    baseY = 0;

  switch (face) {
    case 0: // Front
      baseX = spacing;
      baseY = spacing;
      break;
    case 1: // Right
      baseX = spacing * 2;
      baseY = spacing;
      break;
    case 2: // Back
      baseX = spacing * 3;
      baseY = spacing;
      break;
    case 3: // Left
      baseX = 0;
      baseY = spacing;
      break;
    case 4: // Top
      baseX = spacing;
      baseY = 0;
      break;
    case 5: // Bottom
      baseX = spacing;
      baseY = spacing * 2;
      break;
  }

  return new Coordinate(baseX + x, baseY + y);
}

/**
 * Get a unique key for a position on a face
 */
function getFacePositionKey(face: number, x: number, y: number): string {
  return `${face}-${x}-${y}`;
}

/**
 * Get x, y coordinates for a position along an edge
 */
function getEdgeCoordFromPosition(
  edge: string,
  position: number,
  size: number,
): [number, number] {
  switch (edge) {
    case "top":
      return [position, 0];
    case "right":
      return [size - 1, position];
    case "bottom":
      return [position, size - 1];
    case "left":
      return [0, position];
    default:
      return [0, 0];
  }
}

/**
 * Get all three positions that represent the same physical corner
 * Each corner of a cube is shared by exactly 3 faces
 * Returns array of [face, x, y] tuples for all 3 positions
 */
function getCornerPositions(
  face: number,
  x: number,
  y: number,
  size: number,
): Array<[number, number, number]> {
  const maxIdx = size - 1;

  // Only process corners
  if (!((x === 0 || x === maxIdx) && (y === 0 || y === maxIdx))) {
    return [];
  }

  const key = `${face}-${x}-${y}`;

  // Hard-coded mapping of all 8 physical corners
  // Each entry maps to all 3 face positions that represent that corner
  // Cube topology: 0=Front, 1=Right, 2=Back, 3=Left, 4=Top, 5=Bottom

  const cornerMap: Record<string, Array<[number, number, number]>> = {
    // Corner 1: Front-Top-Left = Top-Front-Left = Left-Top-Front
    "0-0-0": [
      [0, 0, 0],
      [4, 0, maxIdx],
      [3, maxIdx, 0],
    ],
    [`4-0-${maxIdx}`]: [
      [0, 0, 0],
      [4, 0, maxIdx],
      [3, maxIdx, 0],
    ],
    [`3-${maxIdx}-0`]: [
      [0, 0, 0],
      [4, 0, maxIdx],
      [3, maxIdx, 0],
    ],

    // Corner 2: Front-Top-Right = Top-Front-Right = Right-Top-Front
    [`0-${maxIdx}-0`]: [
      [0, maxIdx, 0],
      [4, maxIdx, maxIdx],
      [1, 0, 0],
    ],
    [`4-${maxIdx}-${maxIdx}`]: [
      [0, maxIdx, 0],
      [4, maxIdx, maxIdx],
      [1, 0, 0],
    ],
    "1-0-0": [
      [0, maxIdx, 0],
      [4, maxIdx, maxIdx],
      [1, 0, 0],
    ],

    // Corner 3: Front-Bottom-Left = Bottom-Front-Left = Left-Bottom-Front
    [`0-0-${maxIdx}`]: [
      [0, 0, maxIdx],
      [5, 0, 0],
      [3, maxIdx, maxIdx],
    ],
    "5-0-0": [
      [0, 0, maxIdx],
      [5, 0, 0],
      [3, maxIdx, maxIdx],
    ],
    [`3-${maxIdx}-${maxIdx}`]: [
      [0, 0, maxIdx],
      [5, 0, 0],
      [3, maxIdx, maxIdx],
    ],

    // Corner 4: Front-Bottom-Right = Bottom-Front-Right = Right-Bottom-Front
    [`0-${maxIdx}-${maxIdx}`]: [
      [0, maxIdx, maxIdx],
      [5, maxIdx, 0],
      [1, 0, maxIdx],
    ],
    [`5-${maxIdx}-0`]: [
      [0, maxIdx, maxIdx],
      [5, maxIdx, 0],
      [1, 0, maxIdx],
    ],
    [`1-0-${maxIdx}`]: [
      [0, maxIdx, maxIdx],
      [5, maxIdx, 0],
      [1, 0, maxIdx],
    ],

    // Corner 5: Back-Top-Left = Top-Back-Left = Left-Top-Back
    [`2-${maxIdx}-0`]: [
      [2, maxIdx, 0],
      [4, 0, 0],
      [3, 0, 0],
    ],
    "4-0-0": [
      [2, maxIdx, 0],
      [4, 0, 0],
      [3, 0, 0],
    ],
    "3-0-0": [
      [2, maxIdx, 0],
      [4, 0, 0],
      [3, 0, 0],
    ],

    // Corner 6: Back-Top-Right = Top-Back-Right = Right-Top-Back
    "2-0-0": [
      [2, 0, 0],
      [4, maxIdx, 0],
      [1, maxIdx, 0],
    ],
    [`4-${maxIdx}-0`]: [
      [2, 0, 0],
      [4, maxIdx, 0],
      [1, maxIdx, 0],
    ],
    [`1-${maxIdx}-0`]: [
      [2, 0, 0],
      [4, maxIdx, 0],
      [1, maxIdx, 0],
    ],

    // Corner 7: Back-Bottom-Left = Bottom-Back-Left = Left-Bottom-Back
    [`2-${maxIdx}-${maxIdx}`]: [
      [2, maxIdx, maxIdx],
      [5, 0, maxIdx],
      [3, 0, maxIdx],
    ],
    [`5-0-${maxIdx}`]: [
      [2, maxIdx, maxIdx],
      [5, 0, maxIdx],
      [3, 0, maxIdx],
    ],
    [`3-0-${maxIdx}`]: [
      [2, maxIdx, maxIdx],
      [5, 0, maxIdx],
      [3, 0, maxIdx],
    ],

    // Corner 8: Back-Bottom-Right = Bottom-Back-Right = Right-Bottom-Back
    [`2-0-${maxIdx}`]: [
      [2, 0, maxIdx],
      [5, maxIdx, maxIdx],
      [1, maxIdx, maxIdx],
    ],
    [`5-${maxIdx}-${maxIdx}`]: [
      [2, 0, maxIdx],
      [5, maxIdx, maxIdx],
      [1, maxIdx, maxIdx],
    ],
    [`1-${maxIdx}-${maxIdx}`]: [
      [2, 0, maxIdx],
      [5, maxIdx, maxIdx],
      [1, maxIdx, maxIdx],
    ],
  };

  return cornerMap[key] || [];
}

/**
 * Get all shared keys for corner positions (shared by 3 faces total)
 * Returns the keys for the OTHER TWO faces that share this corner
 */
function getCornerSharedKeys(
  face: number,
  x: number,
  y: number,
  size: number,
): string[] {
  // Get all three faces that share this corner from the mapping
  const cornerPositions = getCornerPositions(face, x, y, size);

  // Return the keys for the other two faces (not including current face)
  return cornerPositions
    .filter(([f, _, __]) => f !== face)
    .map(([f, cx, cy]) => getFacePositionKey(f, cx, cy));
}

/**
 * Get all position keys that should map to the same intersection
 * (for edges and corners shared between faces)
 */
function getSharedPositionKeys(
  face: number,
  x: number,
  y: number,
  size: number,
): string[] {
  const keys: string[] = [];
  const maxIdx = size - 1;

  // Check if this is a corner (special case: shared by 3 faces)
  if ((x === 0 || x === maxIdx) && (y === 0 || y === maxIdx)) {
    const cornerKeys = getCornerSharedKeys(face, x, y, size);
    return cornerKeys;
  }

  // Define cube topology: which edges connect to which faces
  // Format: [face, edge] -> [otherFace, otherEdge, reverseDirection]
  const edgeConnections: Record<string, [number, string, boolean]> = {
    // Front (0)
    "0-top": [4, "bottom", false],
    "0-right": [1, "left", false],
    "0-bottom": [5, "top", false],
    "0-left": [3, "right", false],
    // Right (1)
    "1-top": [4, "right", true], // reversed
    "1-right": [2, "left", false],
    "1-bottom": [5, "right", false],
    "1-left": [0, "right", false],
    // Back (2)
    "2-top": [4, "top", true], // reversed
    "2-right": [3, "left", false],
    "2-bottom": [5, "bottom", true], // reversed
    "2-left": [1, "right", false],
    // Left (3)
    "3-top": [4, "left", false],
    "3-right": [0, "left", false],
    "3-bottom": [5, "left", true], // reversed
    "3-left": [2, "right", false],
    // Top (4)
    "4-top": [2, "top", true], // reversed
    "4-right": [1, "top", false],
    "4-bottom": [0, "top", false],
    "4-left": [3, "top", false],
    // Bottom (5)
    "5-top": [0, "bottom", false],
    "5-right": [1, "bottom", false],
    "5-bottom": [2, "bottom", true], // reversed
    "5-left": [3, "bottom", false],
  };

  // Check if this position is on an edge (but not a corner)
  let onEdge: string | null = null;
  let edgePosition = -1;

  if (y === 0) {
    onEdge = "top";
    edgePosition = x;
  } else if (y === maxIdx) {
    onEdge = "bottom";
    edgePosition = x;
  } else if (x === 0) {
    onEdge = "left";
    edgePosition = y;
  } else if (x === maxIdx) {
    onEdge = "right";
    edgePosition = y;
  }

  if (onEdge) {
    const connectionKey = `${face}-${onEdge}`;
    const connection = edgeConnections[connectionKey];

    if (connection) {
      const [otherFace, otherEdge, reversed] = connection;
      const otherPos = reversed ? maxIdx - edgePosition : edgePosition;

      // Get coordinates on the other face
      const [ox, oy] = getEdgeCoordFromPosition(otherEdge, otherPos, size);
      keys.push(getFacePositionKey(otherFace, ox, oy));
    }
  }

  return keys;
}

/**
 * Creates a cube board where each face is a grid.
 * Edges and corners are properly shared between adjacent faces.
 *
 * Face indices: 0=Front, 1=Right, 2=Back, 3=Left, 4=Top, 5=Bottom
 *
 * Topology:
 * - 8 corners (each shared by 3 faces)
 * - 12 edges with (size-2) interior points each (shared by 2 faces)
 * - 6 faces with (size-2)^2 interior points each (not shared)
 */
export function createCubeBoard<TIntersection extends Intersection>(
  config: CubeBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const size = config.faceSize;

  // Map from face+position to global intersection index
  const intersectionMap = new Map<string, number>();
  const intersections: TIntersection[] = [];

  // Helper to get or create an intersection at a face position
  const getOrCreateIntersection = (
    face: number,
    x: number,
    y: number,
  ): number => {
    // Check if this position is on an edge or corner and might be shared
    const key = getFacePositionKey(face, x, y);

    if (intersectionMap.has(key)) {
      return intersectionMap.get(key)!;
    }

    // Create new intersection
    const pos = getCubeNetPosition(face, x, y, size);
    const idx = intersections.length;
    intersections.push(new intersectionConstructor(new Vector2D(pos.x, pos.y)));
    intersectionMap.set(key, idx);

    // Also register this position for all faces that share it
    const sharedKeys = getSharedPositionKeys(face, x, y, size);
    sharedKeys.forEach((sharedKey) => {
      intersectionMap.set(sharedKey, idx);
    });

    return idx;
  };

  // Create all intersections for all 6 faces
  for (let face = 0; face < 6; face++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        getOrCreateIntersection(face, x, y);
      }
    }
  }

  // Connect intersections within each face and across shared edges
  // Track connections to avoid duplicates
  const connected = new Set<string>();

  for (let face = 0; face < 6; face++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const key = getFacePositionKey(face, x, y);
        const idx = intersectionMap.get(key)!;

        // Connect to right neighbor
        if (x < size - 1) {
          const rightKey = getFacePositionKey(face, x + 1, y);
          const rightIdx = intersectionMap.get(rightKey)!;

          // Only connect if we haven't already connected these two intersections
          const connectionKey =
            idx < rightIdx ? `${idx}-${rightIdx}` : `${rightIdx}-${idx}`;
          if (!connected.has(connectionKey)) {
            intersections[idx].connectTo(intersections[rightIdx], true);
            connected.add(connectionKey);
          }
        }

        // Connect to bottom neighbor
        if (y < size - 1) {
          const bottomKey = getFacePositionKey(face, x, y + 1);
          const bottomIdx = intersectionMap.get(bottomKey)!;

          // Only connect if we haven't already connected these two intersections
          const connectionKey =
            idx < bottomIdx ? `${idx}-${bottomIdx}` : `${bottomIdx}-${idx}`;
          if (!connected.has(connectionKey)) {
            intersections[idx].connectTo(intersections[bottomIdx], true);
            connected.add(connectionKey);
          }
        }
      }
    }
  }

  return intersections;
}

/**
 * Convert face-x-y notation to intersection index.
 * This is useful for specifying moves in a human-readable way.
 *
 * @param face Face number (0-5)
 * @param x X coordinate on the face
 * @param y Y coordinate on the face
 * @param size Size of each face
 * @returns Index of the intersection, or -1 if not found
 */
export function facePositionToIndex(
  face: number,
  x: number,
  y: number,
  size: number,
): number {
  // Recreate the same mapping logic as in createCubeBoard
  const intersectionMap = new Map<string, number>();

  // Helper to register an intersection
  const registerIntersection = (
    f: number,
    fx: number,
    fy: number,
    idx: number,
  ) => {
    const key = getFacePositionKey(f, fx, fy);
    if (!intersectionMap.has(key)) {
      intersectionMap.set(key, idx);

      // Also register for shared positions
      const sharedKeys = getSharedPositionKeys(f, fx, fy, size);
      sharedKeys.forEach((sharedKey) => {
        if (!intersectionMap.has(sharedKey)) {
          intersectionMap.set(sharedKey, idx);
        }
      });
    }
  };

  // Build the map by iterating through faces in the same order as createCubeBoard
  let idx = 0;
  for (let f = 0; f < 6; f++) {
    for (let fy = 0; fy < size; fy++) {
      for (let fx = 0; fx < size; fx++) {
        const key = getFacePositionKey(f, fx, fy);
        if (!intersectionMap.has(key)) {
          registerIntersection(f, fx, fy, idx);
          idx++;
        }
        // If position was already registered, skip it
      }
    }
  }

  const key = getFacePositionKey(face, x, y);
  return intersectionMap.get(key) ?? -1;
}

/**
 * Convert 2D net position back to face-x-y coordinates.
 * This reverses the getCubeNetPosition mapping.
 *
 * @param netPos The 2D position from the cube net
 * @param size Size of each face
 * @returns [face, x, y] or null if not on a face
 */
export function netPositionToFaceCoords(
  netPos: CoordinateLike,
  size: number,
): [number, number, number] | null {
  const spacing = size + 1;

  // Check each face's bounds
  const faces = [
    { face: 0, baseX: spacing, baseY: spacing }, // Front
    { face: 1, baseX: spacing * 2, baseY: spacing }, // Right
    { face: 2, baseX: spacing * 3, baseY: spacing }, // Back
    { face: 3, baseX: 0, baseY: spacing }, // Left
    { face: 4, baseX: spacing, baseY: 0 }, // Top
    { face: 5, baseX: spacing, baseY: spacing * 2 }, // Bottom
  ];

  for (const { face, baseX, baseY } of faces) {
    const x = netPos.x - baseX;
    const y = netPos.y - baseY;

    // Check if position is within this face's bounds
    if (x >= 0 && x < size && y >= 0 && y < size) {
      return [face, x, y];
    }
  }

  return null;
}

/**
 * Convert face-x-y coordinates to 3D position on cube surface.
 *
 * @param face Face number (0-5): 0=Front, 1=Right, 2=Back, 3=Left, 4=Top, 5=Bottom
 * @param x X coordinate on the face (0 to size-1)
 * @param y Y coordinate on the face (0 to size-1)
 * @param size Size of each face
 * @param faceOffset Half the physical cube size
 * @returns THREE.Vector3-like object {x, y, z}
 */
export function faceCoordsTo3DPosition(
  face: number,
  x: number,
  y: number,
  size: number,
  faceOffset: number,
): { x: number; y: number; z: number } {
  // Convert grid coordinates to centered positions
  const u = (x / (size - 1)) * (size - 1) - faceOffset;
  const v = (y / (size - 1)) * (size - 1) - faceOffset;

  // Map to cube face positions
  // 0=Front, 1=Right, 2=Back, 3=Left, 4=Top, 5=Bottom
  switch (face) {
    case 0: // Front (facing +Z)
      return { x: u, y: -v, z: faceOffset };
    case 1: // Right (facing +X)
      return { x: faceOffset, y: -v, z: -u };
    case 2: // Back (facing -Z)
      return { x: -u, y: -v, z: -faceOffset };
    case 3: // Left (facing -X)
      return { x: -faceOffset, y: -v, z: u };
    case 4: // Top (facing +Y)
      return { x: u, y: faceOffset, z: v };
    case 5: // Bottom (facing -Y)
      return { x: u, y: -faceOffset, z: -v };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

/**
 * Project a 3D position onto a squircle (superellipse) surface.
 * Uses the equation: |x|^p + |y|^p + |z|^p = r^p
 *
 * @param pos The position to project
 * @param power The power parameter (2 = sphere, higher = more cube-like, infinity = cube)
 * @param radius The target radius
 * @returns Projected position on the squircle surface
 */
export function projectToSquircle(
  pos: { x: number; y: number; z: number },
  power: number,
  radius: number,
): { x: number; y: number; z: number } {
  const { x, y, z } = pos;

  // Handle edge case of origin
  if (x === 0 && y === 0 && z === 0) {
    return { x: 0, y: 0, z: radius };
  }

  // Calculate the current "radius" using the superellipse norm
  // ||v||_p = (|x|^p + |y|^p + |z|^p)^(1/p)
  const norm = Math.pow(
    Math.pow(Math.abs(x), power) +
      Math.pow(Math.abs(y), power) +
      Math.pow(Math.abs(z), power),
    1 / power,
  );

  // Scale to the target radius
  const scale = radius / norm;

  return {
    x: x * scale,
    y: y * scale,
    z: z * scale,
  };
}

/**
 * Calculate the surface normal at a point on a squircle.
 * The gradient of f(x,y,z) = |x|^p + |y|^p + |z|^p gives the normal direction.
 * ∇f = (p·|x|^(p-1)·sgn(x), p·|y|^(p-1)·sgn(y), p·|z|^(p-1)·sgn(z))
 *
 * @param pos Position on the squircle surface
 * @param power The power parameter
 * @returns Normalized surface normal vector
 */
export function calculateSquircleNormal(
  pos: { x: number; y: number; z: number },
  power: number,
): { x: number; y: number; z: number } {
  const { x, y, z } = pos;

  // Calculate gradient components
  const epsilon = 1e-10; // Small value to avoid division by zero
  const nx = power * Math.pow(Math.abs(x) + epsilon, power - 1) * Math.sign(x);
  const ny = power * Math.pow(Math.abs(y) + epsilon, power - 1) * Math.sign(y);
  const nz = power * Math.pow(Math.abs(z) + epsilon, power - 1) * Math.sign(z);

  // Normalize the normal vector
  const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

  if (length < epsilon) {
    // Fallback for degenerate case
    return { x: 0, y: 1, z: 0 };
  }

  return {
    x: nx / length,
    y: ny / length,
    z: nz / length,
  };
}
