import { BoardPattern, createBoard } from "../../boardFactory";
import { Intersection } from "../../intersection";
import {
  getCubeNetPosition,
  netPositionToFaceCoords,
  faceCoordsTo3DPosition,
} from "../CubeHelper";

describe("CubeHelper", () => {
  describe("Board Structure", () => {
    it("should create correct number of intersections (no duplicates)", () => {
      const size = 3;
      const config = {
        type: BoardPattern.Cube,
        faceSize: size,
      };

      // Formula: 8 corners + 12*(size-2) edges + 6*(size-2)^2 faces
      // For size=3: 8 + 12*1 + 6*1 = 26
      expect(createBoard(config, Intersection).length).toBe(26);
    });

    it("should have correct intersection count for size 5", () => {
      const size = 5;
      const config = {
        type: BoardPattern.Cube,
        faceSize: size,
      };

      // For size=5: 8 + 12*3 + 6*9 = 8 + 36 + 54 = 98
      expect(createBoard(config, Intersection).length).toBe(98);
    });

    it("should have correct neighbor counts for intersections", () => {
      const size = 3;
      const config = {
        type: BoardPattern.Cube,
        faceSize: size,
      };

      const intersections = createBoard(config, Intersection);

      const neighborCounts = new Map<number, number>();
      intersections.forEach((intersection) => {
        const count = intersection.neighbours.length;
        neighborCounts.set(count, (neighborCounts.get(count) || 0) + 1);
      });

      // For a 3x3 cube (26 intersections):
      // - 8 corners with 3 neighbors each
      // - 12 edge midpoints (1 per edge) with 4 neighbors each
      // - 6 face centers with 4 neighbors each
      // Total: 8 + 12 + 6 = 26
      expect(neighborCounts.get(3)).toBe(8); // corners
      expect(neighborCounts.get(4)).toBe(18); // edges + face centers

      // Verify all intersections have neighbors
      expect(intersections.every((i) => i.neighbours.length > 0)).toBe(true);
    });
  });

  describe("Position Mapping", () => {
    it("should convert net position to face coordinates", () => {
      const size = 3;

      // Test center of front face (face 0)
      const netPos0 = getCubeNetPosition(0, 1, 1, size);
      const coords0 = netPositionToFaceCoords(netPos0, size);
      expect(coords0).toEqual([0, 1, 1]);

      // Test corner of top face (face 4)
      const netPos4 = getCubeNetPosition(4, 0, 0, size);
      const coords4 = netPositionToFaceCoords(netPos4, size);
      expect(coords4).toEqual([4, 0, 0]);

      // Test right face (face 1)
      const netPos1 = getCubeNetPosition(1, 2, 1, size);
      const coords1 = netPositionToFaceCoords(netPos1, size);
      expect(coords1).toEqual([1, 2, 1]);
    });

    it("should return null for invalid net positions", () => {
      const size = 3;

      // Test position that's not on any face (in the gap between faces)
      const result = netPositionToFaceCoords({ x: 100, y: 100 }, size);
      expect(result).toBeNull();
    });

    it("should round-trip: face coords -> net position -> face coords", () => {
      const size = 3;

      // Test all positions on all faces
      for (let face = 0; face < 6; face++) {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const netPos = getCubeNetPosition(face, x, y, size);
            const coords = netPositionToFaceCoords(netPos, size);
            expect(coords).toEqual([face, x, y]);
          }
        }
      }
    });

    it("should convert face coordinates to 3D positions", () => {
      const size = 3;
      const faceOffset = (size - 1) / 2; // 1 for size 3

      // Test front face center (1, 1)
      // u = (1/2)*2 - 1 = 0, v = (1/2)*2 - 1 = 0
      // Front: {x: u, y: -v, z: faceOffset} = {0, 0, 1}
      const pos0 = faceCoordsTo3DPosition(0, 1, 1, size, faceOffset);
      expect(pos0.x).toBeCloseTo(0);
      expect(pos0.y).toBeCloseTo(0);
      expect(pos0.z).toBeCloseTo(faceOffset);

      // Test front face top-left corner (0, 0)
      // u = (0/2)*2 - 1 = -1, v = (0/2)*2 - 1 = -1
      // Front: {x: u, y: -v, z: faceOffset} = {-1, 1, 1}
      const pos1 = faceCoordsTo3DPosition(0, 0, 0, size, faceOffset);
      expect(pos1.x).toBeCloseTo(-faceOffset);
      expect(pos1.y).toBeCloseTo(faceOffset); // -v = -(-1) = 1
      expect(pos1.z).toBeCloseTo(faceOffset);

      // Test top face center (1, 1)
      // u = 0, v = 0
      // Top: {x: u, y: faceOffset, z: v} = {0, 1, 0}
      const pos4 = faceCoordsTo3DPosition(4, 1, 1, size, faceOffset);
      expect(pos4.x).toBeCloseTo(0);
      expect(pos4.y).toBeCloseTo(faceOffset);
      expect(pos4.z).toBeCloseTo(0);

      // Test right face center (1, 1)
      // u = 0, v = 0
      // Right: {x: faceOffset, y: -v, z: -u} = {1, 0, 0}
      const pos1Right = faceCoordsTo3DPosition(1, 1, 1, size, faceOffset);
      expect(pos1Right.x).toBeCloseTo(faceOffset);
      expect(pos1Right.y).toBeCloseTo(0);
      expect(pos1Right.z).toBeCloseTo(0);
    });

    it("should map shared edge positions to same 3D location", () => {
      const size = 3;
      const faceOffset = (size - 1) / 2;

      // Front face right edge should map to same position as Right face left edge
      // Front (0) at (2, 1) should equal Right (1) at (0, 1)
      const frontRightEdge = faceCoordsTo3DPosition(0, 2, 1, size, faceOffset);
      const rightLeftEdge = faceCoordsTo3DPosition(1, 0, 1, size, faceOffset);

      expect(frontRightEdge.x).toBeCloseTo(rightLeftEdge.x);
      expect(frontRightEdge.y).toBeCloseTo(rightLeftEdge.y);
      expect(frontRightEdge.z).toBeCloseTo(rightLeftEdge.z);
    });
  });
});
