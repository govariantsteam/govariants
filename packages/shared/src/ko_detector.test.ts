import { SuperKoDetector, KoError } from "./ko_detector";

test("superko detector throws if same state pushed twice", () => {
  const detector = new SuperKoDetector();
  detector.push({ a: 1 });
  detector.push({ a: 2 });
  expect(() => detector.push({ a: 1 })).toThrow(KoError);
});
