/**
 * Web Audio APIを使用したオリジナル音楽生成システム
 */

class MusicSystem {
    constructor() {
        // AudioContextの初期化
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        
        // 現在再生中のBGM
        this.currentBGM = null;
        this.bgmLoopInterval = null;
        
        // アクティブなオーディオノードを追跡
        this.activeNodes = [];
        
        // 音量設定
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.5; // 効果音の音量
        this.isMuted = false;
    }
    
    // オーディオコンテキストの初期化（ユーザー操作後に呼ぶ必要がある）
    async init() {
        if (this.isInitialized) return;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API is not supported in this browser');
            }
            
            this.audioContext = new AudioContextClass();
            
            // suspended状態の場合はresume
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.bgmVolume;
            
            this.isInitialized = true;
        } catch (error) {
            console.warn('音楽システムの初期化に失敗しました:', error);
            this.isInitialized = false;
        }
    }
    
    // ノートの周波数を取得
    getNoteFrequency(note) {
        const notes = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
            'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
        };
        return notes[note] || 440;
    }
    
    // 単音を再生
    playNote(frequency, duration, startTime, type = 'square', volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // アクティブノードリストに追加
        this.activeNodes.push({ oscillator, gainNode });
        
        // エンベロープ
        const now = startTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // アタック
        gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + duration * 0.1); // ディケイ
        gainNode.gain.setValueAtTime(volume * 0.7, now + duration * 0.9); // サステイン
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // リリース
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        // 終了時にアクティブノードリストから削除
        oscillator.addEventListener('ended', () => {
            const index = this.activeNodes.findIndex(node => node.oscillator === oscillator);
            if (index !== -1) {
                this.activeNodes.splice(index, 1);
            }
        });
    }
    
    // コードを再生
    playChord(notes, duration, startTime, type = 'sine', volume = 0.2) {
        notes.forEach(note => {
            const freq = this.getNoteFrequency(note);
            this.playNote(freq, duration, startTime, type, volume);
        });
    }
    
    // ドラムサウンドを再生
    playDrum(type, startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const now = startTime;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // アクティブノードリストに追加
        this.activeNodes.push({ oscillator, gainNode });
        
        switch(type) {
            case 'kick':
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                gainNode.gain.setValueAtTime(1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
            case 'snare':
                const noise = this.audioContext.createBufferSource();
                const noiseBuffer = this.audioContext.createBuffer(1, 4410, this.audioContext.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < noiseData.length; i++) {
                    noiseData[i] = Math.random() * 2 - 1;
                }
                noise.buffer = noiseBuffer;
                noise.connect(gainNode);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                noise.start(now);
                // ノイズソースもアクティブノードリストに追加
                this.activeNodes.push({ oscillator: noise, gainNode });
                break;
            case 'hihat':
                oscillator.type = 'square';
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;
        }
        
        // 終了時にアクティブノードリストから削除
        oscillator.addEventListener('ended', () => {
            const index = this.activeNodes.findIndex(node => node.oscillator === oscillator);
            if (index !== -1) {
                this.activeNodes.splice(index, 1);
            }
        });
    }
    
    // タイトル画面のBGM
    playTitleBGM() {
        if (this.currentBGM === 'title') {
            return;
        }
        
        this.stopBGM();
        
        if (!this.isInitialized) {
            return;
        }
        
        const bpm = 120;
        const beatLength = 60 / bpm;
        let currentBeat = 0;
        
        const playBar = () => {
            const now = this.audioContext.currentTime;
            
            // ベースライン（8ビート）
            const bassPattern = ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'F3', 'F3'];
            for (let i = 0; i < 8; i++) {
                this.playNote(
                    this.getNoteFrequency(bassPattern[i]),
                    beatLength * 0.9,
                    now + i * beatLength * 0.5,
                    'sine',
                    0.4
                );
            }
            
            // コード進行（4拍子）
            const chords = [
                ['C4', 'E4', 'G4'],
                ['G4', 'B4', 'D5'],
                ['A4', 'C5', 'E5'],
                ['F4', 'A4', 'C5']
            ];
            
            for (let i = 0; i < 4; i++) {
                this.playChord(
                    chords[i],
                    beatLength * 0.9,
                    now + i * beatLength,
                    'triangle',
                    0.2
                );
            }
            
            // メロディー
            const melody = [
                { note: 'E5', duration: 0.5 },
                { note: 'D5', duration: 0.5 },
                { note: 'C5', duration: 1 },
                { note: 'G4', duration: 1 },
                { note: 'A4', duration: 0.5 },
                { note: 'B4', duration: 0.5 },
                { note: 'C5', duration: 1 }
            ];
            
            let melodyTime = now;
            melody.forEach(({ note, duration }) => {
                this.playNote(
                    this.getNoteFrequency(note),
                    duration * beatLength * 0.9,
                    melodyTime,
                    'square',
                    0.3
                );
                melodyTime += duration * beatLength;
            });
            
            currentBeat += 4;
        };
        
        // 最初のバーを再生
        playBar();
        
        // ループ設定
        this.bgmLoopInterval = setInterval(() => {
            playBar();
        }, beatLength * 4 * 1000);
        
        this.currentBGM = 'title';
    }
    
    // ゲームプレイ中のBGM
    playGameBGM() {
        if (this.currentBGM === 'game') {
            return;
        }
        
        this.stopBGM();
        
        if (!this.isInitialized) {
            return;
        }
        
        const bpm = 140;
        const beatLength = 60 / bpm;
        let currentBeat = 0;
        
        const playBar = () => {
            const now = this.audioContext.currentTime;
            
            // ドラムパターン
            for (let i = 0; i < 4; i++) {
                // キック
                this.playDrum('kick', now + i * beatLength);
                // スネア
                if (i === 1 || i === 3) {
                    this.playDrum('snare', now + i * beatLength);
                }
                // ハイハット
                for (let j = 0; j < 2; j++) {
                    this.playDrum('hihat', now + i * beatLength + j * beatLength * 0.5);
                }
            }
            
            // ベースライン（アルペジオパターン）
            const bassPattern = [
                'C3', 'E3', 'G3', 'E3',
                'F3', 'A3', 'C4', 'A3',
                'G3', 'B3', 'D4', 'B3',
                'C3', 'E3', 'G3', 'E3'
            ];
            
            for (let i = 0; i < 16; i++) {
                this.playNote(
                    this.getNoteFrequency(bassPattern[i]),
                    beatLength * 0.23,
                    now + i * beatLength * 0.25,
                    'sawtooth',
                    0.3
                );
            }
            
            // リードメロディー（2小節目から）
            if (currentBeat % 8 >= 4) {
                const leadNotes = [
                    { note: 'G5', duration: 0.5 },
                    { note: 'E5', duration: 0.5 },
                    { note: 'C5', duration: 0.5 },
                    { note: 'E5', duration: 0.5 },
                    { note: 'G5', duration: 1 },
                    { note: 'A5', duration: 0.5 },
                    { note: 'G5', duration: 0.5 }
                ];
                
                let leadTime = now;
                leadNotes.forEach(({ note, duration }) => {
                    this.playNote(
                        this.getNoteFrequency(note),
                        duration * beatLength * 0.8,
                        leadTime,
                        'square',
                        0.25
                    );
                    leadTime += duration * beatLength;
                });
            }
            
            currentBeat += 4;
        };
        
        // 最初のバーを再生
        playBar();
        
        // ループ設定
        this.bgmLoopInterval = setInterval(() => {
            playBar();
        }, beatLength * 4 * 1000);
        
        this.currentBGM = 'game';
    }
    
    // ゲームクリアのジングル
    playVictoryJingle() {
        this.stopBGM();
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const notes = [
            { note: 'C5', time: 0, duration: 0.2 },
            { note: 'E5', time: 0.2, duration: 0.2 },
            { note: 'G5', time: 0.4, duration: 0.2 },
            { note: 'C6', time: 0.6, duration: 0.6 }
        ];
        
        notes.forEach(({ note, time, duration }) => {
            this.playNote(
                this.getNoteFrequency(note),
                duration,
                now + time,
                'sine',
                0.4
            );
        });
        
        // 和音
        this.playChord(['C4', 'E4', 'G4', 'C5'], 1.2, now, 'triangle', 0.3);
    }
    
    // ゲームオーバーのジングル
    playGameOverJingle() {
        this.stopBGM();
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const notes = [
            { note: 'C4', time: 0, duration: 0.3 },
            { note: 'B3', time: 0.3, duration: 0.3 },
            { note: 'A3', time: 0.6, duration: 0.3 },
            { note: 'G3', time: 0.9, duration: 0.6 }
        ];
        
        notes.forEach(({ note, time, duration }) => {
            this.playNote(
                this.getNoteFrequency(note),
                duration,
                now + time,
                'sine',
                0.3
            );
        });
    }
    
    // ゲームオーバー効果音（ジングルの後にBGMを再生）
    playGameOverSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // まずジングルを再生
        this.playGameOverJingle();
        
        // ジングル終了後にゲームオーバーBGMを開始
        setTimeout(() => {
            if (!this.isInitialized || this.isMuted) return;
            this.playGameOverBGM();
        }, 1800);
    }
    
    // ゲームオーバーBGM
    playGameOverBGM() {
        if (!this.isInitialized || this.isMuted) return;
        if (this.currentBGM === 'gameOver') return;
        
        this.stopBGM();
        
        const beatLength = 0.5; // 120 BPM
        let currentBeat = 0;
        
        const playBar = () => {
            if (!this.isInitialized || this.isMuted || this.currentBGM !== 'gameOver') return;
            
            const now = this.audioContext.currentTime;
            
            // 悲しげな和音進行
            const chords = [
                ['C3', 'Eb3', 'G3'],
                ['Ab3', 'C4', 'Eb4'],
                ['F3', 'Ab3', 'C4'],
                ['G3', 'B3', 'D4']
            ];
            
            const chordIndex = Math.floor(currentBeat / 2) % 4;
            this.playChord(chords[chordIndex], beatLength * 2, now, 'sine', 0.2);
            
            // 低いベースライン
            const bassNote = chords[chordIndex][0];
            this.playNote(
                this.getNoteFrequency(bassNote) / 2,
                beatLength * 1.8,
                now,
                'triangle',
                0.3
            );
            
            currentBeat += 2;
        };
        
        playBar();
        
        this.bgmLoopInterval = setInterval(() => {
            playBar();
        }, beatLength * 2 * 1000);
        
        this.currentBGM = 'gameOver';
    }
    
    // 全てのアクティブノードを強制停止
    stopAllActiveNodes() {
        
        this.activeNodes.forEach(({ oscillator, gainNode }) => {
            try {
                // ゲインを即座に0に設定
                if (gainNode && gainNode.gain) {
                    gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                }
                // オシレーターを即座に停止
                if (oscillator && oscillator.stop) {
                    oscillator.stop(this.audioContext.currentTime);
                }
            } catch (e) {
            }
        });
        
        // アクティブノードリストをクリア
        this.activeNodes = [];
    }
    
    // BGMを停止
    stopBGM() {
        
        // 既に停止済みの場合はスキップ
        if (!this.currentBGM && !this.bgmLoopInterval) {
            return;
        }
        
        // ループを停止
        if (this.bgmLoopInterval) {
            clearInterval(this.bgmLoopInterval);
            this.bgmLoopInterval = null;
        }
        
        // 全てのアクティブノードを強制停止
        this.stopAllActiveNodes();
        
        // 現在のBGMを無効化
        this.currentBGM = null;
        
    }
    
    // 音量を設定
    setVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.value = this.bgmVolume;
        }
    }
    
    // ミュート切り替え
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.bgmVolume;
        }
        return this.isMuted;
    }
    
    // ミュート状態を取得
    getMuteState() {
        return this.isMuted;
    }
    
    // ===== サウンドエフェクトシステム =====
    
    // 効果音を再生する基本メソッド
    playSoundEffect(frequency, duration, type = 'square', volume = null, envelope = null) {
        if (!this.isInitialized || this.isMuted) return;
        
        const effectVolume = volume !== null ? volume : this.sfxVolume;
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // エンベロープの設定
        if (envelope) {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(effectVolume, now + envelope.attack);
            gainNode.gain.exponentialRampToValueAtTime(effectVolume * envelope.decay, now + envelope.attack + envelope.decayTime);
            gainNode.gain.setValueAtTime(effectVolume * envelope.sustain, now + duration - envelope.release);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        } else {
            gainNode.gain.setValueAtTime(effectVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        }
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    // ゲームスタート効果音
    playGameStartSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // 上昇音階
        const notes = [
            { freq: this.getNoteFrequency('C4'), time: 0, duration: 0.1 },
            { freq: this.getNoteFrequency('E4'), time: 0.1, duration: 0.1 },
            { freq: this.getNoteFrequency('G4'), time: 0.2, duration: 0.1 },
            { freq: this.getNoteFrequency('C5'), time: 0.3, duration: 0.3 }
        ];
        
        notes.forEach(({ freq, time, duration }) => {
            setTimeout(() => {
                this.playSoundEffect(freq, duration, 'sine', 0.6);
            }, time * 1000);
        });
    }
    
    // 敵踏みつけ効果音
    playEnemyStompSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // フリークエンシースイープ + ノイズ
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.type = 'square';
        oscillator1.frequency.setValueAtTime(800, now);
        oscillator1.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        
        oscillator2.type = 'sawtooth';
        oscillator2.frequency.setValueAtTime(1200, now);
        oscillator2.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.2);
        oscillator2.stop(now + 0.15);
    }
    
    // ミス（ダメージ）効果音
    playDamageSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // 下降音階 + ノイズ
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }
    
    // 穴に落ちた時の効果音
    playFallDeathSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // 長い下降音（落下感を表現）
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // メイン下降音
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(800, now);
        oscillator1.frequency.exponentialRampToValueAtTime(40, now + 1.5);
        
        // ハーモニクス（オクターブ上）
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(1600, now);
        oscillator2.frequency.exponentialRampToValueAtTime(80, now + 1.5);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // フェードアウト
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 1.5);
        oscillator2.stop(now + 1.5);
        
        // エコー効果を追加
        setTimeout(() => {
            if (!this.isInitialized || this.isMuted) return;
            this.playSoundEffect(200, 0.3, 'sine', 0.2);
        }, 500);
    }
    
    // ジャンプ効果音
    playJumpSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        this.playSoundEffect(
            440, // A4
            0.1,
            'square',
            0.3,
            { attack: 0.01, decayTime: 0.03, decay: 0.7, sustain: 0.5, release: 0.06 }
        );
        
        // ハーモニクスを追加
        setTimeout(() => {
            this.playSoundEffect(880, 0.08, 'sine', 0.15);
        }, 20);
    }
    
    // コイン収集効果音（より高音でコインらしく）
    playCoinSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // より高音のキラキラ音（オクターブ上げる）
        const notes = [
            { freq: this.getNoteFrequency('A5'), time: 0, duration: 0.08 },
            { freq: this.getNoteFrequency('C6'), time: 0.04, duration: 0.08 },
            { freq: this.getNoteFrequency('E6'), time: 0.08, duration: 0.12 }
        ];
        
        notes.forEach(({ freq, time, duration }) => {
            setTimeout(() => {
                this.playSoundEffect(freq, duration, 'sine', 0.5);
            }, time * 1000);
        });
        
        // さらに高いハーモニクスを追加
        setTimeout(() => {
            this.playSoundEffect(this.getNoteFrequency('A6'), 0.1, 'triangle', 0.3);
        }, 60);
    }
    
    // ゴール効果音
    playGoalSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // ファンファーレ風の効果音
        const melody = [
            { freq: this.getNoteFrequency('C5'), time: 0, duration: 0.2 },
            { freq: this.getNoteFrequency('E5'), time: 0.15, duration: 0.2 },
            { freq: this.getNoteFrequency('G5'), time: 0.3, duration: 0.2 },
            { freq: this.getNoteFrequency('C6'), time: 0.45, duration: 0.4 }
        ];
        
        melody.forEach(({ freq, time, duration }) => {
            setTimeout(() => {
                this.playSoundEffect(freq, duration, 'triangle', 0.5);
            }, time * 1000);
        });
        
        // ハーモニーを追加
        setTimeout(() => {
            this.playChord(['C4', 'E4', 'G4', 'C5'], 0.8, this.audioContext.currentTime, 'sine', 0.3);
        }, 200);
    }
    
    // ボタン押下効果音
    playButtonClickSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // 短いクリック音
        this.playSoundEffect(
            800,
            0.05,
            'square',
            0.2,
            { attack: 0.01, decayTime: 0.02, decay: 0.5, sustain: 0.3, release: 0.02 }
        );
    }
    
    // リスタート効果音
    playRestartSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // リセット音（下降→上昇）
        const now = this.audioContext.currentTime;
        
        // 下降音
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.1);
        
        // 上昇音
        setTimeout(() => {
            if (!this.isInitialized || this.isMuted) return;
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(400, this.audioContext.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
            gain2.gain.setValueAtTime(0.25, this.audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            osc2.connect(gain2);
            gain2.connect(this.masterGain);
            osc2.start(this.audioContext.currentTime);
            osc2.stop(this.audioContext.currentTime + 0.15);
        }, 100);
    }
    
    // スプリングの効果音を再生
    playSpringSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // スプリングの弾む音（ボヨヨーン）
        const time = this.audioContext.currentTime;
        
        // 低音から高音へのスイープ
        for (let i = 0; i < 3; i++) {
            const startFreq = 100 + i * 50;
            const endFreq = 400 + i * 100;
            const delay = i * 0.05;
            
            // 周波数スイープ
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(startFreq, time + delay);
            osc.frequency.exponentialRampToValueAtTime(endFreq, time + delay + 0.15);
            
            gainNode.gain.setValueAtTime(0.3 - i * 0.1, time + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + delay + 0.2);
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            osc.start(time + delay);
            osc.stop(time + delay + 0.2);
            
            this.activeNodes.push({ osc, gainNode });
        }
    }
    
    // 効果音の音量を設定
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 効果音の音量を取得
    getSfxVolume() {
        return this.sfxVolume;
    }
    
    // クリーンアップ
    destroy() {
        try {
            this.stopAllActiveNodes();
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close().catch(error => {
                    console.error('AudioContext closing error:', error);
                });
            }
            this.isInitialized = false;
        } catch (error) {
            console.error('音楽システムのクリーンアップエラー:', error);
        }
    }
}

// グローバルスコープに設定（ブラウザ/テスト環境）
if (typeof window !== 'undefined') {
    window.MusicSystem = MusicSystem;
}
if (typeof global !== 'undefined') {
    global.MusicSystem = MusicSystem;
}

// Node.js環境用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicSystem;
}