/**
 * PDF预览功能
 * 使用PDF.js渲染PDF文件的第一页作为封面
 */

// 配置PDF.js的worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 当页面加载完成时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户设置，决定是否启用PDF预览
    const isPdfPreviewEnabled = checkPdfPreviewSetting();
    
    if (isPdfPreviewEnabled) {
        // 初始化PDF预览
        initPdfPreviews();
    }
    
    // 监听设置变化
    listenForSettingChanges();
});

/**
 * 检查用户是否启用了PDF预览功能
 * @returns {boolean} 是否启用PDF预览
 */
function checkPdfPreviewSetting() {
    // 默认启用
    let isPdfPreviewEnabled = true;
    
    // 从配置中获取设置
    if (window.AppConfig && window.AppConfig.settings) {
        isPdfPreviewEnabled = window.AppConfig.settings.pdfPreview !== false;
    }
    
    return isPdfPreviewEnabled;
}

/**
 * 监听设置变化
 */
function listenForSettingChanges() {
    // 监听设置页面的消息
    window.addEventListener('message', function(event) {
        // 检查消息类型
        if (event.data && event.data.type === 'settings_changed') {
            // 如果PDF预览设置发生变化
            if (event.data.setting === 'pdfPreview') {
                if (event.data.value) {
                    // 启用PDF预览
                    initPdfPreviews();
                } else {
                    // 禁用PDF预览，恢复原始图片
                    restoreOriginalCovers();
                }
            }
        }
    });
    
    // 监听本地存储变化
    window.addEventListener('storage', function(event) {
        if (event.key === 'audiobook_settings') {
            try {
                const settings = JSON.parse(event.newValue);
                if (settings && settings.settings) {
                    const isPdfPreviewEnabled = settings.settings.pdfPreview !== false;
                    
                    if (isPdfPreviewEnabled) {
                        initPdfPreviews();
                    } else {
                        restoreOriginalCovers();
                    }
                }
            } catch (e) {
                console.error('解析设置时出错:', e);
            }
        }
    });
}

/**
 * 恢复原始封面图片
 */
function restoreOriginalCovers() {
    // 查找所有PDF预览画布
    const previewCanvases = document.querySelectorAll('.pdf-preview-canvas');
    
    previewCanvases.forEach(canvas => {
        // 查找相邻的原始图片
        const originalImg = canvas.nextSibling;
        if (originalImg && originalImg.tagName === 'IMG') {
            // 显示原始图片
            originalImg.style.display = '';
            // 隐藏画布
            canvas.style.display = 'none';
            
            // 移除加载或错误指示器
            const parent = canvas.parentNode;
            const indicators = parent.querySelectorAll('.pdf-loading-indicator, .pdf-error-indicator');
            indicators.forEach(indicator => parent.removeChild(indicator));
        }
    });
}

/**
 * 初始化所有PDF项目的预览
 */
function initPdfPreviews() {
    // 获取所有PDF类型的书籍项
    const pdfItems = document.querySelectorAll('.book-item.pdf');
    
    // 遍历每个PDF项目
    pdfItems.forEach(item => {
        // 获取PDF链接
        const pdfLink = item.querySelector('.book-link');
        if (!pdfLink) return;
        
        const pdfUrl = pdfLink.getAttribute('href');
        if (!pdfUrl || !pdfUrl.toLowerCase().endsWith('.pdf')) return;
        
        // 获取封面图片元素
        const coverImg = item.querySelector('.book-cover img');
        if (!coverImg) return;
        
        // 检查是否已经创建了预览画布
        let canvas = item.querySelector('.pdf-preview-canvas');
        
        // 如果没有画布，创建一个新的
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pdf-preview-canvas';
            canvas.dataset.pdfUrl = pdfUrl;
            
            // 替换图片元素
            coverImg.parentNode.insertBefore(canvas, coverImg);
            coverImg.style.display = 'none';
        } else {
            // 如果已有画布但被隐藏，则显示它并隐藏图片
            canvas.style.display = '';
            coverImg.style.display = 'none';
        }
        
        // 检查是否已经渲染过
        if (!canvas.dataset.rendered) {
            // 加载并渲染PDF预览
            loadPdfPreview(pdfUrl, canvas);
        }
    });
}

/**
 * 加载PDF并渲染第一页作为预览
 * @param {string} url - PDF文件的URL
 * @param {HTMLCanvasElement} canvas - 用于渲染的画布元素
 */
async function loadPdfPreview(url, canvas) {
    try {
        // 显示加载指示器
        showLoadingIndicator(canvas);
        
        // 加载PDF文档
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        // 获取第一页
        const page = await pdf.getPage(1);
        
        // 计算合适的缩放比例
        const viewport = calculateViewport(page, canvas);
        
        // 准备渲染
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // 渲染PDF页面到画布
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // 标记为已渲染
        canvas.dataset.rendered = 'true';
        
        // 隐藏加载指示器
        hideLoadingIndicator(canvas);
    } catch (error) {
        console.error('加载PDF预览失败:', error);
        // 显示错误指示器
        showErrorIndicator(canvas);
        // 回退到原始图片
        const coverImg = canvas.nextSibling;
        if (coverImg && coverImg.tagName === 'IMG') {
            coverImg.style.display = '';
            canvas.style.display = 'none';
        }
    }
}

/**
 * 计算适合容器的视口
 * @param {PDFPageProxy} page - PDF页面对象
 * @param {HTMLCanvasElement} canvas - 画布元素
 * @returns {PageViewport} 计算后的视口
 */
function calculateViewport(page, canvas) {
    // 获取原始视口
    const originalViewport = page.getViewport({ scale: 1 });
    
    // 获取容器尺寸
    const containerWidth = canvas.clientWidth || 200; // 默认宽度
    const containerHeight = canvas.clientHeight || 300; // 默认高度
    
    // 计算宽度和高度的缩放比例
    const scaleX = containerWidth / originalViewport.width;
    const scaleY = containerHeight / originalViewport.height;
    
    // 使用较大的缩放比例以确保填满容器
    const scale = Math.max(scaleX, scaleY);
    
    // 返回新的视口
    return page.getViewport({ scale });
}

/**
 * 显示加载指示器
 * @param {HTMLCanvasElement} canvas - 画布元素
 */
function showLoadingIndicator(canvas) {
    // 创建加载指示器
    const loader = document.createElement('div');
    loader.className = 'pdf-loading-indicator';
    loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    loader.style.position = 'absolute';
    loader.style.top = '50%';
    loader.style.left = '50%';
    loader.style.transform = 'translate(-50%, -50%)';
    loader.style.color = 'white';
    loader.style.fontSize = '2rem';
    loader.style.zIndex = '2';
    
    // 添加到画布父元素
    const parent = canvas.parentNode;
    parent.style.position = 'relative';
    parent.appendChild(loader);
}

/**
 * 隐藏加载指示器
 * @param {HTMLCanvasElement} canvas - 画布元素
 */
function hideLoadingIndicator(canvas) {
    const parent = canvas.parentNode;
    const loader = parent.querySelector('.pdf-loading-indicator');
    if (loader) {
        parent.removeChild(loader);
    }
}

/**
 * 显示错误指示器
 * @param {HTMLCanvasElement} canvas - 画布元素
 */
function showErrorIndicator(canvas) {
    // 创建错误指示器
    const errorIndicator = document.createElement('div');
    errorIndicator.className = 'pdf-error-indicator';
    errorIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i><br>无法加载预览';
    errorIndicator.style.position = 'absolute';
    errorIndicator.style.top = '50%';
    errorIndicator.style.left = '50%';
    errorIndicator.style.transform = 'translate(-50%, -50%)';
    errorIndicator.style.color = 'white';
    errorIndicator.style.fontSize = '1rem';
    errorIndicator.style.textAlign = 'center';
    errorIndicator.style.zIndex = '2';
    errorIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    errorIndicator.style.padding = '10px';
    errorIndicator.style.borderRadius = '5px';
    
    // 添加到画布父元素
    const parent = canvas.parentNode;
    parent.style.position = 'relative';
    parent.appendChild(errorIndicator);
} 