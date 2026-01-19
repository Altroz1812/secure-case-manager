import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailMessage {
  id: string;
  from: { emailAddress: { address: string; name?: string } };
  toRecipients: Array<{ emailAddress: { address: string } }>;
  subject: string;
  bodyPreview: string;
  body?: { content: string };
  receivedDateTime: string;
  hasAttachments: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GODADDY_EMAIL = Deno.env.get("GODADDY_EMAIL");
  const GODADDY_PASSWORD = Deno.env.get("GODADDY_PASSWORD");

  if (!GODADDY_EMAIL || !GODADDY_PASSWORD) {
    console.error("Missing email credentials");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Email credentials not configured. Please set GODADDY_EMAIL and GODADDY_PASSWORD secrets." 
      }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    console.log("Starting email sync...");
    const url = new URL(req.url);
    const isTestMode = url.searchParams.get('test') === 'true';
    const branchEmail = url.searchParams.get('branch_email');

    // Helper function to auto-map branch by recipient email
    async function getBranchByEmail(recipientEmail: string): Promise<string | null> {
      const { data } = await supabase.rpc('get_branch_by_email', { 
        _recipient_email: recipientEmail 
      });
      return data;
    }

    if (isTestMode) {
      console.log("Running in test mode - inserting mock email");
      
      // Get a random branch to simulate auto-mapping
      let branchId: string | null = null;
      const testRecipientEmail = branchEmail || "test@rcu-branch.com";
      
      // Try to get branch by email first
      branchId = await getBranchByEmail(testRecipientEmail);
      
      // If no branch mapped by email, get first active branch
      if (!branchId) {
        const { data: branches } = await supabase
          .from('branches')
          .select('id')
          .eq('is_active', true)
          .limit(1);
        branchId = branches?.[0]?.id || null;
      }

      const mockEmailData = {
        external_id: `mock-${Date.now()}`,
        sender_email: "client@example.com",
        sender_name: "Test Client",
        recipient_email: testRecipientEmail,
        subject: "Test Email - Verification Request for John Doe",
        body_preview: "Please verify the address and employment details for applicant John Doe, Application #APP-2024-001.",
        body_html: `<p>Dear Team,</p>
          <p>Please verify the following details for our applicant:</p>
          <ul>
            <li><strong>Applicant Name:</strong> John Doe</li>
            <li><strong>Application #:</strong> APP-2024-001</li>
            <li><strong>Address:</strong> 123 Main Street, Mumbai 400001</li>
          </ul>
          <p>Please complete the verification within SLA.</p>
          <p>Thanks,<br/>Client Team</p>`,
        received_at: new Date().toISOString(),
        is_processed: false,
        branch_id: branchId,
      };

      const { data: existingEmail } = await supabase
        .from("emails")
        .select("id")
        .eq("external_id", mockEmailData.external_id)
        .maybeSingle();

      if (!existingEmail) {
        const { data: email, error } = await supabase
          .from("emails")
          .insert(mockEmailData)
          .select()
          .single();

        if (error) {
          console.error("Failed to insert test email:", error);
          throw error;
        }

        console.log("Test email inserted successfully:", email.id);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Test email sync completed",
            email_id: email.id,
            branch_id: branchId,
            branch_auto_mapped: !!branchId,
            mode: "test"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test email already exists",
          mode: "test"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Production Mode - Microsoft Graph API Integration
    // This section provides the structure for Graph API integration
    // Requires MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID secrets
    
    const MS_GRAPH_CLIENT_ID = Deno.env.get("MS_GRAPH_CLIENT_ID");
    const MS_GRAPH_CLIENT_SECRET = Deno.env.get("MS_GRAPH_CLIENT_SECRET");
    const MS_GRAPH_TENANT_ID = Deno.env.get("MS_GRAPH_TENANT_ID");

    if (MS_GRAPH_CLIENT_ID && MS_GRAPH_CLIENT_SECRET && MS_GRAPH_TENANT_ID) {
      console.log("Microsoft Graph API credentials detected, attempting sync...");
      
      try {
        // Get OAuth token
        const tokenResponse = await fetch(
          `https://login.microsoftonline.com/${MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: MS_GRAPH_CLIENT_ID,
              client_secret: MS_GRAPH_CLIENT_SECRET,
              scope: 'https://graph.microsoft.com/.default',
              grant_type: 'client_credentials',
            }),
          }
        );

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("Token fetch failed:", errorText);
          throw new Error(`Failed to get access token: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch unread emails from inbox
        const mailResponse = await fetch(
          `https://graph.microsoft.com/v1.0/users/${GODADDY_EMAIL}/mailFolders/inbox/messages?$filter=isRead eq false&$top=50&$select=id,from,toRecipients,subject,bodyPreview,body,receivedDateTime,hasAttachments`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!mailResponse.ok) {
          const errorText = await mailResponse.text();
          console.error("Mail fetch failed:", errorText);
          throw new Error(`Failed to fetch emails: ${errorText}`);
        }

        const mailData = await mailResponse.json();
        const messages: EmailMessage[] = mailData.value || [];
        
        console.log(`Found ${messages.length} unread emails`);

        let syncedCount = 0;
        let skippedCount = 0;

        for (const message of messages) {
          // Check if email already exists
          const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('external_id', message.id)
            .maybeSingle();

          if (existing) {
            skippedCount++;
            continue;
          }

          // Get recipient email for branch mapping
          const recipientEmail = message.toRecipients?.[0]?.emailAddress?.address || GODADDY_EMAIL;
          
          // Auto-map branch by recipient email
          const branchId = await getBranchByEmail(recipientEmail);

          const emailData = {
            external_id: message.id,
            sender_email: message.from.emailAddress.address,
            sender_name: message.from.emailAddress.name || null,
            recipient_email: recipientEmail,
            subject: message.subject,
            body_preview: message.bodyPreview,
            body_html: message.body?.content || null,
            received_at: message.receivedDateTime,
            is_processed: false,
            branch_id: branchId,
          };

          const { error: insertError } = await supabase
            .from('emails')
            .insert(emailData);

          if (insertError) {
            console.error(`Failed to insert email ${message.id}:`, insertError);
          } else {
            syncedCount++;
            console.log(`Synced email: ${message.subject} -> Branch: ${branchId || 'unassigned'}`);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Email sync completed. Synced: ${syncedCount}, Skipped: ${skippedCount}`,
            synced: syncedCount,
            skipped: skippedCount,
            mode: "graph_api"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      } catch (graphError: any) {
        console.error("Graph API sync error:", graphError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Graph API sync failed: ${graphError.message}`,
            mode: "graph_api"
          }),
          { 
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
      }
    }

    // Fallback: No Graph API configured
    console.log("No Microsoft Graph API credentials configured");
    console.log("For production email sync, configure MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, and MS_GRAPH_TENANT_ID");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sync configuration is valid. Configure Microsoft Graph API credentials for production sync.",
        config: {
          godaddy_email_configured: true,
          graph_api_configured: false,
        },
        instructions: [
          "For Office 365/Exchange: Set MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID secrets",
          "For GoDaddy IMAP: Use a webhook service or external sync tool",
          "Use ?test=true to insert a test email for development"
        ]
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Email sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
