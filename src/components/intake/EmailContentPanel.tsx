import { useState } from 'react';
import { format } from 'date-fns';
import { Mail, Paperclip, Calendar, User, ChevronDown, ChevronUp, GripVertical, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { EmailWithAttachments } from '@/hooks/useEmails';

interface ExtractedData {
  applicant_name?: string;
  application_number?: string;
  loan_number?: string;
  address?: string;
  pincode?: string;
}

interface EmailContentPanelProps {
  email: EmailWithAttachments;
  onExtractData: (data: ExtractedData) => void;
  onDragStart: (text: string, fieldHint?: string) => void;
}

// Common patterns for extracting data from emails
const extractPatterns = {
  applicant_name: [
    /(?:applicant|customer|borrower|name)\s*[:\-]\s*([A-Za-z\s\.]+)/i,
    /(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Za-z\s]+)/,
    /name\s*[:\-]\s*([A-Za-z\s\.]+)/i,
  ],
  application_number: [
    /(?:application|app|appl)\s*(?:no|number|#|id)?\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    /(?:ref|reference)\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9\-]+)/i,
  ],
  loan_number: [
    /(?:loan|ln)\s*(?:no|number|#|id)?\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    /(?:account|acct)\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9\-]+)/i,
  ],
  address: [
    /(?:address|addr|location)\s*[:\-]\s*([^\n]+(?:\n[^\n]+)?)/i,
    /(?:property|site|verification)\s*(?:address)?\s*[:\-]\s*([^\n]+)/i,
  ],
  pincode: [
    /(?:pin|pincode|zip|postal)\s*(?:code)?\s*[:\-]?\s*(\d{6})/i,
    /\b(\d{6})\b/,
  ],
};

function extractDataFromText(text: string): ExtractedData {
  const extracted: ExtractedData = {};
  
  for (const [field, patterns] of Object.entries(extractPatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted[field as keyof ExtractedData] = match[1].trim();
        break;
      }
    }
  }
  
  return extracted;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

export function EmailContentPanel({ email, onExtractData, onDragStart }: EmailContentPanelProps) {
  const [showFullBody, setShowFullBody] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  
  const plainTextBody = email.body_html ? stripHtml(email.body_html) : email.body_preview || '';
  const displayBody = showFullBody ? plainTextBody : plainTextBody.slice(0, 500);
  
  const handleAutoExtract = () => {
    const textToAnalyze = `${email.subject}\n${plainTextBody}`;
    const extracted = extractDataFromText(textToAnalyze);
    onExtractData(extracted);
  };
  
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };
  
  const handleDragStart = (e: React.DragEvent, text: string, fieldHint?: string) => {
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.setData('application/x-field-hint', fieldHint || '');
    onDragStart(text, fieldHint);
  };

  const DraggableText = ({ text, fieldHint, children }: { text: string; fieldHint?: string; children: React.ReactNode }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            draggable
            onDragStart={(e) => handleDragStart(e, text, fieldHint)}
            className="cursor-grab active:cursor-grabbing hover:bg-primary/10 rounded px-0.5 inline-flex items-center gap-1"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground opacity-50" />
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Drag to form field</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Content
          </CardTitle>
          <Button size="sm" variant="secondary" onClick={handleAutoExtract}>
            <Wand2 className="h-4 w-4 mr-2" />
            Auto Extract
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Email Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium text-muted-foreground w-16">Subject:</span>
            <DraggableText text={email.subject} fieldHint="subject">
              <span className="font-semibold">{email.subject}</span>
            </DraggableText>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground w-16">From:</span>
            <DraggableText text={email.sender_name || email.sender_email}>
              <User className="h-3.5 w-3.5" />
              {email.sender_name || email.sender_email}
            </DraggableText>
            {email.sender_name && (
              <span className="text-muted-foreground">({email.sender_email})</span>
            )}
          </div>
          {email.recipient_email && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground w-16">To:</span>
              <span>{email.recipient_email}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground w-16">Date:</span>
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(email.received_at), 'PPp')}
          </div>
        </div>
        
        <Separator />
        
        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4" />
                Attachments ({email.attachments.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {email.attachments.map((attachment) => (
                  <Badge key={attachment.id} variant="outline" className="py-1.5">
                    <Paperclip className="h-3 w-3 mr-1.5" />
                    <span className="max-w-[150px] truncate">{attachment.file_name}</span>
                    {attachment.file_size && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({Math.round(attachment.file_size / 1024)}KB)
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}
        
        {/* Email Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Body</span>
            <p className="text-xs text-muted-foreground">
              Select text and drag to form fields
            </p>
          </div>
          <ScrollArea className="flex-1 border rounded-md p-3 bg-muted/30">
            <div 
              className="text-sm whitespace-pre-wrap leading-relaxed select-text"
              onMouseUp={handleTextSelection}
            >
              {displayBody}
              {plainTextBody.length > 500 && (
                <>
                  {!showFullBody && '...'}
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setShowFullBody(!showFullBody)}
                  >
                    {showFullBody ? (
                      <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>
                </>
              )}
            </div>
          </ScrollArea>
          
          {/* Selected Text Quick Actions */}
          {selectedText && (
            <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Selected:</span>
                <DraggableText text={selectedText}>
                  <span className="text-xs font-medium truncate max-w-[200px]">
                    "{selectedText}"
                  </span>
                </DraggableText>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => setSelectedText('')}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
