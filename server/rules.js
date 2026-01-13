/* =========================
   REGRAS DAMA BRASILEIRA
========================= */

const DIRECTIONS = {
  white: [[-1, -1], [-1, 1]], // peças brancas movem pra frente
  black: [[1, -1], [1, 1]]    // peças pretas movem pra frente
};

function isValidPosition(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

// Verifica se existe captura obrigatória
function mandatoryCaptures(board, color) {
  const captures = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece || piece.color !== color) continue;
      const pieceCaptures = getCaptures(board, i, j);
      if (pieceCaptures.length) captures.push(...pieceCaptures);
    }
  }
  return captures;
}

// Retorna todas capturas possíveis da peça
function getCaptures(board, x, y) {
  const piece = board[x][y];
  if (!piece) return [];
  const color = piece.color;
  const opponent = color === "white" ? "black" : "white";
  const captures = [];

  const dirs = piece.isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]] : DIRECTIONS[color];

  dirs.forEach(([dx, dy]) => {
    let nx = x + dx;
    let ny = y + dy;
    let jumped = false;
    while (isValidPosition(nx, ny)) {
      const target = board[nx][ny];
      if (!jumped && target && target.color === opponent) {
        // peça do oponente encontrada, verificar espaço depois
        let jumpX = nx + dx;
        let jumpY = ny + dy;
        if (isValidPosition(jumpX, jumpY) && !board[jumpX][jumpY]) {
          captures.push({from:[x,y], over:[nx,ny], to:[jumpX,jumpY]});
        }
        break;
      } else if (target) break;
      if (!piece.isKing) break; // peão normal não continua
      nx += dx;
      ny += dy;
    }
  });

  return captures;
}

// Verifica movimentos normais (sem captura)
function getMoves(board, x, y) {
  const piece = board[x][y];
  if (!piece) return [];
  const color = piece.color;
  const moves = [];
  const dirs = piece.isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]] : DIRECTIONS[color];

  dirs.forEach(([dx, dy]) => {
    let nx = x + dx;
    let ny = y + dy;
    while (isValidPosition(nx, ny) && !board[nx][ny]) {
      moves.push([nx, ny]);
      if (!piece.isKing) break; // peão normal só anda 1
      nx += dx;
      ny += dy;
    }
  });

  return moves;
}

// Promove peão a dama
function promotePiece(board, x, y) {
  const piece = board[x][y];
  if (!piece) return;
  if ((piece.color === "white" && x === 0) || (piece.color === "black" && x === 7)) {
    piece.isKing = true;
  }
}

// Executa movimento
function movePiece(board, fromX, fromY, toX, toY) {
  const piece = board[fromX][fromY];
  board[toX][toY] = piece;
  board[fromX][fromY] = null;
  promotePiece(board, toX, toY);
}

// Executa captura
function capturePiece(board, fromX, fromY, overX, overY, toX, toY) {
  movePiece(board, fromX, fromY, toX, toY);
  board[overX][overY] = null;
}

module.exports = {
  DIRECTIONS,
  isValidPosition,
  mandatoryCaptures,
  getCaptures,
  getMoves,
  promotePiece,
  movePiece,
  capturePiece
};
