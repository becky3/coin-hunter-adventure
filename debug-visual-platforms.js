const fs = require('fs');
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));

console.log('=== 垂直セクション（1600-2400px）のプラットフォーム配置詳細 ===');

const verticalSectionPlatforms = levelData.platforms
    .filter(p => p.x >= 1600 && p.x < 2400)
    .sort((a, b) => a.x - b.x);

console.log('垂直セクションのプラットフォーム数:', verticalSectionPlatforms.length);

verticalSectionPlatforms.forEach((platform, i) => {
    console.log(`Platform ${i + 1}: x=${platform.x}, y=${platform.y}, w=${platform.width}, h=${platform.height}`);
});

console.log('\n=== Y座標の近いプラットフォームを確認 ===');

// Y座標が近すぎて見た目が不自然になる可能性のあるペアを検出
for (let i = 0; i < verticalSectionPlatforms.length; i++) {
    for (let j = i + 1; j < verticalSectionPlatforms.length; j++) {
        const p1 = verticalSectionPlatforms[i];
        const p2 = verticalSectionPlatforms[j];
        
        // X座標が近く、Y座標も近い場合
        const xDiff = Math.abs(p1.x - p2.x);
        const yDiff = Math.abs(p1.y - p2.y);
        
        if (xDiff < 200 && yDiff < 50 && yDiff > 0) {
            console.log(`視覚的に近いペア:`);
            console.log(`  Platform A: x=${p1.x}, y=${p1.y}, w=${p1.width}, h=${p1.height}`);
            console.log(`  Platform B: x=${p2.x}, y=${p2.y}, w=${p2.width}, h=${p2.height}`);
            console.log(`  X差: ${xDiff}px, Y差: ${yDiff}px`);
            console.log('');
        }
    }
}

console.log('\n=== 修正提案 ===');
console.log('Y座標が近すぎるプラットフォームの間隔を広げることを推奨します。');
console.log('最小Y間隔: 60px以上を推奨');