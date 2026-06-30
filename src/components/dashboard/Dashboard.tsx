import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Progress, Input, Select, Space, Button, DatePicker } from 'antd';
import { ShoppingOutlined, DollarOutlined, ProfileOutlined, OrderedListOutlined, SearchOutlined } from '@ant-design/icons';
import { message } from '../../utils/message';
import { useTablePagination } from '../../utils/tablePagination';
const { Title } = Typography;
import { dashboardAPI } from '../../services/api';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;

interface DashboardItem {
  janCode: string;
  productName: string;
  categoryName: string;
  warehouseName: string;
  inbound : number;
  inboundAmount: number;
  outbound: number;
  outboundAmount: number;
  currentInventory: number;
}

const allOrders: any[] | (() => any[]) = [];

const Dashboard: React.FC = () => {
  const warehouses = JSON.parse(sessionStorage.getItem('warehouses') || '[]');
  const categories = JSON.parse(sessionStorage.getItem('categories') || '[]');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs().subtract(6, 'day'), dayjs()]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dataSource, setDataSource] = useState(allOrders);
  const { pagination, resetPage } = useTablePagination();

  // 検索ボタンクリック
  const handleSearch = async () => {
    resetPage();
    setSearchLoading(true);
    try {
      const dateFrom = filterDateRange?.[0]?.format('YYYY-MM-DD');
      const dateTo = filterDateRange?.[1]?.format('YYYY-MM-DD');
      const result = await dashboardAPI.getdashboardList({
        productName: searchProductName || '',
        category: searchCategory || '',
        warehouse: selectedWarehouse || '',
        dateFrom,
        dateTo,
      });
      if (result && Array.isArray(result.data)) {
        setDataSource(result.data);
      } else {
        setDataSource([]);
        message.error('入出庫データの取得に失敗しました。',5);
      }
    } catch (error) {
      setDataSource([]);
      message.error('入出庫データの取得に失敗しました。',5);
    } finally {
      setSearchLoading(false);
    }
  };

  // 総売上 = 売上金額（出庫）
  const totalSalesAmount = dataSource.reduce((sum, item) => sum + (item.outboundAmount || 0), 0);

  // 総利益 = 売上金額（出庫）- 売上金額（入庫）
  const totalSalesBenefit = dataSource.reduce((sum, item) => sum + (item.outboundAmount - item.inboundAmount || 0), 0);

  // 在庫件数 = 在庫件数の合計
  const totalCurrentInventory = dataSource.reduce((sum, item) => sum + (item.currentInventory || 0), 0);

  // 表のカラム定義（フォント・行の高さを大きく）
  const columns = [
    {
      title: <span style={{ fontSize: 28 }}>商品名</span>,
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string) => <span style={{ fontSize: 24}}>{text}</span>,
    },
    {
      title: <span style={{ fontSize: 28 }}>カテゴリー</span>,
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string) => <span style={{ fontSize: 24}}>{text}</span>,
    },
    {
      title: <span style={{ fontSize: 28 }}>入庫件数</span>,
      dataIndex: 'inbound',
      key: 'inbound',
      align: 'center' as const,
      render: (inbound: number) => <span style={{ fontSize: 24}}>{inbound.toLocaleString()}</span>
    },
    {
      title: <span style={{ fontSize: 28 }}>出庫件数</span>,
      dataIndex: 'outbound',
      key: 'outbound',
      align: 'center' as const,
      render: (outbound: number) => <span style={{ fontSize: 24}}>{outbound.toLocaleString()}</span>
    },
    {
      title: <span style={{ fontSize: 28 }}>入庫金額</span>,
      dataIndex: 'inboundAmount',
      key: 'inboundAmount',
      align: 'center' as const,
      render: (inboundAmount: number) => <span style={{ fontSize: 24}}>{inboundAmount.toLocaleString()}</span>,
    },
    {
      title: <span style={{ fontSize: 28 }}>出庫金額</span>,
      dataIndex: 'outboundAmount',
      key: 'outboundAmount',
      align: 'center' as const,
      render: (outboundAmount: number) => <span style={{ fontSize: 24}}>{outboundAmount.toLocaleString()}</span>,
    },
    {
      title: <span style={{ fontSize: 28 }}>保管倉庫</span>,
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      render: (text: string) => <span style={{ fontSize: 24}}>{text}</span>,
    },
    {
      title: <span style={{ fontSize: 28 }}>現在在庫件数</span>,
      key: 'currentInventory',
      dataIndex: 'currentInventory',
      align: 'center' as const,
      render: (currentInventory: number) => <span style={{ fontSize: 24}}>{currentInventory.toLocaleString()}</span>,
    },
  ];

  return (
    <div>
      {/* ダッシュボードタイトル - 他の画面より大きなフォント */}
      <Title level={1} style={{ fontSize: 36, marginBottom: 4 }}>ダッシュボード</Title>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 17 }}></p>

      <Card title="" style={{ marginTop: 16 }}>
        {/* 検索条件エリア */}
        
        <div style={{ marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <Space size={24}>
            <div style={{display: 'flex',gap: '12px',alignItems: 'flex-start',}} >
              <div >
                  <span style={{ fontSize: 24, fontWeight: 500, marginRight: 12, marginBottom: 8, display: 'inline-block' }}>商品名</span>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="商品名を入力"
                    value={searchProductName}
                    onChange={(e) => setSearchProductName(e.target.value)}
                    style={{ width: 300, fontSize: 20 }}
                    size="large"
                    allowClear
                  />
                </div>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 500, marginRight: 12, marginBottom: 8, display: 'inline-block' }}>カテゴリー</span>
                  <Select
                    placeholder="カテゴリーを選択"
                    value={searchCategory || undefined}
                    onChange={(value) => setSearchCategory(value || '')}
                    style={{ width: 250 }}
                    size="large"
                    allowClear
                    options={categories.map((category: any) => ({
                      key: category.code,
                      value: category.code,
                      label: category.name,
                    }))}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 500, marginRight: 12, marginBottom: 8, display: 'inline-block' }}>倉庫</span>
                  <Select
                    placeholder="倉庫を選択してください"
                    value={selectedWarehouse || undefined}
                    onChange={setSelectedWarehouse}
                    style={{ width: 250 }}
                    size="large"
                    allowClear
                    options={warehouses.map((warehouse: any) => ({
                      key: warehouse.code,
                      value: warehouse.code,
                      label: warehouse.name,
                    }))}
                  />
                </div>
                <div style={{display: 'flex',flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8, lineHeight: 1.2,}}>
                  <div>
                  <span style={{ fontSize: 24, fontWeight: 500, marginRight: 12, marginBottom: 8, display: 'inline-block' }}>入出庫日</span>
                  <RangePicker
                    value={filterDateRange}
                    onChange={(dates) => setFilterDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                    format="YYYY/MM/DD"
                    style={{ width: 300, fontSize: 20 }}
                    size="large"
                  />
                </div>
                  <span style={{ fontSize: 14, color: '#d91919' }}>＊入出庫更新日とは関係ありません。 </span>
                </div>
                
                <div>              
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    size="large"
                    onClick={handleSearch}
                    loading={searchLoading}>
                    検索
                  </Button> 
                </div>
            </div>
          </Space>
        </div>

        {/* 総売上エリア - 検索条件の下 */}
        <Row gutter={32} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card style={{ backgroundColor: '#e6f4ff' }}>
              <Statistic
                title={<span style={{ fontSize: 24 }}>総利益</span>}
                value={totalSalesBenefit}
                precision={0}
                prefix={<DollarOutlined />}
                suffix="円"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ backgroundColor: '#e6f4ff' }}>
              <Statistic
                title={<span style={{ fontSize: 24 }}>総売上</span>}
                value={totalSalesAmount}
                precision={0}
                prefix={<DollarOutlined />}
                suffix="円"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ backgroundColor: '#e6f4ff' }}>
              <Statistic
                title={<div><span style={{ fontSize: 24 }}>現在在庫総件数</span></div>}
                value={totalCurrentInventory}
                prefix={<ShoppingOutlined />}
                suffix="件"
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={dataSource}
          //rowKey="id"
          size="large"
          style={{ fontSize: 28 }}
          pagination={pagination}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
