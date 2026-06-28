import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/locale/ja_JP';

import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';
import ProductList from './components/products/ProductList';
import ProductForm from './components/products/ProductForm';
import ProductDetail from './components/products/ProductDetail-backup';
import ProductView from './components/products/ProductView-backup';
import BarcodeProductRegistration from './components/warehouse/BarcodeProductRegistration';
import BarcodeGenerator from './components/warehouse/BarcodeGenerator';
import InventoryList from './components/inventory/InventoryList';
import UserManagement from './components/users/UserManagement';
import SupplierManagement from './components/suppliers/SupplierManagement';
import { AuthProvider, useAuth } from './services/AuthContext';
import PrivateRoute from './services/PrivateRoute';

import './App.css';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        {/* OPERATOR ロールの場合、*/}
        {isOperator ? (
          <>
            <Route index element={<Navigate to="/warehouse" replace />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="warehouse" element={<BarcodeProductRegistration />} />
            <Route path="barcode-generator" element={<BarcodeGenerator />} />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="warehouse" element={<BarcodeProductRegistration />} />
            <Route path="barcode-generator" element={<BarcodeGenerator />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/:id/view" element={<ProductView />} />
            <Route path="suppliers" element={<SupplierManagement />} />
            <Route path="users" element={<UserManagement />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ConfigProvider locale={jaJP}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
