document.addEventListener('DOMContentLoaded', () => {
  // Overlays and core content containers
  const disclaimerOverlay = document.getElementById('disclaimer-overlay');
  const mainContent = document.getElementById('main-content');

  // --- Disclaimer Logic ---
  const agreeButton = document.getElementById('agree-button');
  const disagreeButton = document.getElementById('disagree-button');

  chrome.storage.sync.get(['hasAgreedToTerms'], (result) => {
    if (result.hasAgreedToTerms) {
      showMainContent();
    } else {
      disclaimerOverlay.style.display = 'flex';
      mainContent.style.display = 'none';
    }
  });

  agreeButton.addEventListener('click', () => {
    chrome.storage.sync.set({ hasAgreedToTerms: true }, () => {
      showMainContent();
    });
  });

  disagreeButton.addEventListener('click', () => window.close());

  function showMainContent() {
    disclaimerOverlay.style.display = 'none';
    mainContent.style.display = 'block';
    console.log('显示主内容，准备初始化应用');
    // 添加一个小延迟确保DOM完全渲染
    setTimeout(() => {
      initializeApp();
    }, 100);
  }

  // --- Main App Initialization ---
  function initializeApp() {
    initializeMainFunctionality();
  }

  // --- Original Application Functionality ---
  function initializeMainFunctionality() {
    console.log('初始化主要功能');
    console.log('DOM加载状态:', document.readyState);
    // 首先加载所有配置
    chrome.storage.sync.get(['autoAnalyze', 'threshold'], (result) => {
      console.log('从存储加载配置:', result);
      if (result.autoAnalyze !== undefined) document.getElementById('autoAnalyze').checked = result.autoAnalyze;
      if (result.threshold !== undefined) {
          document.getElementById('threshold').value = result.threshold;
          document.getElementById('threshold-value').textContent = result.threshold;
      document.getElementById('threshold-value-display').textContent = result.threshold;
      }
      
      // 配置加载完成后，再设置事件监听器
      setupEventListeners();
    });
  }
  
  function setupEventListeners() {
    console.log('设置事件监听器');
    
    // 设置保存配置的事件监听器
    document.getElementById('autoAnalyze').addEventListener('change', () => saveSettings());
    document.getElementById('threshold').addEventListener('input', (e) => {
      document.getElementById('threshold-value').textContent = e.target.value;
      document.getElementById('threshold-value-display').textContent = e.target.value;
      saveSettings();
    });
    
    // 设置分析按钮事件监听器
    // 显示分析消息提示
    function displayAnalyzeMessage(message, isSuccess = false) {
      const messageDiv = document.getElementById('analyze-message');
      if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = isSuccess ? '#4CAF50' : '#f44336'; // Green for success, red for error
        messageDiv.style.display = 'block';
        setTimeout(() => {
          messageDiv.textContent = '';
          messageDiv.style.display = 'none';
        }, 3000); // Hide after 3 seconds
      }
    }

    document.getElementById('analyze').addEventListener('click', async () => {
      const analyzeBtn = document.getElementById('analyze');
      
      // 获取当前页面URL并判断是否为小红书或抖音用户页
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0].url;
        
        // 判断是否为小红书用户页
        const isXiaohongshuUserPage = currentUrl.includes('xiaohongshu.com/user/profile/');
        // 判断是否为抖音用户页
        const isDouyinUserPage = currentUrl.includes('douyin.com/user/');
        
        if (!isXiaohongshuUserPage && !isDouyinUserPage) {
          displayAnalyzeMessage('请先切换到小红书或抖音用户页再进行分析', false);
          return;
        }
      } catch (error) {
        console.error('获取当前页面URL失败:', error);
        displayAnalyzeMessage('无法获取当前页面信息，请重试', false);
        return;
      }
      
      analyzeBtn.textContent = '分析中...';
      analyzeBtn.disabled = true;
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => analyze(true)
        });

        // Proactively detect when analysis panel is rendered and restore button
        const tabId = tabs[0].id;
        const start = Date.now();
        const timeoutMs = 20000;
        const intervalMs = 500;
        const intervalId = setInterval(async () => {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => !!document.querySelector('#analysis-result-container')
            });
            const exists = Array.isArray(results) ? results[0].result : results;
            if (exists) {
              analyzeBtn.textContent = '立即分析';
              analyzeBtn.disabled = false;
              clearInterval(intervalId);
              
              // 在content浮层显示后1秒关闭popup窗口
              setTimeout(() => {
                window.close();
              }, 200);
            } else if (Date.now() - start > timeoutMs) {
              clearInterval(intervalId);
              analyzeBtn.textContent = '立即分析';
              analyzeBtn.disabled = false;
            }
          } catch (_) {
            // On any error, stop polling and restore button
            clearInterval(intervalId);
            analyzeBtn.textContent = '立即分析';
            analyzeBtn.disabled = false;
          }
        }, intervalMs);
      } catch (error) {
        console.error('Analyze button error:', error);
        analyzeBtn.textContent = '立即分析';
        analyzeBtn.disabled = false;
      }
    });

    function saveSettings(fieldId = null) {
      const settings = {
        autoAnalyze: document.getElementById('autoAnalyze').checked,
        threshold: document.getElementById('threshold').value,
      };
 
      chrome.storage.sync.set(settings, () => {
        console.log('Settings saved.');
        if (fieldId) showFieldSavedFeedback(fieldId);
      });
    }

    function showFieldSavedFeedback(fieldId) {
      const field = document.getElementById(fieldId);
      if (!field) return;
      const originalBorderColor = field.style.borderColor;
      const originalBoxShadow = field.style.boxShadow;
      
      field.style.borderColor = '#4CAF50';
      field.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
      
      let savedIcon = field.nextElementSibling;
      if (!savedIcon || !savedIcon.classList.contains('saved-icon')) {
        savedIcon = document.createElement('span');
        savedIcon.classList.add('saved-icon');
        savedIcon.textContent = '✓';
        savedIcon.style.color = '#4CAF50';
        savedIcon.style.marginLeft = '5px';
        savedIcon.style.fontSize = '14px';
        savedIcon.style.display = 'inline-block';
        savedIcon.style.opacity = '0';
        savedIcon.style.transition = 'opacity 0.3s';
        field.parentNode.insertBefore(savedIcon, field.nextSibling);
      }
      
      savedIcon.style.opacity = '1';
      
      setTimeout(() => {
        field.style.borderColor = originalBorderColor;
        field.style.boxShadow = originalBoxShadow;
        savedIcon.style.opacity = '0';
      }, 2000);
    }



    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'analysisComplete') {
        const analyzeBtn = document.getElementById('analyze');
        if (analyzeBtn) {
          analyzeBtn.textContent = '立即分析';
          analyzeBtn.disabled = false;
        }
      }
    });
  }
});
