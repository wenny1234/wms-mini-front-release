import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Card, Typography, Select } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, BarcodeOutlined } from '@ant-design/icons';
import { message } from '../../utils/message';
import { useTablePagination } from '../../utils/tablePagination';
import { productAPI } from '../../services/api';

const { Title } = Typography;

// 商品データの型定義
interface Product {
  id: string;
  name: string;
  janCode: string;
  category: string;
  categoryName: string;
  company: string;
  updatedAt: string;
  description: string;
}

// 商品一覧コンポーネント
const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [searchCompany, setSearchCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null);
  const categories = JSON.parse(sessionStorage.getItem('categories') || '[]');
  const { pagination, resetPage } = useTablePagination();

  // 検索ボタン押下時の処理
  const handleSearch = async () => {
    resetPage();
    setLoading(true);
    try {
      const params: any = {};
      if (searchName) params.searchName = searchName;
      if (searchCategory) params.searchCategory = searchCategory;
      if (searchCompany) params.searchCompany = searchCompany;
      const data = await productAPI.getProducts(Object.keys(params).length > 0 ? params : undefined);
      // APIがデータを返した場合はAPIのデータを使用
      if (Array.isArray(data.data)) {
        setApiProducts(data.data.map((u: any, index: number) => ({
          key: u.id || String(index),
          name: u.name || '',
          janCode: u.janCode || '',
          category: u.category || '',
          categoryName: u.categoryName || '',
          company: u.company,
          updatedAt: u.updatedAt ??'',
          description: u.description || '',
        })));
      } else {
        setApiProducts(null);
      }
    } catch (error) {
      message.error('検索結果の取得に失敗しました。',5);
    } finally {
      setLoading(false);
    }
  };

  // 画面初期表示時に全件取得
  useEffect(() => {
    handleSearch();
  }, []);

  // APIからのデータがあればAPIのデータを使用し、なければ空配列を使用
  const sourceProducts = apiProducts !== null ? apiProducts : [];
  const filteredProducts = sourceProducts

  const columns: any[] = [
    {
      title: '商品名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
        {
      title: 'JANコード',
      dataIndex: 'janCode',
      key: 'janCode',
      sorter: (a: Product, b: Product) => a.janCode.localeCompare(b.janCode),
    },
    {
      title: 'カテゴリー',
      dataIndex: 'categoryName',
      key: 'categoryName',
      sorter: (a: Product, b: Product) => a.categoryName.localeCompare(b.categoryName),
      //onFilter: (value: string | number | boolean, record: Product) => record.category === value,
    },
    {
      title: 'メーカー名',
      dataIndex: 'company',
      key: 'company',
      sorter: (a: Product, b: Product) => a.company.localeCompare(b.company),
    },
    {
      title: '更新日時',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a: Product, b: Product) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${record.id}/edit`, { state: { product: record } })}
            title="編集"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>商品登録</Title>
          <p style={{ color: '#666', margin: 0 }}></p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/new')}
            size="large"
          >
            新規商品
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, color: '#333', fontSize: 13 }}>商品名</div>
            <Input
              placeholder="商品名を入力"
              allowClear
              size="large"
              style={{ width: 220 }}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, color: '#333', fontSize: 13 }}>カテゴリー</div>
            <Select
              placeholder="カテゴリーを選択"
              allowClear
              size="large"
              style={{ width: 200 }}
              value={searchCategory || undefined}
              onChange={(value) => setSearchCategory(value || '')}
              options={categories.map((category: any) => ({
                key: category.code,
                value: category.code,
                label: category.name,
              }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500, color: '#333', fontSize: 13 }}>メーカー名</div>
            <Input
              placeholder="メーカー名を入力"
              allowClear
              size="large"
              style={{ width: 220 }}
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              onPressEnter={handleSearch}
            />
          </div>
          
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="large"
            onClick={handleSearch}
          >
            検索
          </Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <span style={{ marginRight: 8 }}>合計: {filteredProducts.length} 件</span>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={pagination}
        />
      </Card>
    </div>
  );
};

export default ProductList;
