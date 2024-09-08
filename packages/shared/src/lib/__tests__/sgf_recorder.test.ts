import { Color } from "../../variants/baduk";
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
  detector.recordMove("cd", Color.BLACK);
  detector.recordMove("ec", Color.WHITE);
  detector.recordMove("pass", Color.BLACK);
  expect(detector.sgfContent).toContain(`;B[cd];W[ec]`);
});

test("Can handle resignation", () => {
    const detector = new SgfRecorder("baduk", { width: 9, height: 9 }, 7.5);
    detector.recordMove("resign", Color.BLACK);
    expect(detector.sgfContent).toContain("RE[W+R]");
  });
  
