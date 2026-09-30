import { describe, expect, test } from "vitest";
import {
  columnLabel,
  rowLabel,
  rowLabelLines,
  rowLabelEmWidth,
} from "../coordinates";

describe("A1 style", () => {
  test("letters run left to right and skip I", () => {
    const labels = new Array(19)
      .fill(null)
      .map((_, x) => columnLabel(x, "a1"));
    expect(labels.join("")).toBe("ABCDEFGHJKLMNOPQRST");
  });

  test("letters continue past the alphabet", () => {
    expect(columnLabel(24, "a1")).toBe("Z");
    expect(columnLabel(25, "a1")).toBe("AA");
    expect(columnLabel(49, "a1")).toBe("AZ");
    expect(columnLabel(50, "a1")).toBe("BA");
  });

  test("numbers run bottom to top, so A1 is the lower left", () => {
    expect(rowLabel(0, 19, "a1")).toBe("19");
    expect(rowLabel(18, 19, "a1")).toBe("1");
  });
});

describe("1-1 style", () => {
  test("columns are numbered left to right", () => {
    expect(columnLabel(0, "1-1")).toBe("1");
    expect(columnLabel(18, "1-1")).toBe("19");
  });

  test("rows are hanzi numerals running top to bottom", () => {
    expect(rowLabel(0, 19, "1-1")).toBe("一");
    expect(rowLabel(8, 19, "1-1")).toBe("九");
    expect(rowLabel(9, 19, "1-1")).toBe("十");
    expect(rowLabel(10, 19, "1-1")).toBe("十一");
    expect(rowLabel(18, 19, "1-1")).toBe("十九");
  });

  test("hanzi numerals hold up past nineteen", () => {
    expect(rowLabel(19, 25, "1-1")).toBe("二十");
    expect(rowLabel(20, 25, "1-1")).toBe("二十一");
    expect(rowLabel(99, 100, "1-1")).toBe("百");
    expect(rowLabel(110, 111, "1-1")).toBe("百十一");
  });
});

describe("row label layout", () => {
  test("hanzi stack top to bottom, one glyph per line", () => {
    expect(rowLabelLines(18, 19, "1-1")).toEqual(["十", "九"]);
    expect(rowLabelLines(0, 19, "1-1")).toEqual(["一"]);
  });

  test("A1 numbers stay on one line", () => {
    expect(rowLabelLines(0, 19, "a1")).toEqual(["19"]);
  });

  test("a stacked label is one glyph wide however tall it gets", () => {
    expect(rowLabelLines(20, 30, "1-1")).toEqual(["二", "十", "一"]);
    expect(rowLabelEmWidth(30, "1-1")).toBe(1);
    expect(rowLabelEmWidth(19, "1-1")).toBe(1);
  });

  test("A1 grows sideways instead, at less than full width per digit", () => {
    expect(rowLabelEmWidth(9, "a1")).toBeCloseTo(0.6);
    expect(rowLabelEmWidth(19, "a1")).toBeCloseTo(1.2);
  });
});
