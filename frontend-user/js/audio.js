/**
 * 音效管理系统
 * 使用Web Audio API生成游戏音效
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;
        this.initialized = false;
    }

    /**
     * 初始化音频上下文
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('[Audio] 音频系统初始化成功');
        } catch (e) {
            console.warn('[Audio] 音频系统初始化失败:', e);
        }
    }

    /**
     * 设置音效音量
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置音乐音量
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 播放开火音效
     */
    playShoot() {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建噪声
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // 低通滤波器
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        // 音量控制
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.15);
    }

    /**
     * 播放爆炸音效
     */
    playExplosion() {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建爆炸噪声
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * (1 - t);
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // 低通滤波器
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        
        // 音量控制
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.5);
    }

    /**
     * 播放命中音效
     */
    playHit() {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 金属撞击声
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * 播放升级音效
     */
    playLevelUp() {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 上升音调
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });
    }

    /**
     * 播放引擎声
     */
    playEngine(speed) {
        // 引擎声在实际游戏中可以用循环音效实现
        // 这里简化处理
    }

    /**
     * 播放受伤音效
     */
    playDamage() {
        if (!this.initialized) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// 全局音频管理器实例
const audioManager = new AudioManager();
