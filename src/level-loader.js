/**
 * レベルローダー
 * JSONファイルからステージデータを読み込む
 */

class LevelLoader {
    constructor() {
        this.stages = null;
        this.currentStageData = null;
        this.currentStageId = null;
    }
    
    /**
     * ステージリストを読み込む
     */
    async loadStageList() {
        try {
            // 現在のページ位置に関係なく正しいパスを構築
            const basePath = window.location.pathname.includes('/tests/') ? '../levels/' : 'levels/';
            const response = await fetch(basePath + 'stages.json');
            if (!response.ok) {
                throw new Error(`ステージリスト読み込みエラー: ${response.status}`);
            }
            const data = await response.json();
            this.stages = data.stages;
            this.stageList = data;
            return data;
        } catch (error) {
            console.error('ステージリスト読み込みエラー:', error);
            // フォールバック: ハードコードされたステージリスト
            const fallbackData = {
                stages: [
                    {
                        id: 'stage1',
                        name: 'チュートリアルステージ',
                        description: '基本的な操作を学ぶステージ',
                        filename: 'stage1.json',
                        unlocked: true
                    }
                ],
                currentStage: 'stage1'
            };
            this.stages = fallbackData.stages;
            this.stageList = fallbackData;
            return fallbackData;
        }
    }
    
    /**
     * 特定のステージデータを読み込む
     * @param {string} stageId ステージID
     */
    async loadStage(stageId) {
        try {
            // ステージ情報を取得
            const stageInfo = this.stages?.find(s => s.id === stageId);
            if (!stageInfo) {
                throw new Error(`ステージ情報が見つかりません: ${stageId}`);
            }
            
            // ステージデータを読み込む
            const basePath = window.location.pathname.includes('/tests/') ? '../levels/' : 'levels/';
            const response = await fetch(basePath + stageInfo.filename);
            if (!response.ok) {
                throw new Error(`ステージデータ読み込みエラー: ${response.status}`);
            }
            
            this.currentStageData = await response.json();
            this.currentStageId = stageId;
            
            console.log(`ステージ「${this.currentStageData.name}」を読み込みました`);
            return this.currentStageData;
            
        } catch (error) {
            console.error('ステージデータ読み込みエラー:', error);
            throw error;
        }
    }
    
    /**
     * 現在のステージデータを取得
     */
    getCurrentStageData() {
        return this.currentStageData;
    }
    
    /**
     * 現在のステージIDを取得
     */
    getCurrentStageId() {
        return this.currentStageId;
    }
    
    /**
     * 次のステージが存在するかチェック
     */
    hasNextStage() {
        if (!this.stages || !this.currentStageId) return false;
        
        const currentIndex = this.stages.findIndex(s => s.id === this.currentStageId);
        return currentIndex >= 0 && currentIndex < this.stages.length - 1;
    }
    
    /**
     * 次のステージIDを取得
     */
    getNextStageId() {
        if (!this.hasNextStage()) return null;
        
        const currentIndex = this.stages.findIndex(s => s.id === this.currentStageId);
        return this.stages[currentIndex + 1].id;
    }
    
    /**
     * ステージクリア情報を更新
     * @param {string} stageId ステージID
     * @param {number} score スコア
     * @param {number} time クリアタイム
     */
    updateStageClearInfo(stageId, score, time) {
        const stage = this.stages?.find(s => s.id === stageId);
        if (!stage) return;
        
        // ベストスコアとベストタイムを更新
        if (!stage.bestScore || score > stage.bestScore) {
            stage.bestScore = score;
        }
        if (!stage.bestTime || time < stage.bestTime) {
            stage.bestTime = time;
        }
        
        // 次のステージをアンロック
        const currentIndex = this.stages.findIndex(s => s.id === stageId);
        if (currentIndex >= 0 && currentIndex < this.stages.length - 1) {
            this.stages[currentIndex + 1].unlocked = true;
        }
        
        // ローカルストレージに保存
        this.saveProgress();
    }
    
    /**
     * 進行状況をローカルストレージに保存
     */
    saveProgress() {
        if (!this.stages) return;
        
        const progress = {
            stages: this.stages.map(s => ({
                id: s.id,
                unlocked: s.unlocked,
                bestScore: s.bestScore || 0,
                bestTime: s.bestTime || 0
            }))
        };
        
        localStorage.setItem('gameProgress', JSON.stringify(progress));
    }
    
    /**
     * 進行状況をローカルストレージから読み込む
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('gameProgress');
            if (!saved) return;
            
            const progress = JSON.parse(saved);
            if (!progress.stages || !this.stages) return;
            
            // 保存された進行状況を適用
            progress.stages.forEach(savedStage => {
                const stage = this.stages.find(s => s.id === savedStage.id);
                if (stage) {
                    stage.unlocked = savedStage.unlocked;
                    stage.bestScore = savedStage.bestScore || 0;
                    stage.bestTime = savedStage.bestTime || 0;
                }
            });
            
        } catch (error) {
            console.error('進行状況の読み込みエラー:', error);
        }
    }
    
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.LevelLoader = LevelLoader;
}

// Node.js環境でも利用可能にする
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelLoader;
}

// グローバルスコープにも追加（テスト環境用）
if (typeof global !== 'undefined') {
    global.LevelLoader = LevelLoader;
}