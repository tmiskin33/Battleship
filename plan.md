# Battleship: Big 12 Edition — Plan

## Goal
A browser-based Battleship game where two friends play head-to-head on one device, each representing their favorite Big 12 team.

## Who it is for
Two people sitting together and sharing one computer, tablet, or phone, passing it back and forth between turns. They know classic Battleship and want a quick, fun game with some college team spirit.

## Must-have features
1. **Classic two-player gameplay.** A 10×10 grid with five ships (sizes 5, 4, 3, 3, 2) placed randomly. Players take turns firing one shot at a time, each shot shows hit, miss, or sunk, and the first player to sink the whole enemy fleet wins.
2. **Pass-the-device screen.** Between turns, a cover screen hides both boards until the next player taps "I'm ready," so no one sees the other player's ships.
3. **Big 12 team pick.** At the start, each player picks one of the 16 Big 12 teams. Their board uses that team's colors, and ship names and game messages use the team name (e.g., "Kansas State sinks your Carrier!").

## Nice-to-haves
- Manual ship placement with rotate and shuffle (first add-on after v1)
- Generated sound effects (cannon, splash, victory horn) built in the browser
- "Play again" button and a running score across games
- Optional "a hit gives you another shot" rule

## Out of scope
- Playing against the computer
- Online or networked play on separate devices
- Official team logos, mascot artwork, or real fight song recordings
- User accounts, logins, or saving games
- Special weapons or power-ups
- Any tools beyond plain HTML, CSS, and JavaScript (no frameworks, no server)
