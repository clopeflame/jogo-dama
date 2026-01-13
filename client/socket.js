const socket = io();

socket.on("connect", () => {
  console.log("🟢 Conectado:", socket.id);
});
