const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    score: 0,
    level: 1,
    timeLeft: 60,
    gameRunning: true,
    items: [],
    miner: null
};

// 矿工类
class Miner {
    constructor() {
        this.x = canvas.width / 2;
        this.y = 30;
        this.width = 40;
        this.height = 40;
        this.hookAngle = 0;
        this.hookLength = 150;
        this.isRetracting = false;
        this.caughtItem = null;
    }

    update() {
        // 钩子旋转
        if (!this.isRetracting) {
            this.hookAngle += 0.05;
        }
    }

    draw() {
        // 绘制矿工
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        
        // 绘制头部
        ctx.fillStyle = '#FDB462';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制钩子
        const hookX = this.x + Math.sin(this.hookAngle) * this.hookLength;
        const hookY = this.y + this.height + Math.cos(this.hookAngle) * this.hookLength;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(hookX, hookY);
        ctx.stroke();
        
        // 绘制钩子头
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(hookX, hookY, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    getHookPos() {
        return {
            x: this.x + Math.sin(this.hookAngle) * this.hookLength,
            y: this.y + this.height + Math.cos(this.hookAngle) * this.hookLength
        };
    }
}

// 物品类
class Item {
    constructor(type, x, y) {
        this.type = type; // 'gold', 'diamond', 'rock', 'bomb'
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.caught = false;
        
        const valueMap = {
            gold: 10,
            diamond: 50,
            rock: 5,
            bomb: -20
        };
        this.value = valueMap[type] || 0;
    }

    draw() {
        const colorMap = {
            gold: '#FFD700',
            diamond: '#00CED1',
            rock: '#808080',
            bomb: '#FF0000'
        };
        
        ctx.fillStyle = colorMap[this.type] || '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制文字标记
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textMap = {
            gold: '金',
            diamond: '钻',
            rock: '石',
            bomb: '炸'
        };
        ctx.fillText(textMap[this.type] || '', this.x, this.y);
    }

    checkCollision(hookX, hookY) {
        const distance = Math.sqrt((this.x - hookX) ** 2 + (this.y - hookY) ** 2);
        return distance < this.radius + 8;
    }
}

// 生成物品
function generateItems() {
    gameState.items = [];
    const types = ['gold', 'gold', 'gold', 'diamond', 'rock', 'rock', 'bomb'];
    
    for (let i = 0; i < gameState.level * 3 + 5; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 200) + 150;
        gameState.items.push(new Item(type, x, y));
    }
}

// 初始化游戏
function init() {
    gameState.miner = new Miner();
    generateItems();
    
    // 点击事件
    canvas.addEventListener('click', () => {
        if (!gameState.miner.isRetracting && gameState.gameRunning) {
            checkCatch();
        }
    });
    
    // 计时器
    const timer = setInterval(() => {
        if (gameState.gameRunning) {
            gameState.timeLeft--;
            document.getElementById('timer').textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 0) {
                endGame();
                clearInterval(timer);
            }
        }
    }, 1000);
    
    gameLoop();
}

// 检查捕获
function checkCatch() {
    const hookPos = gameState.miner.getHookPos();
    
    gameState.items.forEach((item, index) => {
        if (item.checkCollision(hookPos.x, hookPos.y)) {
            gameState.score += item.value;
            gameState.items.splice(index, 1);
            playSound('catch');
        }
    });
}

// 播放音效
function playSound(type) {
    // 使用 Web Audio API 播放简单的音效
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    if (type === 'catch') {
        oscillator.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// 游戏循环
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新和绘制
    gameState.miner.update();
    gameState.miner.draw();
    
    gameState.items.forEach(item => {
        item.draw();
    });
    
    // 更新UI
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    
    requestAnimationFrame(gameLoop);
}

// 结束游戏
function endGame() {
    gameState.gameRunning = false;
    alert(`游戏结束！\n最终得分: ${gameState.score}\n关卡: ${gameState.level}`);
}

// 启动游戏
window.onload = init;
