import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Card, Typography, Space, message,
  Switch, Tag,
} from 'antd';
import {
  PlusOutlined, SaveOutlined, RollbackOutlined,
  UserOutlined, ReloadOutlined, PhoneOutlined,
} from '@ant-design/icons';
import { userAPI } from '../../services/api';

const { Title } = Typography;

interface User {
  key: string;
  username: string;
  id: string;
  password: string;
  permission: 'OPERATOR' | 'APPROVER';
  phone: string;
  enabled: boolean;
  isNew?: boolean;
  isEditing?: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // APIからユーザーデータを取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getUsers();
      if (data && Array.isArray(data.data)) {
        setUsers(data.data.map((u: any, index: number) => ({
          key: u.id || String(index),
          username: u.username || '',
          id: u.id || '',
          password: '', // パスワードはAPIから取得しない（セキュリティ上の理由）
          permission: u.permission || 'OPERATOR',
          phone: u.phone ??'',
          enabled: u.enabled ?? true,
        })));
      } else {
        // データがない場合はモックデータを使用
      }
    } catch (error) {
      message.warning('ユーザー取得に失敗しました。', 5);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isEditing = (record: User) => record.key === editingKey;

  // 新規ユーザー行を追加
  const handleAdd = () => {
    // 編集中の行がある場合は追加を禁止
    if (editingKey) {
      message.warning('保存されていない変更があります。先に保存またはキャンセルしてください。', 5);
      return;
    }
    const newKey = Date.now().toString();
    const newUser: User = {
      key: newKey,
      username: '',
      id: '',
      password: '',
      permission: 'OPERATOR',
      phone: '',
      enabled: true,
      isNew: true,
      isEditing: true,
    };
    setUsers([...users, newUser]);
    setEditingKey(newKey);
  };

  // 編集開始（新規行は自動的に編集モード）
  const handleEdit = (record: User) => {
    setEditingKey(record.key);
  };

  // キャンセル（新規行の場合は削除）
  const handleCancel = (key: string) => {
    const user = users.find(u => u.key === key);
    if (user?.isNew) {
      setUsers(users.filter(u => u.key !== key));
    }
    setEditingKey('');
  };

  // ユーザー名の重複チェック
  const checkUsernameDuplicate = (username: string, currentKey: string): boolean => {
    return users.some(u => u.username === username && u.key !== currentKey);
  };

  // 保存（新規作成 or 更新）
  const handleSave = async (key: string) => {
    const user = users.find(u => u.key === key);
    if (!user) return;

    if (!user.username.trim()) {
      message.warning('ユーザー名を入力してください',5);
      return;
    }

    // ユーザー名の重複チェック（自身を除く）
    if (checkUsernameDuplicate(user.username, key)) {
      message.warning('このユーザー名は既に使用されています,別のユーザー名を入力してください',5);
      return;
    }

    if (!user.password.trim()&& user.isNew) {
      message.warning('パスワードを入力してください',5);
      return;
    }

    const userData = {
      username: user.username,
      id: user.id,
      password: user.password,
      permission: user.permission,
      phone: user.phone,
      enabled: user.enabled,
    };

    try {
      if (user.isNew) {
        // 新規作成
        const response = await userAPI.createUser(userData);
        // サーバーから生成されたIDを取得して画面に反映
        const newId = response?.data?.id || response?.id;
        if (newId) {
          setUsers(prev =>
            prev.map(u =>
              u.key === key ? { ...u, id: newId, key: newId, isNew: false } : u
            )
          );
        }
        message.success('ユーザーを作成しました');
      } else {
        // 更新
        await userAPI.updateUser(userData);
        message.success('ユーザーを更新しました');
      }
      setEditingKey('');
      //await fetchUsers();
    } catch (error) {
      message.error('保存失敗しました',5);
    }
  };

  // 有効/無効を切り替え
  const handleToggleEnabled = async (record: User) => {
    // const user = users.find(u => u.key === key);
    if (!record) return;
    try {
      record.enabled = !record.enabled;
      await userAPI.updateUserStatus(record);
      message.info(record.enabled ? 'ユーザーを有効にしました' : 'ユーザーを無効にしました');
      await fetchUsers();
    } catch (error) {
      message.error('ステータスの更新失敗しました',5);
    }
  };

  // フィールド値の更新
  const updateField = (key: string, field: keyof User, value: any) => {
    setUsers(prev =>
      prev.map(u =>
        u.key === key ? { ...u, [field]: value } : u
      )
    );
  };

  const columns = [
    {
      title: 'ユーザー名',
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (_: any, record: User) => {
        if (isEditing(record)) {
          return (
            <Input
              value={record.username}
              onChange={(e) => updateField(record.key, 'username', e.target.value)}
              placeholder="ユーザー名を入力"
              maxLength={20}
              showCount
              style={{ width: 160 }}
            />
          );
        }
        return (
          <span style={{ color: record.enabled ? undefined : '#999' }}>
            {record.username || '-'}
          </span>
        );
      },
    },
    {
      title: 'パスワード',
      dataIndex: 'password',
      key: 'password',
      width: 180,
      render: (_: any, record: User) => {
        if (isEditing(record)) {
          return (
            <Input.Password
              value={record.password}
              onChange={(e) => updateField(record.key, 'password', e.target.value)}
              placeholder="パスワードを入力"
              maxLength={20}
              showCount
              style={{ width: 160 }}
            />
          );
        }
        return record.password ? '••••••••' : '••••••••';
      },
    },
    {
      title: '電話番号',
      dataIndex: 'phone',
      key: 'phone',
      width: 180,
      render: (_: any, record: User) => {
        if (isEditing(record)) {
          return (
            <Input
              value={record.phone}
              onChange={(e) => updateField(record.key, 'phone', e.target.value)}
              placeholder="電話番号を入力"
              prefix={<PhoneOutlined />}
              maxLength={20}
              showCount
              style={{ width: 170 }}
            />
          );
        }
        return record.phone ? (
          <Space>
            <PhoneOutlined style={{ color: record.enabled ? '#1890ff' : '#999' }} />
            <span style={{ color: record.enabled ? undefined : '#999' }}>{record.phone}</span>
          </Space>
        ) : '-';
      },
    },
    {
      title: '権限',
      dataIndex: 'permission',
      key: 'permission',
      width: 130,
      render: (_: any, record: User) => {
        if (isEditing(record)) {
          return (
            <Select
              value={record.permission}
              onChange={(val) => updateField(record.key, 'permission', val)}
              style={{ width: 110 }}
              options={[
                { value: 'OPERATOR', label: 'OPERATOR' },
                { value: 'APPROVER', label: 'APPROVER' },
              ]}
            />
          );
        }
        return (
          <Tag color={record.permission === 'OPERATOR' ? 'blue' : 'purple'}>
            {record.permission}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: User) => {
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
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => handleEdit(record)}
            >
              編集
            </Button>
            <Switch
              checked={record.enabled}
              onChange={(checked) => handleToggleEnabled(record)}
              checkedChildren="有効"
              unCheckedChildren="無効"
              size="small"
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>ユーザー管理</Title>
          <p style={{ color: '#666', margin: 0 }}></p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            ユーザー追加
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="key"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <p>ユーザーが登録されていません</p>
                <p style={{ color: '#999', fontSize: 13 }}>
                  「ユーザー追加」ボタンからユーザーを追加してください
                </p>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default UserManagement;
