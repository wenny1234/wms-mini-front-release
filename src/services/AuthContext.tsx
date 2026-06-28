import React, { createContext, useState, useContext, ReactNode } from 'react';
import { authAPI } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('token');
  });

  // ログイン関数の実装
  const login = async (username: string, password: string): Promise<boolean> => {
    try {

      // ログインAPI呼び出し
      const response = await authAPI.login(username, password);
      
      // APIレスポンスの構造を確認するためのデバッグログ    
      console.log('Login API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      
      // responseがオブジェクトで、期待されるプロパティが存在するかを確認
      if (response && typeof response === 'object' && (response.statusCode === 200 || response.code === 200)) {
        // userオブジェクトを作成（APIレスポンスの構造に合わせて適宜修正）
        const loggedInUser: User = {
          id: response.data.id,
          username: response.data.username,
          email: '',
          role: response.data.role, // A default role that can be modified when necessary
        };
        
        // 更新状态和sessionStorage
        setUser(loggedInUser);
        sessionStorage.setItem('user', JSON.stringify(loggedInUser));
        sessionStorage.setItem('categories', JSON.stringify(response.data.categoryData));
        sessionStorage.setItem('warehouses', JSON.stringify(response.data.warehousesData));
        
        // The token is just a temporary workaround, 
        // so it doesn’t really matter whether we use it now. 
        // The backend isn’t managing it at the moment.
        if (response.token || response.accessToken || response.data.token || response.data.accessToken) {
          const authToken = response.token || response.accessToken || response.data.token || response.data.accessToken;
          setToken(authToken);
          sessionStorage.setItem('token', authToken);
        }  
        console.log('Login successful for user:', username);
        return true;
      }
      
      console.log('Login failed - invalid response structure');
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      // APIエラーの詳細をログに出力してデバッグを助ける
      if (error.response) {
        // サーバーがエラー応答を返した場合
        console.error('API error response:', error.response.data);
      } else if (error.request) {
        
        console.error('No response received:', error.request);
      } else {
        // リクエスト設定時にエラーが発生した場合
        console.error('Request setup error:', error.message);
      }
      return false;
    }
  };

  // ログアウト関数の実装
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    authAPI.logout();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
