// Battleship: Big 12 Edition. Two players pick Big 12 teams, place their
// ships, then play on one device with a cover screen between turns.

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
const placeEl = document.getElementById("place");
const placeTitleEl = document.getElementById("place-title");
const placeMessageEl = document.getElementById("place-message");
const placeBoardEl = document.getElementById("place-board");
const shipListEl = document.getElementById("ship-list");
const rotateBtn = document.getElementById("rotate-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const doneBtn = document.getElementById("done-btn");
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

// The squares a ship would cover, starting at (row, col) and running right or down.
function shipCells(row, col, length, horizontal) {
  const cells = [];
  for (let i = 0; i < length; i++) {
    cells.push(horizontal ? [row, col + i] : [row + i, col]);
  }
  return cells;
}

// A ship fits if every square is on the board and is water (or already this ship).
// grid[row][col] holds the index of the ship there, or null for water.
function fits(player, index, cells) {
  return cells.every(
    ([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE &&
      (player.grid[r][c] === null || player.grid[r][c] === index)
  );
}

function removeShip(player, index) {
  const ship = player.fleet[index];
  if (!ship.cells) return;
  ship.cells.forEach(([r, c]) => (player.grid[r][c] = null));
  ship.cells = null;
}

// Try to put a ship at (row, col). Returns false and changes nothing if it doesn't fit.
function placeShip(player, index, row, col, horizontal) {
  const ship = player.fleet[index];
  const cells = shipCells(row, col, ship.length, horizontal);
  if (!fits(player, index, cells)) return false;
  removeShip(player, index);
  cells.forEach(([r, c]) => (player.grid[r][c] = index));
  ship.cells = cells;
  ship.horizontal = horizontal;
  return true;
}

// Place every ship at a random spot that fits and doesn't overlap.
function shuffleFleet(player) {
  player.fleet.forEach((_, index) => removeShip(player, index));
  player.fleet.forEach((ship, index) => {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * SIZE);
      const col = Math.floor(Math.random() * SIZE);
      placed = placeShip(player, index, row, col, horizontal);
    }
  });
}

function makePlayer(number, team) {
  return {
    number,
    team,
    name: team.school,
    grid: emptyGrid(),
    // Team-flavored ship names, e.g. "Jayhawk Carrier". cells stays null until placed.
    fleet: SHIPS.map((ship) => ({
      name: `${team.mascot} ${ship.name}`,
      length: ship.length,
      hits: 0,
      cells: null,
      horizontal: true,
    })),
    received: emptyGrid(), // shots fired at this player: null, "miss" or "hit"
    lastIncoming: null, // report of the opponent's last shot, shown at the start of this player's turn
  };
}

// ---------- Game state ----------

const players = [];
let current = 0;
// "setup" = picking teams, "place-cover" = device being passed before placing ships,
// "placing" = a player is placing ships, "cover" = device being passed between turns,
// "aim" = waiting for a shot, "fired" = shot taken, waiting to pass, "over" = someone won
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
    showCover("place");
  }
}

// ---------- Ship placement ----------

let selected = 0; // index of the ship being placed or moved, or null
let horizontal = true;

function allPlaced(player) {
  return player.fleet.every((s) => s.cells);
}

function nextUnplaced(player) {
  const index = player.fleet.findIndex((s) => !s.cells);
  return index === -1 ? null : index;
}

function startPlacing() {
  phase = "placing";
  coverEl.hidden = true;
  placeEl.hidden = false;
  const me = players[current];
  applyTeamColors(placeEl, me.team);
  placeTitleEl.textContent = `${me.team.school}, place your fleet`;
  selected = 0;
  horizontal = true;
  placeMessageEl.textContent = "";
  renderPlacement();
}

function renderPlacement() {
  const me = players[current];

  placeBoardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}`);
      const shipIndex = me.grid[r][c];
      if (shipIndex !== null) {
        cell.classList.add("ship");
        if (shipIndex === selected) cell.classList.add("selected");
      }
      cell.addEventListener("click", () => clickPlacementCell(r, c));
      cell.addEventListener("mouseenter", () => showPreview(r, c));
      cell.addEventListener("pointerdown", (e) => startDrag(e, r, c));
      placeBoardEl.appendChild(cell);
    }
  }
  placeBoardEl.onmouseleave = clearPreview;

  // Ship list: click a ship to select it, then click the board to put it there.
  shipListEl.innerHTML = "";
  me.fleet.forEach((ship, index) => {
    const btn = document.createElement("button");
    btn.className = "ship-btn";
    if (index === selected) btn.classList.add("selected");
    if (ship.cells) btn.classList.add("placed");
    btn.innerHTML = `<span>${ship.name}</span><span class="ship-squares">${"■".repeat(ship.length)}</span>`;
    btn.addEventListener("click", () => {
      selected = index;
      placeMessageEl.textContent = "";
      renderPlacement();
    });
    shipListEl.appendChild(btn);
  });

  rotateBtn.textContent = `↻ Rotate (now ${horizontal ? "across" : "down"})`;
  doneBtn.disabled = !allPlaced(me);
  doneBtn.textContent = allPlaced(me) ? "Lock in fleet 🔒" : `Place ${me.fleet.filter((s) => !s.cells).length} more`;

  if (!placeMessageEl.textContent) {
    placeMessageEl.textContent = selected === null
      ? "All ships placed. Drag a ship to move it, or lock in your fleet. Once locked, ships can't be moved."
      : `Click a square to place your ${me.fleet[selected].name}. It runs ${horizontal ? "right" : "down"} from there.`;
  }
}

// ---------- Dragging ships (mouse or finger) ----------

let drag = null; // { index, offset, startR, startC, moved } while a ship is being dragged
let suppressClick = false;

// Which board square is under the pointer, or null.
function cellUnderPointer(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || !placeBoardEl.contains(el) || el.dataset.row === undefined) return null;
  return [Number(el.dataset.row), Number(el.dataset.col)];
}

// Where the ship's first square goes, keeping the square you grabbed under the pointer.
function dragAnchor(r, c) {
  return horizontal ? [r, c - drag.offset] : [r - drag.offset, c];
}

function startDrag(e, r, c) {
  if (phase !== "placing" || e.button > 0) return;
  const me = players[current];
  const index = me.grid[r][c];
  if (index === null) return;
  const ship = me.fleet[index];
  drag = {
    index,
    offset: ship.cells.findIndex(([sr, sc]) => sr === r && sc === c),
    startR: r,
    startC: c,
    moved: false,
  };
}

function moveDrag(e) {
  if (!drag) return;
  const pos = cellUnderPointer(e);
  if (!pos) {
    clearPreview();
    return;
  }
  if (!drag.moved && (pos[0] !== drag.startR || pos[1] !== drag.startC)) {
    // The pointer left the grabbed square, so this is a drag, not a click.
    drag.moved = true;
    selected = drag.index;
    horizontal = players[current].fleet[drag.index].horizontal;
    placeBoardEl.classList.add("dragging");
  }
  if (drag.moved) showPreviewAt(...dragAnchor(...pos));
}

function endDrag(e) {
  if (!drag) return;
  const finished = drag;
  placeBoardEl.classList.remove("dragging");
  if (!finished.moved) {
    drag = null;
    return; // a plain click: the click handler takes it from here
  }

  // Ignore the click the browser sends right after a drag.
  suppressClick = true;
  setTimeout(() => (suppressClick = false), 0);

  const me = players[current];
  const ship = me.fleet[finished.index];
  const pos = cellUnderPointer(e);
  const anchor = pos ? dragAnchor(...pos) : null;
  drag = null;

  if (anchor && placeShip(me, finished.index, anchor[0], anchor[1], horizontal)) {
    selected = nextUnplaced(me);
    placeMessageEl.textContent = `Moved your ${ship.name}.`;
  } else {
    selected = finished.index;
    placeMessageEl.textContent = `Your ${ship.name} doesn't fit there, so it stayed put. Try another spot.`;
  }
  renderPlacement();
}

function cancelDrag() {
  drag = null;
  placeBoardEl.classList.remove("dragging");
  clearPreview();
}

document.addEventListener("pointermove", moveDrag);
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", cancelDrag);

// ---------- Previews and clicks ----------

// Highlight where the selected ship would land: green if it fits, red if not.
function showPreview(r, c) {
  if (drag) return; // while dragging, moveDrag draws the preview
  showPreviewAt(r, c);
}

function showPreviewAt(r, c) {
  clearPreview();
  if (selected === null) return;
  const me = players[current];
  const cells = shipCells(r, c, me.fleet[selected].length, horizontal);
  const ok = fits(me, selected, cells);
  cells.forEach(([pr, pc]) => {
    const el = placeBoardEl.querySelector(`[data-row="${pr}"][data-col="${pc}"]`);
    if (el) el.classList.add(ok ? "preview-ok" : "preview-bad");
  });
}

function clearPreview() {
  placeBoardEl.querySelectorAll(".preview-ok, .preview-bad")
    .forEach((el) => el.classList.remove("preview-ok", "preview-bad"));
}

function clickPlacementCell(r, c) {
  if (suppressClick) return;
  const me = players[current];
  const shipThere = me.grid[r][c];

  // Clicking a different ship picks it up so it can be moved.
  if (shipThere !== null && shipThere !== selected) {
    selected = shipThere;
    horizontal = me.fleet[shipThere].horizontal;
    placeMessageEl.textContent = `Moving your ${me.fleet[shipThere].name}. Drag it, click a new spot, or Rotate.`;
    renderPlacement();
    return;
  }
  if (selected === null) return;

  const ship = me.fleet[selected];
  // Clicking the ship you already picked up keeps it picked up.
  if (shipThere === selected) {
    placeMessageEl.textContent = `Moving your ${ship.name}. Drag it, click a new spot, or Rotate.`;
    renderPlacement();
    return;
  }
  if (placeShip(me, selected, r, c, horizontal)) {
    selected = nextUnplaced(me);
    placeMessageEl.textContent = "";
  } else {
    placeMessageEl.textContent = `Your ${ship.name} doesn't fit there. It can't go off the board or overlap another ship.`;
  }
  renderPlacement();
  showPreview(r, c);
}

function rotate() {
  if (phase !== "placing") return;
  horizontal = !horizontal;
  placeMessageEl.textContent = "";
  const me = players[current];
  // A placed ship rotates in place if there's room.
  if (selected !== null && me.fleet[selected].cells) {
    const ship = me.fleet[selected];
    const [r, c] = ship.cells[0];
    if (!placeShip(me, selected, r, c, horizontal)) {
      placeMessageEl.textContent = `No room to rotate your ${ship.name} here. Click a new spot to place it ${horizontal ? "horizontally" : "vertically"}.`;
    }
  }
  renderPlacement();
}

function shuffle() {
  const me = players[current];
  shuffleFleet(me);
  selected = null;
  placeMessageEl.textContent = "Ships shuffled. Drag a ship to move it, shuffle again, or lock in your fleet.";
  renderPlacement();
}

// Locking in is final: there is no way back to this screen once the battle starts.
function donePlacing() {
  if (!allPlaced(players[current])) return;
  if (!window.confirm("Lock in your fleet? You won't be able to move your ships after this.")) return;
  placeEl.hidden = true;
  if (current === 0) {
    current = 1;
    showCover("place");
  } else {
    current = 0;
    showCover("battle");
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

// mode "place": hand over to place ships. mode "battle": hand over to take a shot.
function showCover(mode) {
  phase = mode === "place" ? "place-cover" : "cover";
  const next = players[current];
  gameEl.hidden = true;
  placeEl.hidden = true;
  coverEl.hidden = false;
  applyTeamColors(coverEl, next.team);
  coverPlayerEl.textContent = `Player ${next.number}`;
  coverTitleEl.textContent = mode === "place"
    ? `${next.team.school} ${next.team.nickname}, place your fleet`
    : `${next.team.school} ${next.team.nickname}, you're up`;
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

readyBtn.addEventListener("click", () => {
  if (phase === "place-cover") startPlacing();
  else if (phase === "cover") startTurn();
});
passBtn.addEventListener("click", () => {
  current = 1 - current;
  showCover("battle");
});
rotateBtn.addEventListener("click", rotate);
shuffleBtn.addEventListener("click", shuffle);
doneBtn.addEventListener("click", donePlacing);
// Keyboard shortcut: R rotates while placing ships.
document.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") rotate();
});

drawTeamPicker();
