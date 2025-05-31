// 书库页面的JavaScript功能

document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const categoryItems = document.querySelectorAll('.category-item');
    const viewButtons = document.querySelectorAll('.view-btn');
    const searchInput = document.querySelector('.search-bar input');
    const bookItems = document.querySelectorAll('.book-item');
    const seeAllLinks = document.querySelectorAll('.see-all');
    
    // 书籍数据（实际应用中可能来自API或服务器）
    const booksData = [
        {
            id: 'audio-001',
            title: '这次我们怎么死？',
            author: '屹涵原创有声书',
            cover: 'images/1.jpg',
            type: 'audiobook',
            progress: 35,
            genre: '科幻故事',
            duration: '27分钟',
            readTimeMinutes: 27,
            dateAdded: '2024-03-15'
        },
        {
            id: 'pdf-001',
            title: '量子物理入门',
            author: '李量子',
            cover: 'https://img1.baidu.com/it/u=2545418245,1944340659&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=748',
            type: 'pdf',
            progress: 25,
            genre: '科学教程',
            pages: 120,
            dateAdded: '2024-03-14',
            pdfUrl: 'books/量子共鸣.pdf'
        },
        {
            id: 'pdf-002',
            title: '深度学习实战',
            author: '张智能',
            cover: 'https://img1.baidu.com/it/u=2988241719,3581428036&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=708',
            type: 'pdf',
            progress: 15,
            genre: '计算机科学',
            pages: 230,
            dateAdded: '2024-03-10',
            pdfUrl: 'books/这次我们怎么死？.pdf'
        }
    ];
    
    // 监听来自收藏页面的消息
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'favorites_updated') {
            const { action, title } = event.data;
            
            if (action === 'remove') {
                // 找到对应的书籍项并更新收藏按钮状态
                bookItems.forEach(item => {
                    const itemTitle = item.querySelector('h4')?.textContent;
                    if (itemTitle === title) {
                        const favoriteBtn = item.querySelector('.favorite-btn');
                        if (favoriteBtn) {
                            favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                            favoriteBtn.title = '添加到收藏';
                        }
                    }
                });
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
    
    // 初始化收藏按钮
    initFavoriteButtons();
    
    // 分类过滤
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新活动状态
            categoryItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 获取所选类别
            const category = this.querySelector('span').textContent;
            filterBooks(category);
            
            // 更新标题
            updatePageTitle(category);
        });
    });

    // 视图切换
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const isGrid = this.querySelector('i').classList.contains('fa-th-large');
            const booksGrid = document.querySelectorAll('.books-grid');

            booksGrid.forEach(grid => {
                if (isGrid) {
                    grid.classList.remove('list-view');
                } else {
                    grid.classList.add('list-view');
                }
            });
        });
    });

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchBooks(this.value);
        });
        
        // 当按下回车键时搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                searchBooks(this.value.trim());
            }
        });
    }
    
    // 查看全部链接
    seeAllLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryTitle = this.closest('.section-header').querySelector('h3').textContent;
            
            // 找到对应的分类并激活
            categoryItems.forEach(item => {
                const itemText = item.querySelector('span').textContent;
                if (categoryTitle.includes(itemText)) {
                    item.click();
                }
            });
        });
    });
    
    // 处理URL参数，例如搜索请求
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
        searchBooks(searchQuery);
    }
    
    // 初始化收藏按钮
    function initFavoriteButtons() {
        // 为每个书籍项添加收藏按钮
        bookItems.forEach(bookItem => {
            if (bookItem.classList.contains('new-item')) return; // 跳过"添加新书籍"项
            
            // 查找封面容器
            const coverContainer = bookItem.querySelector('.book-cover');
            if (!coverContainer) return;
            
            // 查找这本书的信息
            const title = bookItem.querySelector('h4')?.textContent;
            const author = bookItem.querySelector('.book-author')?.textContent;
            
            // 创建收藏按钮
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.title = '添加到收藏';
            
            // 查找或创建书籍ID
            let bookId = '';
            for (const book of booksData) {
                if (book.title === title) {
                    bookId = book.id;
                    break;
                }
            }
            
            // 检查是否已收藏
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const isFavorited = favorites.some(item => (item.id === bookId) || (item.title === title));
            
            // 设置按钮内容
            favoriteBtn.innerHTML = isFavorited ? 
                '<i class="fas fa-heart"></i>' : 
                '<i class="far fa-heart"></i>';
            
            // 添加点击事件
            favoriteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(bookItem, this);
            });
            
            // 添加到封面容器
            coverContainer.appendChild(favoriteBtn);
        });
    }
    
    // 切换收藏状态
    function toggleFavorite(bookItem, button) {
        // 获取书籍信息
        const title = bookItem.querySelector('h4').textContent;
        const author = bookItem.querySelector('.book-author')?.textContent || '未知作者';
        const coverImg = bookItem.querySelector('img');
        const coverSrc = coverImg ? coverImg.src : '';
        const progressBar = bookItem.querySelector('.progress-bar');
        const progress = progressBar ? 
            parseInt(progressBar.style.width) || 0 :
            0;
        
        // 确定书籍类型
        const isPdf = bookItem.classList.contains('pdf');
        const type = isPdf ? 'pdf' : 'audiobook';
        
        // 查找完整的书籍数据
        let bookData = booksData.find(book => book.title === title);
        
        // 如果找不到，创建一个基础数据对象
        if (!bookData) {
            bookData = {
                id: `${type}-${Date.now()}`,
                title: title,
                author: author,
                cover: coverSrc,
                type: type,
                progress: progress,
                dateAdded: new Date().toISOString().split('T')[0]
            };
        }
        
        // 获取当前收藏列表
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // 检查是否已收藏
        const index = favorites.findIndex(item => (item.id === bookData.id) || (item.title === title));
        
        if (index >= 0) {
            // 已收藏，移除
            favorites.splice(index, 1);
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.title = '添加到收藏';
            showToast(`已将《${title}》从收藏中移除`);
            
            // 通知收藏页面（如果打开）
            notifyFavoritesPage('remove', title);
        } else {
            // 未收藏，添加
            favorites.push(bookData);
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.title = '从收藏中移除';
            showToast(`已将《${title}》添加到收藏`);
            
            // 通知收藏页面（如果打开）
            notifyFavoritesPage('add', bookData);
        }
        
        // 保存到本地存储
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    
    // 通知收藏页面
    function notifyFavoritesPage(action, data) {
        try {
            // 向所有打开的窗口发送消息
            if (window.opener) {
                window.opener.postMessage({
                    type: 'favorites_updated',
                    action: action,
                    data: data
                }, '*');
            }
        } catch (e) {
            console.error('无法发送消息到收藏页面:', e);
        }
    }

    // 过滤书籍
    function filterBooks(category) {
        if (category === '全部') {
            // 显示所有书籍
            bookItems.forEach(item => {
                item.style.display = '';
            });
        } else {
            // 根据类型过滤
            bookItems.forEach(item => {
                const isMatch = (category === '有声书' && !item.classList.contains('pdf')) ||
                               (category === 'PDF' && item.classList.contains('pdf')) ||
                               (category === '图书' && item.classList.contains('new-item'));
                               
                item.style.display = isMatch ? '' : 'none';
            });
        }
    }
    
    // 更新页面标题
    function updatePageTitle(category) {
        const pageHeader = document.querySelector('.page-header h2');
        if (pageHeader) {
            pageHeader.textContent = category;
        }
    }
    
    // 搜索书籍
    function searchBooks(query) {
        if (!query || query.trim() === '') {
            // 如果搜索为空，显示所有书籍
            bookItems.forEach(item => {
                item.style.display = '';
            });
            
            // 恢复原始分类状态
            const activeCategory = document.querySelector('.category-item.active');
            if (activeCategory) {
                filterBooks(activeCategory.querySelector('span').textContent);
            }
            return;
        }
        
        query = query.toLowerCase();
        
        // 更新标题
        updatePageTitle(`搜索: "${query}"`);
        
        // 过滤书籍
        bookItems.forEach(item => {
            if (item.classList.contains('new-item')) {
                item.style.display = 'none';
                return;
            }
            
            const title = item.querySelector('h4')?.textContent.toLowerCase() || '';
            const author = item.querySelector('.book-author')?.textContent.toLowerCase() || '';
            
            item.style.display = (title.includes(query) || author.includes(query)) ? '' : 'none';
        });
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

    // 书籍项目点击效果
    bookItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        // 如果是有声书，添加点击播放功能
        if (item.classList.contains('audiobook')) {
            const bookLink = item.querySelector('.book-link');
            if (bookLink) {
                bookLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // 获取书籍信息
                    const title = item.querySelector('h4').textContent;
                    const bookId = this.getAttribute('href').split('?id=')[1] || 'audio-001';
                    
                    try {
                        // 保存当前播放状态
                        if (window.audioManager) {
                            window.audioManager.saveState();
                            
                            // 设置要播放的书籍ID
                            const audioSrc = 'audio/这次我们怎么死？.mp3'; // 实际应用中应该根据ID获取
                            window.audioManager.setCurrentBook(bookId, audioSrc);
                        }
                        
                        // 跳转到播放页面
                        window.location.href = `index.html?id=${bookId}`;
                    } catch (error) {
                        console.error('处理音频播放时出错:', error);
                        // 如果出错，仍然跳转
                        window.location.href = this.getAttribute('href');
                    }
                });
            }
        }
    });
});