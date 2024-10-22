import { Baduk, badukVariant } from "./baduk";
import { Coordinate } from "../lib/coordinate";
import { getGroup } from "../lib/group_utils";
import { Variant } from "../variant";
import { NewBadukConfig } from "./baduk_utils";

export class TetrisGo extends Baduk {
  protected postValidateMove(move: Coordinate): void {
    super.postValidateMove(move);

    if (getGroup(move, this.board).length === 4) {
      throw new Error("Cannot make a group with four stones");
    }
  }
}

export const tetrisVariant: Variant<NewBadukConfig> = {
  ...badukVariant,
  gameClass: TetrisGo,
  description: "Baduk but players can't play Tetris shapes",
};
