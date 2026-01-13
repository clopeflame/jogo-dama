const {
  mandatoryCaptures,
  getCaptures,
  getMoves,
  movePiece,
  capturePiece
} = require("./rules");

// Cria tabuleiro inicial 8x8
function createBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i+j)%2===1) board[i][j] = {color:"black", isKing:false};
    }
  }
  for (let i = 5; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i+j)%2===1) board[i][j] = {color:"white", isKing:false};
    }
  }
  return board;
}

// Valida se o movimento é permitido
function validateMove(board, fromX, fromY, toX, toY, color) {
  const captures = mandatoryCaptures(board, color);
  if (captures.length) {
    // captura obrigatória
    for (let c of captures) {
      if (c.from[0]===fromX && c.from[1]===fromY &&
          c.to[0]===toX && c.to[1]===toY) return {valid:true, capture:true, over:c.over};
    }
    return {valid:false, message:"Captura obrigatória"};
  } else {
    const moves = getMoves(board, fromX, fromY);
    for (let m of moves) {
      if (m[0]===toX && m[1]===toY) return {valid:true, capture:false};
    }
    return {valid:false, message:"Movimento inválido"};
  }
}

// Executa o movimento (com captura)
function performMove(board, fromX, fromY, toX, toY) {
  const validation = validateMove(board, fromX, fromY, toX, toY, board[fromX][fromY].color);
  if (!validation.valid) return validation;

  if (validation.capture) {
    capturePiece(board, fromX, fromY, validation.over[0], validation.over[1], toX, toY);
  } else {
    movePiece(board, fromX, fromY, toX, toY);
  }

  return {valid:true};
}

module.exports = {
  createBoard,
  validateMove,
  performMove
};
