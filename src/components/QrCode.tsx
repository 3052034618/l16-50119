import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardBody } from './ui/Card';
import { QrCode, Download, Printer } from 'lucide-react';
import Button from './ui/Button';
import { useRef } from 'react';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  showActions?: boolean;
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
}

export function QrCodeDisplay({
  value,
  size = 180,
  label,
  showActions = true,
  includeMargin = true,
  bgColor = '#ffffff',
  fgColor = '#1B5E20',
}: QrCodeDisplayProps) {
  const svgRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `溯源码_${value.slice(-8)}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    printWindow.document.write(`
      <html>
        <head>
          <title>溯源码打印 - ${label || value}</title>
          <style>
            body { font-family: 'Noto Sans SC', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; }
            .qr-container { text-align: center; }
            h2 { color: #1B5E20; margin-bottom: 20px; }
            .label { margin-top: 16px; font-size: 14px; color: #374151; word-break: break-all; }
            .code { margin-top: 8px; font-size: 12px; color: #6B7280; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${label || '产品溯源码'}</h2>
            <div style="width:${size}px;height:${size}px;">${svgData}</div>
            <div class="label">${label || ''}</div>
            <div class="code">${value}</div>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="w-full">
      <CardHeader divider>
        <CardTitle icon={<QrCode size={20} />}>溯源码</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col items-center">
          <div
            ref={svgRef}
            className="p-3 bg-white rounded-lg border border-brand-100"
            style={{ boxShadow: '0 2px 8px rgba(27, 94, 32, 0.08)' }}
          >
            <QRCodeSVG
              value={value}
              size={size}
              level="H"
              includeMargin={includeMargin}
              bgColor={bgColor}
              fgColor={fgColor}
            />
          </div>
          {label && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="mt-1 text-xs text-gray-500 font-mono">{value}</p>
            </div>
          )}
          {showActions && (
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={handleDownload}>
                下载
              </Button>
              <Button variant="primary" size="sm" icon={<Printer size={16} />} onClick={handlePrint}>
                打印
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function QrCodeSmall({ value, size = 100 }: { value: string; size?: number }) {
  return (
    <div className="inline-block p-1.5 bg-white rounded border border-brand-100">
      <QRCodeCanvas value={value} size={size} level="M" fgColor="#1B5E20" />
    </div>
  );
}

export default QrCodeDisplay;
