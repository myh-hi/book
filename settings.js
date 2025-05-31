/**
 * 设置页面功能
 */

// 当文档加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化设置页面
    initSettings();
});

/**
 * 初始化设置页面
 */
function initSettings() {
    // 从配置中获取设置
    getSettings();
    
    // 初始化设置页面交互
    initNavigation();
    initColorSelector();
    initToggleSwitches();
    initButtonGroups();
    initActionButtons();
}

/**
 * 从配置中获取设置
 */
function getSettings() {
    if (!window.AppConfig) return;
    
    // 获取设置数据
    const settings = window.AppConfig.settings || {};
    
    // 应用强调色
    const accentColor = settings.accentColor || window.AppConfig.general.highlightColor || '#fc3c44';
    selectAccentColor(accentColor);
    
    // 应用默认视图
    const defaultView = settings.defaultView || 'grid';
    selectDefaultView(defaultView);
    
    // 应用其他开关类设置
    if (settings.autoPlay !== undefined) {
        setToggleState('autoplay-toggle', settings.autoPlay);
    }
    
    if (settings.showProgress !== undefined) {
        setToggleState('progress-toggle', settings.showProgress);
    }
    
    if (settings.notifications !== undefined) {
        setToggleState('notifications-toggle', settings.notifications);
    }
    
    // 应用PDF预览设置
    if (settings.pdfPreview !== undefined) {
        setToggleState('pdf-preview-toggle', settings.pdfPreview);
    }
}

/**
 * 保存设置到配置
 * @param {string} key - 设置键
 * @param {any} value - 设置值
 */
function saveSetting(key, value) {
    try {
        if (!window.AppConfig) {
            console.warn('AppConfig未定义，无法保存设置');
            return;
        }
        
        // 确保设置对象存在
        if (!window.AppConfig.settings) {
            window.AppConfig.settings = {};
        }
        
        // 保存设置
        window.AppConfig.settings[key] = value;
        
        // 如果是强调色，同步到general设置
        if (key === 'accentColor' && window.AppConfig.general) {
            window.AppConfig.general.highlightColor = value;
        }
        
        // 如果设置改变了，触发保存 (如果config.js中实现了saveSettings函数)
        if (typeof window.saveSettings === 'function') {
            window.saveSettings();
        } else {
            // 如果没有saveSettings函数，使用localStorage作为备份
            localStorage.setItem('app_settings', JSON.stringify(window.AppConfig.settings));
        }
    } catch (error) {
        console.error('保存设置时出错:', error);
        // 显示错误提示
        showToast('保存设置失败，请重试');
    }
}

/**
 * 初始化设置页面导航
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            
            // 更新导航高亮
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应内容区域
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${sectionId}-section`) {
                    section.classList.add('active');
                }
            });
        });
    });
}

/**
 * 初始化强调色选择器
 */
function initColorSelector() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const color = this.dataset.color;
            selectAccentColor(color);
            saveSetting('accentColor', color);
            
            // 直接应用强调色到所有页面
            applyAccentColorToAllPages(color);
        });
    });
}

/**
 * 选择强调色
 * @param {string} color - 颜色代码
 */
function selectAccentColor(color) {
    // 更新UI选择状态
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === color);
    });
    
    // 应用强调色到文档
    document.documentElement.style.setProperty('--highlight-color', color);
}

/**
 * 应用强调色到所有页面
 * @param {string} color - 颜色代码
 */
function applyAccentColorToAllPages(color) {
    // 在localStorage中保存颜色，以便其他页面读取
    localStorage.setItem('app_highlight_color', color);
    
    // 如果处于iframe内，也尝试通知父页面
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'set_highlight_color',
                color: color
            }, '*');
        }
    } catch (e) {
        console.error('无法发送消息到父窗口:', e);
    }
}

/**
 * 初始化开关
 */
function initToggleSwitches() {
    const toggles = document.querySelectorAll('.toggle-switch input');
    toggles.forEach(toggle => {
        const settingKey = toggle.closest('.setting-item')?.dataset.setting;
        
        if (settingKey) {
            toggle.addEventListener('change', function() {
                saveSetting(settingKey, this.checked);
                
                // 特殊处理PDF预览设置
                if (settingKey === 'pdfPreview') {
                    notifyPdfPreviewChange(this.checked);
                }
            });
        }
    });
}

/**
 * 通知PDF预览设置变化
 * @param {boolean} enabled - 是否启用PDF预览
 */
function notifyPdfPreviewChange(enabled) {
    // 通过postMessage通知其他页面
    try {
        // 向所有打开的窗口发送消息
        if (window.opener) {
            window.opener.postMessage({
                type: 'settings_changed',
                setting: 'pdfPreview',
                value: enabled
            }, '*');
        }
    } catch (e) {
        console.error('无法发送消息:', e);
    }
}

/**
 * 设置开关状态
 * @param {string} id - 开关ID
 * @param {boolean} state - 开关状态
 */
function setToggleState(id, state) {
    const toggle = document.getElementById(id);
    if (toggle) {
        toggle.checked = state;
    }
}

/**
 * 初始化按钮组
 */
function initButtonGroups() {
    const buttonGroups = document.querySelectorAll('.button-group');
    buttonGroups.forEach(group => {
        const buttons = group.querySelectorAll('.button-option');
        const settingKey = group.dataset.setting;
        
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const value = this.dataset.value;
                
                // 更新UI
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // 保存设置
                if (settingKey) {
                    saveSetting(settingKey, value);
                }
                
                // 特定处理
                if (settingKey === 'defaultView') {
                    selectDefaultView(value);
                }
            });
        });
    });
}

/**
 * 选择默认视图
 * @param {string} view - 视图类型
 */
function selectDefaultView(view) {
    const viewButtons = document.querySelectorAll('.button-option[data-value]');
    viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === view);
    });
}

/**
 * 初始化操作按钮
 */
function initActionButtons() {
    // 清除缓存按钮
    const clearCacheBtn = document.querySelector('.action-btn:not(.dangerous)');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', function() {
            clearCache();
        });
    }
    
    // 重置应用按钮
    const resetAppBtn = document.querySelector('.action-btn.dangerous');
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', function() {
            if (confirm('确定要重置应用？这将清除所有设置和数据。')) {
                resetApp();
            }
        });
    }
}

/**
 * 清除缓存
 */
function clearCache() {
    // 显示加载指示器
    showActionFeedback(document.querySelector('.action-btn:not(.dangerous)'), '清除中...');
    
    // 模拟清除过程
    setTimeout(() => {
        // 清除完成
        showActionFeedback(document.querySelector('.action-btn:not(.dangerous)'), '已清除', true);
        
        // 恢复按钮文字
        setTimeout(() => {
            resetButtonText(document.querySelector('.action-btn:not(.dangerous)'), '<i class="fas fa-trash-alt"></i><span>清除缓存</span>');
        }, 2000);
    }, 1500);
}

/**
 * 重置应用
 */
function resetApp() {
    // 显示加载指示器
    showActionFeedback(document.querySelector('.action-btn.dangerous'), '重置中...');
    
    // 重置设置
    if (window.AppConfig) {
        window.AppConfig.settings = {};
        // 恢复默认强调色
        document.documentElement.style.setProperty('--highlight-color', '#fc3c44');
        window.AppConfig.general.highlightColor = '#fc3c44';
    }
    
    // 清除本地存储
    localStorage.removeItem('app_highlight_color');
    localStorage.removeItem('audiobook_settings');
    
    // 模拟重置过程
    setTimeout(() => {
        // 重置完成
        showActionFeedback(document.querySelector('.action-btn.dangerous'), '已重置', true);
        
        // 恢复按钮文字
        setTimeout(() => {
            resetButtonText(document.querySelector('.action-btn.dangerous'), '<i class="fas fa-exclamation-triangle"></i><span>重置应用</span>');
            
            // 刷新页面以应用重置
            location.reload();
        }, 2000);
    }, 2000);
}

/**
 * 显示按钮操作反馈
 * @param {Element} button - 按钮元素
 * @param {string} text - 显示文本
 * @param {boolean} success - 是否成功状态
 */
function showActionFeedback(button, text, success = false) {
    if (!button) return;
    
    const originalHTML = button.innerHTML;
    button.dataset.originalHtml = originalHTML;
    
    if (success) {
        button.innerHTML = `<i class="fas fa-check"></i><span>${text}</span>`;
        button.classList.add('success');
    } else {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>${text}</span>`;
    }
}

/**
 * 重置按钮文字
 * @param {Element} button - 按钮元素
 * @param {string} html - HTML内容
 */
function resetButtonText(button, html) {
    if (!button) return;
    button.innerHTML = html;
    button.classList.remove('success');
}

/**
 * 显示提示消息
 * @param {string} message - 提示消息
 * @param {boolean} isError - 是否为错误提示
 */
function showToast(message, isError = false) {
    try {
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
                background-color: ${isError ? 'rgba(220, 53, 69, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
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
        } else {
            // 更新颜色
            toast.style.backgroundColor = isError ? 'rgba(220, 53, 69, 0.9)' : 'rgba(0, 0, 0, 0.8)';
        }
        
        // 设置消息
        toast.textContent = message;
        
        // 显示并自动隐藏
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    } catch (error) {
        console.error('显示提示消息时出错:', error);
    }
} 