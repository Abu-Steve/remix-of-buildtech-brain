import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Nachricht erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY ist nicht konfiguriert');
    }

    // Validate user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Ungültiges Token:', userError);
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log(`Chat-Anfrage von Benutzer: ${userData.user.email}`);

    // Service client for DB access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch ALL approved documents first (including file_path)
    const { data: allDocuments, error: docsError } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        type,
        file_path,
        visibility_scope,
        status,
        group_id,
        created_at,
        document_tags (
          tags (name)
        ),
        groups (name)
      `)
      .in('status', ['approved', 'best-practice']);

    if (docsError) {
      console.error('Fehler beim Laden der Dokumente:', docsError);
    }

    // Filter documents using can_view_document function for THIS user
    const accessibleDocuments = [];
    for (const doc of allDocuments || []) {
      const { data: canView, error: rpcError } = await supabase.rpc('can_view_document', {
        _user_id: userId,
        _doc_id: doc.id
      });
      
      if (rpcError) {
        console.error(`Fehler bei can_view_document für ${doc.id}:`, rpcError);
        continue;
      }
      
      if (canView === true) {
        accessibleDocuments.push(doc);
      }
    }

    console.log(`Benutzer ${userData.user.email} hat Zugriff auf ${accessibleDocuments.length} von ${allDocuments?.length || 0} Dokumenten`);

    // Function to extract text content from documents
    async function extractDocumentContent(doc: any): Promise<string> {
      if (!doc.file_path) {
        return '';
      }

      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from('documents')
          .download(doc.file_path);

        if (downloadError || !fileData) {
          console.error(`Fehler beim Herunterladen von ${doc.file_path}:`, downloadError);
          return '';
        }

        const fileType = doc.type?.toLowerCase() || '';
        const fileName = doc.file_path.toLowerCase();

        // Handle text-based files
        if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
          const text = await fileData.text();
          return text.substring(0, 10000); // Limit to 10k chars
        }

        // Handle PDF files - extract text using basic parsing
        if (fileType === 'pdf' || fileName.endsWith('.pdf')) {
          const arrayBuffer = await fileData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          
          // Simple PDF text extraction (looks for text streams)
          let text = '';
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const content = decoder.decode(bytes);
          
          // Extract text between BT and ET markers (PDF text objects)
          const textMatches = content.match(/BT[\s\S]*?ET/g) || [];
          for (const match of textMatches) {
            // Extract text from Tj and TJ operators
            const tjMatches = match.match(/\(([^)]*)\)\s*Tj/g) || [];
            for (const tj of tjMatches) {
              const textContent = tj.match(/\(([^)]*)\)/);
              if (textContent) {
                text += textContent[1] + ' ';
              }
            }
          }
          
          // If no text extracted via BT/ET, try to find readable strings
          if (text.length < 100) {
            // Look for sequences of printable ASCII characters
            const readableMatches = content.match(/[\x20-\x7E]{20,}/g) || [];
            text = readableMatches
              .filter(s => !s.includes('<<') && !s.includes('>>') && !s.includes('/'))
              .join(' ');
          }
          
          // Clean up the text
          text = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          return text.substring(0, 10000); // Limit to 10k chars
        }

        // For other file types, return empty (can't extract)
        console.log(`Dateityp ${fileType} wird nicht für Textextraktion unterstützt`);
        return '';
      } catch (error) {
        console.error(`Fehler beim Extrahieren von Inhalt aus ${doc.file_path}:`, error);
        return '';
      }
    }

    // Build context from accessible documents
    let documentContext = "";
    const documentSources: { id: string; title: string; type: string; excerpt: string }[] = [];
    
    if (accessibleDocuments.length > 0) {
      documentContext = "=== DOKUMENTE AUS DER DATENBANK (für diesen Benutzer zugänglich) ===\n\n";
      
      for (const doc of accessibleDocuments) {
        const tags = doc.document_tags?.map((dt: any) => dt.tags?.name).filter(Boolean).join(', ') || '';
        const groupName = (doc.groups as any)?.name || 'Unbekannt';
        const visibility = doc.visibility_scope === 'all_companies' ? 'Alle Firmen' : 'Nur eigene Firma';
        
        // Extract actual document content
        const documentContent = await extractDocumentContent(doc);
        
        documentContext += `--- Dokument: "${doc.title}" ---\n`;
        documentContext += `Typ: ${doc.type}\n`;
        documentContext += `Beschreibung: ${doc.description || 'Keine Beschreibung'}\n`;
        documentContext += `Firma: ${groupName}\n`;
        documentContext += `Sichtbarkeit: ${visibility}\n`;
        documentContext += `Status: ${doc.status === 'best-practice' ? 'Best Practice' : 'Genehmigt'}\n`;
        if (tags) documentContext += `Tags: ${tags}\n`;
        documentContext += `Erstellt: ${new Date(doc.created_at).toLocaleDateString('de-DE')}\n`;
        
        if (documentContent) {
          documentContext += `\nINHALT DES DOKUMENTS:\n${documentContent}\n`;
        } else {
          documentContext += `\n(Dokumentinhalt konnte nicht extrahiert werden - Binärdatei oder nicht unterstütztes Format)\n`;
        }
        documentContext += '\n';
        
        documentSources.push({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          excerpt: documentContent ? documentContent.substring(0, 200) : (doc.description?.substring(0, 100) || 'Dokument aus der BuildTech Wissensdatenbank')
        });
      }
    } else {
      documentContext = "Keine Dokumente in der Datenbank verfügbar, auf die dieser Benutzer Zugriff hat.";
    }

    // System prompt - prioritize database, then external
    const systemPrompt = `Du bist der BuildTech KI-Assistent für Dokumenten- und Wissensmanagement im Bauwesen.

KRITISCHE REGELN - STRIKT BEFOLGEN:

1. DATENBANK ZUERST: Du MUSST zuerst versuchen, die Frage anhand der unten aufgeführten Dokumente aus der Datenbank zu beantworten.

2. QUELLENANGABE PFLICHT: Wenn du Informationen aus den Dokumenten verwendest, MUSST du die Quelle(n) nennen:
   Format: "Laut dem Dokument '[Dokumenttitel]'..." oder "📚 Quelle: [Dokumenttitel]"

3. NUR BEI BEDARF EXTERN: Nur wenn die Frage nicht mit den verfügbaren Dokumenten beantwortet werden kann, darfst du externes Wissen verwenden.
   Wenn du externes Wissen verwendest, MUSST du dies DEUTLICH kennzeichnen:
   "⚠️ HINWEIS: Diese Information stammt aus externem Wissen, nicht aus Ihrer Datenbank. Bitte verifizieren Sie diese Angaben."

4. DEUTSCHE ANTWORTEN: Antworte IMMER auf Deutsch.

5. BAUVORSCHRIFTEN: Bei rechtlichen Texten und Vorschriften:
   - Erkläre die Essenz in einfachem Deutsch
   - Weise darauf hin, den Originaltext zu prüfen
   - Füge hinzu: "Bitte prüfen Sie den Originaltext für verbindliche Aussagen."

6. KEINE HALLUZINATIONEN: Erfinde keine Dokumente oder Quellen. Wenn du etwas nicht weißt, sage es ehrlich.

${documentContext}

ANTWORTFORMAT:
- Bei Datenbank-Antworten: Nenne am Ende "📚 Quellen: [Liste der Dokumenttitel]"
- Bei externen Antworten: Beginne mit "⚠️ Externe Quelle" und erkläre, warum die Datenbank keine Antwort liefern konnte`;

    // Call Lovable AI Gateway
    console.log('Rufe Lovable AI Gateway auf...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate-Limit erreicht, bitte versuchen Sie es später erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Guthaben aufgebraucht, bitte laden Sie Ihr Konto auf.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI Gateway Fehler:', aiResponse.status, errorText);
      throw new Error(`AI Gateway Fehler: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';

    // Determine which documents were mentioned
    const mentionedDocs = documentSources.filter(doc => 
      generatedText.toLowerCase().includes(doc.title.toLowerCase())
    );

    // Check if response uses external knowledge
    const isExternal = generatedText.includes('⚠️') || 
                       generatedText.toLowerCase().includes('extern') ||
                       generatedText.toLowerCase().includes('nicht aus ihrer datenbank');

    console.log(`Antwort generiert. Externe Quelle: ${isExternal}, Erwähnte Dokumente: ${mentionedDocs.length}`);

    return new Response(
      JSON.stringify({ 
        content: generatedText,
        sources: mentionedDocs,
        isExternal,
        accessibleDocumentCount: accessibleDocuments.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Fehler in ai-chat Funktion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
