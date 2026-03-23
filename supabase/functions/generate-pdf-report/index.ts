import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportBlock {
  id: string;
  type: string;
  config: Record<string, any>;
}

interface TemplateConfig {
  pageSize?: string;
  orientation?: string;
  margins?: { top: number; right: number; bottom: number; left: number };
  blocks?: ReportBlock[];
}

// Resolve {{field}} placeholders from context data
function resolveField(text: string, ctx: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => ctx[key.trim()] || 'N/A');
}

// Build context from report/task/lead/client data
function buildContext(report: any, task: any, lead: any, client: any): Record<string, string> {
  return {
    applicant_name: lead?.applicant_name || 'N/A',
    application_number: lead?.application_number || 'N/A',
    loan_number: lead?.loan_number || 'N/A',
    address: lead?.address || 'N/A',
    pincode: lead?.pincode || 'N/A',
    client_name: client?.name || 'N/A',
    client_code: client?.code || 'N/A',
    product_name: 'N/A',
    branch_name: 'N/A',
    verification_type: task?.verification_type || 'N/A',
    verification_date: task?.completed_at ? new Date(task.completed_at).toLocaleDateString('en-IN') : 'N/A',
    verifier_name: 'N/A',
    verifier_code: task?.fe_code || 'N/A',
    task_number: task?.task_number || 'N/A',
    lead_number: lead?.lead_number || 'N/A',
    status: task?.status || 'N/A',
    remarks: task?.final_remarks || report?.report_data?.remarks || 'No remarks provided',
    qc_remarks: task?.qc_remarks || 'N/A',
    geo_coordinates: 'N/A',
    report_date: new Date(report.generated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    sla_deadline: task?.sla_deadline ? new Date(task.sla_deadline).toLocaleString('en-IN') : 'N/A',
  };
}

// Render a single block to HTML
function renderBlock(block: ReportBlock, ctx: Record<string, string>, reportData: any): string {
  const c = block.config || {};
  switch (block.type) {
    case 'header':
      return `<div style="border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-size:22px;font-weight:700;color:#2563eb">${resolveField(c.title || 'Verification Report', ctx)}</div>
        ${c.subtitle ? `<div style="font-size:13px;color:#666">${resolveField(c.subtitle, ctx)}</div>` : ''}</div>
        ${c.showDate ? `<div style="font-size:11px;color:#666">${ctx.report_date}</div>` : ''}
      </div>`;

    case 'client_logo':
      return `<div style="text-align:${c.position||'center'};margin:8px 0"><div style="display:inline-block;width:${c.width||120}px;height:${c.height||60}px;border:1px dashed #ccc;text-align:center;line-height:${c.height||60}px;color:#999;font-size:11px">${ctx.client_name} Logo</div></div>`;

    case 'section_title':
      return `<div style="margin:16px 0 8px;text-align:${c.align||'left'}"><div style="font-size:15px;font-weight:600;color:#1e293b">${resolveField(c.title||'', ctx)}</div>${c.showDivider?'<hr style="border:none;border-top:1px solid #e2e8f0;margin-top:4px"/>':''}</div>`;

    case 'key_value_table': {
      const cols = c.columns || 2;
      const fields = c.fields || [];
      let rows = '';
      for (let i = 0; i < fields.length; i += cols) {
        rows += '<tr>';
        for (let j = 0; j < cols; j++) {
          const f = fields[i + j];
          if (f) {
            rows += `<td style="padding:6px 10px;font-weight:600;color:#475569;background:#f8fafc;font-size:12px;border:1px solid #e2e8f0">${f.label}</td>`;
            rows += `<td style="padding:6px 10px;font-size:12px;border:1px solid #e2e8f0">${resolveField(f.field, ctx)}</td>`;
          } else {
            rows += '<td colspan="2" style="border:1px solid #e2e8f0"></td>';
          }
        }
        rows += '</tr>';
      }
      return `${c.title?`<div style="font-size:13px;font-weight:600;margin-bottom:4px">${resolveField(c.title,ctx)}</div>`:''}
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px">${rows}</table>`;
    }

    case 'data_table': {
      const headers = (c.headers || []).map((h: string) => `<th style="padding:6px 10px;background:#f8fafc;font-size:12px;font-weight:600;border:1px solid #e2e8f0;text-align:left">${h}</th>`).join('');
      let rowsHtml = '';
      // Try to get checklist data from report
      const checklistData = reportData?.checklist_results || reportData?.verification_details?.checklist || [];
      if (Array.isArray(checklistData) && checklistData.length > 0) {
        rowsHtml = checklistData.map((item: any, i: number) =>
          `<tr><td style="padding:6px 10px;font-size:12px;border:1px solid #e2e8f0">${i+1}</td><td style="padding:6px 10px;font-size:12px;border:1px solid #e2e8f0">${item.label||item.item||''}</td><td style="padding:6px 10px;font-size:12px;border:1px solid #e2e8f0">${item.response||item.value||''}</td></tr>`
        ).join('');
      } else {
        rowsHtml = '<tr><td colspan="3" style="padding:6px 10px;font-size:12px;border:1px solid #e2e8f0;text-align:center;color:#999">No data available</td></tr>';
      }
      return `${c.title?`<div style="font-size:13px;font-weight:600;margin-bottom:4px">${resolveField(c.title,ctx)}</div>`:''}
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tr>${headers}</tr>${rowsHtml}</table>`;
    }

    case 'text_block': {
      const content = c.field ? resolveField(c.field, ctx) : (c.content || '');
      return `<div style="padding:12px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px;font-size:${c.fontSize||12}px;margin:8px 0;line-height:1.6">${content}</div>`;
    }

    case 'photo_grid':
      return `<div style="padding:12px;background:#f1f5f9;border-radius:4px;text-align:center;color:#666;font-size:12px;margin:8px 0">[Photo evidence will be rendered when available]</div>`;

    case 'signature_block': {
      const sigs = (c.signatures || []).map((s: any) => `<div style="text-align:center;flex:1">
        <div style="border-bottom:1px solid #333;width:140px;margin:0 auto 6px;height:50px"></div>
        <div style="font-size:12px;font-weight:600">${resolveField(s.name||'', ctx)}</div>
        <div style="font-size:11px;color:#666">${s.designation||''}</div>
        <div style="font-size:10px;color:#999">${s.label||''}</div>
      </div>`).join('');
      return `<div style="display:flex;justify-content:space-around;margin:30px 0">${sigs}</div>`;
    }

    case 'spacer':
      return `<div style="height:${c.height||20}px"></div>`;

    case 'divider':
      return `<hr style="border:none;border-top:${c.thickness||1}px ${c.style||'solid'} ${c.color||'#e2e8f0'};margin:12px 0"/>`;

    default:
      return '';
  }
}

// Generate HTML from block-based template
function generateFromBlocks(template: TemplateConfig, ctx: Record<string, string>, reportData: any): string {
  const margins = template.margins || { top: 40, right: 30, bottom: 40, left: 30 };
  const blocksHtml = (template.blocks || []).map(b => renderBlock(b, ctx, reportData)).join('\n');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Verification Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:12px;line-height:1.6;color:#333;padding:${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px}
@media print{body{padding:20px}}</style></head><body>${blocksHtml}</body></html>`;
}

// Legacy fallback for old-format reports
function generateLegacyHtml(report: any, task: any, lead: any, client: any): string {
  const reportDate = new Date(report.generated_at).toLocaleDateString('en-IN', { year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit' });
  const rd = report.report_data || {};
  let sections = '';
  if (rd.applicant_details) {
    sections += `<div style="margin-bottom:20px"><h2 style="font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px">Applicant Details</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:6px 10px;font-weight:600;background:#f8fafc;width:180px;border-bottom:1px solid #f1f5f9">Name:</td><td style="padding:6px 10px;border-bottom:1px solid #f1f5f9">${rd.applicant_details.name||'N/A'}</td></tr><tr><td style="padding:6px 10px;font-weight:600;background:#f8fafc;border-bottom:1px solid #f1f5f9">Application Number:</td><td style="padding:6px 10px;border-bottom:1px solid #f1f5f9">${rd.applicant_details.application_number||'N/A'}</td></tr><tr><td style="padding:6px 10px;font-weight:600;background:#f8fafc;border-bottom:1px solid #f1f5f9">Address:</td><td style="padding:6px 10px;border-bottom:1px solid #f1f5f9">${rd.applicant_details.address||'N/A'}</td></tr></table></div>`;
  }
  if (rd.findings) sections += `<div style="margin-bottom:20px"><h2 style="font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px">Findings</h2><div style="padding:12px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px">${rd.findings}</div></div>`;
  if (rd.remarks || task?.final_remarks) sections += `<div style="margin-bottom:20px"><h2 style="font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px">Remarks</h2><div style="padding:12px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px">${rd.remarks||task?.final_remarks||''}</div></div>`;
  if (!sections) sections = `<div style="margin-bottom:20px"><h2 style="font-size:16px">Report Data</h2><pre style="background:#f8fafc;padding:12px;border-radius:4px;font-size:11px">${JSON.stringify(rd,null,2)}</pre></div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:12px;line-height:1.6;color:#333;padding:40px}</style></head><body>
<div style="border-bottom:3px solid #2563eb;padding-bottom:16px;margin-bottom:24px"><h1 style="font-size:22px;color:#2563eb">Verification Report</h1><div style="color:#666;font-size:13px">Version ${report.version} · ${reportDate}</div></div>
<div style="display:flex;justify-content:space-between;background:#f8fafc;padding:12px;border-radius:6px;margin-bottom:20px">
<div style="text-align:center"><div style="font-size:10px;color:#666;text-transform:uppercase">Task</div><div style="font-size:13px;font-weight:600">${task?.task_number||'N/A'}</div></div>
<div style="text-align:center"><div style="font-size:10px;color:#666;text-transform:uppercase">Client</div><div style="font-size:13px;font-weight:600">${client?.name||'N/A'}</div></div>
<div style="text-align:center"><div style="font-size:10px;color:#666;text-transform:uppercase">Status</div><div style="font-size:13px;font-weight:600">${task?.status||'N/A'}</div></div>
</div>${sections}
<div style="margin-top:30px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#666;font-size:10px">Computer-generated report · ${reportDate} · Version ${report.version}</div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { reportId } = await req.json();
    if (!reportId) {
      return new Response(JSON.stringify({ error: 'Report ID is required' }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`Generating PDF for report: ${reportId}`);

    const { data: report, error: reportError } = await supabase.from('generated_reports').select('*').eq('id', reportId).single();
    if (reportError || !report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    let task = null, lead = null, client = null;
    if (report.task_id) {
      const { data: td } = await supabase.from('tasks').select('*, lead:leads(*, client:clients(*))').eq('id', report.task_id).single();
      task = td; lead = td?.lead; client = td?.lead?.client;
    } else if (report.lead_id) {
      const { data: ld } = await supabase.from('leads').select('*, client:clients(*)').eq('id', report.lead_id).single();
      lead = ld; client = ld?.client;
    }

    // Check if there's a block-based client_report_config for this client/type
    let htmlContent: string;
    const clientId = client?.id;
    let templateConfig: TemplateConfig | null = null;

    if (clientId) {
      const { data: configs } = await supabase.from('client_report_configs').select('template_config').eq('client_id', clientId).eq('is_active', true).limit(1);
      if (configs?.length && (configs[0].template_config as any)?.blocks?.length) {
        templateConfig = configs[0].template_config as unknown as TemplateConfig;
      }
    }

    if (templateConfig?.blocks?.length) {
      const ctx = buildContext(report, task, lead, client);
      htmlContent = generateFromBlocks(templateConfig, ctx, report.report_data);
    } else {
      htmlContent = generateLegacyHtml(report, task, lead, client);
    }

    return new Response(JSON.stringify({
      success: true,
      html: htmlContent,
      filename: `report-${task?.task_number || lead?.lead_number || report.id.substring(0, 8)}-v${report.version}.pdf`,
      reportType: report.report_type,
      version: report.version,
    }), { headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
