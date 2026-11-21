# Battleship: Big 12 Edition

A two-player Battleship game for one device. Each player picks a Big 12 team, and the game uses that team's colors and names. Built with plain HTML, CSS, and JavaScript: no install, no server.

## Play

Download or clone this repository and open `index.html` in any modern browser.

1. Player 1 picks a team, then Player 2 picks a different one.
2. Hand the device to Player 1 and click **I'm ready**.
3. Fire one shot at **Enemy waters**, then click **Pass to …** and hand the device over.
4. The cover screen hides both boards between turns, so no peeking.
5. The first team to sink all five enemy ships wins. Refresh the page to play again.

## Rules

- 10×10 grid, five ships per side: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2)
- Ships are placed randomly
- One shot per turn; a ship is named only when it is sunk

## Files

- `index.html`: page layout (team picker, cover screen, game screen)
- `style.css`: styles and team-color theming
- `script.js`: teams, ship placement, turns, and win check
- `plan.md`: goals and scope
- `ROADMAP.md`: milestones and progress

Team colors are approximate and used for fun. No official logos are included.
