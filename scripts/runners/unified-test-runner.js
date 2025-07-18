#!/usr/bin/env node

/**
 * 統合テストランナー
 * すべてのテストを一元管理し、単一のコマンドで実行可能
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const CoverageAnalyzer = require('../validators/coverage-analyzer');
const ErrorMonitor = require('../validators/error-monitor');

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
                level: null,
                performance: null
            },
            errorMonitoring: {
                errors: [],
                warnings: []
            },
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                errors: 0,
                warnings: 0
            }
        };
        this.startTime = Date.now();
        this.errorMonitor = new ErrorMonitor();
        
        // テストカテゴリの定義を共有
        this.testCategories = [
            { name: '構造テスト', key: 'structure', icon: '📁', runner: () => this.runStructureTests() },
            { name: 'HTTPサーバーの確認', key: 'http', icon: '🌐', runner: () => this.checkHttpServerCategory() },
            { name: '統合テスト', key: 'integration', icon: '🔗', runner: () => this.runIntegrationTests() },
            { name: '自動ゲームテスト', key: 'automated', icon: '🎮', runner: () => this.runAutomatedGameTests() },
            { name: 'レベル検証テスト', key: 'level', icon: '🏗️', runner: () => this.runLevelValidationTests() },
            { name: 'ビジュアルテスト', key: 'visual', icon: '🎨', runner: () => this.runVisualTests() }
        ];
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

        // エラー監視を開始
        this.errorMonitor.start();
        console.log('🚨 エラー監視を開始しました\n');

        const totalCategories = this.testCategories.length;

        try {
            // 各カテゴリのテストを実行
            for (let i = 0; i < this.testCategories.length; i++) {
                const category = this.testCategories[i];
                const categoryNumber = i + 1;
                
                console.log(`\n${category.icon} [${categoryNumber}/${totalCategories}] ${category.name}を実行中...`);
                
                // HTTPサーバーチェックの特別処理
                if (category.name === 'HTTPサーバーの確認') {
                    const serverRunning = await this.checkHttpServer();
                    if (!serverRunning) {
                        console.log(`[${categoryNumber}.1] ❌ HTTPサーバー起動確認 : HTTPサーバーが起動していません`);
                        // HTTPサーバーチェックの結果を記録
                        this.results.tests.http = {
                            passed: 0,
                            failed: 1,
                            serverRunning: false
                        };
                        // サマリー計算してからレポート生成
                        this.calculateSummary();
                        return this.generateReport();
                    } else {
                        console.log(`[${categoryNumber}.1] ✅ HTTPサーバー起動確認`);
                        this.results.tests.http = {
                            passed: 1,
                            failed: 0,
                            serverRunning: true
                        };
                    }
                } else {
                    // 通常のテスト実行
                    const results = await category.runner();
                    this.results.tests[this.getCategoryKey(category.name)] = results;
                    this.displayCategoryResults(category.name, results, categoryNumber);
                }
            }

            // エラー監視を停止
            this.errorMonitor.stop();
            
            // エラー監視の結果を取得
            const errorResults = this.errorMonitor.getTestResults();
            this.results.errorMonitoring = {
                errors: errorResults.errors,
                warnings: errorResults.warnings
            };
            this.results.summary.errors = errorResults.errorCount;
            this.results.summary.warnings = errorResults.warningCount;

            // サマリーの計算
            this.calculateSummary();

            // レポート生成
            return this.generateReport();

        } catch (error) {
            console.error('\n❌ テスト実行中にエラーが発生しました:', error);
            this.results.error = error.message;
            
            // エラー監視を停止
            this.errorMonitor.stop();
            
            return this.generateReport();
        } finally {
            // エラー監視が確実に停止されるようにする
            if (this.errorMonitor.isMonitoring) {
                this.errorMonitor.stop();
            }
        }
    }

    /**
     * カテゴリ名からキーを取得
     */
    getCategoryKey(categoryName) {
        const category = this.testCategories.find(cat => cat.name === categoryName);
        return category ? category.key : categoryName;
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
     * HTTPサーバーチェックカテゴリの実行
     */
    async checkHttpServerCategory() {
        // この特別なカテゴリは通常のテスト結果形式を返さない
        // runAllTestsで特別に処理される
        return null;
    }


    /**
     * 統合テストの実行
     */
    async runIntegrationTests() {
        // comprehensive-test-resultsを実行
        const testPath = path.join(process.cwd(), 'scripts/utils/comprehensive-test-results.js');
        if (!fs.existsSync(testPath)) {
            return { 
                passed: 0, 
                failed: 1, 
                error: `エラー: comprehensive-test-results.js が見つかりません (${testPath})`,
                tests: [{
                    name: '統合テストファイルの存在確認',
                    passed: false,
                    message: `❌ ファイルが見つかりません: ${testPath}`
                }]
            };
        }
        return this.runScript('scripts/utils/comprehensive-test-results.js', '統合テスト');
    }

    /**
     * 自動ゲームテストの実行
     */
    async runAutomatedGameTests() {
        // run-automated-testsを実行
        return this.runScript('scripts/runners/run-automated-tests.js', '自動ゲームテスト');
    }

    /**
     * レベル検証テストの実行
     */
    async runLevelValidationTests() {
        const LevelValidationTest = require('../validators/level-validation-test.js');
        const validator = new LevelValidationTest();
        
        try {
            const result = await validator.runTests('stage1');
            
            // 統一テストランナーの形式に合わせる
            return {
                passed: result.success && result.summary.critical === 0 ? 1 : 0,
                failed: result.summary.critical,
                tests: result.issues.map(issue => ({
                    name: issue.message,
                    passed: issue.severity !== 'critical',
                    message: `[${issue.severity}] ${issue.type}`
                }))
            };
        } catch (error) {
            return {
                passed: 0,
                failed: 1,
                error: error.message
            };
        }
    }

    /**
     * ビジュアルテストの実行
     */
    async runVisualTests() {
        const CanvasSnapshotTest = require('../validators/canvas-snapshot-test.js');
        const tester = new CanvasSnapshotTest();
        
        try {
            const result = await tester.runAllTests();
            
            // 統一テストランナーの形式に合わせる
            return {
                passed: result.summary.passed,
                failed: result.summary.failed,
                tests: result.tests.map(test => ({
                    name: test.name,
                    passed: test.passed,
                    message: test.message
                }))
            };
        } catch (error) {
            return {
                passed: 0,
                failed: 1,
                error: error.message
            };
        }
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
        else if (results.output || results.error || results.skipped) {
            // 統合テストの詳細表示
            if (categoryName === '統合テスト' && results.output) {
                this.displayIntegrationTestDetails(results.output, categoryNumber);
            }
            // 自動ゲームテストの詳細表示
            else if (categoryName === '自動ゲームテスト' && results.output) {
                this.displayAutomatedTestDetails(results.output, categoryNumber);
            }
        }
        // レベル検証テストの詳細表示
        if (categoryName === 'レベル検証テスト') {
            this.displayLevelValidationDetails(results, categoryNumber);
        }
    }

    /**
     * レベル検証テストの詳細表示
     */
    displayLevelValidationDetails(results, categoryNumber) {
        if (results.tests && Array.isArray(results.tests)) {
            if (results.tests.length === 0) {
                console.log(`[${categoryNumber}.1] ✅ レベル検証完了 : 問題は検出されませんでした`);
            } else {
                let testIndex = 1;
                results.tests.forEach(test => {
                    if (test.passed) {
                        console.log(`[${categoryNumber}.${testIndex}] ✅ ${test.name}`);  
                    } else {
                        console.log(`[${categoryNumber}.${testIndex}] ❌ ${test.name} : ${test.message}`);
                    }
                    testIndex++;
                });
            }
        } else if (results.error) {
            console.log(`[${categoryNumber}.1] ❌ レベル検証エラー : ${results.error}`);
        } else if (results.passed === 0 && results.failed === 0) {
            console.log(`[${categoryNumber}.1] ✅ レベル検証完了 : 問題は検出されませんでした`);
        } else {
            console.log(`[${categoryNumber}.1] ⏭️  レベル検証がスキップされました`);
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
        
        // エラー監視の結果を保持
        const currentErrors = this.results.summary.errors || 0;
        const currentWarnings = this.results.summary.warnings || 0;
        
        this.results.summary = {
            total,
            passed,
            failed,
            skipped,
            duration: Date.now() - this.startTime,
            successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
            errors: currentErrors,
            warnings: currentWarnings
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
     * 失敗したテストの収集
     */
    collectFailedTests() {
        const allFailedTests = [];
        
        // 各カテゴリを処理
        this.testCategories.forEach((category, categoryIndex) => {
            const categoryNumber = categoryIndex + 1;
            const results = this.results.tests[category.key];
            
            if (!results) return;
            
            // 構造テストとレベル検証テストの処理
            if (results.tests && Array.isArray(results.tests)) {
                results.tests.forEach((test, testIndex) => {
                    if (!test.passed) {
                        allFailedTests.push(`[${categoryNumber}.${testIndex + 1}] ❌ ${test.name} : ${test.message}`);
                    }
                });
            }
            
            // HTTPサーバーチェックの特別処理
            else if (category.key === 'http') {
                if (results && results.serverRunning === false) {
                    allFailedTests.push(`[${categoryNumber}.1] ❌ HTTPサーバー起動確認 : HTTPサーバーが起動していません`);
                }
            }
            
            // 統合テストの処理
            else if (category.key === 'integration' && results.output) {
                this.collectIntegrationTestFailures(results.output, categoryNumber, allFailedTests);
            }
            
            // 自動ゲームテストの処理
            else if (category.key === 'automated' && results.output) {
                this.collectAutomatedTestFailures(results.output, categoryNumber, allFailedTests);
            }
        });
        
        return allFailedTests;
    }

    /**
     * 統合テストの失敗を収集
     */
    collectIntegrationTestFailures(output, categoryNumber, allFailedTests) {
        const checks = [
            { pattern: /インフラストラクチャ: (❌)/, name: 'インフラストラクチャ検証', idx: 1 },
            { pattern: /JavaScript基本: (❌)/, name: 'JavaScript基本読み込み', idx: 3 },
            { pattern: /JavaScript高度: (❌)/, name: 'JavaScript高度機能', idx: 4 },
            { pattern: /ブラウザテスト準備: (❌)/, name: 'ブラウザテスト準備', idx: 5 }
        ];
        
        checks.forEach(check => {
            if (output.match(check.pattern)) {
                allFailedTests.push(`[${categoryNumber}.${check.idx}] ❌ ${check.name} : 検証に失敗しました`);
            }
        });
    }

    /**
     * 自動ゲームテストの失敗を収集
     */
    collectAutomatedTestFailures(output, categoryNumber, allFailedTests) {
        const allTestPattern = /([✅❌]) ([^:\n]+)(?:: (.+))?/g;
        const allMatches = [...output.matchAll(allTestPattern)];
        
        let testIndex = 1;
        allMatches.forEach(match => {
            const testName = match[2].trim();
            const status = match[1];
            const error = match[3] || '';
            
            // 「失敗したテスト」という項目自体は除外
            if (testName !== '失敗したテスト') {
                if (status === '❌') {
                    allFailedTests.push(`[${categoryNumber}.${testIndex}] ❌ ${testName} : ${error}`);
                }
                testIndex++;
            }
        });
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
        const resultPath = path.join(process.cwd(), 'test-results', 'unified-test-results.json');
        fs.writeFileSync(resultPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 詳細な結果を保存しました: ${resultPath}`);

        // 失敗があった場合のみ詳細を表示
        if (this.results.summary.failed > 0) {
            console.log('\n📋 失敗したテストの一覧:');
            
            // collectFailedTestsメソッドを使用して失敗を収集
            const allFailedTests = this.collectFailedTests();
            
            // 失敗したテストを表示
            allFailedTests.forEach(test => console.log(test));
        }

        // エラー監視の結果を表示
        if (this.results.summary.errors > 0 || this.results.summary.warnings > 0) {
            console.log('\n🚨 エラー監視結果:');
            console.log(`検出されたエラー: ${this.results.summary.errors}件`);
            console.log(`検出された警告: ${this.results.summary.warnings}件`);
            
            if (this.results.summary.errors > 0) {
                console.log('\n❌ エラー詳細:');
                this.results.errorMonitoring.errors.forEach((err, index) => {
                    console.log(`${index + 1}. ${err.message}`);
                });
            }
            
            if (this.results.summary.warnings > 0) {
                console.log('\n⚠️  警告詳細:');
                this.results.errorMonitoring.warnings.forEach((warn, index) => {
                    console.log(`${index + 1}. ${warn.message}`);
                });
            }
            
            // エラーレポートの詳細表示
            if (this.results.summary.errors > 0) {
                this.errorMonitor.displayReport();
            }
        }

        // カバレッジ分析を実行（詳細な未テスト関数リストは非表示）
        console.log('\n📈 カバレッジ分析を実行中...');
        try {
            const analyzer = new CoverageAnalyzer();
            analyzer.run(false); // showDetails = false
        } catch (error) {
            console.error('カバレッジ分析でエラーが発生しました:', error.message);
        }

        // exit codeを返す（エラーが検出された場合も失敗とする）
        return (this.results.summary.failed > 0 || this.results.summary.errors > 0) ? 1 : 0;
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
            case 'level':
                this.results.tests.level = await this.runLevelValidationTests();
                break;
            default:
                console.error(`❌ 不明なカテゴリ: ${category}`);
                console.log('利用可能なカテゴリ: structure, unit, integration, automated, level');
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