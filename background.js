
chrome.runtime.onInstalled.addListener(() => {
  // 监听存储变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.autoAnalyze?.newValue === true) {
      checkAndAnalyze();
    }
  });

  // 初始化检查
  chrome.storage.sync.get(['autoAnalyze'], (result) => {
    if (result.autoAnalyze) {
      checkAndAnalyze();
    }
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get(['autoAnalyze'], (result) => {
      if (result.autoAnalyze && isTargetUrl(tab.url)) {
        executeAnalysis(tabId);
      }
    });
  }
});




function isTargetUrl(url) {
  if (!url) return false;
  const parsedUrl = new URL(url);
  return (
    (parsedUrl.host.includes('xiaohongshu.com') && parsedUrl.pathname.startsWith('/user/profile/')) || 
    (parsedUrl.host.includes('douyin.com') && parsedUrl.pathname.startsWith('/user/'))
  );
}

function executeAnalysis(tabId) {
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    files: ['content.js']
  }).then(() => {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      function: () => {
        analyze(true);
      }
    });
  });
}

function checkAndAnalyze() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (isTargetUrl(tab.url)) {
        executeAnalysis(tab.id);
      }
    });
  });
}