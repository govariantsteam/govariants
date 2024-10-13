export const fractionalRulesDescription = `

<h2>Introduction</h2>
<p>
  Fractional is a variant with a wide range of possible game configurations. It supports any number of players and combines the modifications of <strong>Parallel Moves</strong> and <strong>Fractional Stones</strong>.
</p>
<p>
  Understanding the rules of Baduk (Go) are a prerequisite for this description.
</p>

<h2>Objective</h2>
<p>
  Players receive points for the area controlled by their <strong>Primary Colour</strong> (see <i>Fractional Stones</i>).
</p>

<h2>Parallel Moves</h2>
<p>
  When all players have submitted a move, all stones are simultaneously placed on the board. If two or more players played the same move, a collision occurs (see <i>Collision Handling</i>).
</p>

<h2>Fractional Stones</h2>
<p>
  Stones have multiple colours, and the chains of each colour are determined individually. As a result chains may overlap with each other. Players place stones with two colours, one of them being the players <strong>Primary Colour</strong>.
</p>

<h2>Collision Handling</h2>
<p>
  When two or more players submit the same move, a single stone is placed at that position, with all colours of the colliding players.
</p>

<h2>Capture</h2>
<p>
  Chains without liberties are removed as usual. When multiple chains simultaneously lose their last liberty, first all Old Chains are removed simultaneously, then all New Chains without liberties are removed.
</p>

<ul>
  <li>
    <strong>New Chains</strong> are those including a stone placed this round.
  </li>
  <li>
    <strong>Old Chains</strong> are those that don’t include a stone placed this
    round.
  </li>
</ul>

<p>
  Note that removing Old Chains might free up liberties of New Chains, allowing them to avoid capture (like in baduk, a stone that captures a Ko).
</p>`;
