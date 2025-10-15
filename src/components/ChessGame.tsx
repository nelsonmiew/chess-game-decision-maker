'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Crown, Timer } from 'lucide-react';

interface GameState {
  game: Chess;
  gameHistory: string[];
  isGameActive: boolean;
  currentPlayer: 'white' | 'black';
  gameSpeed: number;
  capturedPieces: {
    white: string[];
    black: string[];
  };
}

const PIECE_VALUES: { [key: string]: number } = {
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
};

const PIECE_SYMBOLS: { [key: string]: string } = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

interface ChessBoardProps {
  position: string;
  boardOrientation: 'white' | 'black';
}

function ChessBoard({ position, boardOrientation }: ChessBoardProps) {
  const game = new Chess(position);
  const board = game.board();

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayRanks = boardOrientation === 'white' ? ranks : [...ranks].reverse();
  const displayFiles = boardOrientation === 'white' ? files : [...files].reverse();

  return (
    <div className="relative inline-block">
      <div className="grid grid-cols-8 gap-0 border-4 border-amber-700 rounded-2xl overflow-hidden shadow-2xl">
        {displayRanks.map((rank, rankIndex) =>
          displayFiles.map((file, fileIndex) => {
            const square = `${file}${rank}` as Square;
            const piece = game.get(square);
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            
            return (
              <motion.div
                key={square}
                className={`
                  w-16 h-16 flex items-center justify-center text-4xl relative
                  ${isLight 
                    ? 'bg-gradient-to-br from-amber-100 to-amber-200' 
                    : 'bg-gradient-to-br from-amber-600 to-amber-800'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {piece && (
                  <motion.span
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="drop-shadow-lg"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                  </motion.span>
                )}
                
                {/* Square coordinates */}
                {(fileIndex === 0) && (
                  <span className={`absolute top-1 left-1 text-xs font-bold ${
                    isLight ? 'text-amber-800' : 'text-amber-200'
                  }`}>
                    {rank}
                  </span>
                )}
                {(rankIndex === displayRanks.length - 1) && (
                  <span className={`absolute bottom-1 right-1 text-xs font-bold ${
                    isLight ? 'text-amber-800' : 'text-amber-200'
                  }`}>
                    {file}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ChessGame() {
  const [gameState, setGameState] = useState<GameState>({
    game: new Chess(),
    gameHistory: [],
    isGameActive: false,
    currentPlayer: 'white',
    gameSpeed: 2000,
    capturedPieces: { white: [], black: [] }
  });

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // AI move generation with some strategic logic
  const generateAIMove = useCallback((game: Chess): string | null => {
    const possibleMoves = game.moves();
    
    if (possibleMoves.length === 0) return null;

    // Simple AI strategy: prioritize captures, then center control, then random
    const captureMoves = possibleMoves.filter(move => move.includes('x'));
    const centerMoves = possibleMoves.filter(move => 
      move.includes('e4') || move.includes('e5') || 
      move.includes('d4') || move.includes('d5')
    );

    if (captureMoves.length > 0) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else if (centerMoves.length > 0 && Math.random() > 0.7) {
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    } else {
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
  }, []);

  // Handle AI moves
  useEffect(() => {
    if (!gameState.isGameActive || gameState.game.isGameOver()) return;

    const timer = setTimeout(() => {
      const newGame = new Chess(gameState.game.fen());
      const move = generateAIMove(newGame);
      
      if (move) {
        const moveResult = newGame.move(move);
        
        if (moveResult) {
          // Track captured pieces
          const newCapturedPieces = { ...gameState.capturedPieces };
          if (moveResult.captured) {
            const capturedPiece = moveResult.captured;
            const capturingColor = moveResult.color === 'w' ? 'white' : 'black';
            newCapturedPieces[capturingColor].push(capturedPiece);
          }

          setGameState(prev => ({
            ...prev,
            game: newGame,
            gameHistory: [...prev.gameHistory, move],
            currentPlayer: newGame.turn() === 'w' ? 'white' : 'black',
            capturedPieces: newCapturedPieces
          }));
        }
      }
    }, gameState.gameSpeed);

    return () => clearTimeout(timer);
  }, [gameState.game.fen(), gameState.isGameActive, gameState.gameSpeed, generateAIMove, gameState.capturedPieces]);

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      isGameActive: true
    }));
  };

  const pauseGame = () => {
    setGameState(prev => ({
      ...prev,
      isGameActive: false
    }));
  };

  const resetGame = () => {
    setGameState({
      game: new Chess(),
      gameHistory: [],
      isGameActive: false,
      currentPlayer: 'white',
      gameSpeed: 2000,
      capturedPieces: { white: [], black: [] }
    });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setGameState(prev => ({
      ...prev,
      gameSpeed: newSpeed
    }));
  };

  const getGameStatus = () => {
    if (gameState.game.isCheckmate()) {
      return `Checkmate! ${gameState.game.turn() === 'w' ? 'Black' : 'White'} wins!`;
    } else if (gameState.game.isDraw()) {
      return 'Game ended in a draw!';
    } else if (gameState.game.isCheck()) {
      return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
    }
    return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`;
  };

  const calculateMaterialAdvantage = () => {
    const whitePieces = gameState.capturedPieces.white;
    const blackPieces = gameState.capturedPieces.black;
    
    const whiteAdvantage = whitePieces.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);
    const blackAdvantage = blackPieces.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);
    
    return whiteAdvantage - blackAdvantage;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              Chess Game Simulator
            </h1>
            <Crown className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-slate-300 text-lg">Watch two AI players battle it out in beautiful chess</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Game Controls & Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Game Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Game Status
              </h3>
              <div className="space-y-3">
                <div className="text-slate-300">
                  <span className="font-medium">Status:</span>
                  <div className="mt-1 text-white font-semibold">{getGameStatus()}</div>
                </div>
                <div className="text-slate-300">
                  <span className="font-medium">Moves played:</span>
                  <span className="ml-2 text-white">{gameState.gameHistory.length}</span>
                </div>
                <div className="text-slate-300">
                  <span className="font-medium">Material advantage:</span>
                  <span className={`ml-2 font-semibold ${
                    calculateMaterialAdvantage() > 0 ? 'text-green-400' : 
                    calculateMaterialAdvantage() < 0 ? 'text-red-400' : 'text-white'
                  }`}>
                    {calculateMaterialAdvantage() > 0 ? '+' : ''}{calculateMaterialAdvantage()}
                  </span>
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Controls</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={gameState.isGameActive ? pauseGame : startGame}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {gameState.isGameActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    {gameState.isGameActive ? 'Pause' : 'Play'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Reset
                  </motion.button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium">Game Speed</label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="250"
                    value={gameState.gameSpeed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-sm text-slate-400 text-center">
                    {gameState.gameSpeed}ms between moves
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-medium transition-all"
                >
                  Flip Board
                </motion.button>
              </div>
            </div>

            {/* Captured Pieces */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Captured Pieces</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-300 mb-2">Captured by White</div>
                  <div className="flex flex-wrap gap-1">
                    {gameState.capturedPieces.white.map((piece, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-2xl"
                      >
                        {PIECE_SYMBOLS[piece]}
                      </motion.span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-300 mb-2">Captured by Black</div>
                  <div className="flex flex-wrap gap-1">
                    {gameState.capturedPieces.black.map((piece, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-2xl"
                      >
                        {PIECE_SYMBOLS[piece.toUpperCase()]}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center - Chess Board */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="relative flex justify-center">
                <ChessBoard 
                  position={gameState.game.fen()} 
                  boardOrientation={boardOrientation}
                />
                
                {/* Current player indicator */}
                <motion.div
                  key={gameState.currentPlayer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                >
                  {gameState.currentPlayer === 'white' ? '⚪ White' : '⚫ Black'} to move
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Move History */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Move History</h3>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {gameState.gameHistory.length === 0 ? (
                  <div className="text-slate-400 text-center py-8">
                    No moves yet. Start the game to see moves here.
                  </div>
                ) : (
                  gameState.gameHistory.map((move, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-2 rounded-lg flex items-center justify-between ${
                        index % 2 === 0 ? 'bg-white/5' : 'bg-transparent'
                      }`}
                    >
                      <span className="text-slate-400 text-sm">
                        {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}
                      </span>
                      <span className="text-white font-mono">{move}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}