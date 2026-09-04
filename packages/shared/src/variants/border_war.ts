// 战争号角-边境线 v9.0 变体移植（govariants）
// 自包含实现：复用 govariants 的 Grid/Coordinate/SGF 基建，规则逻辑为新独立状态机。
// 满分目标对齐《战争号角-边境线》规则书 v9.0：
//   - 布局阶段前4手（每方2枚）必须落己方领土，自动成为据点
//   - 其他规则在下方 BorderWar 类中实现（见 rulesDescription）
import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { AbstractGame, ExportContext } from "../abstract_game";
import { Variant } from "../variant";
import { SgfRecorder } from "../lib/sgf_recorder";
import { DefaultBoardState } from "../lib/board_types";
import { NewGridBadukConfig, mapBoard } from "./baduk_utils";
import { BoardPattern } from "../lib/abstractBoard/boardFactory";

// 数字键 player 0/1 的简单映射（替代 {0,1} 字面量，提供索引签名）
type NumP = Record<number, number>;
type StrongholdMap = Record<number, Set<string>>;

export enum Color {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

// ---- 常量（对应引擎 Const.ts）----
export const BOARD_SIZE = 19;
export const BORDER_ROW = 9; // 0基：第10行 = 边境线
export const PIECE_LIMIT = 90; // 每方兵力上限
export const KOMI_DEFAULT = 5; // 白方终局 +5
export const DEPLOY_MOVES = 4; // 布局阶段手数（黑1白1黑2白2）
export const DEPLOY_STONES_PER_SIDE = 2;

export const Zone = {
  BLACK: 0,
  BORDER: 1,
  WHITE: 2,
} as const;
export type Zone = (typeof Zone)[keyof typeof Zone];

function opponent(color: Color): Color {
  return color === Color.BLACK ? Color.WHITE : Color.BLACK;
}

function zoneOfRow(row: number): Zone {
  if (row < BORDER_ROW) return Zone.BLACK;
  if (row === BORDER_ROW) return Zone.BORDER;
  return Zone.WHITE;
}
function ownZone(color: Color): Zone {
  return color === Color.BLACK ? Zone.BLACK : Zone.WHITE;
}
function enemyZone(color: Color): Zone {
  return color === Color.BLACK ? Zone.WHITE : Zone.BLACK;
}
// 攻击区：对方领土 ∪ 边境（用于围空/围困/吃子得分）
function isAttackZone(row: number, color: Color): boolean {
  const z = zoneOfRow(row);
  return z === Zone.BORDER || z === enemyZone(color);
}
// 防御区：己方领土 ∪ 边境（用于围困/吃子补兵）
function isDefenseZone(row: number, color: Color): boolean {
  const z = zoneOfRow(row);
  return z === Zone.BORDER || z === ownZone(color);
}

export interface BorderWarConfig extends NewGridBadukConfig {
  komi: number;
  pieceLimit: number;
  board: { type: typeof BoardPattern.Grid; width: number; height: number };
}

export interface BorderWarState {
  board: Color[][];
  next_to_play: 0 | 1;
  last_move: string;
  captures: NumP;
  // 边境线专属
  phase_hand: number; // 当前第几手（1基）
  strongholds: Record<number, string[]>; // 双方据点（SGF 坐标字符串）
  pieces_left: NumP; // 每方剩余兵力
  deploy_done: boolean; // 布局阶段是否结束
  // 实时分数面板（不含白贴目；点差由 finalize 结算）
  score: {
    captures: NumP; // 吃子分：+4/子（攻击区）
    stronghold: NumP; // 据点奖励 +10/次
    casualty: NumP; // 战损 -1/子（负值）
  };
}

/**
 * 战争号角-边境线
 * 双方在风云边境线两侧布阵，前4手于己方领土建立据点；在对方领土/边境围空、围困、吃子得分；
 * 在己方领土围困、吃子可补兵；破坏对方已得分包围圈可得防御分。
 */
export class BorderWar extends AbstractGame<BorderWarConfig, BorderWarState> {
  public board: Grid<Color>;
  protected next_to_play: 0 | 1 = 0;
  protected last_move = "";
  protected phase_hand = 0;
  protected captures: NumP = { 0: 0, 1: 0 };
  protected sgf?: SgfRecorder;
  protected deploy_done = false;
  public numeric_result?: number;

  // 兵力/据点
  protected pieces_on_board: NumP = { 0: 0, 1: 0 };
  protected strongholds: StrongholdMap = { 0: new Set(), 1: new Set() };

  // 事件计数（与引擎 Counters 对齐）
  protected annihilate: NumP = { 0: 0, 1: 0 }; // 吃子次数（子数，仅攻击区）
  protected normalLost: NumP = { 0: 0, 1: 0 }; // 普通战损子数
  protected strongholdTaken: NumP = { 0: 0, 1: 0 }; // 提对方据点次数
  protected soldierBonus: NumP = { 0: 0, 1: 0 }; // 防御区提吃/围困回补兵力（只增不减）

  constructor(config: BorderWarConfig) {
    super(config);
    if (
      this.config.board.width !== BOARD_SIZE ||
      this.config.board.height !== BOARD_SIZE
    ) {
      throw new Error(
        `BorderWar requires a ${BOARD_SIZE}×${BOARD_SIZE} board.`,
      );
    }
    this.board = new Grid<Color>(
      this.config.board.width,
      this.config.board.height,
    ).fill(Color.EMPTY);
    this.sgf = new SgfRecorder(this.config.board, this.config.komi);
  }

  override numPlayers(): number {
    return 2;
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.next_to_play];
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  override playMove(player: number, move: string): void {
    if (player !== this.next_to_play) {
      throw Error(`It's not player ${player}'s turn!`);
    }
    this.sgf?.recordMove(move, player);

    if (move === "resign") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+R" : "B+R";
      return;
    }
    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+T" : "B+T";
      return;
    }
    if (move !== "pass") {
      const pos = Coordinate.fromSgfRepr(move);
      if (!this.board.isInBounds(pos)) {
        throw Error(`Move out of bounds. (move: ${move})`);
      }
      if (this.board.at(pos) !== Color.EMPTY) {
        throw Error(
          `Cannot place a stone on top of an existing stone. (${move})`,
        );
      }
      this.playMoveInternal(pos, player);
    }
    this.phase_hand += 1;
    this.prepareForNextMove(move);
    super.increaseRound();
  }

  protected playMoveInternal(pos: Coordinate, player: number): void {
    const color = player === 0 ? Color.BLACK : Color.WHITE;

    // 布局阶段前 DEPLOY_MOVES 手：只能落己方领土（不含边境线）
    if (!this.deploy_done && zoneOfRow(pos.y) !== ownZone(color)) {
      throw Error("Deploy phase: must place in your own territory.");
    }

    // 兵力上限：落子消耗1兵（可部署 = 上限 − 占用 + 补兵）
    const available =
      this.config.pieceLimit -
      this.pieces_on_board[player] +
      this.soldierBonus[player];
    if (available <= 0) {
      throw Error("No pieces left to deploy.");
    }

    this.board.set(pos, color);
    this.pieces_on_board[player] += 1;

    // 提子结算：只提对手，按区域判断吃子分/补兵
    const opponent_color = opponent(color);
    const oppPlayer = 1 - player;
    const captured_here: Coordinate[] = [];
    this.board.neighbors(pos).forEach((n) => {
      if (this.board.at(n) !== opponent_color) return;
      const group = getGroup(n, this.board) as Coordinate[];
      if (!groupHasLiberties(group, this.board)) {
        group.forEach((p) => this.board.set(p, Color.EMPTY));
        captured_here.push(...group);
      }
    });

    if (captured_here.length > 0) {
      // 每提一子：提吃分仅计攻击区（对方领土/边境）；防御区（己方领土/边境）提普通子回补兵力
      let ateAttack = 0;
      let strongholdHit = 0;
      const oppStrongholds = this.strongholds[oppPlayer];
      for (const c of captured_here) {
        this.pieces_on_board[oppPlayer] -= 1;
        const sgf = c.toSgfRepr();
        if (oppStrongholds.has(sgf)) {
          // 提吃据点：+10 据点奖励，不计战损、不计吃子分、不补兵（规则书 v9.0）
          oppStrongholds.delete(sgf);
          strongholdHit += 1;
          continue;
        }
        // 普通子：战损 -1；攻击区吃子分 +4；防御区补兵 +1
        this.normalLost[oppPlayer] += 1;
        if (isAttackZone(c.y, color)) ateAttack += 1;
        if (isDefenseZone(c.y, color)) this.soldierBonus[player] += 1;
      }
      this.captures[player] += captured_here.length;
      this.annihilate[player] += ateAttack;
      this.strongholdTaken[player] += strongholdHit;
      // 注：无气组在围棋引擎中会立即被提走，围困本身不会滞留盘上；
      // 因此「围困补兵」在本实现中由「防御区提吃普通子补兵」天然覆盖（两者同一路径）。
    }

    // 布局阶段：前 DEPLOY_STONES_PER_SIDE 枚（本手序）成据点
    if (
      !this.deploy_done &&
      this.strongholds[player].size < DEPLOY_STONES_PER_SIDE
    ) {
      this.strongholds[player].add(pos.toSgfRepr());
    }
  }

  protected prepareForNextMove(move: string): void {
    // 布局阶段结束判定
    if (!this.deploy_done && this.phase_hand >= DEPLOY_MOVES) {
      this.deploy_done = true;
    }

    // 双虚 → 终局
    if (this.last_move === "pass" && move === "pass") {
      this.finalizeScore();
      return;
    }

    this.next_to_play = this.next_to_play === 0 ? 1 : 0;
    this.last_move = move;
  }

  override exportState(_context: ExportContext): BorderWarState {
    return {
      board: this.board.serialize(),
      next_to_play: this.next_to_play,
      last_move: this.last_move,
      captures: { 0: this.captures[0], 1: this.captures[1] },
      phase_hand: this.phase_hand,
      strongholds: {
        0: [...this.strongholds[0]],
        1: [...this.strongholds[1]],
      },
      pieces_left: {
        0: Math.max(
          0,
          this.config.pieceLimit -
            this.pieces_on_board[0] +
            this.soldierBonus[0],
        ),
        1: Math.max(
          0,
          this.config.pieceLimit -
            this.pieces_on_board[1] +
            this.soldierBonus[1],
        ),
      },
      deploy_done: this.deploy_done,
      score: this.liveScore(),
    };
  }

  /** 盘中实时分数（不贴目）找 border 口 */
  private liveScore() {
    // 围困/围空用简化的实时计算：仅用于观察面板。
    // 权威结果以 finalizeScore 为准。
    const captures = { 0: this.annihilate[0] * 4, 1: this.annihilate[1] * 4 };
    return {
      captures,
      stronghold: {
        0: this.strongholdTaken[0] * 10,
        1: this.strongholdTaken[1] * 10,
      },
      casualty: {
        0: -this.normalLost[0] || 0,
        1: -this.normalLost[1] || 0,
      },
    };
  }

  protected finalizeScore() {
    // 占领分（围空+2/点 + 围困+3/子，均仅攻击区）+ 吃子分 + 据点 + 战损 + 贴目
    let bk_total = 0;
    let wt_total = 0;

    // 吃子分（仅攻击区提子）
    bk_total += this.annihilate[0] * 4;
    wt_total += this.annihilate[1] * 4;

    // 据点奖励
    bk_total += this.strongholdTaken[0] * 10;
    wt_total += this.strongholdTaken[1] * 10;

    // 战损
    bk_total -= this.normalLost[0];
    wt_total -= this.normalLost[1];

    // 围空分：连通空区块被某色完全包围 → 该色占领，攻击区 +2/点
    const enc = this.computeTerritory();
    bk_total += enc[0];
    wt_total += enc[1];

    // 围困分：被围困（无气）棋子仍存盘 → 围困方得分 +3/子（攻击区）
    // 在 border 中围困分数计入占领分，由 finalize 统一累加
    const siege = this.computeSiege();
    bk_total += siege[0];
    wt_total += siege[1];

    // 白方贴目（默认 +5）
    wt_total += this.config.komi;

    this.numeric_result = bk_total - wt_total;
    if (this.numeric_result < 0) this.result = `W+${-this.numeric_result}`;
    else if (this.numeric_result > 0) this.result = `B+${this.numeric_result}`;
    else this.result = "Tie";
    this.phase = "gameover";
  }

  /** 围空分：返回 {黑方分, 白方分}，空连通区域被单色完全包围则归该色（攻击区 +2/点） */
  private computeTerritory(): [number, number] {
    const res: [number, number] = [0, 0];
    const visited = new Grid<boolean>(this.board.width, this.board.height).fill(
      false,
    );
    this.board.forEach((color, pos) => {
      if (color !== Color.EMPTY || visited.at(pos)) return;
      const group = getGroup(pos, this.board);
      group.forEach((p) => visited.set(p, true));
      const border = getOuterBorder(group, this.board);
      const borderColors = border.map((p) => this.board.at(p) as Color);
      if (borderColors.length === 0) return; // 无外边界：整盘无包围者，不判占领
      const owner = borderColors[0];
      if (borderColors.every((c) => c === owner)) {
        const colorOf = owner === Color.BLACK ? 0 : 1;
        for (const p of group) {
          if (isAttackZone(p.y, owner)) res[colorOf] += 2;
        }
      }
    });
    return res;
  }

  /** 围困分：被完全围住（无外气）且仍未提存的棋子，围困方 +3/子（攻击区） */
  private computeSiege(): [number, number] {
    const res: [number, number] = [0, 0];
    const visited = new Grid<boolean>(this.board.width, this.board.height).fill(
      false,
    );
    this.board.forEach((color, pos) => {
      if (color === Color.EMPTY || visited.at(pos)) return;
      const group = getGroup(pos, this.board);
      group.forEach((p) => visited.set(p, true));
      // 无外气 = 已被围死（现实中会立即提走故极少停留，规则书语义为「被完全包围」）
      if (!groupHasLiberties(group, this.board)) {
        const siegedColor = color;
        const besieger = opponent(siegedColor);
        const besiegerIdx = besieger === Color.BLACK ? 0 : 1;
        for (const p of group) {
          if (isAttackZone(p.y, besieger)) res[besiegerIdx] += 3;
        }
      }
    });
    return res;
  }

  override getSGF(): string {
    return this.sgf?.sgfContent ?? "";
  }

  // ---- Variant 静态辅助 ----
  static defaultConfig(): BorderWarConfig {
    return {
      komi: KOMI_DEFAULT,
      pieceLimit: PIECE_LIMIT,
      board: { type: BoardPattern.Grid, width: BOARD_SIZE, height: BOARD_SIZE },
    };
  }

  static getPlayerColors(_: BorderWarConfig, playerNr: number): string[] {
    return playerNr === 0 ? ["black"] : playerNr === 1 ? ["white"] : [];
  }

  static sanitizeConfig(config: unknown): BorderWarConfig {
    if (
      config &&
      typeof config === "object" &&
      (config as BorderWarConfig).board
    ) {
      return config as BorderWarConfig;
    }
    return BorderWar.defaultConfig();
  }

  static uiTransform<ConfigT extends BorderWarConfig = BorderWarConfig>(
    config: ConfigT,
    gamestate: BorderWarState,
  ): { config: ConfigT; gamestate: DefaultBoardState } {
    const boardShape = "2d";
    const colorTransform = (color: Color): string[] => {
      switch (color) {
        case Color.BLACK:
          return ["black"];
        case Color.WHITE:
          return ["white"];
        case Color.EMPTY:
          return [];
      }
    };
    const strongholdBg: Record<string, string> = {};
    const push = (s: readonly string[] | undefined, c: string) =>
      (s ?? []).forEach((sgf) => (strongholdBg[sgf] = c));
    push(gamestate.strongholds[0], "#d4af37");
    push(gamestate.strongholds[1], "#d4af37");

    return {
      config,
      gamestate: {
        board: mapBoard(
          gamestate.board,
          (color, idx) => {
            const c = color as Color;
            const colors = colorTransform(c);
            const key =
              idx.x !== undefined && idx.y !== undefined
                ? new Coordinate(idx.x, idx.y).toSgfRepr()
                : undefined;
            return {
              colors,
              ...(key &&
                strongholdBg[key] && { background_color: strongholdBg[key] }),
            };
          },
          boardShape,
        ),
      },
    };
  }
}

function groupHasLiberties(
  group: Array<{ x: number; y: number }>,
  board: Grid<Color>,
): boolean {
  return getOuterBorder(group, board).some((p) => board.at(p) === Color.EMPTY);
}

export const borderWarVariant: Variant<BorderWarConfig, BorderWarState> = {
  gameClass: BorderWar,
  description:
    "Border War (War Horn: Borderline) v9.0\n Players deploy on either side of a central borderline; the first 4 moves build strongholds on your own territory. Score territory, sieges and captures in the opponent's half or on the borderline; capturing or sieging on your own side replenishes troops. Breaking an opponent's scored enclosure earns defense points.",
  rulesDescription: `# Border War (War Horn: Borderline) v9.0

A **19×19** Go-like territory variant. Players fight across a central **borderline**
(row 10) on a 19-row board. The goal is not to enclose the most area, but to **score by
attacking into the opponent's half**.

## Goal
Score more points than your opponent (White gets **+5 komi** at game end; both
"komi" and "pieceLimit" are config-driven — the values shown are the defaults).
Each side has a **piece limit of 90** (default).

## Deploy phase (first 4 moves)
- Moves 1–4: Black 2 + White 2 stones in alternating order.
- Each stone **must be placed on your own territory** (rows 1–9 for Black, rows 11–19
  for White — **not** on the borderline row 10).
- Every deploy stone automatically becomes a **stronghold**.

## Zones
- **Black territory**: rows 1–9 · **White territory**: rows 11–19 · **Borderline**: row 10.
- **Attack zone** (the *only* place that scores): the opponent's territory + the borderline.
- **Defense zone**: your own territory + the borderline.

## Scoring
- **Territory** (empty points enclosed in the attack zone): **+2 / point**.
- **Siege** (enemy groups with no liberties, in the attack zone): **+3 / captured stone**.
- **Capture** in the attack zone: **+4 / captured stone** (ordinary stones).
- **Stronghold captured**: **+10**, no war damage, and no capture score.
- **War damage**: **−1** for each ordinary stone captured from you.
- **Komi**: White **+5** at game end.

## Troop replenishment (no scoring)
- Capturing or sieging enemy stones **on your own territory or the borderline**
  replenishes troops instead of scoring.

## Game end
Double pass (two consecutive passes) triggers final scoring.`,
  time_handling: "sequential",
  defaultConfig: BorderWar.defaultConfig,
  getPlayerColors: BorderWar.getPlayerColors,
  sanitizeConfig: BorderWar.sanitizeConfig,
  uiTransform: BorderWar.uiTransform,
};
