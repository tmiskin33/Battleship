// Milestone 3: two players pick Big 12 teams, then play on one device
// with a cover screen between turns.

const SIZE = 10;
const SHIPS = [
  { name: "Carrier", length: 5 },
  { name: "Battleship", length: 4 },
  { name: "Cruiser", length: 3 },
  { name: "Submarine", length: 3 },
  { name: "Destroyer", length: 2 },
];

// The 16 Big 12 teams for 2026. Colors are approximate team colors; no logos.
const TEAMS = [
  { school: "Arizona", mascot: "Wildcat", nickname: "Wildcats", primary: "#0C234B", secondary: "#AB0520" },
  { school: "Arizona State", mascot: "Sun Devil", nickname: "Sun Devils", primary: "#8C1D40", secondary: "#FFC627" },
  { school: "Baylor", mascot: "Bear", nickname: "Bears", primary: "#154734", secondary: "#FFB81C" },
  { school: "BYU", mascot: "Cougar", nickname: "Cougars", primary: "#002E5D", secondary: "#FFFFFF" },
  { school: "Cincinnati", mascot: "Bearcat", nickname: "Bearcats", primary: "#E00122", secondary: "#000000" },
  { school: "Colorado", mascot: "Buffalo", nickname: "Buffaloes", primary: "#000000", secondary: "#CFB87C" },
  { school: "Houston", mascot: "Cougar", nickname: "Cougars", primary: "#C8102E", secondary: "#FFFFFF" },
  { school: "Iowa State", mascot: "Cyclone", nickname: "Cyclones", primary: "#C8102E", secondary: "#F1BE48" },
  { school: "Kansas", mascot: "Jayhawk", nickname: "Jayhawks", primary: "#0051BA", secondary: "#E8000D" },
  { school: "Kansas State", mascot: "Wildcat", nickname: "Wildcats", primary: "#512888", secondary: "#D1D1D1" },
  { school: "Oklahoma State", mascot: "Cowboy", nickname: "Cowboys", primary: "#FF7300", secondary: "#000000" },
  { school: "TCU", mascot: "Horned Frog", nickname: "Horned Frogs", primary: "#4D1979", secondary: "#A3A9AC" },
  { school: "Texas Tech", mascot: "Red Raider", nickname: "Red Raiders", primary: "#CC0000", secondary: "#000000" },
  { school: "UCF", mascot: "Knight", nickname: "Knights", primary: "#000000", secondary: "#BA9B37" },
  { school: "Utah", mascot: "Ute", nickname: "Utes", primary: "#CC0000", secondary: "#FFFFFF" },
  { school: "West Virginia", mascot: "Mountaineer", nickname: "Mountaineers", primary: "#002855", secondary: "#EAAA00" },
];

const setupEl = document.getElementById("setup");
const setupTitleEl = document.getElementById("setup-title");
const teamGridEl = document.getElementById("team-grid");
const coverEl = document.getElementById("cover");
const coverPlayerEl = document.getElementById("cover-player");
const coverTitleEl = document.getElementById("cover-title");
const readyBtn = document.getElementById("ready-btn");
const gameEl = document.getElementById("game");
const turnTitleEl = document.getElementById("turn-title");
const messageEl = document.getElementById("message");
const targetWrapEl = document.getElementById("target-wrap");
const targetLabelEl = document.getElementById("target-label");
const targetBoardEl = document.getElementById("target-board");
const ownBoardEl = document.getElementById("own-board");
const statusEl = document.getElementById("status");
const passBtn = document.getElementById("pass-btn");

// ---------- Colors ----------

// Relative brightness of a hex color (0 = black, 1 = white), per the WCAG formula.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Pick dark or white text, whichever is easier to read on this background.
function textOn(hex) {
  const bg = luminance(hex);
  const contrastWithWhite = 1.05 / (bg + 0.05);
  const contrastWithDark = (bg + 0.05) / (luminance("#102030") + 0.05);
  return contrastWithWhite >= contrastWithDark ? "#ffffff" : "#102030";
}

function applyTeamColors(el, team) {
  el.style.setProperty("--primary", team.primary);
  el.style.setProperty("--secondary", team.secondary);
  el.style.setProperty("--on-primary", textOn(team.primary));
  el.style.setProperty("--on-secondary", textOn(team.secondary));
}

// "Kansas" -> "Kansas's"
function possessive(name) {
  return `${name}'s`;
}

// ---------- Fleets ----------

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

// Place every ship at a random spot that fits on the board and doesn't overlap.
// grid[row][col] holds the index of the ship there, or null for water.
function placeFleet(team) {
  const grid = emptyGrid();
  const fleet = SHIPS.map((ship, index) => {
    while (true) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * (horizontal ? SIZE : SIZE - ship.length + 1));
      const col = Math.floor(Math.random() * (horizontal ? SIZE - ship.length + 1 : SIZE));

      const cells = [];
      for (let i = 0; i < ship.length; i++) {
        cells.push(horizontal ? [row, col + i] : [row + i, col]);
      }

      if (cells.every(([r, c]) => grid[r][c] === null)) {
        cells.forEach(([r, c]) => (grid[r][c] = index));
        // Team-flavored ship name, e.g. "Jayhawk Carrier"
        return { name: `${team.mascot} ${ship.name}`, length: ship.length, hits: 0 };
      }
    }
  });
  return { grid, fleet };
}

function makePlayer(number, team) {
  const { grid, fleet } = placeFleet(team);
  return {
    number,
    team,
    name: team.school,
    grid,
    fleet,
    received: emptyGrid(), // shots fired at this player: null, "miss" or "hit"
    lastIncoming: null, // report of the opponent's last shot, shown at the start of this player's turn
  };
}

// ---------- Game state ----------

const players = [];
let current = 0;
// "setup" = picking teams, "cover" = device being passed, "aim" = waiting for a shot,
// "fired" = shot taken, waiting to pass, "over" = someone won
let phase = "setup";

function opponentOf(index) {
  return players[1 - index];
}

function shipsLeft(player) {
  return player.fleet.filter((s) => s.hits < s.length).length;
}

function isSunkAt(player, r, c) {
  const shipIndex = player.grid[r][c];
  if (shipIndex === null) return false;
  const ship = player.fleet[shipIndex];
  return ship.hits === ship.length;
}

// ---------- Team picker ----------

function drawTeamPicker() {
  const pickingNumber = players.length + 1;
  const taken = players.map((p) => p.team);
  setupTitleEl.textContent = `Player ${pickingNumber}, pick your team`;

  teamGridEl.innerHTML = "";
  TEAMS.forEach((team) => {
    const btn = document.createElement("button");
    btn.className = "team-btn team-colors";
    applyTeamColors(btn, team);
    const isTaken = taken.includes(team);
    btn.disabled = isTaken;
    btn.innerHTML = `<span>${team.school}<small>${isTaken ? "Taken by Player 1" : team.nickname}</small></span>`;
    btn.addEventListener("click", () => pickTeam(team));
    teamGridEl.appendChild(btn);
  });
}

function pickTeam(team) {
  // Both players can't pick the same team.
  if (players.some((p) => p.team === team)) return;

  players.push(makePlayer(players.length + 1, team));
  if (players.length < 2) {
    drawTeamPicker();
  } else {
    setupEl.hidden = true;
    current = 0;
    showCover();
  }
}

// ---------- Drawing the boards ----------

// Apply hit, miss and sunk styling for one square of a player's board.
function styleShot(cell, player, r, c) {
  const shot = player.received[r][c];
  if (shot === "miss") {
    cell.classList.add("miss");
    cell.textContent = "•";
  } else if (shot === "hit") {
    cell.classList.add(isSunkAt(player, r, c) ? "sunk" : "hit");
    cell.textContent = "✕";
  }
}

function render() {
  const me = players[current];
  const enemy = opponentOf(current);

  applyTeamColors(gameEl, me.team);
  applyTeamColors(targetWrapEl, enemy.team);
  targetLabelEl.textContent = `Enemy waters · ${enemy.name}`;

  // Enemy waters: clickable, shows only shots taken (never the enemy's ships).
  targetBoardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}`);
      styleShot(cell, enemy, r, c);
      cell.disabled = phase !== "aim" || enemy.received[r][c] !== null;
      cell.addEventListener("click", () => fire(r, c));
      targetBoardEl.appendChild(cell);
    }
  }

  // Your fleet: your own ships plus every shot the enemy has taken at you.
  ownBoardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (me.grid[r][c] !== null) cell.classList.add("ship");
      styleShot(cell, me, r, c);
      ownBoardEl.appendChild(cell);
    }
  }

  if (phase !== "over") {
    turnTitleEl.textContent = `${possessive(me.name)} turn`;
  }
  statusEl.textContent = `${enemy.name} ships left: ${shipsLeft(enemy)} · Your ships left: ${shipsLeft(me)}`;
}

// ---------- Turn flow ----------

function showCover() {
  phase = "cover";
  const next = players[current];
  gameEl.hidden = true;
  coverEl.hidden = false;
  applyTeamColors(coverEl, next.team);
  coverPlayerEl.textContent = `Player ${next.number}`;
  coverTitleEl.textContent = `${next.team.school} ${next.team.nickname}, you're up`;
}

function startTurn() {
  phase = "aim";
  coverEl.hidden = true;
  gameEl.hidden = false;
  passBtn.hidden = true;

  const me = players[current];
  const enemy = opponentOf(current);
  messageEl.textContent = me.lastIncoming
    ? `${me.lastIncoming} Your turn to fire.`
    : `Fire at ${possessive(enemy.name)} fleet.`;
  render();
}

function fire(r, c) {
  const me = players[current];
  const enemy = opponentOf(current);
  // One shot per turn, and never at a square already shot.
  if (phase !== "aim" || enemy.received[r][c] !== null) return;

  const shipIndex = enemy.grid[r][c];
  if (shipIndex === null) {
    enemy.received[r][c] = "miss";
    messageEl.textContent = "Miss.";
    enemy.lastIncoming = `${me.name} missed.`;
  } else {
    const ship = enemy.fleet[shipIndex];
    ship.hits++;
    enemy.received[r][c] = "hit";
    if (ship.hits === ship.length) {
      messageEl.textContent = `${me.name} sinks ${possessive(enemy.name)} ${ship.name}!`;
      enemy.lastIncoming = `${me.name} sank your ${ship.name}!`;
    } else {
      messageEl.textContent = "Hit!";
      enemy.lastIncoming = `${me.name} hit your ${ship.name}.`;
    }
  }

  if (shipsLeft(enemy) === 0) {
    phase = "over";
    turnTitleEl.textContent = `🏆 ${me.team.school} ${me.team.nickname} win!`;
    messageEl.textContent = `All of ${possessive(enemy.name)} ships are sunk. Refresh the page to play again.`;
    render();
    return;
  }

  phase = "fired";
  render();
  passBtn.textContent = `Pass to ${enemy.name}`;
  passBtn.hidden = false;
}

readyBtn.addEventListener("click", startTurn);
passBtn.addEventListener("click", () => {
  current = 1 - current;
  showCover();
});

drawTeamPicker();
