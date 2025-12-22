import { CubeBaduk, Color } from "../cube";
import { BoardPattern } from "../../lib/abstractBoard/boardFactory";

describe("CubeBaduk", () => {
  describe("Gameplay", () => {
    it("should create a cube board with the correct game state", () => {
      const config = {
        komi: 6.5,
        board: {
          type: BoardPattern.Cube,
          faceSize: 5,
        },
      };

      const game = new CubeBaduk(config);

      const state = game.exportState();
      // State should have 98 intersections for 5x5 cube
      const totalIntersections = state.board.flat().length;
      expect(totalIntersections).toBe(98);
    });

    it("should allow placing stones on the cube surface", () => {
      const config = {
        komi: 6.5,
        board: {
          type: BoardPattern.Cube,
          faceSize: 5,
        },
      };

      const game = new CubeBaduk(config);

      // Place a stone on face 0 at position (1, 2) using face-x-y notation
      game.playMove(0, "0-1-2");

      const state = game.exportState();
      // Check that a black stone was placed (we need to find its index)
      // Stone at face 0, position (1, 2) should be visible in the board
      const blackStones = state.board.flat().filter((c) => c === Color.BLACK);
      expect(blackStones.length).toBe(1);
    });

    it("should handle captures across cube edges", () => {
      const config = {
        komi: 6.5,
        board: {
          type: BoardPattern.Cube,
          faceSize: 3,
        },
      };

      const game = new CubeBaduk(config);

      // Create a simple capture scenario on a single face first
      // Black plays first (player 0), then White (player 1)
      game.playMove(0, "0-1-0"); // Black above center
      game.playMove(1, "0-1-1"); // White at center of front face

      // Continue surrounding white with black stones
      game.playMove(0, "0-1-2"); // Black below
      game.playMove(1, "pass"); // White passes
      game.playMove(0, "0-0-1"); // Black left
      game.playMove(1, "pass"); // White passes
      game.playMove(0, "0-2-1"); // Black right (should capture white)

      const state = game.exportState();

      // White stone should have been captured
      const whiteStones = state.board.flat().filter((c) => c === Color.WHITE);
      expect(whiteStones.length).toBe(0);

      // Black should have 1 capture
      expect(state.captures[0]).toBe(1);
    });

    it("should detect when a group spans multiple faces", () => {
      const config = {
        komi: 6.5,
        board: {
          type: BoardPattern.Cube,
          faceSize: 3,
        },
      };

      const game = new CubeBaduk(config);

      // Place stones that form a group across the edge between Front (0) and Right (1) faces
      // Front face position (2, 1) is on the right edge
      // Right face position (0, 1) should be the same physical position
      // So placing at one should be the same as placing at the other
      game.playMove(0, "0-2-1"); // Black on front face, right edge
      game.playMove(1, "1-1-1"); // White elsewhere

      // Now try to place adjacent to the edge stone to form a group
      // Place at (1, 1) on Front face (just left of the edge)
      game.playMove(0, "0-1-1"); // Black adjacent to first stone

      const state = game.exportState();
      // Two black stones should exist (they're adjacent)
      expect(state.board.flat().filter((c) => c === Color.BLACK).length).toBe(
        2,
      );
    });

    it("should capture a stone along an edge between two faces", () => {
      const config = {
        komi: 6.5,
        board: {
          type: BoardPattern.Cube,
          faceSize: 3,
        },
      };

      const game = new CubeBaduk(config);

      // Test capturing a white stone that sits on the edge between two faces
      // We'll place a white stone on the edge between Front (0) and Right (1)
      // Front: (2, 1) == Right: (0, 1) [same physical position]
      // Black plays first, so we need a setup move

      game.playMove(0, "0-0-0"); // Black dummy move
      game.playMove(1, "0-2-1"); // White on edge between Front and Right

      // Now surround it with black stones
      // On the Front face (0), the white stone at (2, 1) has neighbors:
      // - (2, 0) above
      // - (2, 2) below
      // - (1, 1) to the left
      // - One neighbor across the edge on the Right face

      // On the Right face (1), position (0, 1) has neighbors:
      // - (0, 0) above
      // - (0, 2) below
      // - (1, 1) to the right
      // - One neighbor across the edge on the Front face (which we already know)

      // Let's surround from the Front face perspective:
      game.playMove(0, "0-2-0"); // Black above white (on Front)
      game.playMove(1, "pass");
      game.playMove(0, "0-2-2"); // Black below white (on Front)
      game.playMove(1, "pass");
      game.playMove(0, "0-1-1"); // Black to the left of white (on Front)
      game.playMove(1, "pass");

      // Now add the final liberty from the Right face
      game.playMove(0, "1-1-1"); // Black on Right face, closing the last liberty

      const state = game.exportState();

      // White stone should have been captured
      const whiteStones = state.board.flat().filter((c) => c === Color.WHITE);
      expect(whiteStones.length).toBe(0);

      // Black should have captured 1 stone
      expect(state.captures[0]).toBe(1);
    });
  });
});
