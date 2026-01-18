import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportId: string;
}

// PDF generation using a simple HTML-to-PDF approach
function generatePdfContent(report: any, task: any, lead: any, client: any): string {
  const reportDate = new Date(report.generated_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportData = report.report_data || {};
  const verificationType = task?.verification_type || 'N/A';
  const verificationTypeDisplay = verificationType.charAt(0).toUpperCase() + verificationType.slice(1);

  // Build sections based on report data
  let sectionsHtml = '';
  
  if (reportData.applicant_details) {
    sectionsHtml += `
      <div class="section">
        <h2>Applicant Details</h2>
        <table>
          <tr><td class="label">Name:</td><td>${reportData.applicant_details.name || 'N/A'}</td></tr>
          <tr><td class="label">Application Number:</td><td>${reportData.applicant_details.application_number || 'N/A'}</td></tr>
          <tr><td class="label">Address:</td><td>${reportData.applicant_details.address || 'N/A'}</td></tr>
          <tr><td class="label">Pincode:</td><td>${reportData.applicant_details.pincode || 'N/A'}</td></tr>
        </table>
      </div>
    `;
  }

  if (reportData.verification_details) {
    sectionsHtml += `
      <div class="section">
        <h2>Verification Details</h2>
        <table>
          <tr><td class="label">Type:</td><td>${reportData.verification_details.type || verificationTypeDisplay}</td></tr>
          <tr><td class="label">Status:</td><td>${reportData.verification_details.status || task?.status || 'N/A'}</td></tr>
          <tr><td class="label">Completed At:</td><td>${reportData.verification_details.completed_at || (task?.completed_at ? new Date(task.completed_at).toLocaleString() : 'N/A')}</td></tr>
        </table>
      </div>
    `;
  }

  if (reportData.findings) {
    sectionsHtml += `
      <div class="section">
        <h2>Findings</h2>
        <div class="findings">${reportData.findings}</div>
      </div>
    `;
  }

  if (reportData.remarks || task?.final_remarks) {
    sectionsHtml += `
      <div class="section">
        <h2>Remarks</h2>
        <div class="remarks">${reportData.remarks || task?.final_remarks || 'No remarks provided'}</div>
      </div>
    `;
  }

  if (reportData.qc_details || task?.qc_remarks) {
    sectionsHtml += `
      <div class="section">
        <h2>QC Review</h2>
        <table>
          <tr><td class="label">Reviewed At:</td><td>${task?.qc_reviewed_at ? new Date(task.qc_reviewed_at).toLocaleString() : 'N/A'}</td></tr>
          <tr><td class="label">Remarks:</td><td>${reportData.qc_details?.remarks || task?.qc_remarks || 'No QC remarks'}</td></tr>
        </table>
      </div>
    `;
  }

  // If no specific sections, show raw data
  if (!sectionsHtml) {
    sectionsHtml = `
      <div class="section">
        <h2>Report Data</h2>
        <pre>${JSON.stringify(reportData, null, 2)}</pre>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verification Report - ${task?.task_number || lead?.lead_number || report.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .meta-item {
      text-align: center;
    }
    .meta-item .label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-item .value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 16px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    table td.label {
      width: 180px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
    }
    .findings, .remarks {
      padding: 15px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    pre {
      background: #f8fafc;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 11px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }
    .status-approved { background: #dcfce7; color: #166534; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-pending { background: #fef3c7; color: #92400e; }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Verification Report</h1>
    <div class="subtitle">${report.report_type === 'task_verification' ? 'Task Verification Report' : 'Lead Consolidated Report'} - Version ${report.version}</div>
  </div>

  <div class="meta-info">
    <div class="meta-item">
      <div class="label">Report ID</div>
      <div class="value">${report.id.substring(0, 8).toUpperCase()}</div>
    </div>
    <div class="meta-item">
      <div class="label">${task ? 'Task Number' : 'Lead Number'}</div>
      <div class="value">${task?.task_number || lead?.lead_number || 'N/A'}</div>
    </div>
    <div class="meta-item">
      <div class="label">Client</div>
      <div class="value">${client?.name || 'N/A'}</div>
    </div>
    <div class="meta-item">
      <div class="label">Generated On</div>
      <div class="value">${reportDate}</div>
    </div>
    <div class="meta-item">
      <div class="label">Status</div>
      <div class="value">
        <span class="status-badge status-${(task?.status || 'pending').toLowerCase()}">${task?.status || 'N/A'}</span>
      </div>
    </div>
  </div>

  ${sectionsHtml}

  <div class="footer">
    <p>This is a computer-generated report. Generated on ${reportDate}</p>
    <p>Report Version: ${report.version} | Report ID: ${report.id}</p>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { reportId }: ReportRequest = await req.json();

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'Report ID is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Generating PDF for report: ${reportId}`);

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Report fetch error:', reportError);
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch related data
    let task = null;
    let lead = null;
    let client = null;

    if (report.task_id) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*, lead:leads(*, client:clients(*))')
        .eq('id', report.task_id)
        .single();
      
      task = taskData;
      lead = taskData?.lead;
      client = taskData?.lead?.client;
    } else if (report.lead_id) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('*, client:clients(*)')
        .eq('id', report.lead_id)
        .single();
      
      lead = leadData;
      client = leadData?.client;
    }

    // Generate HTML content
    const htmlContent = generatePdfContent(report, task, lead, client);

    console.log('PDF HTML generated successfully');

    // Return the HTML content - the frontend will handle rendering/printing
    return new Response(
      JSON.stringify({ 
        success: true,
        html: htmlContent,
        filename: `report-${task?.task_number || lead?.lead_number || report.id.substring(0, 8)}-v${report.version}.pdf`,
        reportType: report.report_type,
        version: report.version,
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );

  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
