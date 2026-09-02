import { describe, expect, test } from "vitest";
import { BorderWar } from "../border_war";

// 19×19 默认棋盘。边境线 BORDER_ROW=9（0基第10行）：
//   黑领土 row 0..8（sgf 行字符 a..j 中的 a..i 恰好也对应 x 字母，需用坐标 x0y 形式）
//   边境    row 9  （字符 j）
//   白领土  row 10..18（字符 k..s）
const newGame = () => new BorderWar({ ...BorderWar.defaultConfig() });

describe("战争号角-边境线", () => {
  test("布局阶段前4手自动成为据点", () => {
    const g = newGame();
    g.playMove(0, "aa"); // 黑 row0
    g.playMove(1, "ak"); // 白 row10
    g.playMove(0, "ab"); // 黑 row1
    g.playMove(1, "al"); // 白 row11
    const st = g.exportState({ phase: "play" });
    expect(st.deploy_done).toBe(true);
    expect(st.strongholds[0].sort()).toEqual(["aa", "ab"]);
    expect(st.strongholds[1].sort()).toEqual(["ak", "al"]);
  });

  test("布局阶段不能在对方领土落子", () => {
    const g = newGame();
    // 黑第1手落到白领土（row10）应抛错
    expect(() => g.playMove(0, "ak")).toThrow(/own territory/);
  });

  test("布局阶段不能在边境线落子", () => {
    const g = newGame();
    // 黑第1手落到边境（row9）
    expect(() => g.playMove(0, "aj")).toThrow(/own territory/);
  });

  test("防御区提吃普通子：回补兵力 +1", () => {
    const g = newGame();
    // 布局：黑 aa、ab，白 ak、al（都是据点）
    g.playMove(0, "aa");
    g.playMove(1, "ak");
    g.playMove(0, "ab");
    g.playMove(1, "al");
    // 黑在自己领土 bf(1,5) 布点，白落 a5(0,5)；黑再填 ae(0,4)、ag(0,6) 提掉白 a5
    g.playMove(0, "bf");
    g.playMove(1, "af");
    g.playMove(0, "ae");
    g.playMove(1, "pass");
    g.playMove(0, "ag"); // a5 四气（ae/ag/bf 已是黑）→ 提走白 a5，黑防御区补兵 +1
    const st = g.exportState({ phase: "play" });
    // 黑占用 = aa+ab+bf+ae+ag = 5，补兵 +1 → 剩余兵力 = 90 - 5 + 1 = 86
    expect(st.pieces_left[0]).toBe(86);
    expect(st.score.casualty[1]).toBe(-1); // 白普通子战损
  });

  test("提吃据点：+10 奖励，不计战损、不计吃子分", () => {
    const g = newGame();
    // 布局：白据点 ak(x0,y10)、al(x0,y11)
    g.playMove(0, "aa");
    g.playMove(1, "ak");
    g.playMove(0, "ab");
    g.playMove(1, "al");
    // 白子组 {ak,al} 的气：bk(x1,y10)、aj(x0,y9)、bl(x1,y11)、am(x0,y12)
    g.playMove(0, "aj");
    g.playMove(1, "pass");
    g.playMove(0, "bk");
    g.playMove(1, "pass");
    g.playMove(0, "bl");
    g.playMove(1, "pass");
    g.playMove(0, "am"); // 填满最后一气 → 提掉 ak、al 两个白据点
    const st = g.exportState({ phase: "play" });
    expect(st.strongholds[1]).toHaveLength(0);
    expect(st.score.stronghold[0]).toBe(20); // 2 × +10
    expect(st.score.casualty[1]).toBe(0); // 不计战损
    expect(st.score.territory[0]).toBe(0); // 据点提走不计吃子分
    // 双虚终局
    g.playMove(1, "pass");
    g.playMove(0, "pass");
    expect(g.phase).toBe("gameover");
  });

  test("攻击区吃普通子：吃子分 +4，战损 -1", () => {
    const g = newGame();
    g.playMove(0, "aa");
    g.playMove(1, "ak");
    g.playMove(0, "ab");
    g.playMove(1, "al");
    // 布局结束，白在边境 bj(x1,y9) 放普通子；黑填其四气 aj(0,9)、cj(2,9)、bk(1,10)、bi(1,8)
    g.playMove(0, "aj");
    g.playMove(1, "bj"); // 白子下在边境
    g.playMove(0, "cj");
    g.playMove(1, "pass");
    g.playMove(0, "bk");
    g.playMove(1, "pass");
    g.playMove(0, "bi"); // 提掉白 bj
    const st = g.exportState({ phase: "play" });
    expect(st.score.territory[0]).toBe(4); // +4 吃子分
    expect(st.score.casualty[1]).toBe(-1); // 战损
    // 双虚终局
    g.playMove(1, "pass");
    g.playMove(0, "pass");
    expect(g.phase).toBe("gameover");
  });

  test("兵力上限：落子消耗一兵，扣光后无法落子", () => {
    const g = newGame();
    expect(g.exportState({ phase: "play" }).pieces_left[0]).toBe(90);
    g.playMove(0, "aa");
    expect(g.exportState({ phase: "play" }).pieces_left[0]).toBe(89);
  });
});
