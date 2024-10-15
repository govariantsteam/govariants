export const fractionalRulesDescription = `
Introduction
------------

Fractional is a variant of the classical game of Baduk (Go) featuring **Parallel Moves** and **Fractional Stones**. It supports a wide range of game configurations and can be played with any number of players.

Understanding the rules of Baduk is a prerequisite for this rules description.

Objective
---------

Players receive points for the area controlled by their **Primary Colour** (see _Fractional Stones_).

Parallel Moves
--------------

When all players have submitted a move, all stones are simultaneously placed on the board. If two or more players played the same move, a collision occurs (see _Collision Handling_).

Fractional Stones
-----------------

Stones have multiple colours, and the chains of each colour are determined individually. As a result chains may overlap with each other. Players place stones with two colours, one of them being the players **Primary Colour**.

Collision Handling
------------------

When two or more players submit the same move, a single stone is placed at that position, with all colours of the colliding players.

Capture
-------

Chains without liberties are removed as usual. When multiple chains simultaneously lose their last liberty, first all Old Chains are removed simultaneously, then all New Chains without liberties are removed.

* **New Chains** are those including a stone placed this round.
* **Old Chains** are those that don't include a stone placed this round.

Note that removing Old Chains might free up liberties of New Chains, allowing them to avoid capture (like in Baduk when a stone captures a Ko).
`;
