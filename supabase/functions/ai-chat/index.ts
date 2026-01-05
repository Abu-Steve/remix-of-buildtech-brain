import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, groupIds } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Require a valid logged-in user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate the access token (we do this ourselves because platform JWT verification can fail in some setups)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Invalid/expired JWT:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client for DB access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch relevant documents from the user's groups
    let query = supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        type,
        file_path,
        document_tags (
          tags (name)
        ),
        groups (name)
      `)
      .in('status', ['approved', 'best-practice']);

    // If groupIds provided, filter by groups
    if (groupIds && groupIds.length > 0) {
      query = query.or(`group_id.in.(${groupIds.join(',')}),group_id.is.null`);
    }

    const { data: documents, error: docsError } = await query.limit(50);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    // Build context from documents
    const documentContext = documents?.map((doc: any) => {
      const tags = doc.document_tags?.map((dt: any) => dt.tags?.name).filter(Boolean).join(', ') || '';
      const group = doc.groups?.name || 'General';
      return `- "${doc.title}" (${doc.type}, Group: ${group}${tags ? `, Tags: ${tags}` : ''}): ${doc.description || 'No description'}`;
    }).join('\n') || 'No documents available.';

    console.log(`Found ${documents?.length || 0} documents for context`);

    // Prepare system prompt with document context
    const systemPrompt = `You are BuildTech AI, an intelligent assistant for construction knowledge management.

You have access to the following documents from the BuildTech knowledge base:
${documentContext}

IMPORTANT GUIDELINES:
1. Base your answers primarily on the documents listed above
2. When citing information, always mention the source document title
3. If asked about regulations or legal texts (like VOB), provide simplified explanations in German if relevant, and remind users to verify with original documents
4. If information is not available in the knowledge base, clearly state this and offer general guidance
5. Be concise but thorough
6. For safety-critical information, always recommend consulting official sources

Format your responses with clear sections using markdown when helpful.`;

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Calling OpenAI API...');
    
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Extract mentioned documents as sources
    const mentionedDocs = documents?.filter(doc => 
      generatedText.toLowerCase().includes(doc.title.toLowerCase())
    ).slice(0, 4) || [];

    const sources = mentionedDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.description?.substring(0, 100) || 'Document from BuildTech knowledge base',
    }));

    return new Response(
      JSON.stringify({ 
        content: generatedText,
        sources,
        isExternal: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
