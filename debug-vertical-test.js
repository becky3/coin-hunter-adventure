const fs = require('fs');
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));

console.log('=== 垂直チャレンジテストの詳細確認 ===');

// テストと同じ条件でフィルタ
const verticalPlatforms = levelData.platforms.filter(p => 
    p.x >= 1800 && p.x <= 2100 && p.height === 20 // 空中プラットフォーム
).sort((a, b) => a.y - b.y);

console.log('1800-2100px範囲の垂直プラットフォーム数:', verticalPlatforms.length);
console.log('テスト期待値: >5');
console.log('テスト結果:', verticalPlatforms.length > 5 ? '✅ 成功' : '❌ 失敗');

console.log('\n=== 該当プラットフォーム詳細 ===');
verticalPlatforms.forEach((p, i) => {
    console.log(`${i + 1}: x=${p.x}, y=${p.y}, w=${p.width}, h=${p.height}`);
});

console.log('\n=== 範囲外だが近いプラットフォーム ===');
const nearbyPlatforms = levelData.platforms.filter(p => 
    p.x >= 1600 && p.x < 2400 && p.height === 20 && !(p.x >= 1800 && p.x <= 2100)
);

nearbyPlatforms.forEach((p, i) => {
    console.log(`範囲外${i + 1}: x=${p.x}, y=${p.y}, w=${p.width}, h=${p.height}`);
});

console.log('\n=== 修正提案 ===');
if (verticalPlatforms.length <= 5) {
    console.log('1. テストの期待値を現在の数に合わせて修正');
    console.log('2. またはテスト範囲を拡大（1600-2400px）');
    console.log('3. またはプラットフォーム数チェックを削除');
}