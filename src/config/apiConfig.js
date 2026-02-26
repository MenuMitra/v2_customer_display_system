// Centralized environment configuration for API and WebSocket endpoints
// NOTE:
// - Keep API_HOSTs as bare domains (no /v2 or /v2.2 here)
// - Versioned paths like /v2.2 are appended below in the common base paths

// SINGLE SWITCH: change this to 'production' | 'testing' | 'development'
const CURRENT_ENV = 'production';

// Host configuration per environment
const CONFIG = {
  production: {
    // Deployed frontend: https://menu4.xyz/v2.2 or https://menu4.xyz/v2
    // APIs resolve to:
    // - https://menu4.xyz/v2.2/common/...
    // - https://menu4.xyz/common_api/...
    // - https://menu4.xyz/api/...
    API_HOST: 'https://menu4.xyz',
    WS_URL: 'wss://menu4.xyz/ws/database-updates',
  },
  testing: {
    // Deployed frontend: https://menusmitra.xyz/v2.2 or https://menusmitra.xyz/v2
    // APIs resolve to the same paths on the testing domain.
    API_HOST: 'https://menusmitra.xyz',
    WS_URL: 'wss://menusmitra.xyz/ws/database-updates',
  },
  development: {
    API_HOST: 'https://men4u.xyz',
    WS_URL: 'wss://men4u.xyz/ws/database-updates',
  },
};

const { API_HOST, WS_URL } = CONFIG[CURRENT_ENV];

// Common base paths used across the app
const V2_COMMON_BASE = `${API_HOST}/v2.2/common`;
const COMMON_API_BASE = `${API_HOST}/common_api`;
const API_BASE = `${API_HOST}/api`;

export const ENV = {
  env: CURRENT_ENV,
  API_HOST,
  WS_URL,
  V2_COMMON_BASE,
  COMMON_API_BASE,
  API_BASE,
};

export default ENV;
