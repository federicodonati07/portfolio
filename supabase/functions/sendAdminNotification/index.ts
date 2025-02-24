import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail, userName, plan, text } = await req.json()

    // Invia email usando il servizio email di Supabase
    const response = await fetch('https://api.supabase.com/v1/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: 'federico.donati.work@gmail.com',
        subject: 'Nuova richiesta ricevuta',
        content: `
          Nuova richiesta da ${userName} (${userEmail})
          Piano: ${plan}
          Messaggio: ${text}
        `,
      }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 