// API Configuration
// Centralized base URLs for all API endpoints

export const API_BASE_URLS = {
  // Main API base URL
  MEN4U_BASE: 'https://men4u.xyz',
  
  // Alternative API base URL  
  MENULTRA_BASE: 'https://menultra.com'
};

export const API_ENDPOINTS = {
  // Common API endpoints (v2)
  CDS_KDS_ORDER_LISTVIEW: '/v2/common/cds_kds_order_listview',
  GET_OUTLET_LIST: '/v2/common/get_outlet_list',
  
  // Common API endpoints (v1)
  PARTNER_OUTLET_LIST: '/api/common/partner/outletlist',
  
  // Common API endpoints (legacy)
  LOGOUT: '/common_api/logout'
};

// Helper function to build full API URLs
export const buildApiUrl = (baseUrl, endpoint) => {
  return `${baseUrl}${endpoint}`;
};

// Pre-built API URLs for common use
export const API_URLS = {
  CDS_KDS_ORDER_LISTVIEW: buildApiUrl(API_BASE_URLS.MEN4U_BASE, API_ENDPOINTS.CDS_KDS_ORDER_LISTVIEW),
  GET_OUTLET_LIST: buildApiUrl(API_BASE_URLS.MEN4U_BASE, API_ENDPOINTS.GET_OUTLET_LIST),
  PARTNER_OUTLET_LIST: buildApiUrl(API_BASE_URLS.MENULTRA_BASE, API_ENDPOINTS.PARTNER_OUTLET_LIST),
  LOGOUT: buildApiUrl(API_BASE_URLS.MEN4U_BASE, API_ENDPOINTS.LOGOUT)
};
