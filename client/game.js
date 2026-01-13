const socket = io();

const boardDiv = document.getElementById("board");
let selected = null;       // peça selecionada
let board = [];            // estado atual do tabuleiro
let myColor = null;

// pega dados do localStorage
const roomId = localStorage.getItem("roomId");
const playerName = localStorage.getItem("playerName");

if (!roomId || !playerName) window.location.href = "/";

// ================= JOIN ROOM =================
socket.emit("joinRoom", { roomId, name: playerName });

socket.on("roomUpdate", room => {
  myColor = room.players[socket.id]?.color;
});

// ================= BOTÕES =================
document.getElementById("readyBtn").onclick = () => {
  socket.emit("ready");
  document.getElementById("readyBtn").disabled = true;
};

document.getElementById("drawBtn").onclick = () => {
  socket.emit("askDraw");
};

document.getElementById("resignBtn").onclick = () => {
  alert("Você desistiu. O adversário vence!");
  window.location.href = "/";
};

// ================= SOCKET.IO =================
socket.on("boardUpdate", b => {
  board = b;
  renderBoard();
});

socket.on("startGame", turn => {
  document.getElementById("board").style.display = "grid";
});

socket.on("turnChange", turn => {
  document.getElementById("turn").innerText =
    "Vez: " + (turn === "white" ? "Brancas" : "Pretas");
});

socket.on("timer", t => {
  document.getElementById("timer").innerText = t;
});

socket.on("drawRequest", () => {
  const accept = confirm("O adversário pediu empate. Aceitar?");
  if (accept) socket.emit("acceptDraw");
});

socket.on("drawAccepted", () => {
  board = [];
  renderBoard();
  document.getElementById("readyBtn").disabled = false;
});

// ================= RENDER BOARD =================
function renderBoard() {
  boardDiv.innerHTML = "";

  // se jogador preto, inverter tabuleiro para ficar sempre do lado dele
  const displayBoard = myColor === "white"
    ? board
    : [...board].reverse().map(row => [...row].reverse());

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      // cores das casas
      cell.style.backgroundColor = (i + j) % 2 === 1 ? "#769656" : "#eeeed2";
      cell.dataset.x = i;
      cell.dataset.y = j;

      const piece = displayBoard[i][j];
      if (piece) {
        const pDiv = document.createElement("div");
        pDiv.style.width = "80%";
        pDiv.style.height = "80%";
        pDiv.style.borderRadius = "50%";
        pDiv.style.margin = "auto";
        pDiv.style.marginTop = "10%";
        pDiv.style.backgroundColor = piece.color === "white" ? "#fff" : "#000";

        if (piece.isKing) {
          pDiv.innerText = "♔";
          pDiv.style.color = piece.color === "white" ? "#000" : "#fff";
          pDiv.style.fontSize = "24px";
          pDiv.style.textAlign = "center";
          pDiv.style.lineHeight = "40px";
        }

        cell.appendChild(pDiv);
      }

      cell.onclick = () => onCellClick(i, j);
      boardDiv.appendChild(cell);
    }
  }
}

// ================= CLICK HANDLER =================
function onCellClick(i, j) {
  // converte coordenadas se jogador for preto
  const x = myColor === "white" ? i : 7 - i;
  const y = myColor === "white" ? j : 7 - j;

  const piece = board[x][y];

  if (selected) {
    // tenta mover
    socket.emit("move", { fromX: selected.x, fromY: selected.y, toX: x, toY: y });
    selected = null;
  } else {
    // seleciona peça se for sua
    if (piece && piece.color === myColor) {
      selected = { x, y };
    }
  }
}
