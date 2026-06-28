import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../services/AuthContext';

const { Title } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  //ログイン成功'
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.username, values.password);
      if (success) {
        message.success('ログイン成功');
        const user = sessionStorage.getItem('user');
        const isOperator = user && typeof user === 'string' ? JSON.parse(user).role === 'OPERATOR' : false;
        if (isOperator) {
          navigate('/warehouse');
        } else {
          navigate('/dashboard');
        }
      } else {
        message.error('ログインに失敗しました、ユーザー情報を確認してください。',5);
      }
    } catch (error: any) {
 
    message.error('ログイン処理中にエラーが発生しました',5);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#1a1a2e'
    }}>
      <Card
        style={{
          width: 400,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ fontSize: '28px',color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>永井商事_在庫管理システム</Title>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>ログイン</p>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="ユーザー名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'パスワードを入力してください' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="パスワード"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              ログイン
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p></p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;