import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportBlock, TemplateConfig } from './reportTypes';

const SAMPLE_DATA: Record<string, string> = {
  '{{applicant_name}}': 'Rajesh Kumar Sharma',
  '{{application_number}}': 'APP-2026-001234',
  '{{loan_number}}': 'LN-2026-5678',
  '{{address}}': '42, Sector 15, Noida, UP 201301',
  '{{pincode}}': '201301',
  '{{client_name}}': 'HDFC Bank Ltd',
  '{{client_code}}': 'HDFC',
  '{{product_name}}': 'Home Loan',
  '{{branch_name}}': 'Noida Branch',
  '{{verification_type}}': 'Field Investigation',
  '{{verification_date}}': '23-Mar-2026',
  '{{verifier_name}}': 'Amit Verma',
  '{{verifier_code}}': 'FE-0042',
  '{{task_number}}': 'TASK-000123',
  '{{lead_number}}': 'RCU-000456',
  '{{status}}': 'Completed',
  '{{remarks}}': 'Applicant was present at the address. Property verified as per documents. Locality is residential with good connectivity.',
  '{{qc_remarks}}': 'Verified and approved.',
  '{{geo_coordinates}}': '28.5855° N, 77.3100° E',
  '{{report_date}}': '23-Mar-2026 14:30',
  '{{sla_deadline}}': '24-Mar-2026 18:00',
  '{{applicant_phone}}': '+91 98765 43210',
  '{{employer_name}}': 'TCS Limited',
  '{{designation}}': 'Software Engineer',
  '{{pan_number}}': 'ABCDE1234F',
};

function resolve(text: string): string {
  if (!text) return '';
  return text.replace(/\{\{[^}]+\}\}/g, match => SAMPLE_DATA[match] || match);
}

function renderBlockHtml(block: ReportBlock): string {
  const c = block.config;
  switch (block.type) {
    case 'header':
      return `<div style="border-bottom:3px solid #2563eb;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:20px;font-weight:700;color:#2563eb">${resolve(c.title || '')}</div>
          ${c.subtitle ? `<div style="font-size:13px;color:#666">${resolve(c.subtitle)}</div>` : ''}
        </div>
        ${c.showDate ? `<div style="font-size:11px;color:#666">${resolve('{{report_date}}')}</div>` : ''}
      </div>`;

    case 'client_logo':
      return `<div style="text-align:${c.position || 'center'};margin:8px 0">
        <div style="display:inline-block;width:${c.width || 120}px;height:${c.height || 60}px;border:1px dashed #ccc;line-height:${c.height || 60}px;text-align:center;color:#999;font-size:11px">Client Logo</div>
      </div>`;

    case 'section_title':
      return `<div style="margin:14px 0 8px;text-align:${c.align || 'left'}">
        <div style="font-size:14px;font-weight:600;color:#1e293b">${resolve(c.title || '')}</div>
        ${c.showDivider ? '<hr style="border:none;border-top:1px solid #e2e8f0;margin-top:4px"/>' : ''}
      </div>`;

    case 'key_value_table': {
      const cols = c.columns || 2;
      const fields = c.fields || [];
      let rows = '';
      for (let i = 0; i < fields.length; i += cols) {
        rows += '<tr>';
        for (let j = 0; j < cols; j++) {
          const f = fields[i + j];
          if (f) {
            rows += `<td style="padding:4px 8px;font-weight:600;color:#475569;background:#f8fafc;font-size:11px;width:${100 / (cols * 2)}%;border:1px solid #e2e8f0">${f.label}</td>`;
            rows += `<td style="padding:4px 8px;font-size:11px;width:${100 / (cols * 2)}%;border:1px solid #e2e8f0">${resolve(f.field)}</td>`;
          } else {
            rows += '<td style="border:1px solid #e2e8f0" colspan="2"></td>';
          }
        }
        rows += '</tr>';
      }
      return `${c.title ? `<div style="font-size:12px;font-weight:600;margin-bottom:4px">${c.title}</div>` : ''}
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px">${rows}</table>`;
    }

    case 'data_table': {
      const headers = (c.headers || []).map((h: string) => `<th style="padding:4px 8px;background:#f8fafc;font-size:11px;font-weight:600;border:1px solid #e2e8f0;text-align:left">${h}</th>`).join('');
      const sampleRows = [
        ['1', 'Address confirmed', 'Yes'],
        ['2', 'Applicant met personally', 'Yes'],
        ['3', 'Neighbourhood check done', 'Positive'],
      ];
      const rows = sampleRows.map(r =>
        `<tr>${r.map(cell => `<td style="padding:4px 8px;font-size:11px;border:1px solid #e2e8f0">${cell}</td>`).join('')}</tr>`
      ).join('');
      return `${c.title ? `<div style="font-size:12px;font-weight:600;margin-bottom:4px">${c.title}</div>` : ''}
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px"><tr>${headers}</tr>${rows}</table>`;
    }

    case 'text_block':
      return `<div style="padding:10px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px;font-size:${c.fontSize || 12}px;margin:6px 0;line-height:1.5">
        ${c.field ? resolve(c.field) : (c.content || '<em style="color:#999">No content</em>')}
      </div>`;

    case 'photo_grid': {
      const cols = c.columns || 3;
      const photos = Array(Math.min(cols * 2, 6)).fill(null);
      const items = photos.map((_, i) => `
        <div style="border:1px solid #e2e8f0;border-radius:4px;overflow:hidden">
          <div style="width:100%;height:80px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px">Photo ${i + 1}</div>
          ${c.showCaptions ? `<div style="padding:3px 6px;font-size:9px;color:#666">Evidence photo ${i + 1}</div>` : ''}
          ${c.showGeoTag ? `<div style="padding:0 6px 3px;font-size:8px;color:#999">28.58°N, 77.31°E</div>` : ''}
        </div>`).join('');
      return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin:8px 0">${items}</div>`;
    }

    case 'signature_block': {
      const sigs = (c.signatures || []).map((s: any) => `
        <div style="text-align:center;flex:1">
          <div style="border-bottom:1px solid #333;width:120px;margin:0 auto 4px;height:40px"></div>
          <div style="font-size:11px;font-weight:600">${resolve(s.name || '')}</div>
          <div style="font-size:10px;color:#666">${s.designation || ''}</div>
          <div style="font-size:9px;color:#999">${s.label || ''}</div>
        </div>`).join('');
      return `<div style="display:flex;justify-content:space-around;margin:20px 0">${sigs}</div>`;
    }

    case 'spacer':
      return `<div style="height:${c.height || 20}px"></div>`;

    case 'divider':
      return `<hr style="border:none;border-top:${c.thickness || 1}px ${c.style || 'solid'} ${c.color || '#e2e8f0'};margin:10px 0"/>`;

    default:
      return '';
  }
}

interface Props {
  config: TemplateConfig;
}

export default function ReportPreview({ config }: Props) {
  const html = useMemo(() => {
    return config.blocks.map(renderBlockHtml).join('');
  }, [config]);

  return (
    <Card className="sticky top-4">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="bg-white border-t overflow-auto"
          style={{
            maxHeight: 'calc(100vh - 220px)',
            padding: `${config.margins?.top || 40}px ${config.margins?.right || 30}px ${config.margins?.bottom || 40}px ${config.margins?.left || 30}px`,
          }}
        >
          <div
            className="text-foreground"
            style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", color: '#333' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
