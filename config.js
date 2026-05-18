const BACKEND_CONFIG = {
  apiEndpoint: '',
  apiKey: '',
  timeout: 30000,
  retryAttempts: 3
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BACKEND_CONFIG;
} else if (typeof window !== 'undefined') {
  window.BACKEND_CONFIG = BACKEND_CONFIG;
}

if (typeof globalThis !== 'undefined') {
  globalThis.BACKEND_CONFIG = BACKEND_CONFIG;
}
if (typeof self !== 'undefined') {
  self.BACKEND_CONFIG = BACKEND_CONFIG;
}
