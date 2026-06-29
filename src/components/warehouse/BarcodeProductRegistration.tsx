import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, InputNumber, Select, Button, Card, Typography,
  Table, Space, Tag, Modal, Popconfirm, Collapse
} from 'antd';
import { message } from '../../utils/message';
import {
  BarcodeOutlined, ScanOutlined, SaveOutlined, ArrowLeftOutlined,
  DeleteOutlined, PlusOutlined, MinusCircleOutlined,
  ImportOutlined, ExportOutlined, RollbackOutlined,
  SwapOutlined, AuditOutlined
} from '@ant-design/icons';
import { productAPI, wareHouseAPI } from '../../services/api';

const { Title, Text } = Typography;

// 明細行の型定義
interface DetailItem {
  key: string;
  barcode: string;
  janCode: string;
  productName: string;
  operation: string;
  operationCode: string;
  warehouseCode: string;
  warehouse: string;
  moveWarehouseCode: string;
  moveWarehouse: string;
  quantity: number;
}

// 商品情報の型定義
interface HeaderInfo {
  barcode: string;
  productName: string;
}

type OperationType = '01' | '02' | '03' | '04' | '05' | '06' | '07';

const operationList: { value: OperationType; label: string; icon: React.ReactNode }[] = [
  { value: '01', label: '通常入庫', icon: <ImportOutlined /> },
  { value: '02', label: '通常出庫', icon: <ExportOutlined /> },
  { value: '03', label: '返品入庫', icon: <RollbackOutlined /> },
  { value: '04', label: '在庫移動', icon: <SwapOutlined /> },
  { value: '06', label: '棚卸差異入庫', icon: <AuditOutlined /> },// DBコードは06にしているが，画面の並び順と合わせて
  { value: '05', label: '棚卸差異出庫', icon: <AuditOutlined /> },
  { value: '07', label: '廃棄出庫', icon: <DeleteOutlined /> },
];

const BarcodeProductRegistration: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [headerBarcode, setHeaderBarcode] = useState('');
  const [detailBarcode, setDetailBarcode] = useState('');
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [headerInfo, setHeaderInfo] = useState<HeaderInfo | null>(null);
  const [headerScanned, setHeaderScanned] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('0010');
  const [selectedMoveWarehouse, setSelectedMoveWarehouse] = useState<string>('0010');
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>('01');
  const [tmpProductName, setTmpProductName] = useState<string>('');
  const [headerErrorMessage, setHeaderErrorMessage] = useState<string>('');

  const headerInputRef = useRef<any>(null);
  const detailInputRef = useRef<any>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const warehouses = JSON.parse(sessionStorage.getItem('warehouses') || '[]');

  // 初期フォーカス
  useEffect(() => {
    if (headerInputRef.current) {
      headerInputRef.current.focus();
    }
  }, []);

  // 明細入力にフォーカスを移動
  useEffect(() => {
    if (headerScanned && detailInputRef.current) {
      detailInputRef.current.focus();
    }
  }, [headerScanned]);

  // 明細追加時にテーブルを最後の行までスクロール
  useEffect(() => {
    if (tableContainerRef.current && details.length > 5) {
      setTimeout(() => {
        const tbody = tableContainerRef.current?.querySelector('.ant-table-tbody');
        if (tbody) {
          tbody.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [details.length]);

  // JANコードをスキャン/入力
  const handleHeaderBarcodeSubmit = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      message.warning('JANコードを入力してください',5);
      return;
    }

    // エラーメッセージをクリア（検索開始時）
    setHeaderErrorMessage('');

    setLoading(true);
    try {
      // getProductByBarcodeで商品データを取得
      const result = await productAPI.getProductByBarcode(trimmed);

      if (result && result.data && result.data.name) {
        const productName = result.data.name || '';
        setTmpProductName(productName);
        setHeaderInfo({
          barcode: trimmed,
          productName: productName,
        });
        setHeaderScanned(true);
        setHeaderErrorMessage('');

        // 明細入力にフォーカス移動
        setTimeout(() => {
          if (detailInputRef.current) {
            detailInputRef.current.focus();
          }
        }, 100);
      } else {
        // エラー時も手動入力可能にする
        setTmpProductName('');
        setHeaderInfo({
          barcode: trimmed,
          productName: '',
        });
        setHeaderScanned(false);
        const errMsg = `'JANコードの読み取りに失敗しました`;
        setHeaderErrorMessage(errMsg);
        message.warning(errMsg, 5 );
        // フォーカスをJANコード入力欄に戻す（setTimeoutでstate更新後の再描画を待つ）
        setTimeout(() => {
          headerInputRef.current?.focus();
        }, 100);
      }
    } catch (error: any) {
      console.error('Header scan error:', error);
      // エラー時も手動入力可能にする
      setTmpProductName('');
      setHeaderInfo({
        barcode: trimmed,
        productName: '',
      });
      setHeaderScanned(false);
      setHeaderErrorMessage(error.response?.data?.message || 'JANコードの読み取りに失敗しました');
      message.error(error.response?.data?.message || 'JANコードの読み取りに失敗しました',5);
      // フォーカスをJANコード入力欄に戻す（setTimeoutでstate更新後の再描画を待つ）
      setTimeout(() => {
        headerInputRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // 明細SNコードをスキャン/入力
  const handleDetailBarcodeSubmit = async (barcode: string) => {

    const trimmed = barcode.trim();
    if (!trimmed) {
      message.warning('SNコードを入力してください',5);
      return;
    }

    // 在庫移動の場合、倉庫と移動先倉庫が同じであってはならない
    if (selectedWarehouse === selectedMoveWarehouse && selectedOperation === '04') {
      message.warning(`在庫移動の場合、倉庫と移動先倉庫は異なるものを選択してください。`,5);
      return;
    }

    // SNコード重複チェック
    const existing = details.find(d => d.barcode === trimmed);

    if (existing && trimmed !== '') {
      message.warning(`スキャンした商品は既に追加されています。`,5);
      return;
    }

    const countUp = details.find(d => d.janCode === headerInfo?.barcode && d.barcode === trimmed);

    if (existing && countUp) {
      if (trimmed === '') {　//現時点はありえないかもしれないが、万が一JANコードもSNコードも両方同じものがあった場合は数量を+1する
        // 既存の明細があれば数量を+1
        setDetails(prev =>
          prev.map(d =>
            (d.janCode === headerInfo?.barcode && d.barcode === trimmed)
              ? { ...d, quantity: d.quantity + 1 }
              : d
          )
        );
        if (countUp) {
          message.info(`既存明細の数量を+1しました。`);
        }
      } else {
      }

    } else {
      // 新規明細を追加（
      const newDetail: DetailItem = {
        key: Date.now().toString(),
        barcode: trimmed,
        janCode: headerInfo?.barcode || '',
        productName: tmpProductName || '',
        operationCode: selectedOperation || '01',
        operation: getOperationLabel(selectedOperation || '01'),
        warehouseCode: selectedWarehouse,
        warehouse: getWarehouseName(selectedWarehouse),
        moveWarehouseCode: selectedOperation === '04' ? selectedMoveWarehouse : '',
        moveWarehouse: selectedOperation === '04' ? getWarehouseName(selectedMoveWarehouse) : '',
        quantity: 1,
      };

      setDetails(prev => [...prev, newDetail]);

    }
    // 明細追加後、JANコード入力状態に戻す
    setHeaderInfo(null);
    setTmpProductName('');
    setDetailBarcode('');
    setHeaderScanned(false);
    setHeaderBarcode('');
    // フォーカスをJANコード入力欄に戻す（setTimeoutでstate更新後の再描画を待つ）
    setTimeout(() => {
      headerInputRef.current?.focus();
    }, 100);
  };

  // 明細削除
  const handleDeleteDetail = (key: string) => {
    setDetails(prev => prev.filter(d => d.key !== key));
    message.info('明細を削除しました');
  };

  // 明細の数量変更
  const handleQuantityChange = (key: string, value: number | null) => {
    setDetails(prev =>
      prev.map(d =>
        d.key === key
          ? { ...d, quantity: value || 0 }
          : d
      )
    );
  };

  // 倉庫変更処理
  const handleWarehouseChange = (value: string) => {
    // 明細が存在する場合は確認ポップアップを表示
    if (details.length > 0 && value !== selectedWarehouse) {
      Modal.confirm({
        title: '倉庫の変更',
        content: '倉庫を変更すると、入力中の明細がすべてクリアされます。よろしいですか？',
        okText: 'OK',
        cancelText: 'キャンセル',
        onOk: () => {
          setDetails([]);
          setSelectedWarehouse(value);
          setHeaderScanned(false);
          setHeaderInfo(null);
          setHeaderBarcode('');
          setDetailBarcode('');
          setTmpProductName('');
          setHeaderErrorMessage('');
          form.resetFields();
          if (headerInputRef.current) {
            headerInputRef.current.focus();
          }
        },
      });
    } else {
      setSelectedWarehouse(value);
    }
  };

  // 移動先倉庫変更処理
  const handleMoveWarehouseChange = (value: string) => {
    // 明細が存在する場合は確認ポップアップを表示
    if (details.length > 0 && value !== selectedMoveWarehouse) {
      Modal.confirm({
        title: '移動先倉庫の変更',
        content: '移動先倉庫を変更すると、入力中の明細がすべてクリアされます。よろしいですか？',
        okText: 'OK',
        cancelText: 'キャンセル',
        onOk: () => {
          setDetails([]);
          setSelectedMoveWarehouse(value);
          setHeaderScanned(false);
          setHeaderInfo(null);
          setHeaderBarcode('');
          setDetailBarcode('');
          setTmpProductName('');
          setHeaderErrorMessage('');
          form.resetFields();
          if (headerInputRef.current) {
            headerInputRef.current.focus();
          }
        },
      });
    } else {
      setSelectedMoveWarehouse(value);
    }
  };

  // 操作ボタンクリック処理
  const handleOperationClick = (operation: OperationType) => {
    // 同じボタンが押されたら選択解除（トグル）、ただし「通常入庫」はデフォルトなので再選択可能にする
    const newOperation = (selectedOperation === operation) ? '01' : operation;

    // 明細が存在する場合は確認ポップアップを表示
    if (details.length > 0) {
      Modal.confirm({
        title: '入出庫処理の変更',
        content: '入出庫処理を変更すると、入力中の明細がすべてクリアされます。よろしいですか？',
        okText: 'OK',
        cancelText: 'キャンセル',
        onOk: () => {
          // 明細をクリアしてから操作を切り替え
          setDetails([]);
          setSelectedOperation(newOperation);
          setHeaderScanned(false);
          setHeaderInfo(null);
          setHeaderBarcode('');
          setDetailBarcode('');
          setTmpProductName('');
          setHeaderErrorMessage('');
          form.resetFields();
          if (headerInputRef.current) {
            headerInputRef.current.focus();
          }
        },
      });
    } else {
      setSelectedOperation(newOperation);
    }
  };

  // 登録処理（確認後実行）
  const doSave = async () => {
    try {
      setSaving(true);

      // 明細一覧のJANコードとSNコードを送信
      const data = {
        items: details.map(d => ({
          operationType: d.operationCode,
          janCode: d.janCode,
          snCode: d.barcode,
          warehouse: d.warehouseCode,
          moveWarehouse: d.moveWarehouseCode,
          quantity: d.quantity,
        })),
      };

      await wareHouseAPI.CreateData(data);
      message.success('登録が完了しました');
      setHeaderScanned(false);
      setHeaderInfo(null);
      setDetails([]);
      setHeaderBarcode('');
      setDetailBarcode('');
      setSelectedOperation('01');
      form.resetFields();
      if (headerInputRef.current) {
        headerInputRef.current.focus();
      }
      setHeaderErrorMessage('');
    } catch (error: any) {
      message.error(error?.response?.data?.message || '入出庫登録に失敗しました', 5);
      setHeaderErrorMessage(error?.response?.data?.message || '入出庫登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 商品登録確認ポップアップ
  const handleSave = () => {
    Modal.confirm({
      title: '商品登録確認',
      content: `選択した商品を登録しますか？（明細数: ${details.length}件）`,
      okText: '登録',
      cancelText: 'キャンセル',
      onOk: doSave,
    });
  };

  // リセット（最初からやり直し）
  const handleReset = () => {
    Modal.confirm({
      title: '入力をリセットしますか？',
      content: '入力したすべての情報がクリアされます。',
      okText: 'リセット',
      cancelText: 'キャンセル',
      onOk: () => {
        setHeaderScanned(false);
        setHeaderInfo(null);
        setDetails([]);
        setHeaderBarcode('');
        setDetailBarcode('');
        setSelectedOperation('01');
        form.resetFields();
        setHeaderErrorMessage('');
        message.info('入力をリセットしました');
        if (headerInputRef.current) {
          headerInputRef.current.focus();
        }
      },
    });
  };

  // 倉庫コードから名称を取得
  const getWarehouseName = (code: string) => {
    const warehouse = warehouses.find((w: any) => w.code === code);
    return warehouse ? warehouse.name : code;
  };

  // 操作コードからラベルを取得
  const getOperationLabel = (code: OperationType) => {
    const op = operationList.find(o => o.value === code);
    return op ? op.label : code;
  };

  // 明細テーブルのカラム定義
  const detailColumns = [
    {
      title: 'No.',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'JANコード',
      dataIndex: 'janCode',
      key: 'janCode',
      width: 200,
    },
    {
      title: 'SNコード',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 200,
    },
    {
      title: '商品名',
      dataIndex: 'productName',
      key: 'productName',
      width: 350,
    },
    {
      title: '入出庫処理',
      dataIndex: 'operation',
      key: 'operation',
      width: 180,
      render: (operation: string) => <Tag color="blue">{operation}</Tag>,
    },
    {
      title: '倉庫',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 180,
    },
    {
      title: '移動先倉庫',
      dataIndex: 'moveWarehouse',
      key: 'moveWarehouse',
      width: 180,

    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value: number, record: DetailItem) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleQuantityChange(record.key, val)}
          style={{ width: 80 }}
          disabled={true}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: DetailItem) => (
        <Popconfirm
          title="この明細を削除しますか？"
          onConfirm={() => handleDeleteDetail(record.key)}
          okText="削除"
          cancelText="キャンセル"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <Title level={2}>入出庫登録</Title>
          <p style={{ color: '#666', margin: 0 }}>
          </p>
        </div>
      </div>

      {/* 倉庫・入出庫処理エリア */}
      <Card style={{ marginBottom: 8 }}>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>入出庫処理</Text>
          <Space size={8} wrap>
            {operationList.map((op) => {
              const isSelected = selectedOperation === op.value;
              return (
                <Button
                  key={op.value}
                  icon={op.icon}
                  size="large"
                  onClick={() => handleOperationClick(op.value)}
                  style={{
                    backgroundColor: isSelected ? '#52c41a' : undefined,
                    borderColor: isSelected ? '#52c41a' : undefined,
                    color: isSelected ? '#fff' : undefined,
                  }}
                >
                  {op.label}
                </Button>
              );
            })}
          </Space>
        </div>

        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <Space size={24}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>倉庫</Text>
              <Select
                placeholder="倉庫を選択してください"
                value={selectedWarehouse}
                onChange={handleWarehouseChange}
                disabled={saving}
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
            {selectedOperation === '04' && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  移動先倉庫
                </Text>
                <Select
                  placeholder="移動先倉庫を選択してください"
                  value={selectedMoveWarehouse}
                  onChange={handleMoveWarehouseChange}
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
            )}
          </Space>
        </div>

      </Card>

      {/* 商品情報エリア */}
      <Collapse
        defaultActiveKey={['1']}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: '1',
            label: (
              <Space>
                <BarcodeOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                <span>バーコードをスキャンしてください。（手動入力の場合はEnterで追加）</span>
                {headerScanned && (
                  <Tag color="blue">JANコードスキャン済</Tag>
                )}
              </Space>
            ),
            children: (
              <div>
                {/* JANコード入力 */}
                <div style={{ marginBottom: 16 }}>
                  <Space style={{ width: '100%' }}>
                    <Input
                      ref={headerInputRef}
                      prefix={<BarcodeOutlined />}
                      placeholder="JANコード（手動入力の場合はEnterで追加）"
                      value={headerBarcode}
                      onChange={(e) => setHeaderBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleHeaderBarcodeSubmit(headerBarcode);
                        }
                      }}
                      disabled={headerScanned || loading}
                      style={{ width: 400 }}
                      size="large"
                    />
                    <Input
                      ref={detailInputRef}
                      prefix={<BarcodeOutlined />}
                      placeholder="SNコード（手動入力の場合はEnterで追加）"
                      value={detailBarcode}
                      onChange={(e) => setDetailBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDetailBarcodeSubmit(detailBarcode);
                        }
                      }}
                      disabled={!headerScanned || saving}
                      style={{ width: 400 }}
                      size="large"
                    />
                    {headerErrorMessage && (
                      <Text type="danger" style={{ fontSize: 14, fontWeight: 'bold', lineHeight: '40px' }}>
                        {headerErrorMessage}
                      </Text>
                    )}
                  </Space>
                </div>
                {/* 明細SNコード入力 */}
                <div style={{ marginBottom: 16 }}>
                  <Space style={{ width: '100%' }}>

                  </Space>
                </div>
                
              </div>
            ),
          },
        ]}
      />

      {/* 明細入力エリア */}
      <Collapse
        defaultActiveKey={['2']}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: '2',
            label: (
              <Space>
                <ScanOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                <span>商品明細一覧</span>
                {details.length > 0 && (
                  <Tag color="green">{details.length}件</Tag>
                )}
              </Space>
            ),
            children: (
              <div ref={tableContainerRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
                {/* 明細テーブル */}
                <Table
                  dataSource={details}
                  columns={detailColumns}
                  pagination={false}
                  rowKey="key"
                  locale={{
                    emptyText: '明細がありません。スキャンして追加してください。',
                  }}
                  style={{ marginTop: 8 }}
                  scroll={{ y: 250 }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* アクションボタン */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handleReset}
          size="large"
        >
          リセット
        </Button>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            size="large"
            disabled={details.length === 0}
          >
            登録</Button>
        </Space>
      </div>
    </div>
  );
};

export default BarcodeProductRegistration;
