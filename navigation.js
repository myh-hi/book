/**
 * 导航链接处理
 * 处理所有页面的导航链接，确保在页面切换时不中断音频播放
 */

// 初始化导航链接
function initNavigation() {
    try {
        // 处理导航链接点击，确保不中断音频播放
        document.querySelectorAll('.nav-item-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 保存当前播放状态
                if (window.audioManager) {
                    try {
                        window.audioManager.saveState();
                    } catch (error) {
                        console.error('保存音频状态时出错:', error);
                    }
                }
                
                // 获取目标页面URL
                const href = this.getAttribute('data-href') || this.getAttribute('href');
                
                // 延迟跳转，确保状态已保存
                setTimeout(() => {
                    window.location.href = href;
                }, 100);
            });
        });
        
        // 处理搜索框回车键事件
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim() !== '') {
                    // 保存当前播放状态
                    if (window.audioManager) {
                        try {
                            window.audioManager.saveState();
                        } catch (error) {
                            console.error('保存音频状态时出错:', error);
                        }
                    }
                    
                    // 跳转到书库页面并传递搜索词
                    window.location.href = `library.html?search=${encodeURIComponent(this.value.trim())}`;
                }
            });
        }
    } catch (error) {
        console.error('初始化导航时出错:', error);
    }
}

// 当文档加载完成时，初始化导航
document.addEventListener('DOMContentLoaded', initNavigation); 