import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertTriangle, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatMessage, DocumentSource } from '@/types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Welche Sicherheitsanforderungen gelten für Gerüste?",
    "Erkläre die VOB-Vorschriften für Betonarbeiten",
    "Best Practices für Kellerabdichtung",
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Nachrichtenbereich */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 shadow-glow">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              BuildTech KI-Assistent
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Fragen Sie mich zu Baunormen, Vorschriften oder Best Practices. 
              Ich gebe Antworten basierend auf unserer verifizierten Wissensdatenbank.
            </p>
            
            {/* Schnellfragen */}
            <div className="space-y-2 w-full max-w-lg">
              <p className="text-sm font-medium text-muted-foreground mb-3">Probieren Sie:</p>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(question)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-sm text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Durchsuche Wissensdatenbank...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Eingabebereich */}
      <div className="border-t border-border bg-card p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Fragen Sie zu Baunormen, Vorschriften oder Best Practices..."
              className="min-h-[56px] max-h-[200px] pr-14 resize-none rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-primary"
              rows={1}
            />
            <Button
              size="icon"
              variant="hero"
              className="absolute right-2 bottom-2"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            KI-Antworten basieren auf der verifizierten BuildTech-Wissensdatenbank. Überprüfen Sie kritische Informationen immer.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : ""
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
        isUser 
          ? "bg-secondary" 
          : "bg-gradient-hero"
      )}>
        {isUser ? (
          <span className="text-sm font-medium text-foreground">Sie</span>
        ) : (
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      {/* Nachrichteninhalt */}
      <div className={cn(
        "max-w-[80%] space-y-3",
        isUser ? "items-end" : ""
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-md" 
            : "bg-card border border-border rounded-tl-md"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Warnung für externe Quellen */}
        {message.isExternal && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning">
              Diese Antwort enthält externe Quellen
            </span>
          </div>
        )}

        {/* Quellen */}
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quellen:</p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Zeitstempel */}
        <p className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: DocumentSource }) {
  return (
    <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
      <FileText className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{source.title}</p>
        {source.page && (
          <p className="text-xs text-muted-foreground">Seite {source.page}</p>
        )}
      </div>
      <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
    </button>
  );
}
