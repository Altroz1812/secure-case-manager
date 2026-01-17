import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  messageQueueId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, templateName, variables, messageQueueId }: WhatsAppMessage = await req.json();

    // Validate required fields
    if (!to || !templateName) {
      throw new Error('Missing required fields: to, templateName');
    }

    // Get template from database
    const { data: template, error: templateError } = await supabaseClient
      .from('notification_templates')
      .select('*')
      .eq('template_name', templateName)
      .eq('channel', 'whatsapp')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Replace variables in template body
    let messageBody = template.body_template;
    for (const [key, value] of Object.entries(variables)) {
      messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // TODO: Integrate with WhatsApp Business API
    // This is a placeholder for the actual WhatsApp integration
    // You would need to:
    // 1. Add WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER_ID to secrets
    // 2. Call the WhatsApp Business API to send the message
    
    /*
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('WHATSAPP_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: template.template_code || templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: Object.values(variables).map(v => ({ type: 'text', text: v })),
              },
            ],
          },
        }),
      }
    );

    if (!whatsappResponse.ok) {
      throw new Error(`WhatsApp API error: ${await whatsappResponse.text()}`);
    }

    const whatsappResult = await whatsappResponse.json();
    */

    // For now, just log and update message queue status
    console.log('WhatsApp message would be sent:', {
      to,
      templateName,
      messageBody,
      variables,
    });

    // Update message queue if provided
    if (messageQueueId) {
      await supabaseClient
        .from('message_queue')
        .update({
          status: 'sent', // Change to 'sent' when actually sending
          sent_at: new Date().toISOString(),
          // external_message_id: whatsappResult.messages[0].id,
        })
        .eq('id', messageQueueId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp integration placeholder - message logged',
        templateUsed: templateName,
        recipientPhone: to,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-whatsapp function:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
