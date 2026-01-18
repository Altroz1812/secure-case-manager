import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PdfGenerationResult {
  success: boolean;
  html: string;
  filename: string;
  reportType: string;
  version: number;
}

export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = async (reportId: string): Promise<void> => {
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to download reports');
      }

      const { data, error } = await supabase.functions.invoke<PdfGenerationResult>('generate-pdf-report', {
        body: { reportId },
      });

      if (error) {
        throw error;
      }

      if (!data?.success || !data?.html) {
        throw new Error('Failed to generate PDF content');
      }

      // Open the HTML in a new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Please allow popups to download the report');
      }

      printWindow.document.write(data.html);
      printWindow.document.close();

      // Add print functionality
      printWindow.onload = () => {
        // Add a small delay to ensure styles are loaded
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };

      toast.success('Report ready for download', {
        description: `Use your browser's print dialog to save as PDF (${data.filename})`,
      });

    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsHtml = async (reportId: string): Promise<void> => {
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to download reports');
      }

      const { data, error } = await supabase.functions.invoke<PdfGenerationResult>('generate-pdf-report', {
        body: { reportId },
      });

      if (error) {
        throw error;
      }

      if (!data?.success || !data?.html) {
        throw new Error('Failed to generate report content');
      }

      // Create a Blob and download as HTML
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');

    } catch (error: any) {
      console.error('HTML download error:', error);
      toast.error('Failed to download report', {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePdf,
    downloadAsHtml,
    isGenerating,
  };
}
