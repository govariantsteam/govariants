export const superTicTacGoRules = `
Super Tic-Tac-Go is played on a 9x9 goban. It follows normal Go/Baduk scoring and capture rules*, but with an additional restriction on stone placement.
<br></br>
The goban is divided into nine 3x3 segmants, or 'nonants'. Each intersection within each 3x3 nonant corresponds to one of the nine larger nonants, e.g. the top-left intersection in each nonant corresponds to the top-left nonant.
Players can only place a stone in the nonant that corresponds to the intersection of the last move played. If there are no legal moves in the corresponding nonant, the next move can be placed in any legal position on the goban.
<br></br>

---

*Passing stones are required and self-capture is allowed. No ko rule. The game ends and is scored as a standard Baduk game.
`;
