import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Typography, Button, Space, Image, Row, Col, Statistic, Tag } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined, ShareAltOutlined, HeartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProductView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Mock product data for view mode
  const product = {
    id: id || '1',
    name: 'スマートフォン X',
    description: '最新のスマートフォンです。高性能カメラと長いバッテリー寿命を備えています。革新的なデザインと最先端の技術を搭載し、日常生活をより便利で楽しくします。',
    category: '電子機器',
    price: 99800,
    originalPrice: 119800,
    stock: 45,
    status: '在庫あり',
    janCode: 'PROD-001',
    rating: 4.5,
    reviewCount: 128,
    features: [
      '6.7インチ Super Retina XDR ディスプレイ',
      'A16 Bionic チップ',
      '48MP メインカメラ',
      'Face ID',
      '5G対応',
      'IP68防水防塵',
      'ワイヤレス充電対応',
    ],
    specifications: {
      display: '6.7インチ OLED',
      resolution: '2778x1284',
      processor: 'A16 Bionic',
      memory: '6GB',
      storage: '256GB',
      battery: '4323mAh',
      camera: '48MP + 12MP + 12MP',
      os: 'iOS 17',
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '在庫あり': return 'success';
      case '在庫切れ': return 'warning';
      case '販売中止': return 'error';
      default: return 'default';
    }
  };

  const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
          type="text"
        >
          商品一覧に戻る
        </Button>
      </div>

      <Card>
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={12}>
            <div style={{ textAlign: 'center' }}>
              <Image
                width="100%"
                style={{ maxWidth: 500, borderRadius: 12 }}
                src="https://via.placeholder.com/500x500/1890ff/ffffff?text=Product+Main+Image"
                alt={product.name}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                {[1, 2, 3, 4].map((i) => (
                  <Image
                    key={i}
                    width={80}
                    height={80}
                    style={{ borderRadius: 8, cursor: 'pointer', border: '1px solid #f0f0f0' }}
                    src={`https://via.placeholder.com/80x80/1890ff/ffffff?text=Thumb+${i}`}
                    alt={`Thumbnail ${i}`}
                  />
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div>
              <Tag color={getStatusColor(product.status)} style={{ marginBottom: 8 }}>
                {product.status}
              </Tag>
              <Title level={2}>{product.name}</Title>
              <Text type="secondary">JANコード: {product.janCode} | カテゴリー: {product.category}</Text>

              <div style={{ margin: '24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                    ¥{product.price.toLocaleString()}
                  </Title>
                  <Text delete type="secondary">
                    ¥{product.originalPrice.toLocaleString()}
                  </Text>
                  <Tag color="red" style={{ margin: 0 }}>
                    {discountPercentage}% OFF
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  税込・送料別
                </Text>
              </div>

              <div style={{ margin: '24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text strong>評価:</Text>
                  <Text style={{ color: '#faad14' }}>★★★★☆</Text>
                  <Text type="secondary">({product.rating} / {product.reviewCount}件のレビュー)</Text>
                </div>
                <Statistic
                  title="在庫状況"
                  value={product.stock}
                  suffix="個"
                  valueStyle={{ color: product.stock > 10 ? '#3f8600' : '#cf1322' }}
                />
              </div>

              <div style={{ margin: '32px 0' }}>
                <Title level={4}>主な特徴</Title>
                <ul style={{ paddingLeft: 20 }}>
                  {product.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: 8 }}>
                      <Text>{feature}</Text>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ margin: '32px 0' }}>
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    disabled={product.status !== '在庫あり'}
                  >
                    カートに追加
                  </Button>
                  <Button
                    size="large"
                    icon={<HeartOutlined />}
                  >
                    お気に入り
                  </Button>
                  <Button
                    size="large"
                    icon={<ShareAltOutlined />}
                  >
                    共有
                  </Button>
                </Space>
              </div>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 48 }}>
          <Title level={3}>商品説明</Title>
          <Card>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{product.description}</p>
          </Card>
        </div>

        <div style={{ marginTop: 32 }}>
          <Title level={3}>仕様</Title>
          <Card>
            <Row gutter={[16, 16]}>
              {Object.entries(product.specifications).map(([key, value]) => (
                <Col xs={24} sm={12} md={8} key={key}>
                  <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{key.toUpperCase()}</Text>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{value}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </div>

        <div style={{ marginTop: 32 }}>
          <Title level={3}>レビュー</Title>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Title level={4} style={{ color: '#faad14' }}>★★★★☆</Title>
              <Title level={3}>{product.rating} / 5.0</Title>
              <Text type="secondary">{product.reviewCount}件のレビュー</Text>
              <div style={{ marginTop: 24 }}>
                <Button type="primary">レビューを書く</Button>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default ProductView;