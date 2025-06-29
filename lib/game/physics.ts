import { GameObject, Vector2D } from './types';

export const GRAVITY = 0.8;
export const JUMP_FORCE = -15;
export const MOVE_SPEED = 5;
export const MAX_FALL_SPEED = 12;
export const FRICTION = 0.85;

export function updatePhysics(obj: GameObject, deltaTime: number = 1): void {
  obj.position.x += obj.velocity.x * deltaTime;
  obj.position.y += obj.velocity.y * deltaTime;
  
  if (obj.type === 'player' || obj.type === 'enemy') {
    obj.velocity.y = Math.min(obj.velocity.y + GRAVITY, MAX_FALL_SPEED);
    obj.velocity.x *= FRICTION;
  }
  
  if (obj.type === 'particle') {
    obj.velocity.y += GRAVITY * 0.3;
    obj.velocity.x *= 0.98;
  }
}

export function checkCollision(a: GameObject, b: GameObject): boolean {
  return (
    a.position.x < b.position.x + b.size.x &&
    a.position.x + a.size.x > b.position.x &&
    a.position.y < b.position.y + b.size.y &&
    a.position.y + a.size.y > b.position.y
  );
}

export function resolveCollision(player: GameObject, platform: GameObject): void {
  const playerBottom = player.position.y + player.size.y;
  const playerRight = player.position.x + player.size.x;
  const playerLeft = player.position.x;
  const playerTop = player.position.y;

  const platformBottom = platform.position.y + platform.size.y;
  const platformRight = platform.position.x + platform.size.x;
  const platformLeft = platform.position.x;
  const platformTop = platform.position.y;

  const overlapX = Math.min(playerRight - platformLeft, platformRight - playerLeft);
  const overlapY = Math.min(playerBottom - platformTop, platformBottom - playerTop);

  if (overlapX < overlapY) {
    if (player.position.x < platform.position.x) {
      player.position.x = platformLeft - player.size.x;
    } else {
      player.position.x = platformRight;
    }
    player.velocity.x = 0;
  } else {
    if (player.position.y < platform.position.y) {
      player.position.y = platformTop - player.size.y;
      player.velocity.y = 0;
      if (player.type === 'player') {
        (player as any).isGrounded = true;
        (player as any).isJumping = false;
      }
    } else {
      player.position.y = platformBottom;
      player.velocity.y = 0;
    }
  }
}

export function createParticle(
  position: Vector2D,
  velocity: Vector2D,
  color: string,
  size: number = 4
): any {
  return {
    id: `particle-${Date.now()}-${Math.random()}`,
    position: { ...position },
    velocity: { ...velocity },
    size: { x: size, y: size },
    type: 'particle',
    color,
    active: true,
    lifespan: 30,
    maxLifespan: 30,
    fadeOut: true,
    gravity: true,
  };
}

export function particleBurst(
  position: Vector2D,
  count: number,
  color: string,
  speed: number = 5
): any[] {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    particles.push(
      createParticle(
        position,
        {
          x: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          y: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        },
        color,
        Math.random() * 4 + 2
      )
    );
  }
  return particles;
}