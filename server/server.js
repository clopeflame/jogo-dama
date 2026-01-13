const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const { createRoom, joinRoom, leaveRoom, getRoom } = require("./rooms");
const { createBoard, performMove, validateMove } = require("./gameEngine");

const app = express();
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/index.html")));
app.get("/game", (req, res) => res.sendFile(path.join(__dirname, "../client/game.html")));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* ==================== TIMER ==================== */
function startTurnTimer(room) {
  clearInterval(room.timer);
  room.timeLeft = 30;
  io.to(room.id).emit("timer", room.timeLeft);
  io.to(room.id).emit("turnChange", room.turn);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.id).emit("timer", room.timeLeft);

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.turn = room.turn === "white" ? "black" : "white";
      io.to(room.id).emit("turnChange", room.turn);
      startTurnTimer(room);
    }
  }, 1000);
}

/* ==================== SOCKET.IO ==================== */
io.on("connection", socket => {
  console.log("🟢 Conectado:", socket.id);

  socket.on("joinRoom", ({ roomId, name }) => {
    let room = getRoom(roomId);
    if (!room) {
      room = createRoom(roomId);
      room.board = createBoard();
      room.ready = {};
      room.started = false;
      room.turn = "white";
    }

    // reconexão
    const existingPlayer = Object.values(room.players).find(p => p.name === name);
    if (existingPlayer) {
      socket.id = existingPlayer.id;
      myColor = existingPlayer.color;
    } else {
      joinRoom(roomId, socket.id, name);
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.color = room.players[socket.id]?.color;

    // envia estado atual para o reconectado
    socket.emit("boardUpdate", room.board);
    socket.emit("turnChange", room.turn);
    socket.emit("readyUpdate", room.ready);
    if (room.started) socket.emit("startGame", room.turn);

    io.to(roomId).emit("roomUpdate", room);
  });

  /* ================= READY ================= */
  socket.on("ready", () => {
    const room = getRoom(socket.roomId);
    if (!room || room.started) return;
    if (room.ready[socket.id]) return;
    room.ready[socket.id] = true;

    io.to(room.id).emit("readyUpdate", room.ready);

    if (Object.keys(room.ready).length === 2) {
      let count = 5;
      const countdown = setInterval(() => {
        io.to(room.id).emit("countdown", count);
        count--;
        if (count < 0) {
          clearInterval(countdown);
          room.started = true;
          io.to(room.id).emit("startGame", room.turn);
          io.to(room.id).emit("boardUpdate", room.board);
          startTurnTimer(room);
        }
      }, 1000);
    }
  });

  /* ================= MOVE ================= */
  socket.on("move", ({ fromX, fromY, toX, toY }) => {
    const room = getRoom(socket.roomId);
    if (!room || !room.started) return;
    if (socket.color !== room.turn) return;

    const result = performMove(room.board, fromX, fromY, toX, toY);
    if (!result.valid) return; // não mostra alertas

    io.to(room.id).emit("boardUpdate", room.board);

    const capturesLeft = validateMove(room.board, toX, toY, toX, toY, socket.color).capture;
    if (!capturesLeft) {
      room.turn = room.turn === "white" ? "black" : "white";
      io.to(room.id).emit("turnChange", room.turn);
      startTurnTimer(room);
    }
  });

  /* ================= DESISTIR ================= */
  socket.on("resign", () => {
    const room = getRoom(socket.roomId);
    if (!room) return;
    const opponentId = Object.keys(room.players).find(id => id !== socket.id);
    if (opponentId) io.to(opponentId).emit("opponentResigned");
    room.started = false;
    io.to(room.id).emit("roomUpdate", room);
  });

  /* ================= EMPATE ================= */
  socket.on("askDraw", () => {
    const room = getRoom(socket.roomId);
    if (!room) return;
    const opponentId = Object.keys(room.players).find(id => id !== socket.id);
    if (!opponentId) return;
    io.to(opponentId).emit("drawRequest");
  });

  socket.on("acceptDraw", () => {
    const room = getRoom(socket.roomId);
    if (!room) return;
    room.board = createBoard();
    room.ready = {};
    room.started = false;
    io.to(room.id).emit("drawAccepted");
    io.to(room.id).emit("boardUpdate", room.board);
  });

  /* ================= DISCONNECT ================= */
  socket.on("disconnect", () => {
    console.log("🔴 Saiu:", socket.id);
    if (!socket.roomId) return;
    // mantém estado para reconexão
  });
});

server.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
