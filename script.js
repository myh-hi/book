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
const shareBtn = document.getElementById('share-btn');
const downloadBtn = document.getElementById('download-btn');
const favoriteBtn = document.getElementById('favorite-btn');
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
    
    // 处理导航链接点击，确保不中断音频播放
    document.querySelectorAll('.nav-item-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 保存当前播放状态
            audioManager.saveState();
            
            // 获取目标页面URL
            const href = this.getAttribute('data-href') || this.getAttribute('href');
            
            // 延迟跳转，确保状态已保存
            setTimeout(() => {
                window.location.href = href;
            }, 100);
        });
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
                // 保存当前播放状态
                audioManager.saveState();
                
                // 跳转到书库页面并传递搜索词
                window.location.href = `library.html?search=${encodeURIComponent(this.value.trim())}`;
            }
        });
    }

    // 动作按钮点击
    shareBtn.addEventListener('click', () => {
        shareBtn.classList.add('clicked');
        setTimeout(() => {
            shareBtn.classList.remove('clicked');
        }, 200);
        shareAudio();
    });
    
    downloadBtn.addEventListener('click', () => {
        downloadBtn.classList.add('clicked');
        setTimeout(() => {
            downloadBtn.classList.remove('clicked');
        }, 200);
        downloadAudio();
    });
    
    favoriteBtn.addEventListener('click', () => {
        favoriteBtn.classList.add('clicked');
        setTimeout(() => {
            favoriteBtn.classList.remove('clicked');
        }, 200);
        toggleFavorite();
    });

    // 监听音频管理器事件
    window.addEventListener('audioTimeUpdate', (e) => {
        updateProgress(e.detail.currentTime, e.detail.duration);
    });
    
    window.addEventListener('audioEnded', () => {
        isPlaying = false;
        updatePlayButton();
    });
    
    // 添加封面图片动画效果
    if (coverImg) {
        coverImg.addEventListener('mousemove', handleCoverHover);
        coverImg.addEventListener('mouseleave', resetCoverPosition);
        
        // 添加点击封面显示大图功能
        coverImg.addEventListener('click', showLargeCover);
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
    
    // 如果音频管理器中有播放状态，更新UI
    if (audioManager.getIsPlaying()) {
        isPlaying = true;
        updatePlayButton();
        if (coverImg) coverImg.classList.add('playing');
    }
});

// 创建音频元素
function createAudioElement() {
    // 使用音频管理器创建音频元素
    audioElement = audioManager.createAudio(audioFiles[currentQuality]);
    
    // 同步音量设置
    if (audioManager.volume !== undefined) {
        updateVolumeUI(audioManager.volume);
    } else {
        updateVolumeUI(0.7); // 默认音量
    }
    
    // 如果有保存的播放进度，更新UI
    if (audioManager.currentTime > 0) {
        const duration = audioManager.getDuration();
        if (duration) {
            updateProgress(audioManager.currentTime, duration);
        }
    }
}

// 切换播放/暂停
function togglePlay() {
    // 使用音频管理器切换播放状态
    isPlaying = audioManager.togglePlay();
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
function updateProgress(currentTime, duration) {
    // 如果没有传参，使用音频元素的当前值
    if (currentTime === undefined) {
        currentTime = audioManager.getCurrentTime();
    }
    if (duration === undefined) {
        duration = audioManager.getDuration();
    }
    
    if (duration) {
        const percent = (currentTime / duration) * 100;
        progress.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
        
        // 更新当前书籍的进度
        currentBookInfo.progress = Math.floor(percent);
        
        // 如果该书籍已收藏，更新收藏中的进度
        updateFavoriteProgress(currentBookInfo);
    }
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
    const duration = audioManager.getDuration();
    
    if (duration) {
        const seekTime = percent * duration;
        audioManager.seekTo(seekTime);
        updateProgress(seekTime, duration);
    }
}

// 前进/后退
function seekAudio(seconds) {
    const currentTime = audioManager.getCurrentTime();
    const newTime = Math.max(0, Math.min(audioManager.getDuration(), currentTime + seconds));
    audioManager.seekTo(newTime);
}

// 设置音量
function setVolume(e) {
    const rect = volumeSlider.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    
    const volumeValue = Math.max(0, Math.min(1, percent));
    audioManager.setVolume(volumeValue);
    updateVolumeUI(volumeValue);
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
    
    // 保存当前播放状态和位置
    const wasPlaying = isPlaying;
    const currentTime = audioManager.getCurrentTime();
    
    // 暂停当前音频
    if (isPlaying) {
        audioManager.pause();
    }
    
    // 更新UI
    qualityBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.quality === quality);
    });
    
    // 切换音频源
    currentQuality = quality;
    audioManager.currentQuality = quality;
    
    // 告诉音频管理器更改音频源
    try {
        // 保存当前状态
        const volume = audioManager.volume;
        const isPlaying = audioManager.isPlaying;
        
        // 创建新的音频元素并重新应用状态
        audioElement = audioManager.createAudio(audioFiles[quality]);
        
        // 确保音频元素加载完成后再设置时间
        if (audioElement.readyState >= 1) {
            audioElement.currentTime = currentTime;
        } else {
            audioElement.addEventListener('loadedmetadata', () => {
                audioElement.currentTime = currentTime;
            });
        }
    } catch (error) {
        console.error('切换音频质量时出错:', error);
        showToast('切换音频质量失败，请重试');
    }
    
    // 如果之前在播放，则继续播放
    if (wasPlaying) {
        audioManager.play();
        isPlaying = true;
        updatePlayButton();
    }
}

// 分享功能
function shareAudio() {
    // 检查Web Share API是否可用
    if (navigator.share) {
        navigator.share({
            title: currentBookInfo.title,
            text: `我正在收听《${currentBookInfo.title}》 - ${currentBookInfo.author}`,
            url: window.location.href
        })
        .then(() => showToast('分享成功'))
        .catch((error) => {
            console.error('分享失败:', error);
            showToast('分享失败，请重试');
        });
    } else {
        // 如果Web Share API不可用，显示分享对话框
        showShareDialog();
    }
}

// 显示自定义分享对话框
function showShareDialog() {
    // 创建对话框元素
    const dialog = document.createElement('div');
    dialog.className = 'share-dialog';
    dialog.innerHTML = `
        <div class="share-dialog-content">
            <div class="share-dialog-header">
                <h3>分享《${currentBookInfo.title}》</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="share-dialog-body">
                <div class="share-preview">
                    <img src="${currentBookInfo.cover}" alt="${currentBookInfo.title}" class="share-preview-img">
                    <div class="share-preview-info">
                        <h4>${currentBookInfo.title}</h4>
                        <p>${currentBookInfo.author}</p>
                    </div>
                </div>
                <div class="share-options">
                    <button class="share-option" data-platform="wechat">
                        <i class="fab fa-weixin"></i>
                        <span>微信</span>
                    </button>
                    <button class="share-option" data-platform="weibo">
                        <i class="fab fa-weibo"></i>
                        <span>微博</span>
                    </button>
                    <button class="share-option" data-platform="qq">
                        <i class="fab fa-qq"></i>
                        <span>QQ</span>
                    </button>
                    <button class="share-option" data-platform="link">
                        <i class="fas fa-link"></i>
                        <span>复制链接</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到文档
    document.body.appendChild(dialog);
    
    // 添加事件监听
    const closeBtn = dialog.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        dialog.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(dialog);
        }, 300);
    });
    
    // 分享选项点击
    const shareOptions = dialog.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', () => {
            const platform = option.dataset.platform;
            
            if (platform === 'link') {
                // 复制链接到剪贴板
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                    showToast('链接已复制到剪贴板');
                    closeBtn.click();
                });
            } else {
                // 模拟分享到其他平台
                showToast(`分享到${option.querySelector('span').textContent}功能即将上线`);
                closeBtn.click();
            }
        });
    });
    
    // 显示动画
    setTimeout(() => {
        dialog.classList.add('active');
    }, 10);
}

// 下载功能
function downloadAudio() {
    const audioUrl = audioFiles[audioManager.currentQuality || currentQuality];
    const fileName = `${currentBookInfo.title}.mp3`;
    
    // 创建下载对话框
    const dialog = document.createElement('div');
    dialog.className = 'download-dialog';
    dialog.innerHTML = `
        <div class="download-dialog-content">
            <div class="download-dialog-header">
                <h3>下载《${currentBookInfo.title}》</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="download-dialog-body">
                <div class="download-options">
                    <div class="download-option">
                        <input type="radio" id="normal-quality" name="quality" value="normal" checked>
                        <label for="normal-quality">
                            <span class="quality-name">标准品质</span>
                            <span class="quality-info">MP3 格式</span>
                        </label>
                    </div>
                    <div class="download-option">
                        <input type="radio" id="high-quality" name="quality" value="high">
                        <label for="high-quality">
                            <span class="quality-name">高品质</span>
                            <span class="quality-info">MP3 格式</span>
                        </label>
                    </div>
                </div>
                <button class="download-btn">
                    <i class="fas fa-download"></i>
                    <span>开始下载</span>
                </button>
            </div>
        </div>
    `;
    
    // 添加到文档
    document.body.appendChild(dialog);
    
    // 添加事件监听
    const closeBtn = dialog.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        dialog.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(dialog);
        }, 300);
    });
    
    // 下载按钮点击
    const downloadBtn = dialog.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => {
        // 获取选择的品质
        const selectedQuality = dialog.querySelector('input[name="quality"]:checked').value;
        const downloadUrl = audioFiles[selectedQuality];
        
        // 创建一个临时链接元素并点击它来触发下载
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 关闭对话框
        showToast('下载已开始');
        closeBtn.click();
    });
    
    // 显示动画
    setTimeout(() => {
        dialog.classList.add('active');
    }, 10);
}

// 切换收藏状态
function toggleFavorite() {
    // 更新当前书籍进度
    currentBookInfo.progress = Math.floor((audioManager.getCurrentTime() / audioManager.getDuration()) * 100) || 35;
    currentBookInfo.lastActivity = '刚刚收听';
    
    // 获取当前收藏列表
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // 检查是否已收藏
    const index = favorites.findIndex(item => item.id === currentBookInfo.id);
    
    if (index >= 0) {
        // 已收藏，移除
        favorites.splice(index, 1);
        favoriteBtn.innerHTML = '<i class="fas fa-plus"></i><span>添加到收藏</span>';
        showToast('已从收藏中移除');
    } else {
        // 未收藏，添加
        favorites.push(currentBookInfo);
        favoriteBtn.innerHTML = '<i class="fas fa-check"></i><span>从收藏中移除</span>';
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

// 显示大图功能
function showLargeCover() {
    // 创建大图查看器
    const viewer = document.createElement('div');
    viewer.className = 'cover-viewer';
    viewer.innerHTML = `
        <div class="cover-viewer-content">
            <button class="close-viewer-btn"><i class="fas fa-times"></i></button>
            <div class="large-cover-container">
                <img src="${currentBookInfo.cover}" alt="${currentBookInfo.title}" class="large-cover-img">
            </div>
            <div class="cover-viewer-info">
                <h3>${currentBookInfo.title}</h3>
                <p>${currentBookInfo.author}</p>
            </div>
        </div>
    `;
    
    // 添加到文档
    document.body.appendChild(viewer);
    
    // 添加事件监听
    const closeBtn = viewer.querySelector('.close-viewer-btn');
    closeBtn.addEventListener('click', () => {
        viewer.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(viewer);
        }, 300);
    });
    
    // 点击背景关闭
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) {
            closeBtn.click();
        }
    });
    
    // 显示动画
    setTimeout(() => {
        viewer.classList.add('active');
    }, 10);
} 