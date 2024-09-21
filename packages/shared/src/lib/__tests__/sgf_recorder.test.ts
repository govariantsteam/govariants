import { SgfRecorder } from "../sgf_recorder";

test("SgfRecorder square board", () => {
  const detector = new SgfRecorder({ width: 9, height: 9 }, 7.5);
  expect(detector.sgfContent).toBe(
    `(;\nEV[GO Variants]\nPB[Player Black]\nPW[Player White]\nSZ[9]\nKM[7.5]\n\n\n\n)`,
  );
});

test("SgfRecorder non-square board", () => {
  const detector = new SgfRecorder({ width: 9, height: 19 }, 7.5);
  expect(detector.sgfContent).toBe(
    `(;\nEV[GO Variants]\nPB[Player Black]\nPW[Player White]\nSZ[9:19]\nKM[7.5]\n\n\n\n)`,
  );
});

test("Can write moves", () => {
  const detector = new SgfRecorder({ width: 9, height: 9 }, 7.5);
  detector.recordMove("cd", 0);
  detector.recordMove("ec", 1);
  detector.recordMove("pass", 0);
  expect(detector.sgfContent).toContain(`;B[cd];W[ec]`);
});

test("Can handle resignation", () => {
    const detector = new SgfRecorder({ width: 9, height: 9 }, 7.5);
    detector.recordMove("resign", 0);
    expect(detector.sgfContent).toContain("RE[W+R]");
  });
  
