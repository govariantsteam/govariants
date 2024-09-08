import { Color } from "../../variants/baduk";
import { Coordinate } from "../coordinate";
import { SgfRecorder } from "../sgf_recorder";

test("SgfRecorder square board", () => {
  const detector = new SgfRecorder("baduk", { width: 9, height: 9 }, 7.5);
  expect(detector.sgfContent).toBe(
    `(;\nEV[GO Variants]\nPB[Player Black]\nPW[Player White]\nSZ[9]\nKM[7.5]\nVS[baduk]\n\n`,
  );
});

test("SgfRecorder non-square board", () => {
  const detector = new SgfRecorder("baduk", { width: 9, height: 19 }, 7.5);
  expect(detector.sgfContent).toBe(
    `(;\nEV[GO Variants]\nPB[Player Black]\nPW[Player White]\nSZ[9:19]\nKM[7.5]\nVS[baduk]\n\n`,
  );
});

test("Can write moves", () => {
  const detector = new SgfRecorder("baduk", { width: 9, height: 9 }, 7.5);
  detector.recordMove(new Coordinate(2, 3), Color.BLACK);
  detector.recordMove(new Coordinate(4, 2), Color.WHITE);
  expect(detector.sgfContent).toContain(`;W[cd];B[ec]`);
});
