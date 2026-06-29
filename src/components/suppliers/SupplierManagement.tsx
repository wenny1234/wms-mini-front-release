import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Card, Typography, Space,
} from 'antd';
import { message } from '../../utils/message';
import {
  PlusOutlined, SaveOutlined, RollbackOutlined,
  ShopOutlined, PhoneOutlined, MailOutlined, SearchOutlined,
} from '@ant-design/icons';
import { supplierAPI } from '../../services/api';

const { Title } = Typography;

// 仕入先データの型定義
interface Supplier {
  key: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  isNew?: boolean;
  isEditing?: boolean;
}

// 仕入先管理コンポーネント
const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');

  // フィルター処理（searchTextで仕入先名をフィルター）
  const getFilteredSuppliers = () => {
    if (!searchText.trim()) return suppliers;
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(searchText.toLowerCase().trim())
    );
  };

  // APIから仕入先データを取得
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierAPI.getSuppliers();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        setSuppliers(data.data.map((item: any, index: number) => ({
          key: item.id || String(index),
          id: item.id,
          name: item.name || '',
          phone: item.phone || '',
          email: item.email || '',
        })));
      } else {
        message.warning('仕入先取得に失敗しました。', 5);
      }
    } catch (error) {
      console.warn('仕入先取得に失敗しました。', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const isEditing = (record: Supplier) => record.key === editingKey;

  // 新規仕入先行を追加
  const handleAdd = () => {
    // 編集中の行がある場合は追加を禁止
    if (editingKey) {
      message.warning('保存されていない変更があります。先に保存またはキャンセルしてください。',5);
      return;
    }
    const newKey = Date.now().toString();
    const newSupplier: Supplier = {
      key: newKey,
      id: '',
      name: '',
      phone: '',
      email: '',
      isNew: true,
      isEditing: true,
    };
    setSuppliers([...suppliers, newSupplier]);
    setEditingKey(newKey);
  };

  // 編集開始（新規行は自動的に編集モード）
  const handleEdit = (record: Supplier) => {
    setEditingKey(record.key);
  };

  // キャンセル（新規行の場合は削除）
  const handleCancel = (key: string) => {
    const supplier = suppliers.find(u => u.key === key);
    if (supplier?.isNew) {
      setSuppliers(suppliers.filter(u => u.key !== key));
    }
    setEditingKey('');
  };

  // 保存（新規作成 or 更新）
  const handleSave = async (key: string) => {
    const supplier = suppliers.find(u => u.key === key);
    if (!supplier) return;

    if (!supplier.name.trim()) {
      message.warning('仕入先名を入力してください',5);
      return;
    }

    // API送信用のデータ整形
    const supplierData = {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
    };

    try {
      if (supplier.isNew) {
        // 新規作成
        const response = await supplierAPI.createSupplier(supplierData);

        // サーバーから生成されたIDを取得して画面に反映
        const newId = response?.data?.id || response?.id;
        if (newId) {
          setSuppliers(prev =>
            prev.map(u =>
              u.key === key ? { ...u, id: newId, key: newId, isNew: false } : u
            )
          );
        }
        message.success('仕入先を作成しました');
      } else {
        // 更新
        await supplierAPI.updateSupplier(supplierData);
        message.success('仕入先を更新しました');
      }
      setEditingKey('');
    } catch (error) {
      message.error('保存失敗しました',5);
    }
  };

  // フィールド値の更新
  const updateField = (key: string, field: keyof Supplier, value: any) => {
    setSuppliers(prev =>
      prev.map(u =>
        u.key === key ? { ...u, [field]: value } : u
      )
    );
  };

  const columns = [
    {
      title: '仕入先名',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_: any, record: Supplier) => {
        if (isEditing(record)) {
          return (
            <Input
              value={record.name}
              onChange={(e) => updateField(record.key, 'name', e.target.value)}
              placeholder="仕入先名を入力"
              maxLength={50}
              showCount
              style={{ width: 200 }}
            />
          );
        }
        return (
          <span>
            {record.name || '-'}
          </span>
        );
      },
    },
    {
      title: '電話番号',
      dataIndex: 'phone',
      key: 'phone',
      width: 200,
      render: (_: any, record: Supplier) => {
        if (isEditing(record)) {
          return (
            <Input
              value={record.phone}
              onChange={(e) => updateField(record.key, 'phone', e.target.value)}
              placeholder="電話番号を入力"
              prefix={<PhoneOutlined />}
              maxLength={20}
              showCount
              style={{ width: 190 }}
            />
          );
        }
        return record.phone ? (
          <Space>
            <PhoneOutlined style={{ color: '#1890ff' }} />
            <span>{record.phone}</span>
          </Space>
        ) : '-';
      },
    },
    {
      title: 'メールアドレス',
      dataIndex: 'email',
      key: 'email',
      width: 280,
      render: (_: any, record: Supplier) => {
        if (isEditing(record)) {
          return (
            <Input
              value={record.email}
              onChange={(e) => updateField(record.key, 'email', e.target.value)}
              placeholder="メールアドレスを入力"
              prefix={<MailOutlined />}
              maxLength={50}
              showCount
              style={{ width: 260 }}
            />
          );
        }
        return record.email ? (
          <Space>
            <MailOutlined style={{ color: '#1890ff' }} />
            <span>{record.email}</span>
          </Space>
        ) : '-';
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: Supplier) => {
        if (isEditing(record)) {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => handleSave(record.key)}
              >
                保存
              </Button>
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => handleCancel(record.key)}
              >
                キャンセル
              </Button>
            </Space>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            編集
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>仕入先管理</Title>
          <p style={{ color: '#666', margin: 0 }}></p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            仕入先追加
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="仕入先名で検索"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredSuppliers()}
          rowKey="key"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <ShopOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <p>仕入先が登録されていません</p>
                <p style={{ color: '#999', fontSize: 13 }}>
                  「仕入先追加」ボタンから仕入先を追加してください
                </p>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default SupplierManagement;
