function resetAnalysisState() {
  console.log('Resetting analysis state...');

  // 1. Disconnect observer
  if (window.postStyleObserver) {
    window.postStyleObserver.disconnect();
    window.postStyleObserver = null;
  }

  // 2. Clear item styles
  const allLiveItems = document.querySelectorAll('.note-item, .wqW3g_Kl.WPzYSlFQ.OguQAD1e');
  allLiveItems.forEach(item => {
    item.style.border = '';
    item.style.boxShadow = '';
    item.style.opacity = '';
  });

  // 3. Reset global variables
  window.analysisResults = null;
  window.disableHighlights = false;

  // 4. Scroll to top
  window.scrollTo(0, 0);

  // Also scroll the post list for Douyin to the top
  const postList = document.querySelector('[data-e2e="user-post-list"]');
  if (postList) {
      postList.scrollTop = 0;
  }

  // 5. Remove UI
  const resultDiv = document.querySelector('#analysis-result-container');
  if (resultDiv) {
    resultDiv.remove();
  }
  const toggleBtn = document.querySelector('#analysis-toggle-btn');
  if (toggleBtn) {
    toggleBtn.remove();
  }
}

function analyze(sg) {
  resetAnalysisState();
  if (window.location.host.includes('xiaohongshu.com') && window.location.pathname.startsWith('/user/profile/')) {
    analyzeXiaohongshu(sg);
  } else if (window.location.host.includes('douyin.com') && window.location.pathname.startsWith('/user/')) {
    analyzeDouyin(sg);
  } else {
    console.log('当前页面不支持分析，请在小红书或抖音的账号主页使用此功能');
  }
}



function initializeContentScript() {
  try {
    // 初始化SPA导航处理逻辑
    initializeSPANavigation();
  } catch (error) {
    console.error('[Error] 初始化content script失败:', error);
    
    // 显示错误信息给用户
    showErrorToUser('扩展初始化失败，请重新加载页面');
  }
}

// 初始化SPA导航处理逻辑
function initializeSPANavigation() {
  if (!window.spaObserverInitialized) {
    window.spaObserverInitialized = true;

    function removeAnalysisUI() {
      const resultDiv = document.querySelector('#analysis-result-container');
      if (resultDiv) {
        resultDiv.remove();
      }
      const toggleBtn = document.querySelector('#analysis-toggle-btn');
      if (toggleBtn) {
        toggleBtn.remove();
      }
    }

    function handlePageNavigation() {
      // Add a delay to ensure the page content is updated after navigation
      setTimeout(() => {
        const isSupportedPage = (window.location.host.includes('xiaohongshu.com') && window.location.pathname.startsWith('/user/profile/')) ||
                                (window.location.host.includes('douyin.com') && window.location.pathname.startsWith('/user/'));

        if (isSupportedPage) {
          // Check if auto-analysis is enabled before running
          chrome.storage.sync.get('autoAnalyze', (result) => {
            if (result.autoAnalyze) {
              // It's a user page and auto-analyze is on, so we should re-analyze.
              // The 'true' parameter ensures the UI is shown.
              analyze(true);
            }
          });
        } else {
          // Not a user page, remove the UI.
          removeAnalysisUI();
        }
      }, 1500); // 1.5 second delay, adjustable
    }

    // Use a single, robust observer for SPA navigation
    let lastUrlForObserver = window.location.href;
    const spaObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrlForObserver) {
        lastUrlForObserver = currentUrl;
        handlePageNavigation();
      }
    });

    // Start observing the body for changes that indicate a route change
    spaObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also handle popstate for browser back/forward buttons, which might not trigger the observer
    window.addEventListener('popstate', handlePageNavigation);
    
    console.log('SPA导航处理逻辑已初始化');
  }
}

// 显示错误信息给用户
function showErrorToUser(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '20px';
  errorDiv.style.right = '20px';
  errorDiv.style.backgroundColor = '#ff6b6b';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '10px 15px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.fontSize = '14px';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  // 5秒后自动移除
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

function getUserInfoXiaohongshu() {
  const userInfo = {};
  // 获取用户名和小红书号
  const nameElement = document.querySelector('.user-name');
  if (nameElement) {
    userInfo.username = nameElement.textContent.trim();
    userInfo.nickname = nameElement.textContent.trim(); // 添加nickname字段，与抖音保持一致
    console.log('[Debug] 小红书用户信息 - 昵称:', userInfo.nickname);
  } else {
    console.log('[Debug] 小红书用户信息 - 未找到用户名元素');
  }
  
  const redIdElement = document.querySelector('.user-redId');
  if (redIdElement) {
    userInfo.xhsId = redIdElement.textContent.replace('小红书号：', '').trim();
  }
  
  // 获取头像
  const avatarElement = document.querySelector('.avatar-wrapper img');
  if (avatarElement) {
    userInfo.avatar = avatarElement.src;
  }
  
  // 获取粉丝数和获赞收藏数
  const userInteractions = document.querySelectorAll('.user-interactions .count');
  if (userInteractions.length >= 3) {
    userInfo.followers = userInteractions[1].textContent.trim();
    userInfo.likes = userInteractions[2].textContent.trim();
  }
  
  // 获取用户简介
  const descElement = document.querySelector('.user-desc');
  if (descElement) {
    userInfo.description = descElement.textContent.trim();
  }
  
  // 获取用户标签
  const tagElements = document.querySelectorAll('.user-tags .tag, .user-tags .tag-item');
  if (tagElements.length > 0) {
    userInfo.tags = Array.from(tagElements).map(tag => {
      // 处理性别标签
      const genderIcon = tag.querySelector('use');
      if (genderIcon && genderIcon.hasAttribute('xlink:href')) {
        const gender = genderIcon.getAttribute('xlink:href') === '#female' ? '女' : '男';
        return `性别:${gender}`;
      }
      return tag.textContent.trim();
    });
  }
  
  return userInfo;
}

async function analyzeXiaohongshu(sg) {
  // 重置高亮禁用状态，允许重新分析时高亮作品
  window.disableHighlights = false;
  const userInfo = getUserInfoXiaohongshu();
  const allItems = await scrollAndCollectItemsXiaohongshu(); // This now returns actual DOM elements
  const likeCounts = [];

  allItems.forEach(item => {
    const likeText = item.querySelector('.count')?.textContent;

    if (likeText && likeText.trim() !== '') {
      let likes = 0;
      if (likeText.includes('万')) {
        const numValue = parseFloat(likeText.replace(/[^\d.]/g, ''));
        // Guard against NaN if parsing fails (e.g., text is just "万")
        likes = !isNaN(numValue) ? numValue * 10000 : 0;
      } else {
        likes = parseInt(likeText.replace(/[^\d]/g, '')) || 0;
      }
      likeCounts.push(likes);
      // 获取小红书标题和链接
      const titleElement = item.querySelector('.footer .title span') || item.querySelector('.title');
      item.dataset.title = titleElement?.textContent.trim() || '无标题';
      
      const linkElement = item.querySelector('a.cover.mask.ld') || item.querySelector('a[href^="/note/"]');
      if (linkElement) {
        item.dataset.url = new URL(linkElement.href, window.location.origin).href;
      }
    } else {
      likeCounts.push(0);  // Handle cases where like text is not found or empty
    }
  });

  processAnalysisResults(allItems, likeCounts, userInfo, sg);
}

async function scrollAndCollectItemsXiaohongshu() {
  // Add a delay to allow the page to reset its virtual scroll state after being scrolled to top.
  await new Promise(resolve => setTimeout(resolve, 500));

  let allItemUrls = new Set(); // To track unique URLs and decide when to stop scrolling
  let collectedItems = new Map(); // Use a Map to store unique DOM elements by URL

  // Initial collection to grab pinned posts and the first screen of content
  console.log('[XHS Scroll] Performing initial collection before scrolling...');
  const initialItems = document.querySelectorAll('.note-item');
  initialItems.forEach(item => {
    const linkElement = item.querySelector('a.cover.mask.ld') || item.querySelector('a[href^="/note/"]') || item.querySelector('a[href^="/user/profile/"]');
    if (linkElement) {
      const url = new URL(linkElement.href, window.location.origin).href;
      if (!collectedItems.has(url)) {
        allItemUrls.add(url);
        collectedItems.set(url, item.cloneNode(true));
      }
    }
  });
  console.log(`[XHS Scroll] Initial collection found ${collectedItems.size} items.`);

  let previousScrollHeight = 0;
  let scrollCount = 0;
  let noNewItemsCount = 0;
  const maxScrolls = 20;
  const maxNoNewItems = 3;

  while (scrollCount < maxScrolls) {
    console.log(`[XHS Scroll] Before scroll: scrollCount=${scrollCount}, previousScrollHeight=${previousScrollHeight}, allItemUrls.size=${allItemUrls.size}`);
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for content to load

    const currentScrollHeight = document.body.scrollHeight;
    const currentItems = document.querySelectorAll('.note-item');
    const initialAllItemUrlsSize = allItemUrls.size;

    console.log(`[XHS Scroll] After scroll: currentScrollHeight=${currentScrollHeight}, currentItems.length=${currentItems.length}, allItemUrls.size (before add)=${initialAllItemUrlsSize}`);

    currentItems.forEach(item => {
      const linkElement = item.querySelector('a.cover.mask.ld') || item.querySelector('a[href^="/note/"]');
      if (linkElement) {
        const url = new URL(linkElement.href, window.location.origin).href;
        allItemUrls.add(url);
        // Store the item element itself, keyed by URL. Overwrites are fine.
        if (!collectedItems.has(url)) {
            collectedItems.set(url, item.cloneNode(true));
        }
      }
    });

    if (allItemUrls.size === initialAllItemUrlsSize) {
      noNewItemsCount++;
      console.log(`[XHS Scroll] No new item URLs added. noNewItemsCount=${noNewItemsCount}`);
    } else {
      noNewItemsCount = 0;
    }

    if (currentScrollHeight === previousScrollHeight && noNewItemsCount >= maxNoNewItems) {
      console.log(`[XHS Scroll] Stopping scroll: Scroll height did not change and no new item URLs for ${maxNoNewItems} scrolls. currentScrollHeight=${currentScrollHeight}`);
      break;
    }
    
    previousScrollHeight = currentScrollHeight;
    console.log(`[XHS Scroll] After adding: allItemUrls.size=${allItemUrls.size}`);
    scrollCount++;
  }
  console.log(`[XHS Scroll] Finished scrolling. Total unique items collected: ${collectedItems.size}`);
  
  // Return the collected DOM elements directly, avoiding re-querying
  return Array.from(collectedItems.values());
}

function getUserInfoDouyin() {
  const userInfo = {};
  
  // 获取抖音号和昵称
  const usernameElement = document.querySelector('.GMEdHsXq span span span span');
  const followersElement = document.querySelector('[data-e2e="user-info-fans"] .C1cxu0Vq');
  const likesElement = document.querySelector('[data-e2e="user-info-like"] .C1cxu0Vq');
  const douyinIdElement = document.querySelector('.OcCvtZ2a');
  const locationElement = document.querySelector('.DtUnx4ER');
  const descriptionElement = document.querySelector('.JMYmWBA1 span span span span span');
  
  if (usernameElement) {
    userInfo.nickname = usernameElement.textContent.trim();
    console.log('[Debug] 抖音用户信息 - 昵称:', userInfo.nickname);
  } else {
    console.log('[Debug] 抖音用户信息 - 未找到用户名元素');
  }
  if (douyinIdElement) {
    userInfo.douyinId = douyinIdElement.textContent.trim();
  }
  if (followersElement) {
    userInfo.followers = followersElement.textContent.trim();
  }
  if (likesElement) {
    userInfo.likes = likesElement.textContent.trim();
  }
  if (descriptionElement) {
    userInfo.description = descriptionElement.textContent.trim();
  }
  if (locationElement) {
    userInfo.location = locationElement.textContent.trim();
  }

  // 获取抖音头像
  const avatarElement = document.querySelector('[data-e2e="user-detail"] .avatar-component-avatar-container img');
  if (avatarElement) {
    userInfo.avatar = avatarElement.src;
  }
  
  return userInfo;
}

async function analyzeDouyin(sg) {
  const userInfo = getUserInfoDouyin();
  const allItems = await scrollAndCollectItemsDouyin();
  const likeCounts = [];

  allItems.forEach(item => {
    // 从点赞区域获取点赞数 - 更新选择器
    const likeArea = item.querySelector('span.uWre3Wbh.author-card-user-video-like');
    if (likeArea) {
      const likeText = likeArea.querySelector('span.BgCg_ebQ')?.textContent;
      if (likeText) {
        // 处理点赞数格式（1.8万→18000）
        let likes = 0;
        if (likeText.includes('万')) {
          likes = parseFloat(likeText.replace('万', '')) * 10000;
        } else if (likeText.includes('k')) {
          likes = parseFloat(likeText.replace('k', '')) * 1000;
        } else {
          likes = parseInt(likeText.replace(/[^\d]/g, '')) || 0;
        }
        likeCounts.push(likes);

        // 获取抖音标题和链接
        const linkElement = item.querySelector('a.uz1VJwFY.TyuBARdT.IdxE71f8');
        
        const url = linkElement ? new URL(linkElement.href, window.location.origin).href : '';
        item.dataset.url = url;
        const title = item.querySelector('p.EtttsrEw')?.textContent || item.querySelector('p.eJFBAbdI.H4IE9Xgd')?.textContent || '无标题';
        item.dataset.title = title.trim() || '无标题';
      }
    }
  });

  processAnalysisResults(allItems, likeCounts, userInfo, sg);
}

async function scrollAndCollectItemsDouyin() {
  const postList = document.querySelector('[data-e2e="user-post-list"]');
  if (!postList) {
    console.log('[Douyin Debug] Could not find post list element. Aborting analysis.');
    return [];
  }
  console.log('[Douyin Debug] Found postList element. Starting scroll...', postList);

  let allItemUrls = new Set(); // To track unique URLs and decide when to stop scrolling
  let collectedItems = new Map(); // Use a Map to store unique DOM elements by URL
  let previousScrollHeight = 0;
  let scrollCount = 0;
  let noNewItemsCount = 0;
  const maxScrolls = 20;
  const maxNoNewItems = 3;

  while (scrollCount < maxScrolls) {
    postList.scrollTop = postList.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 500)); // Shortened wait time

    const currentScrollHeight = postList.scrollHeight;
    const itemSelector = 'li.wqW3g_Kl.WPzYSlFQ.OguQAD1e'; // This selector seems to be working.
    const currentItems = postList.querySelectorAll(itemSelector);
    
    console.log(`[Douyin Debug] Iteration ${scrollCount}: Found ${currentItems.length} items.`);

    // If items are found on the first scroll, log the HTML of the first item to find child selectors.
    if (currentItems.length > 0 && scrollCount === 0) {
        console.log(`[Douyin Debug] HTML of first found item:`, currentItems[0].innerHTML);
    }

    const initialAllItemUrlsSize = allItemUrls.size;

    currentItems.forEach((item, index) => { // Add index for logging
      const linkElement = item.querySelector('a.uz1VJwFY.TyuBARdT.IdxE71f8');
      // Add logging for linkElement and URL
      if (scrollCount === 0 && index < 3) { // Log for first 3 items on first scroll
          console.log(`[Douyin Debug] Item ${index} linkElement:`, linkElement);
      }
      if (linkElement) {
        const url = new URL(linkElement.href, window.location.origin).href;
        if (scrollCount === 0 && index < 3) { // Log for first 3 items on first scroll
            console.log(`[Douyin Debug] Item ${index} URL:`, url);
        }
        allItemUrls.add(url);
        // Store a clone of the item element itself, keyed by URL.
        if (!collectedItems.has(url)) {
            collectedItems.set(url, item.cloneNode(true));
        }
      }
    });

    if (allItemUrls.size === initialAllItemUrlsSize) {
      noNewItemsCount++;
    } else {
      noNewItemsCount = 0;
    }

    if (currentScrollHeight === previousScrollHeight && noNewItemsCount >= maxNoNewItems) {
      console.log(`[Douyin Debug] Stopping scroll after ${scrollCount + 1} iterations.`);
      break;
    }
    
    previousScrollHeight = currentScrollHeight;
    scrollCount++;
  }
  console.log(`[Douyin Debug] Finished scrolling. Total unique items collected: ${collectedItems.size}`);
  
  // Return the collected DOM elements directly, avoiding re-querying
  return Array.from(collectedItems.values());
}


// 获取全局分析数据的辅助函数
function getGlobalAnalysisData() {
    return window.globalAnalysisData || null;
}

// 清除全局分析数据的辅助函数
function clearGlobalAnalysisData() {
    window.globalAnalysisData = null;
    console.log('[Global Data] 全局分析数据已清除');
}

// 更新全局分析数据中的单个帖子数据
function updateGlobalPostData(index, updatedData) {
    if (window.globalAnalysisData && window.globalAnalysisData.posts[index]) {
        Object.assign(window.globalAnalysisData.posts[index], updatedData);
        console.log(`[Global Data] 已更新帖子 ${index}:`, updatedData);
        return true;
    }
    return false;
}

// 根据条件过滤全局分析数据
function filterGlobalAnalysisData(filterFn) {
    if (!window.globalAnalysisData) return null;
    
    const filteredPosts = window.globalAnalysisData.posts.filter(filterFn);
    return {
        posts: filteredPosts,
        totalCount: filteredPosts.length,
        originalTotalCount: window.globalAnalysisData.totalCount,
        processedAt: window.globalAnalysisData.processedAt,
    };
}

// 示例：获取高点赞数的帖子
function getHighEngagementPosts(minLikes = 1000) {
    return filterGlobalAnalysisData(post => post.likeCount >= minLikes);
}

// 示例：获取视频帖子
function getVideoPosts() {
    return filterGlobalAnalysisData(post => post.videoDuration !== '无视频');
}

// 示例：获取最新帖子（按创建时间排序）
function getLatestPosts(limit = 10) {
    const data = getGlobalAnalysisData();
    if (!data) return null;
    
    const sortedPosts = [...data.posts].sort((a, b) => {
        const timeA = new Date(a.createTime).getTime();
        const timeB = new Date(b.createTime).getTime();
        return timeB - timeA; // 降序排列
    });
    
    return {
        posts: sortedPosts.slice(0, limit),
        totalCount: Math.min(limit, sortedPosts.length),
        originalTotalCount: data.totalCount,
        processedAt: data.processedAt
    };
}

// 示例：根据标签筛选帖子
function getPostsByTag(tagKeyword) {
    return filterGlobalAnalysisData(post => {
        if (!post.tags || post.tags === '无标签') return false;
        return post.tags.toLowerCase().includes(tagKeyword.toLowerCase());
    });
}

async function processAnalysisResults(items, likeCounts, userInfo = {}, sg) {

  // 清除之前的高亮效果
  items.forEach(item => {
    item.style.border = '';
    item.style.boxShadow = '';
  });

  if (!sg && likeCounts.length === 0) {
    // 仅发送完成状态
    chrome.runtime.sendMessage({ type: 'analysisComplete', success: false });
    return;
  }
  
  // 计算平均点赞数
  let averageLikes = 0;
  let stdDev = 0;
  let contentStability = 0;
  let popularity = 0;

  console.log(`[Analysis] likeCounts.length: ${likeCounts.length}`);
  console.log(`[Analysis] likeCounts:`, likeCounts);

  if (likeCounts.length > 0) {
    const totalLikes = likeCounts.reduce((sum, likes) => sum + likes, 0);
    averageLikes = totalLikes / likeCounts.length;
    console.log(`[Analysis] totalLikes: ${totalLikes}, averageLikes: ${averageLikes}`);
    
    // 计算内容稳定性（标准差 / 平均值）
    const variance = likeCounts.reduce((sum, likes) => sum + Math.pow(likes - averageLikes, 2), 0) / likeCounts.length;
    stdDev = Math.sqrt(variance);
    contentStability = averageLikes > 0 ? 100 - Math.min(100, (stdDev / averageLikes) * 100) : 0;
    console.log(`[Analysis] variance: ${variance}, stdDev: ${stdDev}, contentStability: ${contentStability}`);
    
    // 计算受欢迎程度（高于平均值的比例）
    const popularPosts = likeCounts.filter(likes => likes > averageLikes).length;
    popularity = (popularPosts / likeCounts.length) * 100;
    console.log(`[Analysis] popularPosts: ${popularPosts}, popularity: ${popularity}`);
  } else {
    console.log(`[Analysis] likeCounts is empty, setting averageLikes, stdDev, contentStability, popularity to 0.`);
  }
  
  // 计算互动率（平均点赞数 / 粉丝数）
  let interactionRate = 0;
  if (userInfo.followers && averageLikes > 0) { // Add check for averageLikes > 0
    const followersNum = parseFloat(userInfo.followers.replace(/[^\d.]/g, '')) * (userInfo.followers.includes('万') ? 10000 : 1);
    interactionRate = (averageLikes / followersNum) * 100;
    console.log(`[Analysis] followersNum: ${followersNum}, interactionRate: ${interactionRate}`);
  } else {
    console.log(`[Analysis] userInfo.followers is missing or averageLikes is 0, interactionRate set to 0.`);
  }

  // ... (rest of the function, including threshold calculation)
  let ratio_obj = await new Promise(resolve => { // Renamed to avoid conflict
    chrome.storage.sync.get(['threshold'], resolve);
  });

  console.log(`[Analysis] ratio_obj.threshold: ${ratio_obj.threshold}`);

  if(ratio_obj.threshold===''||ratio_obj.threshold==null||ratio_obj.threshold===undefined){
    ratio_obj.threshold=50;
  }
  let threshold_value; // Renamed to avoid conflict
  threshold_value = averageLikes + 1 * stdDev; // Default threshold calculation
  console.log(`[Analysis] Default threshold (averageLikes + 0.5 * stdDev): ${threshold_value}`);
  threshold_value = threshold_value * ratio_obj.threshold/20; // Use ratio_obj
  console.log(`[Analysis] Final threshold (after ratio adjustment): ${threshold_value}`);
  
  // 构建分析结果对象
  const analysisResults = {
    userInfo,
    averageLikes: averageLikes.toFixed(0),
    interactionRate: interactionRate.toFixed(2) + '%',
    contentStability: contentStability.toFixed(0) + '%',
    popularity: popularity.toFixed(0) + '%',
        items: Array.from(items).map((item, index) => ({
          title: item.dataset.title || '无标题',
          url: item.dataset.url || '#',
          likes: likeCounts[index] || 0
        }))
      };
      
      // 保存分析结果到全局变量，供飞书保存功能使用
      window.analysisResults = analysisResults;
      console.log('[Debug] 分析结果已保存到window.analysisResults:', analysisResults);
      console.log('[Debug] 用户信息:', analysisResults.userInfo);
    
      // 异步处理抖音简介展开
      if (window.location.host.includes('douyin.com')) {
        (async () => {
          const expandButton = document.querySelector('span.Y1D9s6I6');
          if (expandButton) {
            expandButton.click();
            await new Promise(resolve => setTimeout(resolve, 500)); // 等待简介展开
            const fullDescriptionElement = document.querySelector('.JMYmWBA1 span span span span span');
            if (fullDescriptionElement) {
              const fullDescription = fullDescriptionElement.textContent.trim();
              // 更新 analysisResults 中的简介
              analysisResults.userInfo.description = fullDescription;
              // 动态更新分析结果页中显示简介的DOM元素
              const descriptionDisplayElement = document.getElementById('user-description-display');
              if (descriptionDisplayElement) {
                descriptionDisplayElement.textContent = `简介: ${fullDescription}`;
              }
            }
          }
        })();
      }
    
      const parseSocialNumber = (numStr) => {
          if (!numStr) return 0;
          numStr = String(numStr); // Ensure it's a string
          if (numStr.includes('万')) {
              return parseFloat(numStr.replace('万', '')) * 10000;
          } else if (numStr.includes('k')) {
              return parseFloat(numStr.replace('k', '')) * 1000;
          }
                    else {
                        return parseFloat(numStr.replace(/[^\d.]/g, '')) || 0;
                    }      };
    
      // Create a copy of userInfo for modification for the API call
      const apiUserInfo = JSON.parse(JSON.stringify(userInfo));
      if (apiUserInfo.followers) {
        apiUserInfo.followers = parseSocialNumber(apiUserInfo.followers);
      }
      if (apiUserInfo.likes) {
        apiUserInfo.likes = parseSocialNumber(apiUserInfo.likes);
      }
    
      // 根据数据来源判断是抖音还是小红书
      const isDouyin = Object.hasOwnProperty.call(userInfo, 'douyinId');
      const sourceData = isDouyin ? {
        userInfo: apiUserInfo,
        items: Array.from(items).map(item => {
          const linkElement = item.querySelector('a.uz1VJwFY.TyuBARdT.IdxE71f8');
          const url = linkElement ? new URL(linkElement.href, window.location.origin).href : '';
          const title = item.querySelector('p.EtttsrEw')?.textContent || item.querySelector('p.eJFBAbdI.H4IE9Xgd')?.textContent || '无标题';
          const likeArea = item.querySelector('span.uWre3Wbh.author-card-user-video-like');
                  const likeText = likeArea ? likeArea.querySelector('span.BgCg_ebQ')?.textContent : '';
        let likeCount = 0;
        if (likeText) {
            if (likeText.includes('万')) {
                likeCount = parseFloat(likeText) * 10000;
            } else {
                likeCount = parseInt(likeText);
            }
        }
          return {
            title,
            url,
            likes: parseSocialNumber(likeText)
          };
        })
      } : {
        userInfo: apiUserInfo,
        items: Array.from(items).map((item, index) => ({ 
          title: item.dataset.title, 
          url: item.dataset.url, 
          likes: likeCounts[index]
        }))
      };

  let hasCache = false; 
  let hasDeepCache = false;
  let cacheData;
  const parsedData = (data)=>{
    if(!data||(!data.output_d&&!data.output_s)){
      return false;
    }
      const markdownText = JSON.stringify(data.output_d||data.output_s, null, 2);
      // 去除 markdownText 开头和结尾的双引号
      let parsedText = markdownText.replace(/^"|"$/g, '');
      parsedText = parsedText.replace(/- /gm, '<div style="margin-bottom: 10px;"></div>');
      parsedText = parsedText.replace(/\\n/g, '<div style="margin-bottom: 10px;"></div>');
      // 新增：处理### 综合评价格式为h3
      parsedText = parsedText.replace(/### (.*?)\s/g, '<h4>$1</h4>');
      parsedText = parsedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return parsedText;
  }




const clearCache = async () => {
  const xhsId = sourceData?.userInfo?.xhsId;
  const douyinId = sourceData?.userInfo?.douyinId;
  if (!xhsId && !douyinId) {
    console.log('未检测到当前账号信息');
    return;
  }
  const cacheKeys = [];
  if (xhsId) {
    cacheKeys.push(`xhs-${xhsId}-normal`, `xhs-${xhsId}-deep`);
  }
  if (douyinId) {
    cacheKeys.push(`dy-${douyinId}-normal`, `dy-${douyinId}-deep`);
  }
  await chrome.storage.sync.remove(cacheKeys);
  console.log('已清除当前账号缓存（含深度分析缓存）');
  
  // 隐藏清除缓存按钮
  const clearBtn = document.getElementById('clearCacheButton');
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
  
  const detailSection = document.getElementById('detailSection');
  const detailBtn = document.getElementById('showDetailButton');
  if (detailSection) detailSection.style.display = 'none';
  // 只显示按钮，不重写HTML内容，避免事件监听器失效
  if (detailBtn) {
    detailBtn.style.display = 'block';
    // 重置按钮状态，确保可点击
    detailBtn.disabled = false;
    // 恢复按钮的原始文本
    detailBtn.innerHTML = '详细维度拆解';
  }
}

  
  // 不主动发起详细维度拆解请求，点击按钮后再请求
  
  if (!sg&&likeCounts.length === 0) {
    // 仅发送完成状态
    chrome.runtime.sendMessage({
      type: 'analysisComplete',
      success: false
    });
    return;
  }
  
  // 计算平均值和标准差
  const avg = likeCounts.reduce((a, b) => a + b, 0) / likeCounts.length;
  const stdDeviation = Math.sqrt(
    likeCounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / likeCounts.length
  );
  
  // 改进的阈值算法
  const belowAvgCount = likeCounts.filter(l => l < avg).length;
  const aboveAvgCount = likeCounts.length - belowAvgCount;
  
  // 根据数据分布动态调整阈值
  let threshold;
  if (aboveAvgCount > belowAvgCount * 2) {
    // 如果大部分数据高于平均值，使用更严格的阈值
    threshold = avg + 1.0 * stdDeviation;
  } else {
    // 正常情况
    threshold = avg + 0.5 * stdDeviation;
  }

  let  ratio = await new Promise(resolve => {
    chrome.storage.sync.get(['threshold'], resolve);
  });

  if(ratio.threshold===''||ratio.threshold==null||ratio.threshold===undefined){
    ratio.threshold=50;
  }
  threshold = threshold * ratio.threshold/100;
  


  const highlights = [];
  items.forEach((item, index) => {
    if (likeCounts[index] > threshold) {
      highlights.push({
        title: item.dataset.title,
        likes: likeCounts[index],
        url: item.dataset.url || window.location.href
      });
    }
  });

  // --- Virtual Scroll Highlighting Logic ---

  // 1. Store a set of canonical highlight URLs (without query params)
  const highlightUrls = new Set(highlights.map(h => h.url.split('?')[0]));

  // 2. Define the function that applies styles based on the stored URLs
  const reapplyStyles = () => {
    const liveItems = document.querySelectorAll('.note-item, .wqW3g_Kl.WPzYSlFQ.OguQAD1e');
    if (window.disableHighlights) {
      liveItems.forEach(item => {
        item.style.opacity = '';
        item.style.border = '';
        item.style.boxShadow = '';
      });
      return;
    }
    liveItems.forEach(item => {
      // Find the link within the item using a more robust selector
      const linkElement = item.querySelector('a[href^="/note/"], a[href^="/video/"], a[href^="/user/profile/"]');
      if (!linkElement) {
        // If no link, just apply default overlay
        item.style.opacity = '0.1';
        item.style.border = '';
        item.style.boxShadow = '';
        return;
      }

      // Get the canonical URL from the live item
      const canonicalUrl = new URL(linkElement.getAttribute('href'), window.location.origin).href.split('?')[0];

      // Apply styles based on whether the URL is in our highlight set
      if (highlightUrls.has(canonicalUrl)) {
        item.style.boxShadow = '0 0 15px rgba(255,0,0,0.8)';
        item.style.opacity = '1';
      } else {
        item.style.opacity = '0.1';
        item.style.border = '';
        item.style.boxShadow = '';
      }
    });
  };

  // 3. Apply styles for the first time
  reapplyStyles();

  // 4. Set up a MutationObserver to re-apply styles on scroll/DOM change
  const postContainer = document.querySelector('.feeds-container, [data-e2e="user-post-list"]');
  if (postContainer) {
    // Disconnect any previous observer to avoid duplicates
    if (window.postStyleObserver) {
      window.postStyleObserver.disconnect();
    }

    const observer = new MutationObserver(() => {
      // Use requestAnimationFrame to avoid layout thrashing and wait for DOM to settle
      requestAnimationFrame(reapplyStyles);
    });

    observer.observe(postContainer, { childList: true, subtree: true });

    // Store the observer instance on the window object
    window.postStyleObserver = observer;
  }
  // --- End of Virtual Scroll Highlighting Logic ---
  if(!sg){
    // 使用事务方式确保数据一致性
    const timestamp = new Date().toISOString();
    const key = 'analysisResults_'+window.location.href; // 改为使用URL作为key的一部分

    // 先删除该URL可能存在的旧记录
    await new Promise(resolve => {
      chrome.storage.sync.remove(key, resolve);
    });

    await chrome.storage.sync.set({ [key]: {
      url: window.location.href,
      results: highlights || [],
      timestamp: timestamp,  // 使用前面生成的timestamp
      userInfo: userInfo || {}
    } }, () => {
      // 发送完成状态
      chrome.runtime.sendMessage({
        type: 'analysisComplete',
        success: true
      });
    });
  }


  // 修改结果展示部分的样式
  let resultDiv = document.querySelector('#analysis-result-container');
  // 如果结果容器已存在，先移除它
  if (resultDiv) {
    resultDiv.remove();
  }
  
  // 创建新的结果容器
  resultDiv = document.createElement('div');
    resultDiv.id = 'analysis-result-container';
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '0';
    resultDiv.style.left = '0';
    resultDiv.style.width = '350px';
    resultDiv.style.height = '100vh';
    resultDiv.style.zIndex = '9999';
    resultDiv.style.background = 'white';
    resultDiv.style.padding = '15px';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.borderRight = 'none';
    resultDiv.style.borderRadius = '0 8px 8px 0';
    resultDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    resultDiv.style.overflowY = 'auto';
    resultDiv.style.transition = 'transform 0.3s ease';
    resultDiv.style.transform = 'translateX(-350px)'; // 初始隐藏
    
    // 确保折叠按钮位置正确
    const existingToggleBtn = document.querySelector('#analysis-toggle-btn');
    if (existingToggleBtn) {
      existingToggleBtn.style.left = '350px';
      existingToggleBtn.innerHTML = '◀';
    }
  
  // 修改折叠按钮位置
  let toggleBtn = document.querySelector('#analysis-toggle-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('div');
    toggleBtn.id = 'analysis-toggle-btn';
    document.body.appendChild(toggleBtn);
  }
  toggleBtn.innerHTML = '◀';
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.left = '0'; // 初始在屏幕左侧
  toggleBtn.style.top = '50%';
  toggleBtn.style.transform = 'translateY(-50%)';
  toggleBtn.style.width = '20px';
  toggleBtn.style.height = '60px';
  toggleBtn.style.background = 'white';
  toggleBtn.style.border = '1px solid #ccc';
  toggleBtn.style.borderLeft = 'none';
  toggleBtn.style.borderRadius = '0 8px 8px 0';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.userSelect = 'none';
  toggleBtn.style.zIndex = '10000';  // 确保按钮在最上层
  
  // 添加点击事件
  let isCollapsed = false;
  toggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      resultDiv.style.transform = 'translateX(-350px)';
      toggleBtn.innerHTML = '▶';
      toggleBtn.style.left = '0';
      window.disableHighlights = true;
      reapplyStyles();
    } else {
      resultDiv.style.transform = 'translateX(0)';
      toggleBtn.innerHTML = '◀';
      toggleBtn.style.left = '350px';
      window.disableHighlights = false;
      reapplyStyles();
    }
  });
  
  // 在添加内容后，立即显示面板
  setTimeout(() => {
    resultDiv.style.transform = 'translateX(0)'; // 滑入屏幕
    toggleBtn.style.left = '350px'; // 按钮移动到面板右侧
    resultDiv.style.top = '0';
    resultDiv.style.left = '0';
    resultDiv.style.height = '100vh';
  }, 100);
  
  // 将按钮添加到body而不是resultDiv
  document.body.appendChild(toggleBtn);


  // 账号评分算法
  // Move the account score calculation before it's used in the HTML
  function calculateAccountScore(avgLikes, stdDev, followers, likes) {
    // 标准化处理粉丝数和获赞数
    const parseSocialNumber = (numStr) => {
        if (!numStr) return 0;
        if (numStr.includes('万')) {
            return parseFloat(numStr.replace('万', '')) * 10000;
        } else if (numStr.includes('k')) {
            return parseFloat(numStr.replace('k', '')) * 1000;
        } else {
            return parseInt(numStr.replace(/[^\d]/g, '')) || 0;  // 修正正则表达式
        }
    };
    
    const followersNum = parseSocialNumber(followers) || 1;
    const likesNum = parseSocialNumber(likes) || 0;
    // 1. 修正互动率计算
    const engagementRate = Math.min(1, avgLikes / followersNum); // 限制最大为100%
   
    const normalizedStdDev = stdDev / (avgLikes + 1); // 防止除以0
    const likeConsistency = Math.max(1, Math.min(100, 100 * Math.exp(-0.5 * normalizedStdDev)));
  
    
    const popularityScore = Math.min(1, 
      (Math.log10(likesNum + 1) * 0.7 + 
       Math.log10(followersNum + 1) * 0.3) / 5
    ) * 100;

    // 4. 添加低分高赞判断
    const isLowFansHighLikes = followersNum < 10000 && engagementRate > 0.1;
    
    // 计算综合评分(0-100分)
    const score = Math.min(100, 
      (engagementRate * 20) + 
      (likeConsistency * 0.2) + 
      (popularityScore * 0.5) +
      (isLowFansHighLikes ? 10 : 0)
    );
    // Add return statement at the end


       // 新增账号风格分类函数
       function getAccountStyle(consistency, popularity) {
        const styleMap = [
            { threshold: [80, 80], label: '优质均衡型', desc: '内容稳定且受欢迎' },
            { threshold: [80, 60], label: '稳定成长型', desc: '内容稳定且传播力良好' },
            { threshold: [80, 40], label: '稳定小众型', desc: '内容稳定但受众有限' },
            { threshold: [60, 80], label: '单点爆发式', desc: '偶有爆款但不够稳定' },
            { threshold: [60, 60], label: '潜力新星型', desc: '表现均衡有上升空间' },
            { threshold: [40, 80], label: '内容波动式', desc: '爆款频出但不够稳定' },
            { threshold: [40, 60], label: '普通发展型', desc: '表现中等需优化' },
            { threshold: [40, 40], label: '起步阶段型', desc: '各项指标均有提升空间' }
        ];

        // 寻找最接近的匹配规则
        const closestStyle = styleMap.reduce((prev, curr) => {
            const prevDiff = Math.abs(consistency - prev.threshold[0]) + Math.abs(popularity - prev.threshold[1]);
            const currDiff = Math.abs(consistency - curr.threshold[0]) + Math.abs(popularity - curr.threshold[1]);
            return currDiff < prevDiff ? curr : prev;
        });

        // 设置最低匹配条件（至少满足一个维度超过40）
        if (closestStyle.threshold[0] > 40 || closestStyle.threshold[1] > 40) {
            return closestStyle;
        }
        return { label: '新兴探索型', desc: '新账号或数据不足' };
    }

    const accountStyle = getAccountStyle(likeConsistency, popularityScore);


    return {
      score: Math.round(score),
      engagementRate: (engagementRate * 100).toFixed(2) + '%',
      likeConsistency: Math.round(likeConsistency),
      popularityScore: Math.round(popularityScore),
      isLowFansHighLikes,
      accountStyle: accountStyle.label,  // 新增风格标签
      accountStyleDesc: accountStyle.desc  // 新增风格描述
    };
}

// Calculate the score before generating HTML
const accountScore = calculateAccountScore(
  avg, 
  stdDev, 
  userInfo.followers || '0', 
  userInfo.likes || '0'
);




// Now generate the HTML with the calculated score
resultDiv.innerHTML = `
  
  <style>
      button {
        margin-top: 10px;
        padding: 8px 12px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        width: 100%;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      button:hover {
        background: #0b86eb;
      }

      button:active {
        transform: scale(0.98);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      #analysis-result {
        font-size: 14px;
      }
      #analysis-result h3 {
        font-size: 22px; /* Adjusted font size */
        margin: 0; /* Removed margin */
        color: #333;
        font-weight: bold;
      }

      #analysis-result h4 {
        font-size: 18px;
        margin-bottom: 15px;
        color: #333;
        margin-block-start: 1em;
        margin-block-end: 1em;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
        font-weight: bold;
      }

      #analysis-result  p {
        display: block;
        margin-block-start: 1em;
        margin-block-end: 1em;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
      }

      #analysis-result ul {
        display: block;
        list-style-type: disc;
        margin-block-start: 1em;
        margin-block-end: 1em;
        padding-inline-start: 40px;
      }

      #analysis-result li {
        display: list-item;
        list-style: disc;
        text-align: -webkit-match-parent;
      }

      #analysis-result a {
        color: #007bff;
      }
     
    </style>
    <div id="analysis-result">
    <div style="border-bottom:1px solid #e5e7eb; padding: 15px 0; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin:0; font-size: 22px;">分析结果</h3>
    </div>

    <div id="detailSection" style="display:none; margin-top: 8px;">
      <h4>详细维度拆解</h4>
      <div id="apiData"></div>
    </div>
    ${userInfo.avatar ? `<img src="${userInfo.avatar}" style="width: 50px; height: 50px; border-radius: 50%; margin: 10px 0;">` : ''}
    
    ${userInfo.username ? `<p>用户名: ${userInfo.username}</p>` : ''}
    ${userInfo.xhsId ? `<p>小红书号: ${userInfo.xhsId}</p>` : ''}
    ${userInfo.douyinId ? `<p>抖音号: ${userInfo.douyinId}</p>` : ''}
    ${userInfo.nickname ? `<p>昵称: ${userInfo.nickname}</p>` : ''}
    ${userInfo.description ? `<p id="user-description-display">简介: ${userInfo.description}</p>` : ''}
    ${userInfo.followers ? `<p>粉丝数: ${userInfo.followers}</p>` : ''}
    ${userInfo.likes ? `<p>获赞/收藏: ${userInfo.likes}</p>` : ''}
    <button id="clearCacheButton" style="display: ${hasCache ? 'block' : 'none'}; margin:10px 0; padding: 8px 16px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer">清除当前账号缓存</button>

    <h4>账号质量评分</h4>
    <p>综合评分: ${accountScore.score}分 ${accountScore.isLowFansHighLikes ? '(低粉高赞账号)' : ''}</p>
   
    <p>账号风格: <strong>${accountScore.accountStyle}</strong>(${accountScore.accountStyleDesc})</p>
    <p>是否低粉高赞号: ${accountScore.isLowFansHighLikes? '是': '否'}</p>
    <p>互动率: ${accountScore.engagementRate}</p>
    <p>内容稳定性: ${accountScore.likeConsistency}分</p>
    <p>受欢迎度: ${accountScore.popularityScore}分</p>
    <div id="likesChartd" style="width:100%; height:200px; margin-bottom:20px;  border-bottom:1px solid #eee;">
    </div>
    <h4>近期相对高点赞作品</h4>
    ${avg ? `<p>平均点赞数: ${avg.toFixed(0)}</p>` : ''}
    ${stdDev ? `<p>标准差: ${stdDev.toFixed(0)}</p>` : ''}
    <p>高点赞阈值: ${threshold.toFixed(0)}</p>
    <p>高点赞作品数: ${highlights.length}</p>
    <ul>
      ${highlights.map(h => `<li><a href="${h.url}" target="_blank">${h.title}</a> - ${h.likes}点赞</li>`).join('')}
    </ul>
    </div>
    </div>
  `;
  document.body.prepend(resultDiv);
  try { chrome.runtime.sendMessage({ type: 'analysisComplete' }); } catch (_) {}
  

  // 创建错误提示元素（移动到按钮容器内）
  const errorDiv = document.createElement('div');
  errorDiv.id = 'detailError';
  errorDiv.style.color = 'red';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.marginTop = '5px';
  errorDiv.style.display = 'none';
  errorDiv.style.textAlign = 'center';
  errorDiv.style.width = '100%';

  document.getElementById('clearCacheButton').addEventListener('click', clearCache);
  const deepAnalysisBtn = document.getElementById('deep-analysis-btn');
  if (deepAnalysisBtn) {
    console.log('[Debug] "deep-analysis-btn" found. Attaching click listener. Highlights to pass:', JSON.stringify(highlights));
    deepAnalysisBtn.addEventListener('click', () => handleDeepAnalysis(highlights));
  }
  async function isLoggedIn() {
    const { userData } = await new Promise(resolve => chrome.storage.sync.get(['userData'], resolve));
    return !!(userData && userData.email);
  }

  async function getBalance() {
    // 从本地存储获取积分余额
    const { credits } = await new Promise(resolve => chrome.storage.sync.get(['credits'], resolve));
    return credits || 0;
  }




  // 创建折线图容器
  const chartContainer = document.createElement('div');
  chartContainer.style.marginBottom = '20px';
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 200;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '320px';
  canvas.style.display = 'block';
  chartContainer.appendChild(canvas);
  // 查找id为likesChartd的div元素
const likesChartdDiv = document.getElementById('likesChartd');
if (likesChartdDiv) {
  // 如果存在，则将chartContainer渲染到该div中
  likesChartdDiv.appendChild(chartContainer);
} else {
  // 如果不存在，则给出警告信息
  console.warn('未找到id为likesChartd的div元素，无法渲染图表容器');
}
  // 绘制折线图
  const ctx = canvas.getContext('2d');
  const maxLike = Math.max(...likeCounts);
  const minLike = Math.min(...likeCounts);
  const range = maxLike - minLike;
  const padding = 5;
  
  // 绘制坐标轴
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.strokeStyle = '#666';
  ctx.stroke();
  
  // 绘制数据点
  ctx.strokeStyle = '#4285f4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  likeCounts.slice().reverse().forEach((count, i) => {
    const x = padding + (i / (likeCounts.length - 1)) * (canvas.width - 2 * padding);
    const y = canvas.height - padding - ((count - minLike) / range) * (canvas.height - 2 * padding);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // 绘制数据点
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    ctx.arc(x, y+1, 3, 0, Math.PI * 2);
    ctx.fill();
  });
 

  // 在添加内容后，使用setTimeout触发动画
setTimeout(() => {
  resultDiv.style.transform = 'translateX(0)'; // 滑入屏幕
}, 100);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
      window.disableHighlights = true;
      try { if (window.postStyleObserver) { window.postStyleObserver.disconnect(); } } catch (_) {}
      window.postStyleObserver = null;
      const liveItems = document.querySelectorAll('.note-item, .wqW3g_Kl.WPzYSlFQ.OguQAD1e');
      liveItems.forEach(item => {
        item.style.border = '';
        item.style.boxShadow = '';
        item.style.opacity = '';
      });
      highlightUrls.clear();
    }
  });
  try { chrome.runtime.sendMessage({ type: 'analysisComplete' }); } catch (_) {}
  return highlights;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  // DOM已经加载完成，直接初始化
  initializeContentScript();
}
