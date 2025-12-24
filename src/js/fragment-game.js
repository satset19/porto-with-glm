/**
 * FRAGMENT COLLECTOR MINIGAME
 * A simple arcade-style game for the portfolio
 * Collect falling blue fragments, avoid red ones
 */

class FragmentGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.isPlaying = false;
        this.isGameOver = false;

        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('fragmentHighScore')) || 0;

        // Player
        this.player = {
            x: 0,
            y: 0,
            width: 50,
            height: 10,
            speed: 8
        };

        // Fragments (falling objects)
        this.fragments = [];
        this.fragmentSpeed = 2;
        this.spawnRate = 60; // frames between spawns
        this.spawnCounter = 0;

        // Particles (effects)
        this.particles = [];

        // Colors matching portfolio theme
        this.colors = {
            electricBlue: '#00F0FF',
            vaporwavePink: '#FF006E',
            cyberPurple: '#8338EC',
            background: '#0A0A0F'
        };

        // Mouse position
        this.mouseX = 0;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateUI();
        this.renderStartScreen();

        // Update high score display
        const highScoreEl = document.getElementById('highScore');
        if (highScoreEl) {
            highScoreEl.textContent = this.highScore;
        }
    }

    setupCanvas() {
        // Set canvas size
        const wrapper = this.canvas.parentElement;
        const size = Math.min(wrapper.offsetWidth, 600);
        this.canvas.width = size;
        this.canvas.height = size * 0.75;

        // Center player
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height - 30;

        this.mouseX = this.canvas.width / 2;
    }

    setupEventListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        // Touch movement
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
        }, { passive: false });

        // Click to start
        this.canvas.addEventListener('click', () => {
            if (!this.isPlaying && !this.isGameOver) {
                this.startGame();
            }
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.isPlaying && !this.isGameOver) {
                    this.startGame();
                } else if (this.isGameOver) {
                    this.restartGame();
                }
            }
        });

        // Start button
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        // Restart button
        const restartBtn = document.getElementById('restartGameBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }

        // Resize handler
        window.addEventListener('resize', () => {
            if (!this.isPlaying) {
                this.setupCanvas();
            }
        });
    }

    startGame() {
        this.isPlaying = true;
        this.isGameOver = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.fragments = [];
        this.particles = [];
        this.fragmentSpeed = 2;
        this.spawnRate = 60;

        // Hide overlay
        const overlay = document.getElementById('gameOverlay');
        if (overlay) overlay.style.display = 'none';

        this.updateUI();
        this.gameLoop();
    }

    restartGame() {
        this.startGame();
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fragmentHighScore', this.highScore);
        }

        // Show game over screen
        const overlay = document.getElementById('gameOverlay');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const startScreen = document.querySelector('.game__start-screen');

        if (overlay) overlay.style.display = 'flex';
        if (gameOverScreen) gameOverScreen.style.display = 'block';
        if (startScreen) startScreen.style.display = 'none';

        // Update final score
        const finalScoreEl = document.getElementById('finalScore');
        const highScoreEl = document.getElementById('highScore');
        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (highScoreEl) highScoreEl.textContent = this.highScore;
    }

    spawnFragment() {
        const isBad = Math.random() < 0.25; // 25% chance for bad fragment
        const size = 15 + Math.random() * 15;

        this.fragments.push({
            x: Math.random() * (this.canvas.width - size),
            y: -size,
            size: size,
            isBad: isBad,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            speed: this.fragmentSpeed * (0.8 + Math.random() * 0.4)
        });
    }

    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 2 + Math.random() * 4,
                color: color,
                life: 1
            });
        }
    }

    update() {
        if (!this.isPlaying) return;

        // Update player position (smooth follow)
        const targetX = this.mouseX - this.player.width / 2;
        this.player.x += (targetX - this.player.x) * 0.15;

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));

        // Spawn fragments
        this.spawnCounter++;
        if (this.spawnCounter >= this.spawnRate) {
            this.spawnFragment();
            this.spawnCounter = 0;
        }

        // Update fragments
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const frag = this.fragments[i];
            frag.y += frag.speed;
            frag.rotation += frag.rotationSpeed;

            // Check collision with player
            if (this.checkCollision(frag)) {
                if (frag.isBad) {
                    // Bad fragment - lose life
                    this.lives--;
                    this.createParticles(frag.x, frag.y, this.colors.vaporwavePink, 15);

                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                } else {
                    // Good fragment - gain score
                    this.score += 10;
                    this.createParticles(frag.x, frag.y, this.colors.electricBlue, 8);

                    // Level up every 100 points
                    if (this.score % 100 === 0) {
                        this.level++;
                        this.fragmentSpeed += 0.3;
                        this.spawnRate = Math.max(20, this.spawnRate - 5);
                    }
                }

                this.fragments.splice(i, 1);
                this.updateUI();
                continue;
            }

            // Remove fragments that are off screen
            if (frag.y > this.canvas.height + frag.size) {
                this.fragments.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollision(fragment) {
        // Simple box collision
        const fragCenterX = fragment.x + fragment.size / 2;
        const fragCenterY = fragment.y + fragment.size / 2;

        return (
            fragCenterX > this.player.x &&
            fragCenterX < this.player.x + this.player.width &&
            fragCenterY > this.player.y &&
            fragCenterY < this.player.y + this.player.height
        );
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.drawGrid();

        // Draw fragments
        this.fragments.forEach(frag => {
            this.ctx.save();
            this.ctx.translate(frag.x + frag.size / 2, frag.y + frag.size / 2);
            this.ctx.rotate(frag.rotation);

            // Glow effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = frag.isBad ? this.colors.vaporwavePink : this.colors.electricBlue;

            // Draw fragment (triangle)
            this.ctx.fillStyle = frag.isBad ? this.colors.vaporwavePink : this.colors.electricBlue;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -frag.size / 2);
            this.ctx.lineTo(frag.size / 2, frag.size / 2);
            this.ctx.lineTo(-frag.size / 2, frag.size / 2);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();
        });

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Draw player
        this.ctx.save();
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.colors.cyberPurple;
        this.ctx.fillStyle = this.colors.cyberPurple;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    renderStartScreen() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }

    updateUI() {
        const scoreEl = document.getElementById('currentScore');
        const livesEl = document.getElementById('livesCount');
        const levelEl = document.getElementById('currentLevel');

        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = this.lives;
        if (levelEl) levelEl.textContent = this.level;
    }

    gameLoop() {
        if (!this.isPlaying) return;

        this.update();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for game section to be visible
    const initGame = () => {
        const canvas = document.getElementById('gameCanvas');
        if (canvas && !canvas.dataset.initialized) {
            window.fragmentGame = new FragmentGame('gameCanvas');
            canvas.dataset.initialized = 'true';
        }
    };

    // Initialize immediately or when game section comes into view
    initGame();

    // Also initialize when game section is scrolled into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                initGame();
            }
        });
    }, { threshold: 0.1 });

    const gameSection = document.getElementById('game');
    if (gameSection) {
        observer.observe(gameSection);
    }
});

export { FragmentGame };
