import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Typography,
  Tag,
  message,
  Modal,
  Select,
  InputNumber,
  Descriptions,
  // Radio,
  // AutoComplete,
  // Tabs,
  DatePicker,
  Spin,
} from 'antd';
import { Checkbox } from 'antd';
import {
  SearchOutlined,
  // ImportOutlined,
  // ExportOutlined,
  // RollbackOutlined,
  // DeleteOutlined,
  PlayCircleOutlined,
  // EyeOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { invetroryAPI, supplierAPI } from '../../services/api';
const { Title, Text } = Typography;
//const { Search } = Input;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface InventoryItem {
  id: string;
  janCode: string;
  slipNumber: string;
  slipDetailNumber: string;
  slipDate: string;
  slipTime: string;
  transactionSeq: string;
  registrant: string;
  updateDate: string;
  updateTime: string;
  updater: string;
  name: string;
  category: string;
  categoryCode: string;
  snCode: string;
  supplier: string;
  supplierCode: string;
  warehouse: string;
  warehouseCode: string;
  warehouseStatus: string;
  srcWarehouseName: string;
  status: string;
  quantity: number;
  costPrice: number;
  shippingPrice: number;
  reason: string;
}

// 入出庫履歴の型定義未完了のみ
interface WarehouseHistory {
  id: string;
  snCode: string;
  warehouse: string;
  status: string;
  quantity: number;
  operation: string;
  operator: string;
  operationDate: string;
}

// 在庫データ
const inventoryData: InventoryItem[] = [];

// 在庫データの保存処理
const InventoryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [executingRows, setExecutingRows] = useState<Record<string, boolean>>({});
  const [supplierValues, setSupplierValues] = useState<Record<string, string>>({});
  const [costPriceValues, setCostPriceValues] = useState<Record<string, number>>({});
  const [shippingPriceValues, setShippingPriceValues] = useState<Record<string, number>>({});
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState<InventoryItem | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [recordReasons, setRecordReasons] = useState<Record<string, string>>({});
  const [filterProductName, setFilterProductName] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filterOnlyIncomplete, setFilterOnlyIncomplete] = useState(true);
  const [dataSource, setDataSource] = useState<InventoryItem[]>(inventoryData);
  const [searchLoading, setSearchLoading] = useState(false);
  //const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [supplierModalRecord, setSupplierModalRecord] = useState<InventoryItem | null>(null);
  const [supplierSearchText, setSupplierSearchText] = useState('');
  const [supplierList, setSupplierList] = useState<{ id: string; name: string }[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const warehouses = JSON.parse(sessionStorage.getItem('warehouses') || '[]');

  // 初期化：入出庫更新日に一週間前から今日までの日付を設定
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 仕入先一覧をAPIから取得
  const fetchSuppliers = async () => {
    setSupplierLoading(true);
    try {
      const result = await supplierAPI.getSuppliers();
      if (result && Array.isArray(result.data)) {
        setSupplierList(result.data);
      }
    } catch (error) {
      console.error('仕入先一覧の取得に失敗しました:', error);
    } finally {
      setSupplierLoading(false);
    }
  };

  // 初期化：入出庫更新日に一週間前から今日までの日付を設定
  useEffect(() => {
    const today = dayjs().startOf('day');
    const oneWeekAgo = today.subtract(6, 'day');
    setFilterDateRange([oneWeekAgo, today]);
  }, []);

  // 仕入先選択モーダルの検索結果
  const handleSupplierChange = (id: string, value: string) => {
    setSupplierValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // 仕入先選択モーダルで選択した仕入先を反映
  const handleSelectSupplier = (record: InventoryItem, selectedSupplier: { code: string; name: string }) => {
    setDataSource((prev) =>
      prev.map((item) =>
        item.id === record.id
          ? { ...item, supplier: selectedSupplier.name, supplierCode: selectedSupplier.code }
          : item
      )
    );
    setSupplierModalVisible(false);
    setSupplierModalRecord(null);
  };

  // 入庫金額・出庫金額の変更を反映
  const handleCostPriceChange = (id: string, value: number | null) => {
    setCostPriceValues((prev) => ({
      ...prev,
      [id]: value ?? 0,
    }));
  };

  // 入庫金額・出庫金額の変更を反映
  const handleShippingPriceChange = (id: string, value: number | null) => {
    setShippingPriceValues((prev) => ({
      ...prev,
      [id]: value ?? 0,
    }));
  };

  // 実行確認モーダルを開く
  const handleExecute = async (record: InventoryItem) => {
    // 返品入庫・棚卸差異出庫・棚卸差異入庫・廃棄出庫の場合は理由入力モーダルを表示
    if (record.warehouseStatus === '返品入庫'|| record.warehouseStatus === '棚卸差異出庫' 
      || record.warehouseStatus === '棚卸差異入庫'|| record.warehouseStatus === '廃棄出庫') {
      setConfirmRecord(record);
      setConfirmReason(record.reason || recordReasons[record.id] || '');
      setConfirmModalVisible(true);
    } else {
      // 通常の入庫・出庫処理は理由なしで即保存
      setExecutingRows((prev) => ({ ...prev, [record.id]: true }));
      try {
        // 該当行のデータを収集（ユーザーが編集した値を含む）
        const saveData: any = {
          ...record,
          supplier: supplierValues[record.id] ?? record.supplier,
          costPrice: costPriceValues[record.id] ?? record.costPrice,
          shippingPrice: shippingPriceValues[record.id] ?? record.shippingPrice,
          reason: recordReasons[record.id] ?? record.reason,
        };

        // APIに保存処理
        await invetroryAPI.saveinventoryData(saveData);

        // 未完了→完了画面上では即反映
        record.status = '完了';
        message.success('保存処理が完了しました',5);
      } catch (error) {
        message.error('保存処理に失敗しました',5);
      } finally {
        setExecutingRows((prev) => ({ ...prev, [record.id]: false }));
      }
    }
  };

  // 確認モーダルでOKを押したら実際の処理を実行
  const handleConfirmExecute = async () => {
    if (!confirmRecord) return;
    if (!confirmReason.trim()) {
      message.warning('理由・備考を入力してください',5);
      return;
    }

    setConfirmLoading(true);
    const record = confirmRecord;

    try {
      // 該当行のデータを収集（ユーザーが編集した値を含む）+ 理由を追加
      const saveData: any = {
        ...record,
        supplier: supplierValues[record.id] ?? record.supplier,
        costPrice: costPriceValues[record.id] ?? record.costPrice,
        shippingPrice: shippingPriceValues[record.id] ?? record.shippingPrice,
        reason: confirmReason,
      };
      // APIに保存処理
      await invetroryAPI.saveinventoryData(saveData);
      // 未完了→完了
      record.status = '完了';
      record.reason = confirmReason;
      message.success(`保存処理が完了しました`);
      // 理由・備考を保存
      setRecordReasons((prev) => ({
        ...prev,
        [record.id]: confirmReason,
      }));
    } catch (error) {
      message.error('保存処理に失敗しました',5);
    } finally {
      setConfirmLoading(false);
      setConfirmModalVisible(false);
      setConfirmRecord(null);
      setConfirmReason('');
    }
  };
  const handleCancelExecute = () => {
    setConfirmModalVisible(false);
    setConfirmRecord(null);
    setConfirmReason('');
  };

  // 検索ボタンクリック
  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const dateFrom = filterDateRange?.[0]?.format('YYYY-MM-DD');
      const dateTo = filterDateRange?.[1]?.format('YYYY-MM-DD');
      const result = await invetroryAPI.searchInventory({
        productName: filterProductName || '',
        warehouse: filterWarehouse || '',
        status: filterOnlyIncomplete ? 'I' : '', // API側で未完了は'I'、完了は'C'として扱う想定
        dateFrom,
        dateTo,
      });
      if (result && Array.isArray(result.data)) {
        setDataSource(result.data);
      } else {
        // APIからnullが返ってきた場合はﾓックデータでフィルター
        message.error('検索結果の取得に失敗しました。',5);
      }
    } catch (error) {
      message.error('検索結果の取得に失敗しました。',5);
    } finally {
      setSearchLoading(false);
    }
  };


  // 商品登録確認ポップアップ
  const handleSave = (record: InventoryItem) => {
    Modal.confirm({
      title: '在庫保存確認',
      content: `選択した在庫商品(${record.name})を保存しますか？ `,
      okText: '保存',
      cancelText: 'キャンセル',
      onOk: () => handleExecute(record),
    });
  };

  const columns: any[] = [
    {
      title: '商品名',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      sorter: (a: InventoryItem, b: InventoryItem) => a.name.localeCompare(b.name),
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'カテゴリー',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      sorter: (a: InventoryItem, b: InventoryItem) => a.category.localeCompare(b.category),
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: 'SNコード',
      dataIndex: 'snCode',
      key: 'snCode',
      width: 200,
      sorter: (a: InventoryItem, b: InventoryItem) => a.snCode.localeCompare(b.snCode),
    },
    //     {
    //   title: '数量',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   width: 60,
    // },
    {
      title: '仕入先',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 200,
      sorter: (a: InventoryItem, b: InventoryItem) => a.supplier.localeCompare(b.supplier),
      render: (_: string, record: InventoryItem) => {
        const supplier = dataSource.find(item => item.id === record.id)?.supplier || '';
        const supplierCode = dataSource.find(item => item.id === record.id)?.supplierCode || '';
        return (
          <Button
            type="default"
            size="small"
            style={{
              width: '100%',
              textAlign: 'left',
              borderColor: supplier ? '#1890ff' : '#d9d9d9',
              color: supplier ? '#1890ff' : '#bfbfbf',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onClick={() => {
              setSupplierModalRecord(record);
              setSupplierSearchText('');
              setSupplierModalVisible(true);
            }}
          >
            {supplier || <span style={{ color: '#bfbfbf' }}>クリックして選択</span>}
          </Button>
        );
      },
    },
    {
      title: '入出庫処理名',
      dataIndex: 'warehouseStatus',
      key: 'warehouseStatus',
      width: 140,
      filters: [
        { text: '通常出庫', value: '通常出庫' },
        { text: '通常入庫', value: '通常入庫' },
        { text: '返品入庫', value: '返品入庫' },
        { text: '在庫移動', value: '在庫移動' },
        { text: '棚卸差異出庫', value: '棚卸差異出庫' },
        { text: '棚卸差異入庫', value: '棚卸差異入庫' },
        { text: '廃棄出庫', value: '廃棄出庫' },
      ],
      onFilter: (value: string | number | boolean, record: InventoryItem) => record.warehouseStatus === value,

    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === '完了' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: '倉庫',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 120,
      render: (warehouse: string) => <Tag color="blue">{warehouse}</Tag>,
    },
        {
      title: '移動元倉庫',
      dataIndex: 'srcWarehouseName',
      key: 'srcWarehouseName',
      width: 120,
      render: (srcWarehouseName: string) => <Tag color="blue">{srcWarehouseName}</Tag>,
    },
    {
      title: '入庫金額',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 160,
      sorter: (a: InventoryItem, b: InventoryItem) => (costPriceValues[a.id] ?? 0) - (costPriceValues[b.id] ?? 0),
      render: (_: string, record: InventoryItem) => (
        <InputNumber
          style={{ width: '100%' }}
          value={costPriceValues[record.id] ?? record.costPrice ?? 0}
          onChange={(value) => handleCostPriceChange(record.id, value)}
          min={0}
          max={9999999999}
          step={100}
          precision={0}
          formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value?.replace(/¥\s?|(,*)/g, '') as unknown as number}
          placeholder="入庫金額入力"
          disabled={!(record.warehouseStatus.includes('通常入庫'))}
        />
      ),
    },
    {
      title: '出庫金額',
      dataIndex: 'shippingPrice',
      key: 'shippingPrice',
      width: 160,
      sorter: (a: InventoryItem, b: InventoryItem) => (shippingPriceValues[a.id] ?? 0) - (shippingPriceValues[b.id] ?? 0),
      render: (_: string, record: InventoryItem) => (
        <InputNumber
          style={{ width: '100%' }}
          value={shippingPriceValues[record.id] ?? record.shippingPrice ?? 0}
          onChange={(value) => handleShippingPriceChange(record.id, value)}
          min={0}
          max={9999999999}
          step={100}
          precision={0}
          formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value?.replace(/¥\s?|(,*)/g, '') as unknown as number}
          placeholder="出庫金額入力"
          disabled={!(record.warehouseStatus.includes('通常出庫') || record.warehouseStatus.includes('返品入庫'))}
        />
      ),
    },
    {
      title: '理由・備考',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
    },
    {
      title: '入出庫登録日付',
      dataIndex: 'slipDate',
      key: 'slipDate',
      width: 130,
      sorter: (a: InventoryItem, b: InventoryItem) => new Date(a.slipDate).getTime() - new Date(b.slipDate).getTime(),
    },
    {
      title: '入出庫登録時刻',
      dataIndex: 'slipTime',
      key: 'slipTime',
      width: 100,
      sorter: (a: InventoryItem, b: InventoryItem) => a.slipTime.localeCompare(b.slipTime),
    },
    {
      title: '登録者',
      dataIndex: 'registrant',
      key: 'registrant',
      width: 110,
    },
    {
      title: '入出庫日',
      dataIndex: 'updateDate',
      key: 'updateDate',
      width: 130,
      sorter: (a: InventoryItem, b: InventoryItem) => new Date(a.updateDate).getTime() - new Date(b.updateDate).getTime(),
    },
    {
      title: '入出庫更新時刻',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 100,
      sorter: (a: InventoryItem, b: InventoryItem) => a.updateTime.localeCompare(b.updateTime),
    },
    {
      title: '更新者',
      dataIndex: 'updater',
      key: 'updater',
      width: 110,
    },
    {
      title: '保存',
      key: 'execute',
      width: 100,
      fixed: 'right',
      render: (_: any, record: InventoryItem) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleSave(record)}
          loading={executingRows[record.id]}
          size="small"
        >
          保存
        </Button>
      ),
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* 検索中オーバーレイ */}
      {searchLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '32px 48px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <Spin size="large" />
            <span style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>検索中...</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>入出庫商品管理</Title>
          <p style={{ color: '#666', margin: 0 }}></p>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>商品名</Text>
            <Input
              placeholder="商品名で絞り込み"
              allowClear
              value={filterProductName}
              onChange={(e) => setFilterProductName(e.target.value)}
              style={{ width: 200 }}
              size="large"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>倉庫</Text>
              <Select
                placeholder="倉庫を選択してください"
                value={filterWarehouse || undefined}
                onChange={setFilterWarehouse}
                style={{ width: 250 }}
                size="large"
                allowClear
                options={warehouses.map((warehouse: any) => ({
                  label: warehouse.name,
                  value: warehouse.code,
                }))}
              />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>入出庫日</Text>
            <Space>
              <RangePicker
                value={filterDateRange}
                onChange={(dates) => setFilterDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                format="YYYY/MM/DD"
                style={{ width: 300 }}
                size="large"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={searchLoading}
              >
                検索
              </Button>
              <Checkbox
                checked={filterOnlyIncomplete}
                onChange={(e) => setFilterOnlyIncomplete(e.target.checked)}
              >
                未完了のみ
              </Checkbox>
            </Space>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} 件`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          rowClassName={(record) => {
            // Check for duplicates (same janCode + snCode) - red background
            const isDuplicate = dataSource.filter(
              (item) => item.janCode === record.janCode && item.snCode === record.snCode 
              && (record.warehouseStatus === '通常入庫' || record.warehouseStatus === '返品入庫') 
              && record.snCode !== ''// snCodeが空のレコードは重複判定から除外(現時点はない)
            ).length > 1;

            // Check if reason has content - yellow background
            const hasReason = !!(record.reason || recordReasons[record.id]);

            // Priority: duplicate (red) > reason (yellow) > out-of-stock > low-stock
            if (isDuplicate) return 'row-duplicate';
            if (hasReason) return 'row-has-reason';
            return '';
          }}
        />
      </Card>

    
      {/* 実行確認モーダル */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined />
            <span>操作実行確認</span>
          </Space>
        }
        open={confirmModalVisible}
        onCancel={handleCancelExecute}
        confirmLoading={confirmLoading}
        onOk={handleConfirmExecute}
        okText="OK"
        cancelText="キャンセル"
        okButtonProps={{ disabled: !confirmReason.trim() }}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="入出庫伝票番号">{confirmRecord?.slipNumber}</Descriptions.Item>
            <Descriptions.Item label="商品名">{confirmRecord?.name}</Descriptions.Item>
            <Descriptions.Item label="操作">{confirmRecord?.warehouseStatus}</Descriptions.Item>
          </Descriptions>
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>理由・備考 <span style={{ color: '#ff4d4f' }}>*</span></div>
          <TextArea
            rows={3}
            value={confirmReason}
            onChange={(e) => setConfirmReason(e.target.value)}
            placeholder="操作理由・備考を入力してください（必須）"
          />
        </div>
      </Modal>

      {/* 仕入先選択モーダル */}
      <Modal
        title="仕入先を選択"
        open={supplierModalVisible}
        onCancel={() => {
          setSupplierModalVisible(false);
          setSupplierModalRecord(null);
        }}
        footer={null}
        width={500}
      >
        <Input
          placeholder="仕入先を検索"
          value={supplierSearchText}
          onChange={(e) => setSupplierSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        {supplierLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
            <div style={{ marginTop: 8, color: '#999' }}>読み込み中...</div>
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {supplierList
              .filter((s) =>
                !supplierSearchText ||
                s.name.includes(supplierSearchText)
              )
              .map((supplier) => (
                <div
                  key={supplier.id}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    marginBottom: 4,
                    border: '1px solid #f0f0f0',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    if (supplierModalRecord) {
                      handleSelectSupplier(supplierModalRecord, { code: supplier.id, name: supplier.name });
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6f7ff';
                    e.currentTarget.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.borderColor = '#f0f0f0';
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{supplier.name}</div>
                </div>
              ))}
            {supplierList.filter((s) =>
              !supplierSearchText ||
              s.name.includes(supplierSearchText)
            ).length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                該当する仕入先が見つかりません
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryList;
