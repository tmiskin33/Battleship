# Battleship: Big 12 Edition — Roadmap

Every milestone ends with something you can open in a browser (`index.html`) and test.

## Milestone 1: One board, one fleet (smallest working version) ✅
- [x] 10×10 grid shows on the page
- [x] Five ships (sizes 5, 4, 3, 3, 2) placed randomly and hidden, with no overlaps and none off the edge
- [x] Clicking a square fires a shot and marks it as hit or miss
- [x] Clicking the same square twice does nothing
- [x] A message appears when a ship is sunk
- [x] "You win!" appears when all five ships are sunk
- [x] **Test:** open the page, fire at squares until every ship is sunk, and confirm every hit, miss, sunk, and win message is correct

## Milestone 2: Two players, pass the device ✅
- [x] Each player gets their own randomly placed fleet
- [x] Players take turns, with one shot per turn
- [x] Cover screen appears between turns, and boards stay hidden until "I'm ready" is clicked
- [x] Each player sees their own board (with incoming hits) next to their target board
- [x] Game announces which player won
- [x] **Test:** play a full game with a friend (or yourself) and confirm you never see the other player's ships

## Milestone 3: Big 12 team pick (v1 complete) ✅
- [x] Start screen where Player 1 and Player 2 each pick one of the 16 Big 12 teams
- [x] Boards, cover screen, and messages use each team's colors
- [x] Ship names and messages use the team name (e.g., "Kansas State sinks your Carrier!")
- [x] Rule for both players picking the same team (blocked: a team taken by Player 1 is grayed out)
- [x] **Test:** play a game with two different teams and check colors and names throughout, then try picking the same team

## Milestone 4: Manual ship placement (first add-on) ✅
- [x] Each player places their own ships before the game starts, with the cover screen in between
- [x] Rotate button switches between horizontal and vertical
- [x] Ships can't overlap or go off the board
- [x] Shuffle button places ships randomly instead
- [x] **Test:** place ships by hand, try an invalid spot, use shuffle, then play a full game
