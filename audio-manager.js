// 音频管理器 - 处理跨页面播放
class AudioManager {
    static instance;
    
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        
        this.audioElement = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.volume = 0.7;
        this.currentQuality = 'normal';
        this.currentBookId = 'audio-001';
        
        // 从localStorage恢复状态
        this.loadState();
        
        // 每秒保存一次当前播放时间
        setInterval(() => {
            if (this.audioElement && this.isPlaying) {
                this.saveCurrentTime();
            }
        }, 1000);
        
        // 监听页面卸载事件，保存状态
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        AudioManager.instance = this;
    }
    
    // 创建音频元素
    createAudio(src) {
        if (!this.audioElement) {
            this.audioElement = new Audio(src);
            this.audioElement.volume = this.volume;
            
            // 添加事件监听
            this.audioElement.addEventListener('ended', () => {
                this.isPlaying = false;
                this.saveState();
                
                // 触发自定义事件
                const event = new CustomEvent('audioEnded');
                window.dispatchEvent(event);
            });
            
            // 监听播放状态变化
            this.audioElement.addEventListener('play', () => {
                this.isPlaying = true;
                this.saveState();
            });
            
            this.audioElement.addEventListener('pause', () => {
                this.isPlaying = false;
                this.saveState();
            });
            
            // 监听时间更新
            this.audioElement.addEventListener('timeupdate', () => {
                this.currentTime = this.audioElement.currentTime;
                
                // 触发自定义事件
                const event = new CustomEvent('audioTimeUpdate', {
                    detail: {
                        currentTime: this.currentTime,
                        duration: this.audioElement.duration
                    }
                });
                window.dispatchEvent(event);
            });
            
            // 安全地设置当前播放时间
            const savedTime = this.currentTime;
            if (savedTime > 0) {
                // 确保音频元数据已加载再设置时间
                if (this.audioElement.readyState >= 1) {
                    this.audioElement.currentTime = savedTime;
                } else {
                    this.audioElement.addEventListener('loadedmetadata', () => {
                        this.audioElement.currentTime = savedTime;
                    });
                }
            }
        }
        
        return this.audioElement;
    }
    
    // 播放音频
    play() {
        if (this.audioElement) {
            this.audioElement.play().catch(error => {
                console.error('播放失败:', error);
            });
            this.isPlaying = true;
            this.saveState();
        }
    }
    
    // 暂停音频
    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isPlaying = false;
            this.saveState();
        }
    }
    
    // 切换播放/暂停
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        return this.isPlaying;
    }
    
    // 设置音量
    setVolume(volume) {
        this.volume = volume;
        if (this.audioElement) {
            this.audioElement.volume = volume;
        }
        this.saveState();
    }
    
    // 跳转到指定时间
    seekTo(time) {
        if (this.audioElement) {
            this.audioElement.currentTime = time;
            this.currentTime = time;
            this.saveState();
        }
    }
    
    // 获取当前时间
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : this.currentTime;
    }
    
    // 获取总时长
    getDuration() {
        return this.audioElement ? this.audioElement.duration : 0;
    }
    
    // 获取播放状态
    getIsPlaying() {
        return this.isPlaying;
    }
    
    // 保存当前播放时间
    saveCurrentTime() {
        if (this.audioElement) {
            this.currentTime = this.audioElement.currentTime;
            try {
                localStorage.setItem('audioCurrentTime', this.currentTime.toString());
            } catch (error) {
                console.error('保存播放时间失败:', error);
            }
        }
    }
    
    // 保存状态到localStorage
    saveState() {
        try {
            const state = {
                isPlaying: this.isPlaying,
                currentTime: this.currentTime,
                volume: this.volume,
                currentQuality: this.currentQuality,
                currentBookId: this.currentBookId
            };
            localStorage.setItem('audioState', JSON.stringify(state));
        } catch (error) {
            console.error('保存音频状态失败:', error);
        }
    }
    
    // 从localStorage加载状态
    loadState() {
        try {
            const stateJson = localStorage.getItem('audioState');
            if (stateJson) {
                const state = JSON.parse(stateJson);
                this.isPlaying = state.isPlaying;
                this.currentTime = state.currentTime || 0;
                this.volume = state.volume || 0.7;
                this.currentQuality = state.currentQuality || 'normal';
                this.currentBookId = state.currentBookId || 'audio-001';
            }
        } catch (error) {
            console.error('加载音频状态失败:', error);
            // 重置为默认状态
            this.isPlaying = false;
            this.currentTime = 0;
            this.volume = 0.7;
            this.currentQuality = 'normal';
            this.currentBookId = 'audio-001';
        }
    }
    
    // 设置当前播放的书籍
    setCurrentBook(bookId, src) {
        if (this.currentBookId !== bookId) {
            this.currentBookId = bookId;
            this.currentTime = 0;
            
            if (this.audioElement) {
                this.audioElement.src = src;
                this.isPlaying = false;
            }
        }
        this.saveState();
    }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();

// 导出音频管理器
window.AudioManager = AudioManager;
window.audioManager = audioManager; 