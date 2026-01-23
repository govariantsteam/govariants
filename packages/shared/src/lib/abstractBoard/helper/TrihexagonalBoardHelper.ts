import { Grid } from "../../grid";
import { Intersection } from "../intersection";
import { Vector2D } from "./types/Vector2D";

export class TrihexagonalBoardHelper {
  private readonly x_base_vector: Vector2D;
  private readonly y_base_vector: Vector2D;

  constructor() {
    this.x_base_vector = new Vector2D(1, 0);
    this.y_base_vector = new Vector2D(
      Math.cos(Math.PI / 3),
      Math.sin(Math.PI / 3),
    );
  }

  CreateTrihexagonalBoard(size: number): Intersection[] {
    const _size = size;

    let x_shift_pattern = 0;
    let y_shift_pattern = 0;

    switch (_size % 3) {
      case 0: {
        x_shift_pattern = -(_size / 3) + 2;
        y_shift_pattern = -(_size / 3);
        break;
      }
      case 1: {
        x_shift_pattern = -(_size - 1) / 3;
        y_shift_pattern = -(_size - 1) / 3;
        break;
      }
      case 2: {
        x_shift_pattern = -((_size - 2) / 3) - 4;
        y_shift_pattern = -((_size - 2) / 3) - 1;
        break;
      }
    }

    return new Grid<null>(_size, _size)
      .fill(null)
      .map<Intersection | null>((_value, index, _grid) =>
        ((index.x + x_shift_pattern) * 4 - (index.y + y_shift_pattern)) % 7 ===
          0 || index.x + index.y >= _size
          ? null
          : new Intersection(
              this.x_base_vector
                .Multiply(index.x)
                .Add(this.y_base_vector.Multiply(index.y)),
            ),
      )
      .map<Intersection | null>((intersection, index, grid) => {
        if (!intersection) {
          return null;
        }

        grid.at({ x: index.x + 1, y: index.y })?.connectTo(intersection, true);
        grid.at({ x: index.x, y: index.y + 1 })?.connectTo(intersection, true);
        if (index.x > 0) {
          grid
            .at({ x: index.x - 1, y: index.y + 1 })
            ?.connectTo(intersection, true);
        }

        return intersection;
      })
      .to2DArray()
      .flat()
      .filter((value): value is Intersection => value !== null);
  }
}
