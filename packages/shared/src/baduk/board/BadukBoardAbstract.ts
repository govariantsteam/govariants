import type { IBadukBoard } from "../../Interfaces/IBadukBoard";
import type { BadukWithAbstractBoardConfig } from "../badukWithAbstractBoard";
import { BoardPattern } from "../badukWithAbstractBoard";
import { Intersection } from "./intersection";
import { PolygonalBoardHelperFunctions } from "./PolygonalBoardHelper";
import { Vector2D } from "./Vector2D";

export class BadukBoardAbstract implements IBadukBoard 
{
	Intersections: Intersection[];
	Array2D: Intersection[][] | null;

	constructor(conf: BadukWithAbstractBoardConfig)
	{
		switch (conf.pattern)
		{
			case BoardPattern.Rectangular:
				this.Intersections = [];
				this.Array2D = new Array<Array<Intersection>>(conf.height);

				for (let i = 0; i < conf.height; i++) {
					for (let j = 0; j < conf.width; j++) {
						let intersection = new Intersection(new Vector2D(i, j));
						intersection.Identifier = i * conf.width + j;

						this.Intersections.push(intersection);
						this.Array2D[i].push(intersection);

						if (i > 0) {
							intersection.ConnectTo(this.Array2D[i - 1][j], true);
						}
						if (j > 0) {
							intersection.ConnectTo(this.Array2D[i][j - 1], true);
						}
					}
				}
				return;
			case BoardPattern.Polygonal:
				this.Array2D = null;
				var helper = new PolygonalBoardHelperFunctions();
				this.Intersections = helper.CreatePolygonalBoard(helper.Min(conf.height, conf.width));
				return;
			default:
				throw new Error("unknown board pattern");
		}
	}

	Export(): BadukBoardAbstract
	{
		return {
			Intersections: this.Intersections.map(i => i.Export()),
			Array2D: null,
		} as BadukBoardAbstract;
	}
}