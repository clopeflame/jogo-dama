const rooms = {};

function createRoom(roomId) {
  rooms[roomId] = {
    id: roomId,
    players: {},
    spectators: {},
    ready: {},
    started: false,
    turn: "white",
    timer: null,
    timeLeft: 30
  };

  console.log("🆕 Sala criada:", roomId);
  return rooms[roomId];
}

function joinRoom(roomId, socketId, name) {
  const room = rooms[roomId];
  if (!room) return null;

  const count = Object.keys(room.players).length;

  if (count < 2) {
    const color = count === 0 ? "white" : "black";
    room.players[socketId] = { id: socketId, name, color };
    return room.players[socketId];
  }

  room.spectators[socketId] = { id: socketId, name };
  return { spectator: true };
}

function leaveRoom(roomId, socketId) {
  const room = rooms[roomId];
  if (!room) return;

  delete room.players[socketId];
  delete room.spectators[socketId];
  delete room.ready[socketId];

  if (
    Object.keys(room.players).length === 0 &&
    Object.keys(room.spectators).length === 0
  ) {
    delete rooms[roomId];
    console.log("🗑️ Sala removida:", roomId);
  }
}

function getRoom(roomId) {
  return rooms[roomId];
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom
};
