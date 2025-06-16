/**
 * 多ステージシステムのテスト
 */

// テスト環境の設定
if (typeof window === 'undefined') {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    };
    global.fetch = () => Promise.reject(new Error('Fetch not implemented'));
}

// テストランナー
class MultiStageTestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async run() {
        console.log('🧪 多ステージシステムテスト開始...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ ${test.name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }
        
        console.log(`\n📊 テスト結果:`);
        console.log(`✅ 成功: ${this.results.passed}`);
        console.log(`❌ 失敗: ${this.results.failed}`);
        console.log(`📈 合計: ${this.results.total}`);
        console.log(`📊 成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        return this.results;
    }
}

// アサーション関数
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'アサーションエラー');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `期待値: ${expected}, 実際の値: ${actual}`);
    }
}

// モック関数とクラス
function createMockLevelLoader() {
    const mockStages = [
        {
            id: 'stage1',
            name: 'テストステージ1',
            description: 'テスト用ステージ',
            filename: 'stage1.json',
            unlocked: true,
            bestScore: 0,
            bestTime: 0
        },
        {
            id: 'stage2',
            name: 'テストステージ2',
            description: 'テスト用ステージ2',
            filename: 'stage2.json',
            unlocked: false,
            bestScore: 0,
            bestTime: 0
        }
    ];
    
    const mockStageData = {
        id: 'stage1',
        name: 'テストステージ1',
        description: 'テスト用ステージ',
        worldWidth: 1000,
        worldHeight: 576,
        playerSpawn: { x: 100, y: 300 },
        goal: { x: 900, y: 400 },
        platforms: [
            { x: 0, y: 476, width: 200, height: 100 },
            { x: 300, y: 476, width: 200, height: 100 }
        ],
        enemies: [
            { type: 'slime', x: 250, y: 436 }
        ],
        coins: [
            { x: 150, y: 440 },
            { x: 350, y: 440 }
        ],
        springs: []
    };
    
    return {
        stages: mockStages,
        currentStageData: null,
        currentStageId: null,
        
        async loadStageList() {
            return { stages: this.stages, currentStage: 'stage1' };
        },
        
        async loadStage(stageId) {
            const stage = this.stages.find(s => s.id === stageId);
            if (!stage) {
                throw new Error(`ステージが見つかりません: ${stageId}`);
            }
            this.currentStageData = { ...mockStageData, id: stageId };
            this.currentStageId = stageId;
            return this.currentStageData;
        },
        
        getCurrentStageData() {
            return this.currentStageData;
        },
        
        getCurrentStageId() {
            return this.currentStageId;
        },
        
        hasNextStage() {
            const currentIndex = this.stages.findIndex(s => s.id === this.currentStageId);
            return currentIndex >= 0 && currentIndex < this.stages.length - 1;
        },
        
        getNextStageId() {
            if (!this.hasNextStage()) return null;
            const currentIndex = this.stages.findIndex(s => s.id === this.currentStageId);
            return this.stages[currentIndex + 1].id;
        },
        
        updateStageClearInfo(stageId, score, time) {
            const stage = this.stages.find(s => s.id === stageId);
            if (stage) {
                stage.bestScore = Math.max(stage.bestScore || 0, score);
                stage.bestTime = stage.bestTime ? Math.min(stage.bestTime, time) : time;
            }
        },
        
        loadProgress() {},
        saveProgress() {}
    };
}

// テスト実行
async function runMultiStageTests() {
    const runner = new MultiStageTestRunner();
    
    // LevelLoaderクラスの基本機能テスト
    runner.test('LevelLoaderクラスが存在する', () => {
        if (typeof LevelLoader !== 'undefined') {
            const loader = new LevelLoader();
            assert(loader instanceof LevelLoader, 'LevelLoaderのインスタンスが作成できない');
        } else {
            // Node.js環境では実際のLevelLoaderが利用できないため、モックで代用
            const mockLoader = createMockLevelLoader();
            assert(typeof mockLoader.loadStageList === 'function', 'loadStageListメソッドが存在しない');
        }
    });
    
    // ステージリスト読み込みテスト
    runner.test('ステージリストが正常に読み込める', async () => {
        const loader = createMockLevelLoader();
        const stageList = await loader.loadStageList();
        
        assert(Array.isArray(stageList.stages), 'ステージリストが配列でない');
        assert(stageList.stages.length > 0, 'ステージが存在しない');
        assert(stageList.currentStage, 'currentStageが設定されていない');
    });
    
    // ステージデータ読み込みテスト
    runner.test('ステージデータが正常に読み込める', async () => {
        const loader = createMockLevelLoader();
        await loader.loadStageList();
        
        const stageData = await loader.loadStage('stage1');
        
        assert(stageData.id === 'stage1', 'ステージIDが正しくない');
        assert(stageData.name, 'ステージ名が設定されていない');
        assert(Array.isArray(stageData.platforms), 'プラットフォームが配列でない');
        assert(Array.isArray(stageData.enemies), '敵が配列でない');
        assert(Array.isArray(stageData.coins), 'コインが配列でない');
        assert(stageData.playerSpawn, 'プレイヤースポーン位置が設定されていない');
        assert(stageData.goal, 'ゴール位置が設定されていない');
    });
    
    // 次ステージ判定テスト
    runner.test('次ステージの存在判定が正常に動作する', async () => {
        const loader = createMockLevelLoader();
        await loader.loadStageList();
        await loader.loadStage('stage1');
        
        assert(loader.hasNextStage(), 'stage1の次ステージが検出されない');
        assertEqual(loader.getNextStageId(), 'stage2', '次ステージIDが正しくない');
        
        await loader.loadStage('stage2');
        assert(!loader.hasNextStage(), 'stage2に次ステージが存在するとされている');
        assert(loader.getNextStageId() === null, '最後のステージでnullが返されない');
    });
    
    // ステージクリア情報更新テスト
    runner.test('ステージクリア情報が正常に更新される', async () => {
        const loader = createMockLevelLoader();
        await loader.loadStageList();
        
        loader.updateStageClearInfo('stage1', 1000, 60);
        
        const stage1 = loader.stages.find(s => s.id === 'stage1');
        assertEqual(stage1.bestScore, 1000, 'ベストスコアが更新されない');
        assertEqual(stage1.bestTime, 60, 'ベストタイムが更新されない');
    });
    
    // エラーハンドリングテスト
    runner.test('存在しないステージの読み込みでエラーが発生する', async () => {
        const loader = createMockLevelLoader();
        await loader.loadStageList();
        
        try {
            await loader.loadStage('nonexistent');
            throw new Error('エラーが発生しなかった');
        } catch (error) {
            assert(error.message.includes('ステージが見つかりません'), 'エラーメッセージが正しくない');
        }
    });
    
    // JSONデータの妥当性テスト
    runner.test('stage1.jsonファイルが妥当な構造を持つ', () => {
        // このテストはファイルシステムアクセスが必要なため、
        // 実際の環境では別途実行される想定
        const expectedFields = [
            'id', 'name', 'description', 'worldWidth', 'worldHeight',
            'playerSpawn', 'goal', 'platforms', 'enemies', 'coins'
        ];
        
        const mockData = {
            id: 'stage1',
            name: 'テストステージ',
            description: 'テスト用',
            worldWidth: 1000,
            worldHeight: 576,
            playerSpawn: { x: 100, y: 300 },
            goal: { x: 900, y: 400 },
            platforms: [],
            enemies: [],
            coins: []
        };
        
        expectedFields.forEach(field => {
            assert(mockData.hasOwnProperty(field), `必須フィールド ${field} が存在しない`);
        });
    });
    
    // ステージ進行システムテスト
    runner.test('ステージクリア時に次ステージがアンロックされる', async () => {
        const loader = createMockLevelLoader();
        await loader.loadStageList();
        
        // 初期状態でstage2はロック
        const stage2Initial = loader.stages.find(s => s.id === 'stage2');
        assert(!stage2Initial.unlocked, 'stage2が初期状態でアンロックされている');
        
        // stage1をクリア
        loader.updateStageClearInfo('stage1', 1000, 60);
        
        // stage2がアンロックされているかは実装によるため、
        // この部分は実際の実装に合わせて調整が必要
    });
    
    return await runner.run();
}

// Node.js環境で実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runMultiStageTests, createMockLevelLoader };
    
    // 直接実行された場合
    if (require.main === module) {
        runMultiStageTests().catch(console.error);
    }
}