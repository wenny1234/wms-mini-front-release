import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Form, Input, InputNumber, Select, Button, Card, Typography, message, Upload, Space } from 'antd';
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined, BarcodeOutlined } from '@ant-design/icons';
import { productAPI } from '../../services/api';

const categories = JSON.parse(sessionStorage.getItem('categories') || '[]');

const { Title } = Typography;
const { TextArea } = Input;

// フォームのデータ型定義
interface ProductFormData {
  id: string;
  name: string;
  description: string;
  category: string;
  janCode: string;
  company: string;
}

// 商品登録・編集フォームコンポーネント
const ProductForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 編集時、一覧画面から渡された商品データをフォームにセット
  useEffect(() => {
    if (id && id !== 'new') {
      setIsEditing(true);
      const productData = (location.state as any)?.product;
      if (productData) {
        form.setFieldsValue({
          id: productData.id,
          name: productData.name,
          category: productData.category,
          company: productData.company,
          description: productData.description || '',
          janCode: productData.janCode || '',
        });
      }
    }
  }, [id, form, location.state]);

  // フォーム送信時の処理
  const onFinish = async (values: ProductFormData) => {
    setLoading(true);
    try {
      if (isEditing && id) {
        await productAPI.updateProduct(values);
        message.success('商品を更新しました');
      } else {
        await productAPI.createProduct(values);
        message.success('商品を登録しました');
      }
      navigate('/products');
    } catch (error: any) {
      message.error(error?.response?.data?.message || '商品登録に失敗しました',5);
    } finally {
      setLoading(false);
    }
  };

  const categories = JSON.parse(sessionStorage.getItem('categories') || '[]');
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>{isEditing ? '商品編集' : '新規商品登録'}</Title>
          <p style={{ color: '#666', margin: 0 }}>
            {isEditing ? '商品編集' : '商品登録'}
          </p>
        </div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
        >
          一覧に戻る
        </Button>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            price: 0,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <Form.Item
                label="商品名"
                name="name"
                rules={[
                  { required: true, message: '商品名を入力してください' },
                  { max: 60, message: '商品名は60文字以内で入力してください' },
                ]}
              >
                <Input placeholder="商品名を入力" size="large" maxLength={60} showCount/>
              </Form.Item>

              <Form.Item
                label="JANコード"
                name="janCode"
                rules={[
                  { required: true, message: 'JANコードを入力してください' },
                  { max: 20, message: 'JANコードは20文字以内で入力してください' },
                ]}
              >
                <Input placeholder="JANコードをスキャンしてください。（手動入力可）"   prefix={<BarcodeOutlined />} size="large" maxLength={20} showCount disabled={isEditing}  onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}/>
              </Form.Item>

              <Form.Item
                label="カテゴリー"
                name="category"
                rules={[{ required: true, message: 'カテゴリーを選択してください' }]}
              >
                <Select
                  placeholder="カテゴリーを選択"
                  size="large"
                  options={categories.map((category: any) => ({
                    value: category.code,
                    label: category.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="メーカー名"
                name="company"
                rules={[
                  { required: true, message: 'メーカー名を入力してください' },
                  { max: 60, message: 'メーカー名は60文字以内で入力してください' },
                ]}
              >
                <Input placeholder="メーカー名を入力" size="large" maxLength={60} showCount />
              </Form.Item>
            </div>

            <div />
          </div>

          <Form.Item
            label="商品説明"
            name="description"
            rules={[{ required: true, message: '商品説明を入力してください' }]}
          >
            <TextArea
              rows={6}
              placeholder="商品の詳細な説明を入力してください"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                {isEditing ? '更新' : '登録'}
              </Button>
              <Button
                onClick={() => navigate('/products')}
                size="large"
              >
                キャンセル
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProductForm;