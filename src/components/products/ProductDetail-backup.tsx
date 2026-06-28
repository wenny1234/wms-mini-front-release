import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Typography, Descriptions, Button, Tag, Space, Image } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Mock product data
  const product = {
    id: id || '1',
    name: 'スマートフォン X',
    description: '最新のスマートフォンです。高性能カメラと長いバッテリー寿命を備えています。',
    category: '電子機器',
    company: '株式会社 XYZ',
    janCode: 'PROD-001',
    specifications: '画面: 6.7インチ\n解像度: 2778x1284\nCPU: A16 Bionic\nメモリ: 6GB\nストレージ: 256GB\nバッテリー: 4323mAh',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>商品詳細</Title>
          <p style={{ color: '#666', margin: 0 }}>商品の詳細情報</p>
        </div>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/products')}
          >
            一覧に戻る
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${id}/edit`)}
          >
            編集
          </Button>
        </Space>
      </div>

      <Card>
        <Descriptions title="基本情報" bordered column={2}>
          <Descriptions.Item label="商品名">{product.name}</Descriptions.Item>
          <Descriptions.Item label="JANコード">{product.janCode}</Descriptions.Item>
          <Descriptions.Item label="カテゴリー">{product.category}</Descriptions.Item>
          <Descriptions.Item label="メーカー">{product.company}</Descriptions.Item>
          <Descriptions.Item label="登録日">{product.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新日">{product.updatedAt}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 32 }}>
          <Title level={4}>商品説明</Title>
          <Card>
            <p style={{ whiteSpace: 'pre-wrap' }}>{product.description}</p>
          </Card>
        </div>

        <div style={{ marginTop: 32 }}>
          <Title level={4}>商品画像</Title>
          <Card>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Image
                width={200}
                height={200}
                src="https://via.placeholder.com/200x200/1890ff/ffffff?text=Product+Image"
                alt="Product"
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
              <Image
                width={200}
                height={200}
                src="https://via.placeholder.com/200x200/1890ff/ffffff?text=Product+Image+2"
                alt="Product"
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
              <Image
                width={200}
                height={200}
                src="https://via.placeholder.com/200x200/1890ff/ffffff?text=Product+Image+3"
                alt="Product"
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetail;