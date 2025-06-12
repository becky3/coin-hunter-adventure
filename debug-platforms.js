const fs = require('fs');
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));

console.log('=== プラットフォーム重なりチェック ===');

function checkOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

const platforms = levelData.platforms;
const overlaps = [];

for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
        if (checkOverlap(platforms[i], platforms[j])) {
            overlaps.push({
                platform1: { index: i, ...platforms[i] },
                platform2: { index: j, ...platforms[j] }
            });
        }
    }
}

console.log('総プラットフォーム数:', platforms.length);
console.log('重なりの数:', overlaps.length);

if (overlaps.length > 0) {
    console.log('\n=== 重なっているプラットフォーム ===');
    overlaps.forEach((overlap, index) => {
        console.log(`重なり ${index + 1}:`);
        console.log(`  プラットフォーム${overlap.platform1.index}: x=${overlap.platform1.x}, y=${overlap.platform1.y}, w=${overlap.platform1.width}, h=${overlap.platform1.height}`);
        console.log(`  プラットフォーム${overlap.platform2.index}: x=${overlap.platform2.x}, y=${overlap.platform2.y}, w=${overlap.platform2.width}, h=${overlap.platform2.height}`);
        console.log('');
    });
} else {
    console.log('✓ プラットフォームに重なりはありません');
}

// 鳥が画面に表示される可能性をチェック
console.log('\n=== 鳥の表示可能性チェック ===');
const birds = levelData.enemies.filter(e => e.type === 'bird');

birds.forEach((bird, i) => {
    console.log(`鳥${i+1}: x=${bird.x}, y=${bird.y}`);
    
    // カメラ位置0での表示可能性
    const cameraX = 0;
    const x = bird.x - cameraX;
    const visible = x + 40 > 0 && x < 1024; // CANVAS_WIDTH = 1024, bird width = 40
    console.log(`  カメラ位置0での表示: ${visible ? '可能' : '不可能'} (画面内x=${x})`);
    
    // プレイヤーがその位置に到達した時の表示可能性
    const cameraXAtBird = bird.x - 512; // 画面中央
    const visibleAtBird = cameraXAtBird >= 0;
    console.log(`  プレイヤーが近づいた時の表示: ${visibleAtBird ? '可能' : '可能'}`);
});