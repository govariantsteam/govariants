import { Vector2D } from "./Vector2D"
import { Intersection } from "./intersection"

        //-----------------------------------------------------
        //-----------------------------------------------------
        //---------------------6=========17--------------------
        //-----------------/----\-------/----\-----------------
        //-------------/---------\-----/---------\-------------
        //---------7--------------\---/--------------16--------
        //--------/-\--------------\-/--------------/-\--------
        //-------/---\--------------0--------------/---\-------
        //------/-----\---------/-------\---------/-----\------
        //-----/-------\----/---------------\----/-------\-----
        //----8=========1-----------------------5=========15---
        //----|---------|-----------------------|---------|----
        //----|---------|-----------------------|---------|----
        //----|---------|-----------------------|---------|----
        //----9=========2-----------------------4=========14---
        //-----\-------/----\---------------/----\-------/-----
        //------\-----/---------\-------/---------\-----/------
        //-------\---/--------------3--------------\---/-------
        //--------\-/--------------/-\--------------\-/--------
        //---------10-------------/---\--------------13--------
        //-------------\---------/-----\---------/-------------
        //-----------------\----/-------\----/-----------------
        //---------------------11========12--------------------
        //-----------------------------------------------------
        //-----------------------------------------------------

//shift of the reference point of neighbouring Tiles
const TileShiftRight = new Vector2D(2.7320508, 0);
const TileShiftBottomRight = new Vector2D(1.3660254, 2.3660254);
const TileShiftBottomLeft = new Vector2D(-1.3660254, 2.3660254);

//shift from reference point to inner intersections
const Shift2 = new Vector2D(-0.86602540, 0.5);
const Shift3 = new Vector2D(-0.86602540, 1.5);
const Shift4 = new Vector2D(0, 2);
const Shift5 = new Vector2D(0.86602540, 1.5);
const Shift6 = new Vector2D(0.86602540, 0.5);

//shift from reference point to outer intersections
const Shift7 = new Vector2D(-0.5, -0.86602540);
const Shift8 = new Vector2D(-1.36602540, -0.36602540);
const Shift9 = new Vector2D(-1.86602540, 0.5);
const Shift10 = new Vector2D(-1.86602540, 1.5);
const Shift11 = new Vector2D(-1.36602540, 2.36602540);
const Shift12 = new Vector2D(-0.5, 2.86602540);
const Shift13 = new Vector2D(0.5, 2.86602540);
const Shift14 = new Vector2D(1.36602540, 2.36602540);
const Shift15 = new Vector2D(1.86602540, 1.5);
const Shift16 = new Vector2D(1.86602540, 0.5);
const Shift17 = new Vector2D(1.36602540, -0.36602540);
const Shift18 = new Vector2D(0.5, -0.86602540);

class PolygonalTile {
    ReferencePoint: Vector2D;
    Completed: Boolean = false;
    Intersections: Intersection[];
    NeighbourTiles: (PolygonalTile | null)[] = [null, null, null, null, null, null];

    constructor(v: Vector2D) {
        this.ReferencePoint = v;
        this.Intersections =
            [new Intersection(v), new Intersection(v.Add(Shift2)), new Intersection(v.Add(Shift3)),
                new Intersection(v.Add(Shift4)), new Intersection(v.Add(Shift5)), new Intersection(v.Add(Shift6))];

        this.Intersections[0].ConnectTo(this.Intersections[1], true);
        this.Intersections[1].ConnectTo(this.Intersections[2], true);
        this.Intersections[2].ConnectTo(this.Intersections[3], true);
        this.Intersections[3].ConnectTo(this.Intersections[4], true);
        this.Intersections[4].ConnectTo(this.Intersections[5], true);
        this.Intersections[5].ConnectTo(this.Intersections[0], true);
    }

    ConnectToRight(tile: PolygonalTile, bothSides: Boolean) {
        this.NeighbourTiles[0] = tile;

        this.Intersections[5].ConnectTo(tile.Intersections[1], false);
        this.Intersections[4].ConnectTo(tile.Intersections[2], false);

        if (bothSides) {
            tile.ConnectToLeft(this, false);
        }
    }

    ConnectToTopRight(tile: PolygonalTile, bothSides: Boolean) {
        this.NeighbourTiles[1] = tile;

        this.Intersections[0].ConnectTo(tile.Intersections[2], false);
        this.Intersections[5].ConnectTo(tile.Intersections[3], false);

        if (bothSides) {
            tile.ConnectToBottomLeft(this, false);
        }
    }

    ConnectToTopLeft(tile: PolygonalTile, bothSides: Boolean) {
        this.NeighbourTiles[2] = tile;

        this.Intersections[0].ConnectTo(tile.Intersections[4], false);
        this.Intersections[1].ConnectTo(tile.Intersections[3], false);

        if (bothSides) {
            tile.ConnectToBottomRight(this, false);
        }
    }

    ConnectToLeft(tile: PolygonalTile, bothSides: Boolean) {
        this.NeighbourTiles[3] = tile;

        this.Intersections[1].ConnectTo(tile.Intersections[5], false);
        this.Intersections[2].ConnectTo(tile.Intersections[4], false);

        if (bothSides) {
            tile.ConnectToRight(this, false);
        }
    }

    ConnectToBottomLeft(tile: PolygonalTile, bothSides: Boolean) {
        this.NeighbourTiles[4] = tile;

        this.Intersections[2].ConnectTo(tile.Intersections[0], false);
        this.Intersections[3].ConnectTo(tile.Intersections[5], false);

        if (bothSides) {
            tile.ConnectToTopRight(this, false);
        }
    }

    ConnectToBottomRight(tile: PolygonalTile, bothSides: Boolean) {
        this.NeighbourTiles[5] = tile;

        this.Intersections[3].ConnectTo(tile.Intersections[1], false);
        this.Intersections[4].ConnectTo(tile.Intersections[0], false);

        if (bothSides) {
            tile.ConnectToTopLeft(this, false);
        }
    }

    Complete() {
        if (this.NeighbourTiles[2] == null) {
            if (this.NeighbourTiles[1]?.Completed != true) {
                this.Intersections[6] = new Intersection(this.ReferencePoint.Add(Shift7));
                this.Intersections[0].ConnectTo(this.Intersections[6], true);
            }
            else {
                this.Intersections[6] = this.NeighbourTiles[1].Intersections[9];
            }

            if (this.NeighbourTiles[3]?.Completed != true) {
                this.Intersections[7] = new Intersection(this.ReferencePoint.Add(Shift8));
                this.Intersections[1].ConnectTo(this.Intersections[7], true);
            }
            else {
                this.Intersections[7] = this.NeighbourTiles[3].Intersections[16];
            }
        }
        else {
            this.Intersections[6] = this.NeighbourTiles[2].Intersections[4];
            this.Intersections[7] = this.NeighbourTiles[2].Intersections[3];
        }
        if (!this.Intersections[6].IsConnectedTo(this.Intersections[7])) {
            this.Intersections[6].ConnectTo(this.Intersections[7], true);
        }

        if (this.NeighbourTiles[3] == null) {
            if (this.NeighbourTiles[2]?.Completed != true) {
                this.Intersections[8] = new Intersection(this.ReferencePoint.Add(Shift9));
                this.Intersections[1].ConnectTo(this.Intersections[8], true);
            }
            else {
                this.Intersections[8] = this.NeighbourTiles[2].Intersections[11];
            }

            if (this.NeighbourTiles[4]?.Completed != true) {
                this.Intersections[9] = new Intersection(this.ReferencePoint.Add(Shift10));
                this.Intersections[2].ConnectTo(this.Intersections[9], true);
            }
            else {
                this.Intersections[9] = this.NeighbourTiles[4].Intersections[6];
            }
        }
        else {
            this.Intersections[8] = this.NeighbourTiles[3].Intersections[5];
            this.Intersections[9] = this.NeighbourTiles[3].Intersections[4];
        }
        if (!this.Intersections[7].IsConnectedTo(this.Intersections[8])) {
            this.Intersections[7].ConnectTo(this.Intersections[8], true);
        }
        if (!this.Intersections[8].IsConnectedTo(this.Intersections[9])) {
            this.Intersections[8].ConnectTo(this.Intersections[9], true);
        }

        if (this.NeighbourTiles[4] == null) {
            if (this.NeighbourTiles[3]?.Completed != true) {
                this.Intersections[10] = new Intersection(this.ReferencePoint.Add(Shift11));
                this.Intersections[2].ConnectTo(this.Intersections[10], true);
            }
            else {
                this.Intersections[10] = this.NeighbourTiles[3].Intersections[13];
            }

            if (this.NeighbourTiles[5]?.Completed != true) {
                this.Intersections[11] = new Intersection(this.ReferencePoint.Add(Shift12));
                this.Intersections[3].ConnectTo(this.Intersections[11], true);
            }
            else {
                this.Intersections[11] = this.NeighbourTiles[5].Intersections[8];
            }
        }
        else {
            this.Intersections[10] = this.NeighbourTiles[4].Intersections[0];
            this.Intersections[11] = this.NeighbourTiles[4].Intersections[5];
        }
        if (!this.Intersections[9].IsConnectedTo(this.Intersections[10])) {
            this.Intersections[9].ConnectTo(this.Intersections[10], true);
        }
        if (!this.Intersections[10].IsConnectedTo(this.Intersections[11])) {
            this.Intersections[10].ConnectTo(this.Intersections[11], true);
        }

        if (this.NeighbourTiles[5] == null) {
            if (this.NeighbourTiles[4]?.Completed != true) {
                this.Intersections[12] = new Intersection(this.ReferencePoint.Add(Shift13));
                this.Intersections[3].ConnectTo(this.Intersections[12], true);
            }
            else {
                this.Intersections[12] = this.NeighbourTiles[4].Intersections[15];
            }

            if (this.NeighbourTiles[0]?.Completed != true) {
                this.Intersections[13] = new Intersection(this.ReferencePoint.Add(Shift14));
                this.Intersections[4].ConnectTo(this.Intersections[13], true);
            }
            else {
                this.Intersections[13] = this.NeighbourTiles[0].Intersections[10];
            }
        }
        else {
            this.Intersections[12] = this.NeighbourTiles[5].Intersections[1];
            this.Intersections[13] = this.NeighbourTiles[5].Intersections[0];
        }
        if (!this.Intersections[11].IsConnectedTo(this.Intersections[12])) {
            this.Intersections[11].ConnectTo(this.Intersections[12], true);
        }
        if (!this.Intersections[12].IsConnectedTo(this.Intersections[13])) {
            this.Intersections[12].ConnectTo(this.Intersections[13], true);
        }

        if (this.NeighbourTiles[0] == null) {
            if (this.NeighbourTiles[5]?.Completed != true) {
                this.Intersections[14] = new Intersection(this.ReferencePoint.Add(Shift15));
                this.Intersections[4].ConnectTo(this.Intersections[14], true);
            }
            else {
                this.Intersections[14] = this.NeighbourTiles[5].Intersections[17];
            }

            if (this.NeighbourTiles[1]?.Completed != true) {
                this.Intersections[15] = new Intersection(this.ReferencePoint.Add(Shift16));
                this.Intersections[5].ConnectTo(this.Intersections[15], true);
            }
            else {
                this.Intersections[15] = this.NeighbourTiles[1].Intersections[12];
            }
        }
        else {
            this.Intersections[14] = this.NeighbourTiles[0].Intersections[2];
            this.Intersections[15] = this.NeighbourTiles[0].Intersections[1];
        }
        if (!this.Intersections[13].IsConnectedTo(this.Intersections[14])) {
            this.Intersections[13].ConnectTo(this.Intersections[14], true);
        }
        if (!this.Intersections[14].IsConnectedTo(this.Intersections[15])) {
            this.Intersections[14].ConnectTo(this.Intersections[15], true);
        }

        if (this.NeighbourTiles[1] == null) {
            if (this.NeighbourTiles[0]?.Completed != true) {
                this.Intersections[16] = new Intersection(this.ReferencePoint.Add(Shift17));
                this.Intersections[5].ConnectTo(this.Intersections[16], true);
            }
            else {
                this.Intersections[16] = this.NeighbourTiles[0].Intersections[7];
            }

            if (this.NeighbourTiles[2]?.Completed != true) {
                this.Intersections[17] = new Intersection(this.ReferencePoint.Add(Shift18));
                this.Intersections[0].ConnectTo(this.Intersections[17], true);
            }
            else {
                this.Intersections[17] = this.NeighbourTiles[2].Intersections[14];
            }
        }
        else {
            this.Intersections[16] = this.NeighbourTiles[1].Intersections[3];
            this.Intersections[17] = this.NeighbourTiles[1].Intersections[2];
        }
        if (!this.Intersections[15].IsConnectedTo(this.Intersections[16])) {
            this.Intersections[15].ConnectTo(this.Intersections[16], true);
        }
        if (!this.Intersections[16].IsConnectedTo(this.Intersections[17])) {
            this.Intersections[16].ConnectTo(this.Intersections[17], true);
        }
        if (!this.Intersections[17].IsConnectedTo(this.Intersections[6])) {
            this.Intersections[17].ConnectTo(this.Intersections[6], true);
        }

        this.Completed = true;
    }
}

export class PolygonalBoardHelperFunctions {
    Min(a: number, b: number): number {
        if (a < b) {
            return a;
        }
    return b;
    }

    CreatePolygonalBoard(size: number) : Intersection[] {
        let StartTile: PolygonalTile = new PolygonalTile(new Vector2D(0, 0));
        let Tiles: PolygonalTile[] = [StartTile];
        let tileQueue: PolygonalTile[] = [StartTile];

        for (let i = 1; i < (size + 1) / 2; i++) {
            let newTilesQueue: PolygonalTile[] = [];

            while (tileQueue.length > 0) {
                let tile = tileQueue.pop() as PolygonalTile;

                if (tile.NeighbourTiles[0] == null) {
                    let newTile = new PolygonalTile(tile.ReferencePoint.Add(TileShiftRight));
                    Tiles.push(newTile);
                    tile.ConnectToRight(newTile, true);
                    newTilesQueue.push(newTile);

                    if (tile.NeighbourTiles[1] != null) {
                        newTile.ConnectToTopLeft(tile.NeighbourTiles[1], true);
                    }

                    if (tile.NeighbourTiles[5] != null) {
                        newTile.ConnectToBottomLeft(tile.NeighbourTiles[5], true);
                    }
                }

                if (tile.NeighbourTiles[1] == null) {
                    let newTile = new PolygonalTile(tile.ReferencePoint.Substract(TileShiftBottomLeft));
                    Tiles.push(newTile);
                    tile.ConnectToTopRight(newTile, true);
                    newTilesQueue.push(newTile);

                    if (tile.NeighbourTiles[2] != null) {
                        newTile.ConnectToLeft(tile.NeighbourTiles[2], true);
                    }

                    if (tile.NeighbourTiles[0] != null) {
                        newTile.ConnectToBottomRight(tile.NeighbourTiles[0], true);
                    }
                }

                if (tile.NeighbourTiles[2] == null) {
                    let newTile = new PolygonalTile(tile.ReferencePoint.Substract(TileShiftBottomRight));
                    Tiles.push(newTile);
                    tile.ConnectToTopLeft(newTile, true);
                    newTilesQueue.push(newTile);

                    if (tile.NeighbourTiles[3] != null) {
                        newTile.ConnectToBottomLeft(tile.NeighbourTiles[3], true);
                    }

                    if (tile.NeighbourTiles[1] != null) {
                        newTile.ConnectToRight(tile.NeighbourTiles[1], true);
                    }
                }

                if (tile.NeighbourTiles[3] == null) {
                    let newTile = new PolygonalTile(tile.ReferencePoint.Substract(TileShiftRight));
                    Tiles.push(newTile);
                    tile.ConnectToLeft(newTile, true);
                    newTilesQueue.push(newTile);

                    if (tile.NeighbourTiles[4] != null) {
                        newTile.ConnectToBottomRight(tile.NeighbourTiles[4], true);
                    }

                    if (tile.NeighbourTiles[2] != null) {
                        newTile.ConnectToTopRight(tile.NeighbourTiles[2], true);
                    }
                }

                if (tile.NeighbourTiles[4] == null) {
                    let newTile = new PolygonalTile(tile.ReferencePoint.Add(TileShiftBottomLeft));
                    Tiles.push(newTile);
                    tile.ConnectToBottomLeft(newTile, true);
                    newTilesQueue.push(newTile);

                    if (tile.NeighbourTiles[5] != null) {
                        newTile.ConnectToRight(tile.NeighbourTiles[5], true);
                    }

                    if (tile.NeighbourTiles[3] != null) {
                        newTile.ConnectToTopLeft(tile.NeighbourTiles[3], true);
                    }
                }

                if (tile.NeighbourTiles[5] == null) {
                    let newTile = new PolygonalTile(tile.ReferencePoint.Add(TileShiftBottomRight));
                    Tiles.push(newTile);
                    tile.ConnectToBottomRight(newTile, true);
                    newTilesQueue.push(newTile);

                    if (tile.NeighbourTiles[0] != null) {
                        newTile.ConnectToTopRight(tile.NeighbourTiles[0], true);
                    }

                    if (tile.NeighbourTiles[4] != null) {
                        newTile.ConnectToLeft(tile.NeighbourTiles[4], true);
                    }
                }
            }
            tileQueue = newTilesQueue;
        }

        let completed: Boolean = false;
        if (size % 2 === 0) {
            Tiles.forEach(tile => tile.Complete());
            completed = true;
        }

        let intersections: Intersection[] = [];
        for (let i = 0; i < Tiles.length; i++) {
            const tile = Tiles[i];
            for (let j = 0; j < tile.Intersections.length; j++) {
                let intersection = tile.Intersections[j];
                if (intersections.indexOf(intersection) < 0) {
                    intersections.push(tile.Intersections[j]);
                }
            }
        }
        

        let minX: number = intersections[0].Position.X;
        let minY: number = intersections[0].Position.Y;
        for (let i = 0; i < intersections.length; i++) {
            minX = this.Min(minX, intersections[i].Position.X);
            minY = this.Min(minY, intersections[i].Position.Y);
        }
        let shift: Vector2D = new Vector2D(minX, minY);

        for (let z = 0; z < intersections.length; z++)
        {
            let i = intersections[z];
            i.Identifier = z;
            i.Position = i.Position.Substract(shift);
        }

        return intersections;
    }
}