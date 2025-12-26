// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BACKEND_CONFIG;
} else if (typeof window !== 'undefined') {
  window.BACKEND_CONFIG = BACKEND_CONFIG;
}

// 确保在Chrome扩展环境中全局可用
if (typeof globalThis !== 'undefined') {
  globalThis.BACKEND_CONFIG = BACKEND_CONFIG;
}
if (typeof self !== 'undefined') {
  self.BACKEND_CONFIG = BACKEND_CONFIG;
}