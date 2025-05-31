// 音频元素和控制器
let audioElement;
let isPlaying = false;
let currentQuality = 'normal'; // 默认普通品质（MP3）

// 音频文件路径
const audioFiles = {
    high: 'audio/这次我们怎么死？.mp3',  // 由于只有mp3文件，高品质也使用相同文件
    normal: 'audio/这次我们怎么死？.mp3'  // 使用实际提供的文件
};

// DOM 元素
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const currentTimeEl = document.querySelector('.current-time');
const durationEl = document.querySelector('.duration');
const volumeSlider = document.querySelector('.volume-slider');
const volumeProgress = document.querySelector('.volume-progress');
const qualityBtns = document.querySelectorAll('.quality-btn');
const coverImg = document.querySelector('.cover-img');
const navItems = document.querySelectorAll('.nav-item');
const actionBtns = document.querySelectorAll('.action-btn');
const searchInput = document.querySelector('.search-bar input');

// 当前播放的有声书信息
const currentBookInfo = {
    id: 'audio-001',
    title: '这次我们怎么死？',
    author: '屹涵原创有声书',
    cover: 'images/1.jpg',
    type: 'audiobook',
    genre: '科幻故事',
    duration: '27分钟',
    readTimeMinutes: 27,
    readDates: [new Date().toISOString().split('T')[0]]
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 创建音频元素
    createAudioElement();

    // 事件监听
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', () => seekAudio(-10)); // 后退10秒
    nextBtn.addEventListener('click', () => seekAudio(10));  // 前进10秒
    progressBar.addEventListener('click', seek);
    volumeSlider.addEventListener('click', setVolume);
    
    // 品质选择按钮
    qualityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const quality = this.dataset.quality;
            changeQuality(quality);
        });
    });

    // 导航项目点击 (仅处理没有被链接包裹的导航项)
    navItems.forEach(item => {
        // 确保该项目不在链接内部
        if (!item.closest('.nav-item-link')) {
            item.addEventListener('click', function() {
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        }
    });

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // 如果用户在搜索，可以显示搜索提示或跳转到书库页面
            if (this.value.length > 2) {
                // 可以在这里添加搜索建议的功能
                console.log('搜索: ' + this.value);
            }
        });
        
        // 当按下回车键时搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                // 跳转到书库页面并传递搜索词
                window.location.href = `library.html?search=${encodeURIComponent(this.value.trim())}`;
            }
        });
    }

    // 动作按钮点击
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 添加点击动画效果
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 200);
            
            // 处理不同的动作
            const action = this.querySelector('span').textContent;
            handleAction(action);
        });
    });

    // 音频事件
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioElement.duration);
    });
    audioElement.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButton();
    });
    
    // 添加封面图片动画效果
    if (coverImg) {
        coverImg.addEventListener('mousemove', handleCoverHover);
        coverImg.addEventListener('mouseleave', resetCoverPosition);
    }
    
    // 检查收藏状态
    checkFavoriteStatus();
    
    // 获取URL参数，如果是从收藏页面跳转过来
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    if (bookId) {
        // 可以根据ID加载对应的书籍
        console.log(`加载ID: ${bookId}的书籍`);
    }
});

// 创建音频元素
function createAudioElement() {
    audioElement = new Audio(audioFiles[currentQuality]);
    audioElement.volume = 0.7; // 默认音量
    updateVolumeUI(audioElement.volume);
}

// 切换播放/暂停
function togglePlay() {
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play().catch(error => {
            console.error('播放失败:', error);
            // 用户与页面未交互时，自动播放可能会失败
            alert('请点击播放按钮开始播放');
        });
    }
    
    isPlaying = !isPlaying;
    updatePlayButton();
    
    // 播放动画
    if (isPlaying) {
        coverImg.classList.add('playing');
    } else {
        coverImg.classList.remove('playing');
    }
    
    // 记录阅读时间和日期
    if (isPlaying) {
        updateReadStatistics();
    }
}

// 更新播放按钮图标
function updatePlayButton() {
    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// 更新进度条
function updateProgress() {
    const percent = (audioElement.currentTime / audioElement.duration) * 100;
    progress.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audioElement.currentTime);
    
    // 更新当前书籍的进度
    currentBookInfo.progress = Math.floor(percent);
    
    // 如果该书籍已收藏，更新收藏中的进度
    updateFavoriteProgress(currentBookInfo);
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 跳转到指定位置
function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * audioElement.duration;
    
    audioElement.currentTime = seekTime;
    progress.style.width = `${percent * 100}%`;
}

// 前进/后退
function seekAudio(seconds) {
    audioElement.currentTime += seconds;
}

// 设置音量
function setVolume(e) {
    const rect = volumeSlider.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    
    audioElement.volume = Math.max(0, Math.min(1, percent));
    updateVolumeUI(percent);
}

// 更新音量UI
function updateVolumeUI(volumeValue) {
    volumeProgress.style.width = `${volumeValue * 100}%`;
    
    // 更新音量图标
    const volumeIcon = document.querySelector('.volume-container i');
    if (volumeValue > 0.6) {
        volumeIcon.className = 'fas fa-volume-up';
    } else if (volumeValue > 0.1) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-mute';
    }
}

// 切换音频品质
function changeQuality(quality) {
    if (quality === currentQuality) return;
    
    // 由于实际只有一个文件，这里只需要更新UI状态
    
    // 保存当前播放状态和位置
    const wasPlaying = isPlaying;
    const currentTime = audioElement.currentTime;
    
    // 暂停当前音频
    if (isPlaying) {
        audioElement.pause();
    }
    
    // 更新UI
    qualityBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.quality === quality);
    });
    
    // 切换音频源（实际上是相同的文件）
    currentQuality = quality;
    
    // 如果之前在播放，则继续播放
    if (wasPlaying) {
        audioElement.play().catch(error => {
            console.error('恢复播放失败:', error);
        });
        isPlaying = true;
        updatePlayButton();
    }
}

// 处理动作按钮
function handleAction(action) {
    switch(action) {
        case '分享':
            alert('分享功能尚未实现');
            break;
        case '下载':
            alert('下载功能尚未实现');
            break;
        case '添加到收藏':
            toggleFavorite();
            break;
        case '从收藏中移除':
            toggleFavorite();
            break;
    }
}

// 切换收藏状态
function toggleFavorite() {
    // 更新当前书籍进度
    currentBookInfo.progress = Math.floor((audioElement.currentTime / audioElement.duration) * 100) || 35;
    currentBookInfo.lastActivity = '刚刚收听';
    
    // 获取当前收藏列表
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // 检查是否已收藏
    const index = favorites.findIndex(item => item.id === currentBookInfo.id);
    
    // 切换收藏按钮
    const favoriteBtn = document.querySelector('.action-btn:last-child');
    
    if (index >= 0) {
        // 已收藏，移除
        favorites.splice(index, 1);
        if (favoriteBtn) {
            favoriteBtn.innerHTML = '<i class="fas fa-plus"></i><span>添加到收藏</span>';
        }
        showToast('已从收藏中移除');
    } else {
        // 未收藏，添加
        favorites.push(currentBookInfo);
        if (favoriteBtn) {
            favoriteBtn.innerHTML = '<i class="fas fa-check"></i><span>从收藏中移除</span>';
        }
        showToast('已添加到收藏');
    }
    
    // 保存到本地存储
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // 如果收藏页面的FavoritesManager存在，更新收藏页面
    if (window.opener && window.opener.FavoritesManager) {
        window.opener.FavoritesManager.loadFavoritesFromStorage();
    }
}

// 检查收藏状态
function checkFavoriteStatus() {
    const favoriteBtn = document.querySelector('.action-btn:last-child');
    if (!favoriteBtn) return;
    
    // 获取当前收藏列表
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // 检查是否已收藏
    const isFavorited = favorites.some(item => item.id === currentBookInfo.id);
    
    // 更新按钮状态
    if (isFavorited) {
        favoriteBtn.innerHTML = '<i class="fas fa-check"></i><span>从收藏中移除</span>';
    } else {
        favoriteBtn.innerHTML = '<i class="fas fa-plus"></i><span>添加到收藏</span>';
    }
}

// 更新收藏中的进度
function updateFavoriteProgress(bookInfo) {
    // 获取当前收藏列表
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // 查找当前书籍
    const index = favorites.findIndex(item => item.id === bookInfo.id);
    
    // 如果已收藏，更新进度
    if (index >= 0) {
        favorites[index].progress = bookInfo.progress;
        favorites[index].lastActivity = '刚刚收听';
        
        // 保存到本地存储
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// 更新阅读统计
function updateReadStatistics() {
    // 获取当前收藏列表
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // 查找当前书籍
    const index = favorites.findIndex(item => item.id === currentBookInfo.id);
    
    // 添加今天的日期到阅读日期数组
    const today = new Date().toISOString().split('T')[0];
    
    // 如果已收藏，更新统计
    if (index >= 0) {
        // 初始化阅读日期数组
        if (!favorites[index].readDates) {
            favorites[index].readDates = [];
        }
        
        // 添加今天的日期（如果不存在）
        if (!favorites[index].readDates.includes(today)) {
            favorites[index].readDates.push(today);
        }
        
        // 保存到本地存储
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// 显示提示消息
function showToast(message) {
    // 检查是否已存在toast元素
    let toast = document.getElementById('toast');
    
    if (!toast) {
        // 创建toast元素
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;
        document.body.appendChild(toast);
    }
    
    // 设置消息
    toast.textContent = message;
    
    // 显示并自动隐藏
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

// 封面图片3D悬停效果
function handleCoverHover(e) {
    const { left, top, width, height } = e.target.parentElement.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    const xPercent = (x / width - 0.5) * 2; // -1 to 1
    const yPercent = (y / height - 0.5) * 2; // -1 to 1
    
    e.target.style.transform = `
        perspective(1000px) 
        rotateY(${xPercent * 5}deg) 
        rotateX(${yPercent * -5}deg)
        translateZ(10px)
    `;
}

// 重置封面图片位置
function resetCoverPosition(e) {
    e.target.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)';
} 