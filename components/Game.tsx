'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEngine } from '@/lib/game/GameEngine';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 1024;
      canvas.height = 576;
      
      engineRef.current = new GameEngine(canvas);
    }

    const handleRestart = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && engineRef.current) {
        engineRef.current.restart();
      }
    };

    window.addEventListener('keydown', handleRestart);

    return () => {
      window.removeEventListener('keydown', handleRestart);
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const startGame = () => {
    setIsStarted(true);
    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-cyber-purple/20 via-transparent to-transparent" />
      
      <AnimatePresence>
        {!isStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-dark-bg/90 backdrop-blur-lg"
          >
            <motion.h1 
              className="text-8xl font-bold mb-8 neon-text text-neon-pink"
              animate={{ 
                textShadow: [
                  "0 0 20px #FF10F0, 0 0 40px #FF10F0, 0 0 60px #FF10F0",
                  "0 0 30px #FF10F0, 0 0 60px #FF10F0, 0 0 90px #FF10F0",
                  "0 0 20px #FF10F0, 0 0 40px #FF10F0, 0 0 60px #FF10F0"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              MODERN MARIO
            </motion.h1>
            
            <motion.p 
              className="text-2xl mb-12 text-neon-blue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              A cyberpunk platformer experience
            </motion.p>
            
            <motion.button
              onClick={startGame}
              className="px-12 py-6 text-2xl font-bold bg-gradient-to-r from-neon-pink to-cyber-purple 
                         text-white rounded-lg transform transition-all duration-300 
                         hover:scale-110 hover:shadow-2xl hover:shadow-neon-pink/50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              START GAME
            </motion.button>
            
            <motion.div 
              className="mt-12 text-electric-green text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="mb-2">⌨️ Controls:</p>
              <p>← → or A/D: Move</p>
              <p>↑ or W or SPACE: Jump</p>
              <p>ESC: Pause</p>
              <p>R: Restart</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-2 border-cyber-purple rounded-lg shadow-2xl shadow-cyber-purple/50"
          style={{ imageRendering: 'auto' }}
        />
        
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink via-cyber-purple to-neon-blue 
                        rounded-lg blur-lg opacity-50 -z-10 animate-pulse-glow" />
      </div>
    </div>
  );
}