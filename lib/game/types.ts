export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  size: Vector2D;
  type: 'player' | 'enemy' | 'platform' | 'powerup' | 'particle' | 'goal';
  sprite?: string;
  color?: string;
  active: boolean;
}

export interface Player extends GameObject {
  health: number;
  score: number;
  isJumping: boolean;
  isGrounded: boolean;
  facing: 'left' | 'right';
  powerUp?: 'super' | 'fire' | 'star';
  invincible: boolean;
  animationFrame: number;
}

export interface Enemy extends GameObject {
  enemyType: 'goomba' | 'koopa' | 'flying' | 'spiky' | 'jumper';
  health: number;
  patrol: {
    start: number;
    end: number;
  };
  jumpTimer?: number;
  animationFrame?: number;
}

export interface Platform extends GameObject {
  platformType: 'solid' | 'moving' | 'breakable' | 'cloud';
  movement?: {
    direction: 'horizontal' | 'vertical';
    speed: number;
    range: number;
  };
}

export interface Particle extends GameObject {
  lifespan: number;
  maxLifespan: number;
  fadeOut: boolean;
  gravity: boolean;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  platforms: Platform[];
  powerUps: GameObject[];
  particles: Particle[];
  goal: GameObject | null;
  camera: Vector2D;
  level: number;
  gameOver: boolean;
  levelComplete: boolean;
  paused: boolean;
  score: number;
  time: number;
}