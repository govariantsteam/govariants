export const sfractionalRulesDescription = `
Introduction
------------
SFractional (Sequential Fractional) is a variant of the classical game of Baduk (Go) featuring **multicoloured** stones.

Understanding the rules of Baduk is a prerequisite for this description.

Fractional Stones
-----------------
In SFractional stones have two colours. The connectedness of stones, chains and their liberties are all determined for each colour individually, and independently of other colours.

Formally, if c is a colour:
- Two stones are **c-connected** if there is a path between them that traverses only stones with colour c.
- A maximal set of pairwise c-connected stones is a **c-chain**.
- The liberties of a c-chain are the adjacent empty intersections.

Order of Play
-------------
Two players alternatively place stones. One player always places a stone with black, one with white. These are the *primary colours*. The *secondary colour* of the placed stones comes from a configurable list and cycles through it with each pair of moves.

Capture
-------
After each stone placement, the following two steps happen in order.

1.) Chains that don't include the newly placed stone and lack liberties are removed.

2.) If there are still chains without liberties, all of them are removed.

Note that step 1.) may create liberties for chains that include the newly placed stone, allowing them to stay on the board (like in Baduk a stone that captures a Ko).

Self-capture is allowed.

Ko
--
A move is not allowed if it results in a previously seen board position, and both times occured at the same point in the cyclic move order.

Scoring
-------
When scoring a finished game, the secondary colours are ignored. Players receive points for the area controlled by their primary colour.
`;
