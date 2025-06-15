/**
 * レガシーレベルデータ - フォールバック用
 * JSONベースのステージシステムが利用できない場合のみ使用
 */

// 最小限のフォールバックデータ
var levelData = {
    platforms: [
        { x: 0, y: 476, width: 400, height: 100 },
        { x: 500, y: 476, width: 300, height: 100 },
        { x: 900, y: 476, width: 200, height: 100 },
        { x: 1200, y: 476, width: 200, height: 100 },
        { x: 1500, y: 476, width: 200, height: 100 },
        { x: 1800, y: 476, width: 200, height: 100 },
        { x: 2100, y: 476, width: 200, height: 100 },
        { x: 2400, y: 476, width: 200, height: 100 },
        { x: 2700, y: 476, width: 300, height: 100 }
    ],
    enemies: [
        { type: 'slime', x: 350, y: 436 },
        { type: 'slime', x: 750, y: 436 },
        { type: 'slime', x: 1350, y: 436 },
        { type: 'slime', x: 1950, y: 436 },
        { type: 'slime', x: 2550, y: 436 }
    ],
    coins: [
        { x: 150, y: 440 },
        { x: 250, y: 440 },
        { x: 600, y: 440 },
        { x: 1000, y: 440 },
        { x: 1300, y: 440 },
        { x: 1600, y: 440 },
        { x: 1900, y: 440 },
        { x: 2200, y: 440 },
        { x: 2500, y: 440 },
        { x: 2800, y: 440 }
    ],
    springs: [
        { x: 850, y: 456 },
        { x: 1750, y: 456 }
    ],
    flag: { x: 2900, y: 396 }
};

if (typeof console !== 'undefined') {
    console.log('levels.js loaded - 改善版レベルデザイン');
}