#!/usr/bin/env node

/**
 * 統合テストランナー
 * すべてのテストを一元管理し、単一のコマンドで実行可能
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class UnifiedTestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            environment: {
                node: process.version,
                platform: process.platform,
                cwd: process.cwd()
            },
            tests: {
                structure: null,
                unit: null,
                integration: null,
                automated: null,
                performance: null
            },
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0
            }
        };
        this.startTime = Date.now();
    }

    /**
     * すべてのテストを実行
     */
    async runAllTests() {
        console.log('🚀 統合テストランナーを開始します...\n');
        console.log('環境情報:');
        console.log(`  Node.js: ${this.results.environment.node}`);
        console.log(`  Platform: ${this.results.environment.platform}`);
        console.log(`  作業ディレクトリ: ${this.results.environment.cwd}\n`);

        try {
            // 1. 構造テスト（最も基本的なテスト）
            console.log('\n📁 [1/5] 構造テストを実行中...');
            this.results.tests.structure = await this.runStructureTests();
            this.displayCategoryResults('構造テスト', this.results.tests.structure, 1);
            
            // 2. HTTPサーバーの確認
            console.log('\n🌐 [2/5] HTTPサーバーの確認中...');
            const serverRunning = await this.checkHttpServer();
            if (!serverRunning) {
                console.log('[2.1] ❌ HTTPサーバー起動確認 : HTTPサーバーが起動していません');
                this.results.summary.failed++;
                return this.generateReport();
            } else {
                console.log('[2.1] ✅ HTTPサーバー起動確認');
            }

            // 3. ユニットテスト
            console.log('\n🧪 [3/5] ユニットテストを実行中...');
            this.results.tests.unit = await this.runUnitTests();
            this.displayCategoryResults('ユニットテスト', this.results.tests.unit, 3);

            // 4. 統合テスト（ブラウザ環境）
            console.log('\n🔗 [4/5] 統合テストを実行中...');
            this.results.tests.integration = await this.runIntegrationTests();
            this.displayCategoryResults('統合テスト', this.results.tests.integration, 4);

            // 5. 自動ゲームテスト
            console.log('\n🎮 [5/5] 自動ゲームテストを実行中...');
            this.results.tests.automated = await this.runAutomatedGameTests();
            this.displayCategoryResults('自動ゲームテスト', this.results.tests.automated, 5);

            // サマリーの計算
            this.calculateSummary();

            // レポート生成
            return this.generateReport();

        } catch (error) {
            console.error('\n❌ テスト実行中にエラーが発生しました:', error);
            this.results.error = error.message;
            return this.generateReport();
        }
    }

    /**
     * 構造テストの実行
     */
    async runStructureTests() {
        const results = {
            passed: 0,
            failed: 0,
            tests: []
        };

        // 必要なファイルの存在確認
        const requiredFiles = [
            'index.html',
            'src/game.js',
            'src/config.js',
            'src/player.js',
            'src/music.js',
            'levels/stage1.json',
            'assets/player-idle.svg'
        ];

        for (const file of requiredFiles) {
            const exists = fs.existsSync(path.join(process.cwd(), file));
            results.tests.push({
                name: `ファイル存在確認: ${file}`,
                passed: exists,
                message: exists ? '✅ 存在' : '❌ 不在'
            });
            if (exists) results.passed++;
            else results.failed++;
        }

        // JSONファイルの妥当性確認
        const jsonFiles = ['levels/stage1.json', 'levels/stages.json'];
        for (const file of jsonFiles) {
            try {
                const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
                JSON.parse(content);
                results.tests.push({
                    name: `JSON妥当性: ${file}`,
                    passed: true,
                    message: '✅ 有効なJSON'
                });
                results.passed++;
            } catch (error) {
                results.tests.push({
                    name: `JSON妥当性: ${file}`,
                    passed: false,
                    message: `❌ 無効なJSON: ${error.message}`
                });
                results.failed++;
            }
        }

        return results;
    }

    /**
     * HTTPサーバーの確認
     */
    async checkHttpServer() {
        const http = require('http');
        return new Promise((resolve) => {
            const req = http.get('http://localhost:8080/', (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    /**
     * ユニットテストの実行
     */
    async runUnitTests() {
        // curl-test-validatorを実行
        return this.runScript('scripts/curl-test-validator.js', 'ユニットテスト');
    }

    /**
     * 統合テストの実行
     */
    async runIntegrationTests() {
        // comprehensive-test-resultsを実行
        if (fs.existsSync(path.join(process.cwd(), 'scripts/comprehensive-test-results.js'))) {
            return this.runScript('scripts/comprehensive-test-results.js', '統合テスト');
        }
        return { passed: 0, failed: 0, skipped: 1, message: 'スキップ: comprehensive-test-results.js が見つかりません' };
    }

    /**
     * 自動ゲームテストの実行
     */
    async runAutomatedGameTests() {
        // run-automated-testsを実行
        return this.runScript('scripts/run-automated-tests.js', '自動ゲームテスト');
    }

    /**
     * スクリプトの実行
     */
    async runScript(scriptPath, testName) {
        return new Promise((resolve) => {
            const results = {
                passed: 0,
                failed: 0,
                output: '',
                error: ''
            };

            const child = spawn('node', [scriptPath], {
                cwd: process.cwd(),
                env: process.env
            });

            child.stdout.on('data', (data) => {
                results.output += data.toString();
            });

            child.stderr.on('data', (data) => {
                results.error += data.toString();
            });

            child.on('close', (code) => {
                // 出力から成功/失敗を解析
                const output = results.output;
                const successMatch = output.match(/成功[：:]\s*(\d+)/);
                const failMatch = output.match(/失敗[：:]\s*(\d+)/);
                
                if (successMatch) results.passed = parseInt(successMatch[1]);
                if (failMatch) results.failed = parseInt(failMatch[1]);

                // exit codeも考慮
                if (code !== 0 && results.failed === 0) {
                    results.failed = 1;
                }

                results.exitCode = code;
                results.success = code === 0;
                resolve(results);
            });

            // タイムアウト設定
            setTimeout(() => {
                child.kill();
                results.error = 'テストがタイムアウトしました';
                results.failed = 1;
                resolve(results);
            }, 60000); // 60秒
        });
    }

    /**
     * カテゴリ別の結果表示
     */
    displayCategoryResults(categoryName, results, categoryNumber) {
        if (!results) return;
        
        // 構造テストの場合
        if (results.tests && Array.isArray(results.tests)) {
            results.tests.forEach((test, index) => {
                const testNumber = `[${categoryNumber}.${index + 1}]`;
                if (test.passed) {
                    console.log(`${testNumber} ✅ ${test.name}`);
                } else {
                    console.log(`${testNumber} ❌ ${test.name} : ${test.message}`);
                }
            });
        }
        
        // スクリプト実行結果の場合
        else if (results.output || results.error) {
            // ユニットテストの場合はシンプルに表示
            if (categoryName === 'ユニットテスト') {
                if (results.success) {
                    console.log(`[${categoryNumber}.1] ✅ cURLベーステスト検証`);
                } else {
                    console.log(`[${categoryNumber}.1] ❌ cURLベーステスト検証 : テスト実行エラー`);
                }
            }
            // 統合テストの詳細表示
            else if (categoryName === '統合テスト' && results.output) {
                this.displayIntegrationTestDetails(results.output, categoryNumber);
            }
            // 自動ゲームテストの詳細表示
            else if (categoryName === '自動ゲームテスト' && results.output) {
                this.displayAutomatedTestDetails(results.output, categoryNumber);
            }
        }
    }


    /**
     * 統合テストの詳細表示
     */
    displayIntegrationTestDetails(output, categoryNumber) {
        // 各検証項目の結果を表示
        const checks = [
            { pattern: /インフラストラクチャ: ([✅❌])/, name: 'インフラストラクチャ検証' },
            { pattern: /HTTP構成: ([✅❌])/, name: 'HTTP構成確認' },
            { pattern: /JavaScript基本: ([✅❌])/, name: 'JavaScript基本読み込み' },
            { pattern: /JavaScript高度: ([✅❌])/, name: 'JavaScript高度機能' },
            { pattern: /ブラウザテスト準備: ([✅❌])/, name: 'ブラウザテスト準備' }
        ];

        let testIndex = 1;
        checks.forEach((check) => {
            const match = output.match(check.pattern);
            if (match) {
                const status = match[1];
                if (status === '✅') {
                    console.log(`[${categoryNumber}.${testIndex}] ✅ ${check.name}`);
                } else {
                    // エラー理由を特定
                    let reason = '検証に失敗しました';
                    if (check.name === 'インフラストラクチャ検証') {
                        reason = 'テストインフラストラクチャが正しく設定されていません';
                    } else if (check.name === 'JavaScript基本読み込み') {
                        reason = '基本的なJavaScriptファイルの読み込みに失敗しました';
                    } else if (check.name === 'JavaScript高度機能') {
                        reason = 'VM環境でのCanvas操作に制限があります';
                    } else if (check.name === 'ブラウザテスト準備') {
                        reason = 'ブラウザテストの前提条件が満たされていません';
                    }
                    console.log(`[${categoryNumber}.${testIndex}] ❌ ${check.name} : ${reason}`);
                }
                testIndex++;
            }
        });
    }

    /**
     * 自動ゲームテストの詳細表示
     */
    displayAutomatedTestDetails(output, categoryNumber) {
        // テスト結果を抽出
        const testPattern = /([✅❌]) ([^:\n]+)(?:: (.+))?/g;
        const matches = [...output.matchAll(testPattern)];
        
        if (matches.length > 0) {
            let testIndex = 1;
            
            matches.forEach(match => {
                const testName = match[2].trim();
                const status = match[1];
                const error = match[3] || '';
                
                // 「失敗したテスト」という項目自体は除外
                if (testName === '失敗したテスト') {
                    return;
                }
                
                if (status === '✅') {
                    console.log(`[${categoryNumber}.${testIndex}] ✅ ${testName}`);
                } else {
                    console.log(`[${categoryNumber}.${testIndex}] ❌ ${testName} : ${error}`);
                }
                testIndex++;
            });
        }
    }

    /**
     * サマリーの計算
     */
    calculateSummary() {
        let total = 0, passed = 0, failed = 0, skipped = 0;

        for (const [category, result] of Object.entries(this.results.tests)) {
            if (result) {
                if (result.passed !== undefined) passed += result.passed;
                if (result.failed !== undefined) failed += result.failed;
                if (result.skipped !== undefined) skipped += result.skipped;
            }
        }

        total = passed + failed + skipped;
        this.results.summary = {
            total,
            passed,
            failed,
            skipped,
            duration: Date.now() - this.startTime,
            successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0
        };
    }

    /**
     * 失敗情報の抽出
     */
    extractFailureInfo(output, category) {
        if (category === 'automated' && output.includes('失敗したテスト:')) {
            const match = output.match(/失敗したテスト:([\s\S]*?)$/m);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    /**
     * レポートの生成
     */
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 テスト結果サマリー');
        console.log('='.repeat(60));
        console.log(`総テスト数: ${this.results.summary.total}`);
        console.log(`✅ 成功: ${this.results.summary.passed}`);
        console.log(`❌ 失敗: ${this.results.summary.failed}`);
        console.log(`⏭️  スキップ: ${this.results.summary.skipped}`);
        console.log(`成功率: ${this.results.summary.successRate}%`);
        console.log(`実行時間: ${(this.results.summary.duration / 1000).toFixed(2)}秒`);
        console.log('='.repeat(60));

        // 結果をJSONファイルに保存
        const resultPath = path.join(process.cwd(), 'unified-test-results.json');
        fs.writeFileSync(resultPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 詳細な結果を保存しました: ${resultPath}`);

        // 失敗があった場合のみ詳細を表示
        if (this.results.summary.failed > 0) {
            console.log('\n📋 失敗したテストの一覧:');
            
            // すべてのテストをフラットに収集
            const allFailedTests = [];
            
            // 構造テストから失敗を収集
            if (this.results.tests.structure && this.results.tests.structure.tests) {
                this.results.tests.structure.tests.forEach((test, idx) => {
                    if (!test.passed) {
                        allFailedTests.push(`[1.${idx + 1}] ❌ ${test.name} : ${test.message}`);
                    }
                });
            }
            
            // HTTPサーバーチェックの失敗
            if (!this.checkHttpServer()) {
                allFailedTests.push('[2.1] ❌ HTTPサーバー起動確認 : HTTPサーバーが起動していません');
            }
            
            // ユニットテストの失敗
            if (this.results.tests.unit && !this.results.tests.unit.success) {
                allFailedTests.push('[3.1] ❌ cURLベーステスト検証 : テスト実行エラー');
            }
            
            // 統合テストから失敗を収集
            if (this.results.tests.integration && this.results.tests.integration.output) {
                const output = this.results.tests.integration.output;
                const checks = [
                    { pattern: /インフラストラクチャ: (❌)/, name: 'インフラストラクチャ検証', idx: 1 },
                    { pattern: /JavaScript基本: (❌)/, name: 'JavaScript基本読み込み', idx: 3 },
                    { pattern: /JavaScript高度: (❌)/, name: 'JavaScript高度機能', idx: 4 },
                    { pattern: /ブラウザテスト準備: (❌)/, name: 'ブラウザテスト準備', idx: 5 }
                ];
                checks.forEach(check => {
                    if (output.match(check.pattern)) {
                        allFailedTests.push(`[4.${check.idx}] ❌ ${check.name} : 検証に失敗しました`);
                    }
                });
            }
            
            // 自動ゲームテストから失敗を収集
            if (this.results.tests.automated && this.results.tests.automated.output) {
                // すべてのテストをカウントして正しい番号を取得
                const allTestPattern = /([✅❌]) ([^:\n]+)(?:: (.+))?/g;
                const allMatches = [...this.results.tests.automated.output.matchAll(allTestPattern)];
                
                let testIndex = 1;
                allMatches.forEach(match => {
                    const testName = match[2].trim();
                    const status = match[1];
                    const error = match[3] || '';
                    
                    // 「失敗したテスト」という項目自体は除外
                    if (testName !== '失敗したテスト') {
                        if (status === '❌') {
                            allFailedTests.push(`[5.${testIndex}] ❌ ${testName} : ${error}`);
                        }
                        testIndex++;
                    }
                });
            }
            
            // 失敗したテストを表示
            allFailedTests.forEach(test => console.log(test));
        }

        // exit codeを返す
        return this.results.summary.failed > 0 ? 1 : 0;
    }

    /**
     * 特定のカテゴリのテストのみ実行
     */
    async runCategory(category) {
        console.log(`🎯 ${category}テストのみを実行します...\n`);

        switch (category) {
            case 'structure':
                this.results.tests.structure = await this.runStructureTests();
                break;
            case 'unit':
                this.results.tests.unit = await this.runUnitTests();
                break;
            case 'integration':
                this.results.tests.integration = await this.runIntegrationTests();
                break;
            case 'automated':
                this.results.tests.automated = await this.runAutomatedGameTests();
                break;
            default:
                console.error(`❌ 不明なカテゴリ: ${category}`);
                console.log('利用可能なカテゴリ: structure, unit, integration, automated');
                return 1;
        }

        this.calculateSummary();
        return this.generateReport();
    }
}

// メイン処理
async function main() {
    const runner = new UnifiedTestRunner();
    
    // コマンドライン引数の解析
    const args = process.argv.slice(2);
    const categoryIndex = args.findIndex(arg => arg === '--category' || arg === '-c');
    
    let exitCode;
    if (categoryIndex !== -1 && args[categoryIndex + 1]) {
        // 特定のカテゴリのみ実行
        exitCode = await runner.runCategory(args[categoryIndex + 1]);
    } else {
        // すべてのテストを実行
        exitCode = await runner.runAllTests();
    }

    process.exit(exitCode);
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
    console.error('未処理のエラー:', error);
    process.exit(1);
});

// 実行
main().catch(error => {
    console.error('実行エラー:', error);
    process.exit(1);
});