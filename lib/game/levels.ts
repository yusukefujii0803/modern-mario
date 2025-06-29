import { Enemy, Platform, GameObject } from './types';

export function createLevel(levelNumber: number) {
  const enemies: Enemy[] = [];
  const platforms: Platform[] = [];
  const powerUps: GameObject[] = [];

  // Ground platforms - with gaps for challenge
  for (let i = 0; i < 30; i++) {
    // Create gaps at specific positions
    if (i === 8 || i === 9 || i === 15 || i === 22 || i === 23) continue;
    
    platforms.push({
      id: `ground-${i}`,
      position: { x: i * 100, y: 500 },
      velocity: { x: 0, y: 0 },
      size: { x: 100, y: 100 },
      type: 'platform',
      platformType: 'solid',
      active: true,
    });
  }

  // Floating platforms - easier path design
  platforms.push({
    id: 'platform-1',
    position: { x: 300, y: 400 },
    velocity: { x: 0, y: 0 },
    size: { x: 150, y: 20 },
    type: 'platform',
    platformType: 'solid',
    active: true,
  });

  // Bridge over first gap
  platforms.push({
    id: 'bridge-1',
    position: { x: 750, y: 400 },
    velocity: { x: 0, y: 0 },
    size: { x: 250, y: 20 },
    type: 'platform',
    platformType: 'solid',
    active: true,
  });

  // Moving platform for second gap
  platforms.push({
    id: 'moving-1',
    position: { x: 1450, y: 350 },
    velocity: { x: 0, y: 0 },
    size: { x: 120, y: 20 },
    type: 'platform',
    platformType: 'moving',
    active: true,
    movement: {
      direction: 'vertical',
      speed: 0.5,
      range: 100,
    },
  });

  // Stepping stones
  for (let i = 0; i < 4; i++) {
    platforms.push({
      id: `step-${i}`,
      position: { x: 1100 + i * 80, y: 300 - i * 30 },
      velocity: { x: 0, y: 0 },
      size: { x: 60, y: 15 },
      type: 'platform',
      platformType: 'cloud',
      active: true,
    });
  }

  // Safe platform before final section
  platforms.push({
    id: 'safe-platform',
    position: { x: 1800, y: 350 },
    velocity: { x: 0, y: 0 },
    size: { x: 200, y: 20 },
    type: 'platform',
    platformType: 'solid',
    active: true,
  });

  // Final bridge to goal
  platforms.push({
    id: 'final-bridge',
    position: { x: 2200, y: 400 },
    velocity: { x: 0, y: 0 },
    size: { x: 300, y: 20 },
    type: 'platform',
    platformType: 'solid',
    active: true,
  });

  // Goal platform
  platforms.push({
    id: 'goal-platform',
    position: { x: 2600, y: 350 },
    velocity: { x: 0, y: 0 },
    size: { x: 200, y: 150 },
    type: 'platform',
    platformType: 'solid',
    active: true,
  });

  // Enemies - varied types
  
  // Basic Goomba
  enemies.push({
    id: 'enemy-1',
    position: { x: 400, y: 460 },
    velocity: { x: 1, y: 0 },
    size: { x: 30, y: 30 },
    type: 'enemy',
    enemyType: 'goomba',
    health: 1,
    active: true,
    patrol: { start: 350, end: 450 },
    animationFrame: 0,
  });

  // Koopa on platform
  enemies.push({
    id: 'enemy-2',
    position: { x: 350, y: 360 },
    velocity: { x: -0.8, y: 0 },
    size: { x: 35, y: 40 },
    type: 'enemy',
    enemyType: 'koopa',
    health: 2,
    active: true,
    patrol: { start: 300, end: 420 },
    animationFrame: 0,
  });

  // Flying enemy
  enemies.push({
    id: 'enemy-3',
    position: { x: 600, y: 300 },
    velocity: { x: 1.5, y: 0 },
    size: { x: 40, y: 30 },
    type: 'enemy',
    enemyType: 'flying',
    health: 1,
    active: true,
    patrol: { start: 500, end: 700 },
    animationFrame: 0,
  });

  // Spiky enemy (harder to defeat)
  enemies.push({
    id: 'enemy-4',
    position: { x: 1100, y: 460 },
    velocity: { x: -0.5, y: 0 },
    size: { x: 35, y: 35 },
    type: 'enemy',
    enemyType: 'spiky',
    health: 3,
    active: true,
    patrol: { start: 1050, end: 1200 },
    animationFrame: 0,
  });

  // Jumper enemy
  enemies.push({
    id: 'enemy-5',
    position: { x: 1850, y: 310 },
    velocity: { x: 1, y: 0 },
    size: { x: 30, y: 35 },
    type: 'enemy',
    enemyType: 'jumper',
    health: 2,
    active: true,
    patrol: { start: 1800, end: 1950 },
    animationFrame: 0,
    jumpTimer: 0,
  });

  // Goomba squad before goal
  for (let i = 0; i < 3; i++) {
    enemies.push({
      id: `enemy-final-${i}`,
      position: { x: 2250 + i * 60, y: 360 },
      velocity: { x: Math.random() > 0.5 ? 1 : -1, y: 0 },
      size: { x: 30, y: 30 },
      type: 'enemy',
      enemyType: 'goomba',
      health: 1,
      active: true,
      patrol: { start: 2200, end: 2450 },
      animationFrame: 0,
    });
  }

  // Power-ups - strategically placed
  powerUps.push({
    id: 'powerup-1',
    position: { x: 520, y: 300 },
    velocity: { x: 0, y: 0 },
    size: { x: 25, y: 25 },
    type: 'powerup',
    active: true,
    color: '#39FF14',
  });

  powerUps.push({
    id: 'powerup-2',
    position: { x: 1300, y: 200 },
    velocity: { x: 0, y: 0 },
    size: { x: 25, y: 25 },
    type: 'powerup',
    active: true,
    color: '#39FF14',
  });

  powerUps.push({
    id: 'powerup-3',
    position: { x: 1900, y: 300 },
    velocity: { x: 0, y: 0 },
    size: { x: 25, y: 25 },
    type: 'powerup',
    active: true,
    color: '#39FF14',
  });

  // Goal
  const goal: GameObject = {
    id: 'goal',
    position: { x: 2700, y: 300 },
    velocity: { x: 0, y: 0 },
    size: { x: 60, y: 80 },
    type: 'goal',
    active: true,
    color: '#FFD700',
  };

  return { enemies, platforms, powerUps, goal };
}