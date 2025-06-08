const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const GRAVITY = 0.8;
const GROUND_Y = CANVAS_HEIGHT - 100;

let gameState = 'start';
let camera = { x: 0, y: 0 };
let gameSpeed = 2;

const game = {
    score: 0,
    lives: 3,
    coins: 0,
    level: 1,
    time: 400
};

const keys = {};

const player = {
    x: 100,
    y: GROUND_Y - 64,
    width: 32,
    height: 64,
    velX: 0,
    velY: 0,
    speed: 5,
    jumpPower: 18,
    onGround: false,
    direction: 1,
    invulnerable: false,
    invulnerabilityTime: 0,
    color: '#FF0000',
    animFrame: 0,
    animTimer: 0
};

const platforms = [
    { x: 0, y: GROUND_Y, width: CANVAS_WIDTH * 3, height: 100 },
    { x: 300, y: GROUND_Y - 150, width: 200, height: 20 },
    { x: 600, y: GROUND_Y - 100, width: 150, height: 20 },
    { x: 900, y: GROUND_Y - 200, width: 180, height: 20 },
    { x: 1200, y: GROUND_Y - 120, width: 120, height: 20 },
    { x: 1500, y: GROUND_Y - 180, width: 200, height: 20 },
    { x: 1800, y: GROUND_Y - 80, width: 160, height: 20 },
    { x: 2100, y: GROUND_Y - 160, width: 140, height: 20 },
    { x: 2400, y: GROUND_Y - 220, width: 300, height: 20 }
];

const enemies = [
    { x: 400, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true },
    { x: 700, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true },
    { x: 1000, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true },
    { x: 1300, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true },
    { x: 1600, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true },
    { x: 1900, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true },
    { x: 2200, y: GROUND_Y - 40, width: 32, height: 32, velX: -1, type: 'goomba', alive: true }
];

const coins = [
    { x: 350, y: GROUND_Y - 200, width: 24, height: 24, collected: false },
    { x: 650, y: GROUND_Y - 150, width: 24, height: 24, collected: false },
    { x: 950, y: GROUND_Y - 250, width: 24, height: 24, collected: false },
    { x: 1250, y: GROUND_Y - 170, width: 24, height: 24, collected: false },
    { x: 1550, y: GROUND_Y - 230, width: 24, height: 24, collected: false },
    { x: 1850, y: GROUND_Y - 130, width: 24, height: 24, collected: false },
    { x: 2150, y: GROUND_Y - 210, width: 24, height: 24, collected: false },
    { x: 2450, y: GROUND_Y - 270, width: 24, height: 24, collected: false }
];

const flag = { x: 2600, y: GROUND_Y - 200, width: 20, height: 200 };

// Audio Context and Web Audio API for better sounds
let audioContext;
let sounds = {};

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createBGM();
        createSoundEffects();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function createBGM() {
    // Create a cheerful Mario-style BGM
    const bgmData = generateBGM();
    const audioBuffer = audioContext.createBuffer(1, bgmData.length, audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(bgmData);
    
    sounds.bgm = {
        buffer: audioBuffer,
        play() {
            if (this.source) {
                this.source.stop();
            }
            this.source = audioContext.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.loop = true;
            this.source.connect(audioContext.destination);
            this.source.start();
        },
        stop() {
            if (this.source) {
                this.source.stop();
                this.source = null;
            }
        }
    };
}

function generateBGM() {
    const sampleRate = audioContext.sampleRate;
    const duration = 10; // 10 seconds loop
    const length = sampleRate * duration;
    const data = new Float32Array(length);
    
    // Original melody inspired by adventure/exploration themes
    const melody = [
        440, 494, 523, 0, 587, 0, 523, 494, 440, 0, 494, 523, 0, 587, 0, 0,
        659, 698, 659, 587, 523, 0, 494, 440, 0, 392, 0, 440, 494, 0, 0, 0,
        349, 392, 440, 0, 494, 523, 0, 587, 659, 0, 698, 0, 659, 587, 523, 0,
        784, 0, 659, 0, 587, 523, 494, 440, 392, 0, 349, 0, 0, 0, 0, 0
    ];
    
    // Bass line with adventure feel
    const bass = [
        220, 0, 220, 0, 246, 0, 246, 0, 261, 0, 261, 0, 293, 0, 293, 0,
        220, 0, 220, 0, 246, 0, 246, 0, 261, 0, 261, 0, 293, 0, 293, 0,
        174, 0, 174, 0, 196, 0, 196, 0, 220, 0, 220, 0, 246, 0, 246, 0,
        261, 0, 261, 0, 293, 0, 293, 0, 329, 0, 329, 0, 349, 0, 349, 0
    ];
    
    // Add harmonic accompaniment
    const harmony = [
        0, 330, 0, 370, 0, 415, 0, 466, 0, 523, 0, 466, 0, 415, 0, 370,
        0, 349, 0, 392, 0, 440, 0, 494, 0, 523, 0, 494, 0, 440, 0, 392,
        0, 262, 0, 294, 0, 330, 0, 370, 0, 415, 0, 466, 0, 523, 0, 587,
        0, 659, 0, 587, 0, 523, 0, 466, 0, 415, 0, 370, 0, 330, 0, 294
    ];
    
    const noteLength = length / melody.length;
    
    for (let i = 0; i < length; i++) {
        const noteIndex = Math.floor(i / noteLength);
        const t = i / sampleRate;
        
        const melodyFreq = melody[noteIndex % melody.length];
        const bassFreq = bass[noteIndex % bass.length];
        const harmonyFreq = harmony[noteIndex % harmony.length];
        
        let sample = 0;
        
        // Main melody with warm sine wave
        if (melodyFreq > 0) {
            sample += Math.sin(2 * Math.PI * melodyFreq * t) * 0.25;
            sample += Math.sin(2 * Math.PI * melodyFreq * 1.5 * t) * 0.08;
        }
        
        // Bass line with deeper tone
        if (bassFreq > 0) {
            sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.15;
            sample += Math.sin(2 * Math.PI * bassFreq * 0.5 * t) * 0.05;
        }
        
        // Harmony layer
        if (harmonyFreq > 0) {
            sample += Math.sin(2 * Math.PI * harmonyFreq * t) * 0.12;
        }
        
        // Dynamic envelope for natural feel
        const noteProgress = (i % noteLength) / noteLength;
        const envelope = Math.sin(Math.PI * noteProgress) * 0.8 + 0.2;
        sample *= envelope;
        
        // Add subtle reverb effect
        const reverbDelay = Math.floor(sampleRate * 0.05);
        if (i >= reverbDelay) {
            sample += data[i - reverbDelay] * 0.15;
        }
        
        data[i] = sample * 0.4; // Master volume
    }
    
    return data;
}

function createSoundEffects() {
    // Jump sound
    sounds.jump = createSoundEffect([
        {freq: 220, duration: 0.1, type: 'square'},
        {freq: 330, duration: 0.1, type: 'square'}
    ]);
    
    // Coin sound
    sounds.coin = createSoundEffect([
        {freq: 523, duration: 0.1, type: 'sine'},
        {freq: 659, duration: 0.1, type: 'sine'},
        {freq: 784, duration: 0.2, type: 'sine'}
    ]);
    
    // Enemy defeat sound
    sounds.enemy = createSoundEffect([
        {freq: 150, duration: 0.1, type: 'sawtooth'},
        {freq: 100, duration: 0.2, type: 'sawtooth'}
    ]);
    
    // Game over sound
    sounds.gameOver = createSoundEffect([
        {freq: 220, duration: 0.3, type: 'triangle'},
        {freq: 196, duration: 0.3, type: 'triangle'},
        {freq: 174, duration: 0.5, type: 'triangle'}
    ]);
    
    // Level complete sound
    sounds.levelComplete = createSoundEffect([
        {freq: 523, duration: 0.2, type: 'sine'},
        {freq: 659, duration: 0.2, type: 'sine'},
        {freq: 784, duration: 0.2, type: 'sine'},
        {freq: 1047, duration: 0.4, type: 'sine'}
    ]);
}

function createSoundEffect(notes) {
    const sampleRate = audioContext.sampleRate;
    const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
    const length = sampleRate * totalDuration;
    const data = new Float32Array(length);
    
    let currentTime = 0;
    let currentSample = 0;
    
    notes.forEach(note => {
        const noteSamples = sampleRate * note.duration;
        
        for (let i = 0; i < noteSamples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3); // Decay envelope
            
            let sample = 0;
            switch (note.type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * note.freq * t);
                    break;
                case 'square':
                    sample = Math.sign(Math.sin(2 * Math.PI * note.freq * t));
                    break;
                case 'sawtooth':
                    sample = 2 * (t * note.freq % 1) - 1;
                    break;
                case 'triangle':
                    sample = 2 * Math.abs(2 * (t * note.freq % 1) - 1) - 1;
                    break;
            }
            
            data[currentSample + i] = sample * envelope * 0.3;
        }
        
        currentSample += noteSamples;
    });
    
    const audioBuffer = audioContext.createBuffer(1, length, sampleRate);
    audioBuffer.getChannelData(0).set(data);
    
    return {
        buffer: audioBuffer,
        play() {
            const source = audioContext.createBufferSource();
            source.buffer = this.buffer;
            source.connect(audioContext.destination);
            source.start();
        }
    };
}

function startGame() {
    // Initialize audio on first user interaction
    if (!audioContext) {
        initAudio();
    }
    
    document.getElementById('startScreen').style.display = 'none';
    gameState = 'playing';
    playBGM();
    gameLoop();
}

function restartGame() {
    // Reset game state
    game.score = 0;
    game.lives = 3;
    game.coins = 0;
    game.level = 1;
    game.time = 400;
    
    // Reset player
    player.x = 100;
    player.y = GROUND_Y - 64;
    player.velX = 0;
    player.velY = 0;
    player.onGround = false;
    player.invulnerable = false;
    player.invulnerabilityTime = 0;
    
    // Reset camera
    camera.x = 0;
    
    // Reset enemies
    enemies.forEach((enemy, index) => {
        enemy.alive = true;
        enemy.velX = -1;
        // Reset enemy positions
        switch(index) {
            case 0: enemy.x = 400; break;
            case 1: enemy.x = 700; break;
            case 2: enemy.x = 1000; break;
            case 3: enemy.x = 1300; break;
            case 4: enemy.x = 1600; break;
            case 5: enemy.x = 1900; break;
            case 6: enemy.x = 2200; break;
        }
    });
    
    // Reset coins
    coins.forEach(coin => {
        coin.collected = false;
    });
    
    // Hide game over/clear screens
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('gameClearScreen').style.display = 'none';
    
    // Set game state and restart
    gameState = 'playing';
    updateUI();
    playBGM();
    
    // Restart game loop
    gameLoop();
}

function playBGM() {
    if (sounds.bgm) {
        sounds.bgm.play();
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'KeyW') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function updatePlayer() {
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velX = -player.speed;
        player.direction = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velX = player.speed;
        player.direction = 1;
    } else {
        player.velX *= 0.8;
    }
    
    if ((keys['Space'] || keys['KeyW']) && player.onGround) {
        player.velY = -player.jumpPower;
        player.onGround = false;
        if (sounds.jump) sounds.jump.play();
    }
    
    player.velY += GRAVITY;
    
    player.x += player.velX;
    player.y += player.velY;
    
    player.onGround = false;
    
    for (const platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            if (player.velY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velY = 0;
                player.onGround = true;
            }
        }
    }
    
    if (player.x < 0) {
        player.x = 0;
    }
    
    if (player.y > CANVAS_HEIGHT) {
        loseLife();
    }
    
    if (player.invulnerable) {
        player.invulnerabilityTime--;
        if (player.invulnerabilityTime <= 0) {
            player.invulnerable = false;
        }
    }
    
    player.animTimer++;
    if (player.animTimer > 8) {
        player.animFrame = (player.animFrame + 1) % 4;
        player.animTimer = 0;
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        enemy.x += enemy.velX;
        
        let onPlatform = false;
        for (const platform of platforms) {
            if (enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y + enemy.height >= platform.y &&
                enemy.y + enemy.height <= platform.y + 20) {
                onPlatform = true;
                break;
            }
        }
        
        if (!onPlatform || enemy.x < 0) {
            enemy.velX *= -1;
        }
        
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            if (player.velY > 0 && player.y < enemy.y - 10) {
                enemy.alive = false;
                player.velY = -10;
                game.score += 100;
                if (sounds.enemy) sounds.enemy.play();
            } else if (!player.invulnerable) {
                loseLife();
            }
        }
    });
}

function updateCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;
        
        if (player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            game.coins++;
            game.score += 200;
            if (sounds.coin) sounds.coin.play();
            
            if (game.coins >= 8) {
                completeLevel();
            }
        }
    });
}

function checkFlag() {
    if (player.x + player.width > flag.x && player.x < flag.x + flag.width) {
        completeLevel();
    }
}

function loseLife() {
    if (player.invulnerable) return;
    
    game.lives--;
    player.invulnerable = true;
    player.invulnerabilityTime = 120;
    
    if (game.lives <= 0) {
        gameOver();
    } else {
        player.x = 100;
        player.y = GROUND_Y - 64;
        player.velX = 0;
        player.velY = 0;
        camera.x = 0;
    }
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('gameOverScreen').style.display = 'block';
    document.getElementById('finalScore').textContent = game.score;
    if (sounds.gameOver) sounds.gameOver.play();
    if (sounds.bgm) sounds.bgm.stop();
}

function completeLevel() {
    gameState = 'levelComplete';
    document.getElementById('gameClearScreen').style.display = 'block';
    document.getElementById('clearScore').textContent = game.score;
    if (sounds.levelComplete) sounds.levelComplete.play();
    if (sounds.bgm) sounds.bgm.stop();
}

function updateCamera() {
    const targetX = player.x - CANVAS_WIDTH / 2;
    camera.x = Math.max(0, Math.min(targetX, 2700 - CANVAS_WIDTH));
}

function updateUI() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('lives').textContent = game.lives;
    document.getElementById('coins').textContent = game.coins;
}

function drawPlayer() {
    ctx.save();
    
    if (player.invulnerable && Math.floor(player.invulnerabilityTime / 5) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    const x = player.x - camera.x;
    const y = player.y;
    
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, player.width, player.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 4, y + 4, 8, 8);
    ctx.fillRect(x + 20, y + 4, 8, 8);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 6, y + 6, 4, 4);
    ctx.fillRect(x + 22, y + 6, 4, 4);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 8, y + 14, 16, 8);
    
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(x + 2, y + 24, 28, 20);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 6, y + 28, 20, 4);
    ctx.fillRect(x + 10, y + 32, 12, 4);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 4, y + 44, 24, 12);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 2, y + 56, 12, 8);
    ctx.fillRect(x + 18, y + 56, 12, 8);
    
    ctx.restore();
}

function drawPlatforms() {
    platforms.forEach(platform => {
        const x = platform.x - camera.x;
        const y = platform.y;
        
        if (x + platform.width > 0 && x < CANVAS_WIDTH) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, platform.width, platform.height);
            
            ctx.fillStyle = '#228B22';
            if (platform.height > 50) {
                ctx.fillRect(x, y - 10, platform.width, 10);
            }
            
            for (let i = 0; i < platform.width; i += 40) {
                ctx.fillStyle = '#654321';
                ctx.fillRect(x + i, y + 10, 2, platform.height - 20);
            }
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const x = enemy.x - camera.x;
        const y = enemy.y;
        
        if (x + enemy.width > 0 && x < CANVAS_WIDTH) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, enemy.width, enemy.height);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 4, y + 4, 6, 6);
            ctx.fillRect(x + 22, y + 4, 6, 6);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 6, y + 6, 2, 2);
            ctx.fillRect(x + 24, y + 6, 2, 2);
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(x + 8, y + 16, 16, 8);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 4, y + 24, 8, 8);
            ctx.fillRect(x + 20, y + 24, 8, 8);
        }
    });
}

function drawCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;
        
        const x = coin.x - camera.x;
        const y = coin.y;
        
        if (x + coin.width > 0 && x < CANVAS_WIDTH) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x, y, coin.width, coin.height);
            
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(x + 2, y + 2, coin.width - 4, coin.height - 4);
            
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + 4, y + 4, coin.width - 8, coin.height - 8);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 8, y + 8, 8, 8);
        }
    });
}

function drawFlag() {
    const x = flag.x - camera.x;
    const y = flag.y;
    
    if (x + flag.width > 0 && x < CANVAS_WIDTH) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, 8, flag.height);
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 8, y, 60, 40);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 8, y + 40, 60, 40);
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#98FB98');
    gradient.addColorStop(1, '#8B4513');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    for (let i = 0; i < 10; i++) {
        const cloudX = (i * 300 - camera.x * 0.5) % (CANVAS_WIDTH + 100);
        const cloudY = 50 + Math.sin(i) * 30;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 30, cloudY, 40, 0, Math.PI * 2);
        ctx.arc(cloudX + 60, cloudY, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawBackground();
    drawPlatforms();
    drawCoins();
    drawEnemies();
    drawPlayer();
    drawFlag();
}

function gameLoop() {
    if (gameState !== 'playing') return;
    
    updatePlayer();
    updateEnemies();
    updateCoins();
    checkFlag();
    updateCamera();
    updateUI();
    render();
    
    requestAnimationFrame(gameLoop);
}

function backToTitle() {
    // Reset game state
    game.score = 0;
    game.lives = 3;
    game.coins = 0;
    game.level = 1;
    game.time = 400;
    
    // Reset player
    player.x = 100;
    player.y = GROUND_Y - 64;
    player.velX = 0;
    player.velY = 0;
    player.onGround = false;
    player.invulnerable = false;
    player.invulnerabilityTime = 0;
    
    // Reset camera
    camera.x = 0;
    
    // Reset enemies
    enemies.forEach((enemy, index) => {
        enemy.alive = true;
        enemy.velX = -1;
        switch(index) {
            case 0: enemy.x = 400; break;
            case 1: enemy.x = 700; break;
            case 2: enemy.x = 1000; break;
            case 3: enemy.x = 1300; break;
            case 4: enemy.x = 1600; break;
            case 5: enemy.x = 1900; break;
            case 6: enemy.x = 2200; break;
        }
    });
    
    // Reset coins
    coins.forEach(coin => {
        coin.collected = false;
    });
    
    // Hide all game screens
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('gameClearScreen').style.display = 'none';
    
    // Show title screen
    document.getElementById('startScreen').style.display = 'block';
    
    // Stop BGM
    if (sounds.bgm) sounds.bgm.stop();
    
    // Set game state to start
    gameState = 'start';
    updateUI();
}

window.addEventListener('load', () => {
    updateUI();
});