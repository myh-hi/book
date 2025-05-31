// 应用配置文件

// 基本设置
const appConfig = {
    // 收藏页面设置
    favorites: {
        // 是否使用静态活动数据（true）或动态生成（false）
        useStaticActivityData: true,
        
        // 显示所有时间线项目（true）或只显示最近3个（false）
        showAllTimelineItems: true,
        
        // 默认排序方式
        defaultSort: 'recent', // 可选: 'name-asc', 'name-desc', 'progress', 'recent'
        
        // 默认视图
        defaultView: 'grid' // 可选: 'grid', 'list'
    },
    
    // 书库页面设置
    library: {
        // 每页显示的项目数量
        itemsPerPage: 12,
        
        // 默认分类
        defaultCategory: '全部'
    },
    
    // 播放器设置
    player: {
        // 默认音量
        defaultVolume: 0.7,
        
        // 默认音质
        defaultQuality: 'normal', // 可选: 'high', 'normal'
        
        // 自动保存进度
        autoSaveProgress: true
    },
    
    // 通用设置
    general: {
        // 是否显示开发者功能
        showDevFeatures: false,
        
        // 是否启用调试模式
        debugMode: false,
        
        // 主题模式（已弃用，保持默认深色）
        theme: 'dark',

        // 强调色
        highlightColor: '#fc3c44'
    },
    
    // 用户设置
    settings: {
        // 强调色
        accentColor: '#fc3c44',
        
        // 字体大小缩放比例
        fontSize: 1,
        
        // 默认视图
        defaultView: 'grid',
        
        // 自动播放
        autoPlay: true,
        
        // 显示进度
        showProgress: true,
        
        // 通知
        notifications: true,
        
        // 默认音量
        volume: 0.7,
        
        // PDF阅读器
        pdfReader: 'internal', // 可选: 'internal', 'external'
        
        // PDF封面预览
        pdfPreview: true // 是否使用PDF第一页作为封面
    }
};

// 从本地存储加载设置
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('audiobook_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            
            // 合并设置到配置
            if (parsedSettings.settings) {
                appConfig.settings = {...appConfig.settings, ...parsedSettings.settings};
            }
            
            // 同步强调色设置
            if (parsedSettings.settings && parsedSettings.settings.accentColor) {
                appConfig.general.highlightColor = parsedSettings.settings.accentColor;
                document.documentElement.style.setProperty('--highlight-color', parsedSettings.settings.accentColor);
            }
        }

        // 检查是否有单独保存的强调色
        const highlightColor = localStorage.getItem('app_highlight_color');
        if (highlightColor) {
            appConfig.general.highlightColor = highlightColor;
            appConfig.settings.accentColor = highlightColor;
            document.documentElement.style.setProperty('--highlight-color', highlightColor);
        }
    } catch (error) {
        console.error('加载设置时出错:', error);
    }
}

// 保存设置到本地存储
function saveSettings() {
    try {
        const settingsToSave = {
            settings: appConfig.settings
        };
        localStorage.setItem('audiobook_settings', JSON.stringify(settingsToSave));
        
        // 单独保存强调色，方便其他页面读取
        if (appConfig.settings.accentColor) {
            localStorage.setItem('app_highlight_color', appConfig.settings.accentColor);
        }
    } catch (error) {
        console.error('保存设置时出错:', error);
    }
}

// 尝试加载保存的设置
loadSettings();

// 监听设置更改，自动保存
const originalSetObject = appConfig.settings;
appConfig.settings = new Proxy(originalSetObject, {
    set: function(target, key, value) {
        target[key] = value;
        saveSettings();
        return true;
    }
});

// 导出配置
window.AppConfig = appConfig;

// 导出设置函数
window.saveSettings = saveSettings;

// 添加页面加载时的强调色应用
document.addEventListener('DOMContentLoaded', function() {
    // 应用强调色到文档
    document.documentElement.style.setProperty('--highlight-color', appConfig.general.highlightColor);
}); 