import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import type { ChatMessage, DocumentSource } from '@/types';

// Mock AI responses with sources
const mockResponses: Record<string, { content: string; sources: DocumentSource[]; isExternal?: boolean }> = {
  default: {
    content: `Based on our internal documentation, I can provide you with the following information:

The construction standards you're asking about are covered in multiple documents in our knowledge base. The key points include proper safety protocols, compliance with local building codes, and adherence to industry best practices.

**Key recommendations:**
1. Always follow the documented safety procedures
2. Ensure all materials meet specified standards
3. Document all inspections and approvals
4. Consult with certified professionals when needed

Would you like me to elaborate on any specific aspect?`,
    sources: [
      { id: '1', title: 'Construction Safety Guidelines 2024', page: 15, excerpt: 'Safety protocols for on-site work...' },
      { id: '2', title: 'Building Code Compliance Manual', page: 42, excerpt: 'Local code requirements...' },
    ],
  },
  scaffolding: {
    content: `**Scaffolding Safety Requirements:**

According to our verified knowledge base (Document: "Scaffolding Safety Guidelines 2024"), the key requirements are:

1. **Structural Integrity**
   - Maximum load capacity must be clearly marked
   - Base plates required on all standards
   - Diagonal bracing at regular intervals

2. **Access Requirements**
   - Secure ladders at access points
   - Minimum platform width of 60cm
   - Guardrails on all open sides (min. 1m height)

3. **Inspection Protocol**
   - Daily visual inspection required
   - Full inspection after adverse weather
   - Documentation of all inspections

4. **Certification**
   - Scaffolders must hold valid certification
   - Competent person must approve before use

⚠️ **Important**: These are general guidelines. Always verify specific requirements with your local authorities and the original documentation.`,
    sources: [
      { id: '1', title: 'Scaffolding Safety Guidelines 2024', page: 8, excerpt: 'Load capacity and structural requirements...' },
      { id: '2', title: 'DIN 4420 Scaffold Standard', page: 23, excerpt: 'Platform and guardrail specifications...' },
      { id: '3', title: 'Safety Inspection Checklist', page: 1, excerpt: 'Daily inspection requirements...' },
    ],
  },
  vob: {
    content: `**VOB Regulations for Concrete Work - Simplified Explanation:**

Die VOB/C DIN 18331 regelt die Ausführung von Betonarbeiten. Hier die wichtigsten Punkte in einfachem Deutsch:

**Wesentliche Anforderungen:**

1. **Betonqualität**
   - Mindestdruckfestigkeit muss dokumentiert werden
   - Konsistenz bei Lieferung prüfen
   - Temperaturüberwachung bei Extremwetter

2. **Schalung und Bewehrung**
   - Ordnungsgemäße Abnahme vor Betonage
   - Betondeckung der Bewehrung einhalten
   - Dokumentation aller Prüfungen

3. **Nachbehandlung**
   - Mindestens 7 Tage feucht halten
   - Schutz vor direkter Sonneneinstrahlung
   - Frostschutz bei niedrigen Temperaturen

**Rechtlicher Hinweis:**
Dies ist eine vereinfachte Zusammenfassung. Für vertragliche Zwecke immer den Originaltext der VOB konsultieren.

📄 [Vollständiger VOB/C Text verfügbar in der Dokumentenbibliothek]`,
    sources: [
      { id: '1', title: 'VOB/C DIN 18331 Betonarbeiten', page: 1, excerpt: 'Allgemeine technische Vertragsbedingungen...' },
      { id: '2', title: 'VOB/B Compliance Checklist', page: 5, excerpt: 'Vertragliche Anforderungen...' },
    ],
  },
  waterproofing: {
    content: `**Best Practices for Basement Waterproofing:**

Based on DIN 18533 and our internal best practices documentation:

**1. Assessment Phase**
- Determine water load class (W1.1-E to W2.1-E)
- Assess ground conditions and drainage
- Consider hydrostatic pressure levels

**2. Exterior Waterproofing (Recommended)**
- Bituminous membrane systems
- HDPE drainage membranes
- Proper connection to foundation slab

**3. Interior Solutions (When exterior not feasible)**
- Crystalline waterproofing additives
- Injection methods for existing cracks
- Cavity drainage systems

**4. Critical Details**
- Wall-floor junction sealing
- Pipe penetration treatment
- Construction joint waterproofing

**Quality Control:**
- Water testing before backfill
- Documentation of all layers
- Photographic evidence

This information comes from our verified internal knowledge base. External sources were not consulted.`,
    sources: [
      { id: '1', title: 'DIN 18533 Waterproofing Guide', page: 12, excerpt: 'Water load classification...' },
      { id: '2', title: 'Basement Construction Best Practices', page: 34, excerpt: 'Exterior waterproofing systems...' },
      { id: '3', title: 'Quality Control Manual', page: 8, excerpt: 'Testing and documentation...' },
    ],
  },
};

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determine which mock response to use
    let response = mockResponses.default;
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('scaffolding') || lowerContent.includes('gerüst')) {
      response = mockResponses.scaffolding;
    } else if (lowerContent.includes('vob') || lowerContent.includes('concrete') || lowerContent.includes('beton')) {
      response = mockResponses.vob;
    } else if (lowerContent.includes('waterproof') || lowerContent.includes('basement') || lowerContent.includes('keller')) {
      response = mockResponses.waterproofing;
    }

    // Add AI response
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      sources: response.sources,
      isExternal: response.isExternal,
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] -m-4 lg:-m-6">
        <ChatInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
}
