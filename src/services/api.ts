import axios from 'axios';

// windowの型定義を拡張（TypeScriptの場合）
declare global {
  interface Window {
    APP_CONFIG?: { API_BASE_URL: string };
  }
}

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cbcz5hp4rk.execute-api.ap-southeast-1.amazonaws.com/test';
const baseURL = window.APP_CONFIG?.API_BASE_URL || "http://localhost:8080";
const API_BASE_URL = baseURL;
// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  // 登录
  login: async (username: string, password: string) => {
    try {
      console.log('API Base URL:', API_BASE_URL);

      const response = await api.post('/auth/login', {
        username,
        password,
      });
      
      console.log('Login response:', response);
      return response.data;

    } catch (error: any) {
      console.error('=== 错误详情 ===');
      console.log("Error Status:", error.response?.status);
      console.log("Error Data:", error.response?.data);
      console.log("Error Data:", error.response?.headers);
      throw error;
    }
  },

  // ログアウト
  logout: async () => {
    try {
      // ここではAPI呼び出しは行わず、クライアント側でセッションをクリアするだけにします
    } catch (error) {
      console.error('Logout API error:', error);
    }
  },

  // テンプレートを検証（如果需要）
  verifyToken: async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return false;     
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },
};

// 商品検索
export const productAPI = {
  getProducts: async (params?: any) => {
    try {
      // params could be a string (legacy) or an object { searchName, searchCategory, searchCompany }
      const queryParams: any = {};
      if (typeof params === 'string') {
        queryParams.searchText = params;
      } else if (params) {
        if (params.searchName) queryParams.searchName = params.searchName;
        if (params.searchCategory) queryParams.searchCategory = params.searchCategory;
        if (params.searchCompany) queryParams.searchCompany = params.searchCompany;
      }
      const response = await api.get('/products/products', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },

  // // 获取单个产品
  // getProduct: async (id: string) => {
  //   try {
  //     const response = await api.get(`/products/search/${id}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Get product error:', error);
  //     throw error;
  //   }
  // },

  // 商品新規
  createProduct: async (productData: any) => {
    try {
      const response = await api.post('/products/create', productData);
      return response.data;
    } catch (error) {
      console.error('create product error:', error);
      throw error;
    }
  },

  // 商品更新
  updateProduct: async (productData: any) => {
    try {
      const response = await api.post('/products/update', productData);
      return response.data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  // 商品削除　現時点は無効化で対応するため、APIも未実装
  // deleteProduct: async (id: string) => {
  //   try {
  //     const response = await api.delete(`/products/${id}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Delete product error:', error);
  //     throw error;
  //   }
  // },

  // バーコードスキャン商品情報取得
  getProductByBarcode: async (janCode: string) => {
    try {
      console.log('Getting product by barcode:', janCode);
      const response = await api.get(`/warehouse/getproductswithbarcode`, {
        params: { janCode }
      });
      return response.data;    
    } catch (error: any) {
      console.error('Get product by barcode error:', error);
      throw error;
    }
  },

  // // ヘッダー＋明細を保存
  // saveWithDetails: async (headerData: any, details: any[]) => {
  //   try {
  //     console.log('Saving with details:', { header: headerData, details });
  //     const response = await api.post('/products/with-details', {
  //       header: headerData,
  //       details: details,
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Save with details error:', error);
  //     throw error;
  //   }
  // },
};

// API - 実装は必要に応じて追加
export const wareHouseAPI = {
  // Create the inboard outboard data 
  CreateData: async (createInventoryData: any) => {
    try {
      const response = await api.post('/warehouse/createInventoryData', createInventoryData);
      return response.data;
    } catch (error) {
      console.error('Create warehouse data error:', error);
      throw error;
    }
  },
}

// API - 実装は必要に応じて追加
export const invetroryAPI = {
// 入出庫データ検索API
  searchInventory: async (params: {
    productName?: string;
    warehouse?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }) => {
    try {
      const response = await api.get('/inventory/getinventoryList', { params });
      return response.data;
    } catch (error: any) {
      console.error('Search inventory error:', error);
      throw error;
    }
  },
  // 商品詳細履歴一覧を取得
  getproductDetailList: async (params: {
    id?: string;
  }) => {
    try {
      const response = await api.get('/inventory/getproductDetailList', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get product history list error:', error);
      throw error;
    }
  },
    // 入出庫データ保存API
  saveinventoryData: async (inventoryData: any) => {
    try {
      const response = await api.post('/inventory/saveinventoryData', inventoryData);
      return response.data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }
}

// ユーザー管理API
export const userAPI = {
  // ユーザー一覧を取得
  getUsers: async () => {
    try {
      const response = await api.get('/users/users');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  // ユーザーを作成
  createUser: async (userData: any) => {
    try {
      const response = await api.post('/users/create', userData);
      return response.data;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  // ユーザー情報を更新
  updateUser: async (userData: any) => {
    try {
      const response = await api.post(`/users/update`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  // ユーザーの有効/無効を切り替え
  updateUserStatus: async (userData: any) => {
    try {
      const response = await api.post(`/users/updateStatues`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },
}

// 仕入先管理API
export const supplierAPI = {
  // 仕入先一覧を取得
  getSuppliers: async () => {
    try {
      const response = await api.get('/suppliers/suppliers');
      return response.data;
    } catch (error) {
      console.error('Get suppliers error:', error);
      throw error;
    }
  },

  // 仕入先を作成
  createSupplier: async (supplierData: any) => {
    try {
      const response = await api.post('/suppliers/create', supplierData);
      return response.data;
    } catch (error) {
      console.error('Create supplier error:', error);
      throw error;
    }
  },

  // 仕入先情報を更新
  updateSupplier: async (supplierData: any) => {
    try {
      const response = await api.post(`/suppliers/update`, supplierData);
      return response.data;
    } catch (error) {
      console.error('Update supplier error:', error);
      throw error;
    }
  },
};
// 商品検索
export const dashboardAPI = {
  getdashboardList: async (params?: any) => {
    try {
      // params could be a string (legacy) or an object { searchName, searchCategory, searchCompany }
      const queryParams: any = {};
   
      if (params.productName) queryParams.productName = params.productName;
      if (params.category) queryParams.category = params.category;
      if (params.warehouse) queryParams.warehouse = params.warehouse;
      if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
      if (params.dateTo) queryParams.dateTo = params.dateTo;
      
      const response = await api.get('/dashboard/getdashboardList', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },
};

export default api;
