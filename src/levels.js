/**
 * レベルデータ - 廃止予定
 * このファイルは後方互換性のためのみ存在
 * 新しいシステムではJSONベースのステージデータを使用
 */

// 空のデータ構造のみ定義（エラー防止用）
var levelData = {
    platforms: [],
    enemies: [],
    coins: [],
    springs: [],
    flag: { x: 0, y: 0 }
};

if (typeof console !== 'undefined') {
}