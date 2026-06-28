import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Breadcrumb, theme } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  TeamOutlined,
  InboxOutlined,
  QrcodeOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../services/AuthContext';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const isOperator = user?.role === 'OPERATOR';

  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'ダッシュボード',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
      onClick: () => navigate('/products'),
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: '入出庫商品管理',
      onClick: () => navigate('/inventory'),
    },
    {
      key: '/warehouse',
      icon: <SwapOutlined />,
      label: '入出庫登録',
      onClick: () => navigate('/warehouse'),
    },
    {
      key: '/barcode-generator',
      icon: <QrcodeOutlined />,
      label: 'バーコード生成',
      onClick: () => navigate('/barcode-generator'),
    },
    {
      key: '/suppliers',
      icon: <ShopOutlined />,
      label: '仕入先管理',
      onClick: () => navigate('/suppliers'),
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'ユーザー管理',
      onClick: () => navigate('/users'),
    },
  ];

  const menuMap = Object.fromEntries(
  allMenuItems.map(item => [item.key, item.label]));

  // OPERATOR ロールの場合、入出庫登録とバーコード生成のみ表示
  const operatorOnlyKeys = [ '/warehouse', '/barcode-generator', '/products'];
  const menuItems = isOperator
    ? allMenuItems.filter(item => operatorOnlyKeys.includes(item.key))
    : allMenuItems;

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ログアウト',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const breadcrumbItems = [
    { title: 'ホーム' },
    ...location.pathname
      .split('/')
      .filter(Boolean)
      .map((_, index, arr) => {
        const path = '/' + arr.slice(0, index + 1).join('/');
        return {
          title: menuMap[path] || path,
        };
      }),
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#1a1a2e',
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          margin: '16px 0',
          letterSpacing: 2,
        }}>
          {collapsed ? 'WM' : '永井商事'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: '#1a1a2e', borderRight: 0 }}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s', background: '#f5f6fa' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #16213e'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64, color: '#fff' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4361ee' }} />
                <span>{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '16px', overflow: 'initial' }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
          <div
            style={{
              padding: 24,
              background: '#fff',
              borderRadius: borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 'calc(100vh - 180px)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
