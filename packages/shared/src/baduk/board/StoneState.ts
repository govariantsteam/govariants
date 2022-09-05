export enum Color {
	EMPTY = 0,
	BLACK = 1,
	WHITE = 2,
}

export class StoneState
{
	Color: Color;

	constructor(_color: Color)
	{
		this.Color = _color;
	}

	Export(): StoneState
	{
		return new StoneState(this.Color);
    }
}