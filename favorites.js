// 收藏页面的JavaScript功能

document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const filterBtns = document.querySelectorAll('.filter-btn');
    const viewBtns = document.querySelectorAll('.view-btn');
    const sortDropdownItems = document.querySelectorAll('.sort-dropdown-menu a');
    const searchInput = document.querySelector('.search-bar input');
    const collectionGrid = document.querySelector('.collection-grid');
    const emptyState = document.querySelector('.empty-state');
    const staticChartBars = document.querySelectorAll('.chart-bar-container.static-chart');
    const staticTimelineItems = document.querySelectorAll('.timeline-item.static-timeline');
    
    // 配置选项
    const config = {
        useStaticActivityData: true, // 使用静态活动数据（true）或动态生成（false）
        showAllTimelineItems: true   // 显示所有时间线项目（true）或只显示最近3个（false）
    };
    
    // 初始化收藏状态
    loadFavoritesFromStorage();
    
    // 监听来自书库页面的消息
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'favorites_updated') {
            const { action, data } = event.data;
            
            if (action === 'add' && data) {
                // 添加新收藏项
                addToFavorites(data);
            } else if (action === 'remove' && typeof data === 'string') {
                // 移除收藏项
                const title = data;
                
                // 查找要移除的项目
                const allItems = document.querySelectorAll('.collection-item');
                let itemToRemove = null;
                
                // 遍历所有项查找匹配的标题
                allItems.forEach(item => {
                    const itemTitle = item.querySelector('.item-title');
                    if (itemTitle && itemTitle.textContent === title) {
                        itemToRemove = item;
                    }
                });
                
                if (itemToRemove) {
                    // 添加删除动画
                    itemToRemove.classList.add('fade-out');
                    
                    // 设置延迟，等待动画完成后再移除DOM元素
                    setTimeout(() => {
                        itemToRemove.remove();
                        updateFavoriteCount();
                        checkEmptyState();
                    }, 300);
                }
            }
        }
    });
    
    // 导航项目点击 (仅处理没有被链接包裹的导航项)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        // 确保该项目不在链接内部
        if (!item.closest('.nav-item-link')) {
            item.addEventListener('click', function() {
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        }
    });

    // 过滤功能
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活动状态
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 获取过滤类型
            const filterType = this.dataset.filter;
            filterCollection(filterType);
        });
    });

    // 视图切换
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const viewType = this.dataset.view;
            toggleView(viewType);
        });
    });
    
    // 排序下拉菜单选项
    sortDropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sortType = this.dataset.sort;
            sortCollection(sortType);
            
            // 更新排序按钮文本
            const sortBtn = document.querySelector('.sort-btn');
            const sortIcon = sortBtn.querySelector('i:first-child');
            const sortText = sortBtn.querySelector('span');
            
            switch(sortType) {
                case 'name-asc':
                    sortIcon.className = 'fas fa-sort-alpha-down';
                    sortText.textContent = '按名称 (A-Z)';
                    break;
                case 'name-desc':
                    sortIcon.className = 'fas fa-sort-alpha-up-alt';
                    sortText.textContent = '按名称 (Z-A)';
                    break;
                case 'progress':
                    sortIcon.className = 'fas fa-sort-amount-down';
                    sortText.textContent = '按进度';
                    break;
                case 'recent':
                    sortIcon.className = 'fas fa-history';
                    sortText.textContent = '最近添加';
                    break;
            }
        });
    });

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchCollection(this.value);
        });
        
        // 当按下回车键时搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                searchCollection(this.value.trim());
            }
        });
    }

    // 初始化移除收藏按钮的事件监听
    initRemoveBtns();
    
    // 初始化播放按钮和阅读按钮的事件监听
    initActionBtns();
    
    // 处理阅读活动数据
    initActivityData();
    
    // 检查是否显示空状态
    checkEmptyState();
    
    // 更新收藏数量
    updateFavoriteCount();
    
    // 从本地存储加载收藏
    function loadFavoritesFromStorage() {
        // 从localStorage获取收藏列表
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // 清空当前收藏网格
        if (collectionGrid) {
            collectionGrid.innerHTML = '';
            
            // 如果收藏为空，显示空状态
            if (favorites.length === 0) {
                if (emptyState) {
                    emptyState.style.display = 'block';
                    collectionGrid.style.display = 'none';
                }
                return;
            }
            
            // 隐藏空状态，显示收藏网格
            if (emptyState) {
                emptyState.style.display = 'none';
                collectionGrid.style.display = 'grid';
            }
            
            // 为每个收藏项创建DOM元素
            favorites.forEach(item => {
                const itemElement = createCollectionItemElement(item);
                collectionGrid.appendChild(itemElement);
            });
            
            // 初始化新添加元素的事件监听
            initRemoveBtns();
            initActionBtns();
        }
        
        // 更新统计信息
        updateStatistics(favorites);
        
        // 如果配置为使用动态数据，更新活动数据
        if (!config.useStaticActivityData) {
            updateActivityData(favorites);
        }
    }
    
    // 创建收藏项的DOM元素
    function createCollectionItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = `collection-item ${item.type}`;
        itemDiv.dataset.progress = item.progress || 0;
        itemDiv.dataset.added = item.dateAdded || new Date().toISOString().split('T')[0];
        
        const isAudiobook = item.type === 'audiobook';
        
        // 构建HTML结构
        itemDiv.innerHTML = `
            <div class="item-cover">
                <img src="${item.cover}" alt="${item.title}">
                <div class="item-badge ${isAudiobook ? 'audiobook-badge' : 'pdf-badge'}">
                    <i class="fas ${isAudiobook ? 'fa-headphones' : 'fa-file-pdf'}"></i>
                </div>
                <div class="item-actions">
                    <button class="action-btn ${isAudiobook ? 'play-btn' : 'read-btn'}" title="${isAudiobook ? '播放' : '阅读'}">
                        <i class="fas ${isAudiobook ? 'fa-play' : 'fa-book-open'}"></i>
                    </button>
                    <button class="action-btn remove-btn" title="从收藏中移除">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                </div>
                <div class="progress-overlay">
                    <div class="progress-ring">
                        <svg width="44" height="44">
                            <circle class="progress-ring-circle-bg" cx="22" cy="22" r="20" />
                            <circle class="progress-ring-circle" cx="22" cy="22" r="20" 
                                style="stroke-dashoffset: calc(126 - (126 * ${item.progress}) / 100);" />
                        </svg>
                        <span class="progress-text">${item.progress}%</span>
                    </div>
                </div>
            </div>
            <div class="item-info">
                <h3 class="item-title">${item.title}</h3>
                <p class="item-author">${item.author}</p>
                <div class="item-meta">
                    <span class="item-duration">
                        <i class="fas ${isAudiobook ? 'fa-clock' : 'fa-file'}"></i> 
                        ${isAudiobook ? item.duration || '未知' : item.pages ? item.pages + '页' : '未知'}
                    </span>
                    <span class="item-type ${isAudiobook ? 'audiobook-type' : 'pdf-type'}">
                        ${item.genre || '未分类'}
                    </span>
                </div>
                <div class="item-last-activity">
                    <i class="fas fa-history"></i>
                    <span>${item.lastActivity || '最近添加'}</span>
                </div>
            </div>
            ${isAudiobook ? `<a href="index.html?id=${item.id}" class="item-link"></a>` : ''}
        `;
        
        return itemDiv;
    }
    
    // 初始化移除按钮事件监听
    function initRemoveBtns() {
        const removeBtns = document.querySelectorAll('.action-btn.remove-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const collectionItem = this.closest('.collection-item');
                const itemTitle = collectionItem.querySelector('.item-title').textContent;
                
                // 从本地存储中移除
                removeFromFavorites(itemTitle);
                
                // 添加删除动画
                collectionItem.classList.add('fade-out');
                
                // 设置延迟，等待动画完成后再移除DOM元素
                setTimeout(() => {
                    collectionItem.remove();
                    updateFavoriteCount();
                    checkEmptyState();
                    
                    // 显示移除成功提示
                    showToast(`已将《${itemTitle}》从收藏中移除`);
                }, 300);
            });
        });
    }
    
    // 初始化操作按钮事件监听
    function initActionBtns() {
        // 播放按钮
        const playBtns = document.querySelectorAll('.action-btn.play-btn');
        playBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const collectionItem = this.closest('.collection-item');
                const itemTitle = collectionItem.querySelector('.item-title').textContent;
                
                // 添加动画效果
                this.classList.add('pulse');
                setTimeout(() => {
                    this.classList.remove('pulse');
                    // 跳转到播放页面
                    window.location.href = 'index.html';
                }, 300);
            });
        });
        
        // 阅读按钮
        const readBtns = document.querySelectorAll('.action-btn.read-btn');
        readBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const collectionItem = this.closest('.collection-item');
                const itemTitle = collectionItem.querySelector('.item-title').textContent;
                
                alert(`打开PDF: ${itemTitle}`);
            });
        });
    }
    
    // 初始化活动数据显示
    function initActivityData() {
        if (!config.useStaticActivityData) {
            // 使用动态数据：隐藏静态元素，稍后将填充动态数据
            staticChartBars.forEach(bar => {
                bar.style.display = 'none';
            });
            
            staticTimelineItems.forEach((item, index) => {
                // 根据配置，决定是否只显示前几个时间线项目
                if (!config.showAllTimelineItems && index >= 3) {
                    item.style.display = 'none';
                }
            });
            
            // 从本地存储中获取收藏列表，生成活动数据
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            updateActivityData(favorites);
        } else {
            // 使用静态数据：根据配置决定是否显示所有时间线项目
            if (!config.showAllTimelineItems) {
                staticTimelineItems.forEach((item, index) => {
                    if (index >= 3) {
                        item.style.display = 'none';
                    }
                });
            }
            
            // 应用图表动画效果
            animateCharts();
        }
    }
    
    // 过滤收藏内容
    function filterCollection(filterType) {
        const collectionItems = document.querySelectorAll('.collection-item');
        
        if (filterType === 'all') {
            // 显示所有项目
            collectionItems.forEach(item => {
                item.style.display = '';
            });
        } else if (filterType === 'recent') {
            // 根据添加日期排序并只显示最近的几项
            const sortedItems = [...collectionItems].sort((a, b) => {
                const dateA = new Date(a.dataset.added);
                const dateB = new Date(b.dataset.added);
                return dateB - dateA; // 降序，最新的在前面
            });
            
            collectionItems.forEach(item => {
                item.style.display = 'none';
            });
            
            // 只显示最近3个月内添加的项目
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            
            sortedItems.forEach(item => {
                const addedDate = new Date(item.dataset.added);
                if (addedDate >= threeMonthsAgo) {
                    item.style.display = '';
                }
            });
        } else {
            // 按类型过滤 (audiobook 或 pdf)
            collectionItems.forEach(item => {
                if (item.classList.contains(filterType)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        
        // 更新空状态显示
        checkEmptyState();
    }

    // 切换视图 (网格/列表)
    function toggleView(viewType) {
        if (viewType === 'grid') {
            collectionGrid.classList.remove('list-view');
        } else {
            collectionGrid.classList.add('list-view');
        }
    }
    
    // 收藏排序
    function sortCollection(sortType) {
        const collectionItems = document.querySelectorAll('.collection-item');
        const items = [...collectionItems];
        
        switch(sortType) {
            case 'name-asc': // 按名称升序
                items.sort((a, b) => {
                    const titleA = a.querySelector('.item-title').textContent;
                    const titleB = b.querySelector('.item-title').textContent;
                    return titleA.localeCompare(titleB);
                });
                break;
                
            case 'name-desc': // 按名称降序
                items.sort((a, b) => {
                    const titleA = a.querySelector('.item-title').textContent;
                    const titleB = b.querySelector('.item-title').textContent;
                    return titleB.localeCompare(titleA);
                });
                break;
                
            case 'progress': // 按进度排序
                items.sort((a, b) => {
                    const progressA = parseInt(a.dataset.progress) || 0;
                    const progressB = parseInt(b.dataset.progress) || 0;
                    return progressB - progressA; // 降序，进度高的在前面
                });
                break;
                
            case 'recent': // 按添加时间排序
                items.sort((a, b) => {
                    const dateA = new Date(a.dataset.added);
                    const dateB = new Date(b.dataset.added);
                    return dateB - dateA; // 降序，最新的在前面
                });
                break;
        }
        
        // 重新排列元素
        items.forEach(item => {
            collectionGrid.appendChild(item);
        });
        
        // 添加动画效果
        items.forEach((item, index) => {
            item.style.opacity = '0';
            setTimeout(() => {
                item.style.opacity = '1';
                item.classList.add('fade-in');
                setTimeout(() => {
                    item.classList.remove('fade-in');
                }, 500);
            }, index * 50); // 错开每个项目的动画时间
        });
    }

    // 搜索收藏
    function searchCollection(query) {
        const collectionItems = document.querySelectorAll('.collection-item');
        if (!query || query.trim() === '') {
            // 如果搜索为空，显示所有内容
            collectionItems.forEach(item => {
                item.style.display = '';
            });
            
            // 恢复原始过滤状态
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter) {
                filterCollection(activeFilter.dataset.filter);
            }
            return;
        }

        query = query.toLowerCase();
        
        // 过滤项目
        collectionItems.forEach(item => {
            const title = item.querySelector('.item-title')?.textContent.toLowerCase() || '';
            const author = item.querySelector('.item-author')?.textContent.toLowerCase() || '';
            const type = item.classList.contains('audiobook') ? 'audiobook' : 'pdf';
            
            if (title.includes(query) || author.includes(query) || type.includes(query)) {
                item.style.display = '';
                
                // 高亮搜索结果（可选）
                highlightSearchTerms(item, query);
            } else {
                item.style.display = 'none';
            }
        });
        
        // 更新空状态显示
        checkEmptyState();
    }
    
    // 高亮搜索结果（可选功能）
    function highlightSearchTerms(item, query) {
        // 这里可以添加高亮功能，例如给匹配的文本添加<mark>标签
        // 为了简单起见，此处省略实现
    }
    
    // 动画图表数据
    function animateCharts() {
        const barSegments = document.querySelectorAll('.bar-segment');
        
        barSegments.forEach(segment => {
            const targetHeight = segment.style.height;
            segment.style.height = '0';
            
            setTimeout(() => {
                segment.style.height = targetHeight;
            }, 100);
        });
    }
    
    // 从收藏中移除
    function removeFromFavorites(title) {
        // 从本地存储获取收藏列表
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // 移除指定项目
        favorites = favorites.filter(item => item.title !== title);
        
        // 更新本地存储
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // 更新统计信息
        updateStatistics(favorites);
        
        // 如果配置为使用动态数据，更新活动数据
        if (!config.useStaticActivityData) {
            updateActivityData(favorites);
        }
        
        // 通知其他页面（如书库页面）更新收藏状态
        try {
            if (window.opener) {
                window.opener.postMessage({
                    type: 'favorites_updated',
                    action: 'remove',
                    title: title
                }, '*');
            }
        } catch (e) {
            console.error('无法发送消息到其他页面:', e);
        }
    }
    
    // 添加到收藏
    function addToFavorites(item) {
        // 从本地存储获取收藏列表
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // 检查是否已存在
        const exists = favorites.some(fav => fav.id === item.id);
        
        if (!exists) {
            // 添加时间戳
            item.dateAdded = new Date().toISOString().split('T')[0];
            
            // 添加到收藏
            favorites.push(item);
            
            // 更新本地存储
            localStorage.setItem('favorites', JSON.stringify(favorites));
            
            // 更新统计信息
            updateStatistics(favorites);
            
            // 如果配置为使用动态数据，更新活动数据
            if (!config.useStaticActivityData) {
                updateActivityData(favorites);
            }
            
            // 添加到UI
            if (collectionGrid) {
                const itemElement = createCollectionItemElement(item);
                collectionGrid.appendChild(itemElement);
                
                // 更新事件监听
                initRemoveBtns();
                initActionBtns();
                
                // 检查空状态
                checkEmptyState();
            }
            
            return true;
        }
        
        return false;
    }
    
    // 动态更新活动数据
    function updateActivityData(favorites) {
        if (!config.useStaticActivityData) {
            updateActivityChart(favorites);
            updateActivityTimeline(favorites);
        }
    }
    
    // 动态更新活动图表
    function updateActivityChart(favorites) {
        // 这个函数在启用动态数据时使用，根据收藏数据生成活动图表
        // 由于我们在本示例中使用静态图表，此处省略实现
    }
    
    // 动态更新活动时间线
    function updateActivityTimeline(favorites) {
        // 这个函数在启用动态数据时使用，根据收藏数据生成活动时间线
        // 由于我们在本示例中使用静态时间线，此处省略实现
    }
    
    // 检查是否显示空状态
    function checkEmptyState() {
        const collectionItems = document.querySelectorAll('.collection-item');
        const visibleItems = [...collectionItems].filter(item => item.style.display !== 'none');
        
        if (visibleItems.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
                collectionGrid.style.display = 'none';
            }
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
                collectionGrid.style.display = 'grid';
                
                // 检查是否为列表视图
                if (collectionGrid.classList.contains('list-view')) {
                    collectionGrid.style.display = 'block';
                }
            }
        }
    }
    
    // 更新收藏数量
    function updateFavoriteCount() {
        const favoriteCountElement = document.querySelector('.stat-pill:nth-child(2) span');
        if (favoriteCountElement) {
            const count = document.querySelectorAll('.collection-item').length;
            favoriteCountElement.textContent = `${count}本藏品`;
        }
    }
    
    // 更新所有统计信息
    function updateStatistics(favorites) {
        // 更新收藏数量
        updateFavoriteCount();
        
        // 更新阅读时长统计
        const totalHoursElement = document.querySelector('.stat-pill:nth-child(1) span');
        if (totalHoursElement) {
            // 计算总时长（示例，实际可能需要更复杂的计算）
            let totalMinutes = 0;
            favorites.forEach(item => {
                if (item.readTimeMinutes) {
                    totalMinutes += item.readTimeMinutes;
                }
            });
            
            const hours = Math.floor(totalMinutes / 60);
            totalHoursElement.textContent = `${hours}小时阅读时长`;
        }
        
        // 更新阅读天数统计
        const daysElement = document.querySelector('.stat-pill:nth-child(3) span');
        if (daysElement) {
            // 获取不重复的阅读日期（示例，实际可能需要更复杂的计算）
            const readDays = new Set();
            favorites.forEach(item => {
                if (item.readDates && Array.isArray(item.readDates)) {
                    item.readDates.forEach(date => readDays.add(date));
                }
            });
            
            daysElement.textContent = `${readDays.size || 12}天阅读`;
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
    
    // 公开API，可供其他页面调用
    window.FavoritesManager = {
        addToFavorites: addToFavorites,
        removeFromFavorites: removeFromFavorites,
        loadFavoritesFromStorage: loadFavoritesFromStorage,
        showToast: showToast,
        setUseStaticActivityData: function(useStatic) {
            config.useStaticActivityData = useStatic;
            initActivityData();
        },
        setShowAllTimelineItems: function(showAll) {
            config.showAllTimelineItems = showAll;
            initActivityData();
        }
    };
}); 