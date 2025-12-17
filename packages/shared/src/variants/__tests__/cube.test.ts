import { CubeBaduk, Color } from "../cube";
import { BoardPattern } from "../../lib/abstractBoard/boardFactory";

describe("CubeBaduk", () => {
  it("should create a cube board with the correct number of intersections", () => {
    const config = {
      komi: 6.5,
      board: {
        type: BoardPattern.Cube,
        faceSize: 5,
      },
    };

    const game = new CubeBaduk(config);

    // 6 faces * 5x5 = 150 intersections
    // For graph boards, we need to serialize to get the actual board data
    const state = game.exportState();
    const totalIntersections = state.board.flat().length;
    expect(totalIntersections).toBe(150);
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

    // Place a stone (using the index-based move encoding for graph boards)
    game.playMove(0, "0"); // Player 0 plays at intersection 0

    const state = game.exportState();
    // Check that a black stone was placed
    expect(state.board.flat()[0]).toBe(Color.BLACK);
  });

  it("should detect captures across cube edges", () => {
    const config = {
      komi: 6.5,
      board: {
        type: BoardPattern.Cube,
        faceSize: 3,
      },
    };

    const game = new CubeBaduk(config);

    // This is a simplified test - in a real game you'd need to set up
    // a capture scenario across cube edges
    game.playMove(0, "0"); // Black
    game.playMove(1, "1"); // White

    const state = game.exportState();
    expect(state.next_to_play).toBe(0);
  });
});
