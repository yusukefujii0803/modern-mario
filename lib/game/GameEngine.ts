import { GameState, Player, Enemy, Platform, Particle } from './types';
import { updatePhysics, checkCollision, resolveCollision, JUMP_FORCE, MOVE_SPEED, particleBurst } from './physics';
import { createLevel } from './levels';

export class GameEngine {
  private state: GameState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private keys: Set<string> = new Set();
  private lastTime: number = 0;
  private animationId: number | null = null;
  private stars: { x: number; y: number; size: number; brightness: number; parallax: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = this.initializeGame();
    this.setupEventListeners();
    this.initializeStars();
  }

  private initializeStars() {
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * 2000,
        y: Math.random() * this.canvas.height * 0.7,
        size: 2 + (i % 3),
        brightness: 0.3 + (i % 5) * 0.15,
        parallax: 0.1 + (i % 5) * 0.1,
      });
    }
  }

  private initializeGame(): GameState {
    const player: Player = {
      id: 'player',
      position: { x: 100, y: 300 },
      velocity: { x: 0, y: 0 },
      size: { x: 40, y: 40 },
      type: 'player',
      active: true,
      health: 3,
      score: 0,
      isJumping: false,
      isGrounded: false,
      facing: 'right',
      invincible: false,
      animationFrame: 0,
    };

    const level = createLevel(1);

    return {
      player,
      enemies: level.enemies,
      platforms: level.platforms,
      powerUps: level.powerUps,
      goal: level.goal,
      particles: [],
      camera: { x: 0, y: 0 },
      level: 1,
      gameOver: false,
      levelComplete: false,
      paused: false,
      score: 0,
      time: 300,
    };
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  private handleInput() {
    const { player } = this.state;

    if (this.keys.has('arrowleft') || this.keys.has('a')) {
      player.velocity.x = -MOVE_SPEED;
      player.facing = 'left';
      player.animationFrame = (player.animationFrame + 0.3) % 4;
    } else if (this.keys.has('arrowright') || this.keys.has('d')) {
      player.velocity.x = MOVE_SPEED;
      player.facing = 'right';
      player.animationFrame = (player.animationFrame + 0.3) % 4;
    } else {
      player.animationFrame = 0;
    }

    if ((this.keys.has(' ') || this.keys.has('arrowup') || this.keys.has('w')) && 
        player.isGrounded && !player.isJumping) {
      player.velocity.y = JUMP_FORCE;
      player.isJumping = true;
      player.isGrounded = false;
      
      this.state.particles.push(
        ...particleBurst(
          { x: player.position.x + player.size.x / 2, y: player.position.y + player.size.y },
          5,
          '#00FFF0',
          2
        )
      );
    }

    if (this.keys.has('escape')) {
      this.state.paused = !this.state.paused;
      this.keys.delete('escape');
    }
  }

  private updateCamera() {
    const targetX = this.state.player.position.x - this.canvas.width / 2;
    this.state.camera.x += (targetX - this.state.camera.x) * 0.1;
    this.state.camera.x = Math.max(0, this.state.camera.x);
  }

  private updateGame(deltaTime: number) {
    if (this.state.paused || this.state.gameOver || this.state.levelComplete) return;

    this.handleInput();
    
    this.state.player.isGrounded = false;
    updatePhysics(this.state.player, deltaTime);

    for (const platform of this.state.platforms) {
      if (platform.movement) {
        const time = Date.now() / 1000;
        if (platform.movement.direction === 'horizontal') {
          platform.position.x = platform.movement.range * Math.sin(time * platform.movement.speed);
        } else {
          platform.position.y = platform.movement.range * Math.sin(time * platform.movement.speed);
        }
      }

      if (checkCollision(this.state.player, platform)) {
        resolveCollision(this.state.player, platform);
      }
    }

    for (const enemy of this.state.enemies) {
      // Handle different enemy types
      if (enemy.enemyType === 'flying') {
        // Flying enemies hover
        enemy.velocity.y = Math.sin(Date.now() / 500) * 2;
      } else if (enemy.enemyType === 'jumper') {
        // Jumper enemies jump periodically
        enemy.jumpTimer = (enemy.jumpTimer || 0) + deltaTime;
        if (enemy.jumpTimer > 60 && enemy.velocity.y === 0) {
          enemy.velocity.y = -10;
          enemy.jumpTimer = 0;
        }
        updatePhysics(enemy, deltaTime);
        
        // Check ground collision for jumpers
        for (const platform of this.state.platforms) {
          if (checkCollision(enemy, platform)) {
            resolveCollision(enemy, platform);
          }
        }
      } else {
        updatePhysics(enemy, deltaTime);
      }
      
      if (enemy.velocity.x === 0) {
        enemy.velocity.x = enemy.enemyType === 'flying' ? 1.5 : 1;
      }
      
      if (enemy.position.x <= enemy.patrol.start || enemy.position.x >= enemy.patrol.end) {
        enemy.velocity.x *= -1;
      }

      enemy.animationFrame = ((enemy.animationFrame || 0) + 0.2) % 2;

      if (checkCollision(this.state.player, enemy)) {
        // Spiky enemies can't be jumped on
        if (enemy.enemyType === 'spiky') {
          if (!this.state.player.invincible) {
            this.state.player.health--;
            this.state.player.invincible = true;
            this.state.player.velocity.x = -this.state.player.velocity.x * 2;
            this.state.player.velocity.y = -8;
            
            setTimeout(() => {
              this.state.player.invincible = false;
            }, 2000);
            
            if (this.state.player.health <= 0) {
              this.state.gameOver = true;
            }
          }
        } else if (this.state.player.velocity.y > 0 && 
                   this.state.player.position.y < enemy.position.y) {
          // Can jump on non-spiky enemies
          enemy.health--;
          if (enemy.health <= 0) {
            enemy.active = false;
            this.state.score += enemy.enemyType === 'koopa' ? 200 : 100;
          }
          this.state.player.velocity.y = JUMP_FORCE / 2;
          
          this.state.particles.push(
            ...particleBurst(
              { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 },
              10,
              enemy.health <= 0 ? '#FF10F0' : '#FF6B6B',
              4
            )
          );
        } else if (!this.state.player.invincible) {
          this.state.player.health--;
          this.state.player.invincible = true;
          setTimeout(() => {
            this.state.player.invincible = false;
          }, 2000);
          
          if (this.state.player.health <= 0) {
            this.state.gameOver = true;
          }
        }
      }
    }

    this.state.enemies = this.state.enemies.filter(e => e.active);

    for (const powerUp of this.state.powerUps) {
      powerUp.position.y += Math.sin(Date.now() / 200) * 0.5;
      
      if (checkCollision(this.state.player, powerUp)) {
        powerUp.active = false;
        this.state.score += 500;
        this.state.player.powerUp = 'super';
        
        this.state.particles.push(
          ...particleBurst(
            { x: powerUp.position.x + powerUp.size.x / 2, y: powerUp.position.y + powerUp.size.y / 2 },
            15,
            '#39FF14',
            6
          )
        );
      }
    }

    this.state.powerUps = this.state.powerUps.filter(p => p.active);

    // Check goal collision
    if (this.state.goal && checkCollision(this.state.player, this.state.goal)) {
      this.state.levelComplete = true;
      this.state.score += 1000;
      
      // Victory particle effect
      this.state.particles.push(
        ...particleBurst(
          { x: this.state.goal.position.x + this.state.goal.size.x / 2, 
            y: this.state.goal.position.y + this.state.goal.size.y / 2 },
          30,
          '#FFD700',
          8
        )
      );
    }

    for (const particle of this.state.particles) {
      updatePhysics(particle, deltaTime);
      particle.lifespan--;
      
      if (particle.lifespan <= 0) {
        particle.active = false;
      }
    }

    this.state.particles = this.state.particles.filter(p => p.active);

    if (this.state.player.position.y > this.canvas.height + 100) {
      this.state.gameOver = true;
    }

    this.updateCamera();
  }

  private renderBackground() {
    for (let layer = 0; layer < 3; layer++) {
      const parallaxSpeed = 0.2 + layer * 0.3;
      const offsetX = this.state.camera.x * parallaxSpeed;
      
      this.ctx.fillStyle = `rgba(157, 0, 255, ${0.05 + layer * 0.02})`;
      
      for (let i = 0; i < 20; i++) {
        const x = (i * 200 - offsetX) % (this.canvas.width + 200);
        const y = 100 + layer * 50 + Math.sin((Date.now() / 1000 + i) * 0.5) * 20;
        const size = 80 - layer * 20;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - size/2, y + size);
        this.ctx.lineTo(x + size/2, y + size);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
    
    for (const star of this.stars) {
      const x = (star.x - this.state.camera.x * star.parallax) % 2000;
      const screenX = x < 0 ? x + 2000 : x;
      
      if (screenX > -10 && screenX < this.canvas.width + 10) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        this.ctx.fillRect(screenX, star.y, star.size, star.size);
      }
    }
  }

  private render() {
    this.ctx.fillStyle = '#0A0A0F';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, 'rgba(157, 0, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 240, 0.05)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderBackground();

    this.ctx.save();
    this.ctx.translate(-this.state.camera.x, -this.state.camera.y);

    for (const platform of this.state.platforms) {
      this.ctx.fillStyle = platform.platformType === 'cloud' ? 'rgba(255, 255, 255, 0.3)' : '#9D00FF';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = platform.platformType === 'cloud' ? '#00FFF0' : '#9D00FF';
      
      if (platform.platformType === 'cloud') {
        const x = platform.position.x;
        const y = platform.position.y;
        const w = platform.size.x;
        const h = platform.size.y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + 20, y + h);
        this.ctx.bezierCurveTo(x + 20, y + h - 10, x + 10, y + h - 10, x + 10, y + h/2);
        this.ctx.bezierCurveTo(x + 10, y, x + 30, y, x + 40, y + 10);
        this.ctx.bezierCurveTo(x + 50, y, x + 70, y, x + 70, y + h/2);
        this.ctx.bezierCurveTo(x + 70, y + h - 10, x + 60, y + h - 10, x + 60, y + h);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        this.ctx.fillRect(platform.position.x, platform.position.y, platform.size.x, platform.size.y);
      }
      
      this.ctx.shadowBlur = 0;
    }

    for (const enemy of this.state.enemies) {
      const bounce = enemy.enemyType === 'jumper' ? 0 : Math.sin(Date.now() / 200) * 5;
      
      // Set colors based on enemy type
      switch (enemy.enemyType) {
        case 'goomba':
          this.ctx.fillStyle = '#FF10F0';
          this.ctx.shadowColor = '#FF10F0';
          break;
        case 'koopa':
          this.ctx.fillStyle = '#00FF88';
          this.ctx.shadowColor = '#00FF88';
          break;
        case 'flying':
          this.ctx.fillStyle = '#FF6B6B';
          this.ctx.shadowColor = '#FF6B6B';
          break;
        case 'spiky':
          this.ctx.fillStyle = '#FF4444';
          this.ctx.shadowColor = '#FF4444';
          break;
        case 'jumper':
          this.ctx.fillStyle = '#FFB700';
          this.ctx.shadowColor = '#FFB700';
          break;
      }
      
      this.ctx.shadowBlur = 15;
      
      // Draw enemy body
      if (enemy.enemyType === 'spiky') {
        // Draw spiky enemy with spikes
        this.ctx.fillRect(enemy.position.x, enemy.position.y + 5, enemy.size.x, enemy.size.y - 5);
        
        // Draw spikes on top
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(enemy.position.x + i * 12 + 5, enemy.position.y + 5);
          this.ctx.lineTo(enemy.position.x + i * 12 + 10, enemy.position.y);
          this.ctx.lineTo(enemy.position.x + i * 12 + 15, enemy.position.y + 5);
          this.ctx.closePath();
          this.ctx.fill();
        }
      } else if (enemy.enemyType === 'flying') {
        // Draw flying enemy with wings
        this.ctx.fillRect(enemy.position.x + 5, enemy.position.y, enemy.size.x - 10, enemy.size.y);
        
        // Wings
        const wingFlap = Math.sin(Date.now() / 100) * 5;
        this.ctx.fillRect(enemy.position.x - 5, enemy.position.y + 5 + wingFlap, 10, 15);
        this.ctx.fillRect(enemy.position.x + enemy.size.x - 5, enemy.position.y + 5 - wingFlap, 10, 15);
      } else {
        this.ctx.fillRect(
          enemy.position.x, 
          enemy.position.y + bounce, 
          enemy.size.x, 
          enemy.size.y
        );
      }
      
      // Draw eyes
      this.ctx.fillStyle = '#FFFFFF';
      if (enemy.enemyType !== 'spiky') {
        this.ctx.fillRect(
          enemy.position.x + 5 + (enemy.velocity.x > 0 ? 10 : 0), 
          enemy.position.y + 10 + bounce, 
          6, 6
        );
        this.ctx.fillRect(
          enemy.position.x + 17 + (enemy.velocity.x > 0 ? 10 : 0), 
          enemy.position.y + 10 + bounce, 
          6, 6
        );
      }
      
      // Health indicator for tougher enemies
      if (enemy.health > 1) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText(enemy.health.toString(), enemy.position.x + enemy.size.x / 2 - 4, enemy.position.y - 5);
      }
      
      this.ctx.shadowBlur = 0;
    }

    for (const powerUp of this.state.powerUps) {
      this.ctx.fillStyle = '#39FF14';
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = '#39FF14';
      
      const pulse = Math.sin(Date.now() / 100) * 0.2 + 1;
      this.ctx.save();
      this.ctx.translate(
        powerUp.position.x + powerUp.size.x / 2,
        powerUp.position.y + powerUp.size.y / 2
      );
      this.ctx.scale(pulse, pulse);
      this.ctx.fillRect(
        -powerUp.size.x / 2,
        -powerUp.size.y / 2,
        powerUp.size.x,
        powerUp.size.y
      );
      this.ctx.restore();
      
      this.ctx.shadowBlur = 0;
    }

    const player = this.state.player;
    if (!player.invincible || Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.fillStyle = player.powerUp === 'super' ? '#00FFF0' : '#00FFF0';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#00FFF0';
      
      const squash = player.isJumping ? 1.1 : 1;
      const stretch = player.isJumping ? 0.9 : 1;
      
      this.ctx.save();
      this.ctx.translate(
        player.position.x + player.size.x / 2,
        player.position.y + player.size.y / 2
      );
      this.ctx.scale(squash, stretch);
      this.ctx.fillRect(
        -player.size.x / 2,
        -player.size.y / 2,
        player.size.x,
        player.size.y
      );
      
      this.ctx.fillStyle = '#FFFFFF';
      const eyeOffset = player.facing === 'right' ? 5 : -5;
      this.ctx.fillRect(eyeOffset, -10, 8, 8);
      this.ctx.fillRect(eyeOffset + 12, -10, 8, 8);
      
      this.ctx.restore();
      this.ctx.shadowBlur = 0;
    }

    // Draw goal
    if (this.state.goal) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = '#FFD700';
      
      const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
      
      // Goal flag pole
      this.ctx.fillRect(
        this.state.goal.position.x + this.state.goal.size.x / 2 - 3,
        this.state.goal.position.y,
        6,
        this.state.goal.size.y
      );
      
      // Flag
      this.ctx.save();
      this.ctx.translate(
        this.state.goal.position.x + this.state.goal.size.x / 2,
        this.state.goal.position.y + 20
      );
      this.ctx.scale(pulse, pulse);
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(40, 10);
      this.ctx.lineTo(0, 20);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.restore();
      
      // Star on flag
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillText('⭐', this.state.goal.position.x + this.state.goal.size.x / 2 + 10, this.state.goal.position.y + 35);
      
      this.ctx.shadowBlur = 0;
    }

    for (const particle of this.state.particles) {
      const alpha = particle.fadeOut ? particle.lifespan / particle.maxLifespan : 1;
      this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.fillRect(
        particle.position.x,
        particle.position.y,
        particle.size.x,
        particle.size.y
      );
    }

    this.ctx.restore();

    this.renderUI();
  }

  private renderUI() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, 60);
    
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillStyle = '#00FFF0';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00FFF0';
    this.ctx.fillText(`SCORE: ${this.state.score}`, 20, 40);
    
    this.ctx.fillStyle = '#FF10F0';
    this.ctx.shadowColor = '#FF10F0';
    this.ctx.fillText(`HEALTH: ${'❤️'.repeat(Math.max(0, this.state.player.health))}`, this.canvas.width / 2 - 80, 40);
    
    this.ctx.fillStyle = '#39FF14';
    this.ctx.shadowColor = '#39FF14';
    this.ctx.fillText(`LEVEL: ${this.state.level}`, this.canvas.width - 150, 40);
    
    this.ctx.shadowBlur = 0;

    if (this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.font = 'bold 72px monospace';
      this.ctx.fillStyle = '#FF10F0';
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = '#FF10F0';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      
      this.ctx.font = 'bold 24px monospace';
      this.ctx.fillStyle = '#00FFF0';
      this.ctx.shadowColor = '#00FFF0';
      this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
      this.ctx.textAlign = 'left';
      
      this.ctx.shadowBlur = 0;
    }

    if (this.state.levelComplete) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.font = 'bold 72px monospace';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = '#FFD700';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
      
      this.ctx.font = 'bold 36px monospace';
      this.ctx.fillStyle = '#39FF14';
      this.ctx.shadowColor = '#39FF14';
      this.ctx.fillText(`FINAL SCORE: ${this.state.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      
      this.ctx.font = 'bold 24px monospace';
      this.ctx.fillStyle = '#00FFF0';
      this.ctx.shadowColor = '#00FFF0';
      this.ctx.fillText('Press R to play again', this.canvas.width / 2, this.canvas.height / 2 + 80);
      this.ctx.textAlign = 'left';
      
      this.ctx.shadowBlur = 0;
    }

    if (this.state.paused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.font = 'bold 48px monospace';
      this.ctx.fillStyle = '#00FFF0';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#00FFF0';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
      
      this.ctx.shadowBlur = 0;
    }
  }

  private gameLoop = (currentTime: number) => {
    const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2);
    this.lastTime = currentTime;

    this.updateGame(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  restart() {
    this.state = this.initializeGame();
  }
}