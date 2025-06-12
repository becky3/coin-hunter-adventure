const fs = require('fs');
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));

console.log('=== 敵データの詳細 ===');
console.log('総敵数:', levelData.enemies.length);
console.log('鳥の数:', levelData.enemies.filter(e => e.type === 'bird').length);
console.log('スライムの数:', levelData.enemies.filter(e => e.type === 'slime').length);

console.log('\n=== 鳥の配置データ ===');
levelData.enemies.filter(e => e.type === 'bird').forEach((bird, i) => {
    console.log('鳥' + (i+1) + ': x=' + bird.x + ', y=' + bird.y);
});

console.log('\n=== ENEMY_CONFIGの確認 ===');
console.log('bird config exists:', typeof ENEMY_CONFIG.bird !== 'undefined');
if (ENEMY_CONFIG.bird) {
    console.log('bird config:', JSON.stringify(ENEMY_CONFIG.bird, null, 2));
}

console.log('\n=== 初期化後の敵データシミュレーション ===');
const simulatedEnemies = levelData.enemies.map(e => ({
    ...e,
    ...ENEMY_CONFIG[e.type],
    velX: ENEMY_CONFIG[e.type].speed,
    direction: 1,
    animTimer: 0
}));

console.log('初期化後の鳥:', simulatedEnemies.filter(e => e.type === 'bird').length);
console.log('初期化後のスライム:', simulatedEnemies.filter(e => e.type === 'slime').length);