import React, { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Radio,
  Input,
  Statistic,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  BarcodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { message } from '../../utils/message';

const { Title, Text } = Typography;

// バーコード生成ロジック
const generateBarcode = (index: number): string => {
  const now = new Date();

  // 日付(8桁): YYYYMMDD
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  // 時間(6桁): HHmmss
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const timePart = `${hours}${minutes}${seconds}`;

  // 連番(3桁): 001～
  const seqPart = (index + 1).toString().padStart(3, '0');

  return `${datePart}${timePart}${seqPart}`;
};

// バーコードをSVGとして描画（JsBarcode使用）
const BarcodeImage: React.FC<{ code: string; width?: number; height?: number }> = ({
  code,
  width = 280,
  height = 80,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, code, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          textMargin: 4,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [code]);

  return <svg ref={svgRef} style={{ width, height }} />;
};

// チェックディジット計算
const calculateCheckDigit = (code: string): string => {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i], 10);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      sum += digit * 3;
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
};

const BarcodeGenerator: React.FC = () => {
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [count, setCount] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // バーコード生成
  const handleGenerate = () => {
    setLoading(true);

    setTimeout(() => {
      const newBarcodes: string[] = [];
      for (let i = 0; i < count; i++) {
        newBarcodes.push(generateBarcode(i));
      }
      setBarcodes(newBarcodes);
      setLoading(false);
      message.success(`${count}件のバーコードを生成しました`);
    }, 300);
  };

  // 1件コピー
  const handleCopy = async (barcode: string) => {
    try {
      await navigator.clipboard.writeText(barcode);
      message.success(`コピーしました: ${barcode}`);
    } catch {
      message.error('コピーに失敗しました',5);
    }
  };

  // CSVダウンロード
  const handleDownloadCSV = () => {
    if (barcodes.length === 0) {
      message.warning('バーコードを先に生成してください',5);
      return;
    }

    const header = 'No,バーコード,チェックディジット';
    const rows = barcodes.map((code, index) => {
      const checkDigit = calculateCheckDigit(code);
      return `${index + 1},${code},${checkDigit}`;
    });
    const csv = [header, ...rows].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcodes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('CSVファイルをダウンロードしました');
  };

  // 印刷
  const handlePrint = () => {
    if (barcodes.length === 0) {
      message.warning('バーコードを先に生成してください',5);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('ポップアップがブロックされました。ポップアップを許可してください。',5);
      return;
    }

    const barcodeRows = barcodes.map((code) => {
      return `
        <div class="barcode-item">
          <svg class="barcode-svg" data-code="${code}"></svg>
          <div class="barcode-label">${code}</div>
        </div>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>バーコード印刷</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <style>
          @media print {
            @page { margin: 8mm; }
          }
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
          .barcode-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .barcode-item {
            border: 1px dashed #ccc;
            padding: 6px;
            text-align: center;
            page-break-inside: avoid;
            border-radius: 4px;
          }
          .barcode-item svg {
            max-width: 100%;
            height: auto;
          }
          .barcode-label {
            font-size: 10px;
            color: #333;
            margin-top: 2px;
            letter-spacing: 1px;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
          }
          .header h1 { font-size: 16px; margin: 0; }
          .header p { font-size: 11px; color: #666; margin: 2px 0 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>バーコード一覧</h1>
          <p>生成日時: ${new Date().toLocaleString('ja-JP')} | 全${barcodes.length}件</p>
        </div>
        <div class="barcode-grid">
          ${barcodeRows}
        </div>
        <script>
          function renderBarcodes() {
            var svgs = document.querySelectorAll('.barcode-svg');
            var remaining = svgs.length;
            svgs.forEach(function(svg) {
              try {
                JsBarcode(svg, svg.getAttribute('data-code'), {
                  format: 'CODE128',
                  width: 1.5,
                  height: 30,
                  displayValue: true,
                  fontSize: 10,
                  font: 'monospace',
                  textMargin: 2,
                  margin: 4,
                  background: '#ffffff',
                  lineColor: '#000000',
                });
              } catch(e) {
                console.error(e);
              }
              remaining--;
              if (remaining === 0) {
                setTimeout(function() { window.print(); window.close(); }, 300);
              }
            });
          }
          if (document.readyState === 'complete') {
            renderBarcodes();
          } else {
            window.onload = renderBarcodes;
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const countOptions = [
    { value: 30, label: '30件' },
    { value: 50, label: '50件' },
    { value: 100, label: '100件' },
  ];

  const columns = [
    {
      title: 'No.',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Text strong>{index + 1}</Text>
      ),
    },
    {
      title: 'バーコードイメージ',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 350,
      render: (barcode: string) => (
        <BarcodeImage code={barcode} width={280} height={80} />
      ),
    },
    {
      title: 'バーコード番号',
      dataIndex: 'barcode',
      key: 'barcodeNumber',
      width: 200,
      render: (barcode: string) => (
        <Text
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 16,
            fontWeight: 'bold',
            letterSpacing: 2,
          }}
          copyable={{
            text: barcode,
            onCopy: () => message.success(`コピーしました: ${barcode}`),
          }}
        >
          {barcode}
        </Text>
      ),
    },
    {
      title: 'フォーマット',
      key: 'format',
      width: 240,
      render: (_: any, __: any, index: number) => {
        const code = barcodes[index];
        return (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {code.slice(0, 8)}-{code.slice(8, 14)}-{code.slice(14, 17)}
            {' ('}日付{'-'}時間{'-'}連番{')'}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: { barcode: string }) => (
        <Tooltip title="番号をコピー">
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record.barcode)}
            size="small"
          />
        </Tooltip>
      ),
    },
  ];

  // バーコードデータをテーブル用に変換
  const tableData = barcodes.map((code) => ({
    key: code,
    barcode: code,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>バーコード生成</Title>
        </div>
      </div>

      {/* 生成設定 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={12}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                生成件数
              </Text>
              <Radio.Group
                value={count}
                onChange={(e) => setCount(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="large"
              >
                {countOptions.map((opt) => (
                  <Radio.Button key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'flex-end', height: '100%' }}>
              <Button
                type="primary"
                icon={<BarcodeOutlined />}
                onClick={handleGenerate}
                loading={loading}
                size="large"
              >
                {barcodes.length > 0 ? '再生成' : '生成'}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 生成結果 */}
      {barcodes.length > 0 && (
        <>
          {/* サマリー */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={24} md={24}>
              <Card>
                <Statistic
                  title="生成日時"
                  value={new Date().toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                  valueStyle={{ fontSize: 16, color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* アクションボタン */}
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadCSV}
              >
                CSVダウンロード
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                印刷
              </Button>
            </Space>
          </div>
        </>
      )}
      {/* 未生成時のメッセージ */}
      {barcodes.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BarcodeOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={4} type="secondary" style={{ marginTop: 16 }}>
              バーコードを生成してください
            </Title>
            <Text type="secondary">
              上部の「生成件数」を選択して「生成」ボタンをクリックすると、
              17桁のバーコードイメージが自動生成されます。
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BarcodeGenerator;
