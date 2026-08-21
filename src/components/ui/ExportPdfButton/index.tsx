'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExportPdfButtonProps {
  targetId: string;
  filename: string;
  projectName?: string;
}

export function ExportPdfButton({ targetId, filename, projectName }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Import html2pdf dynamically so it doesn't break SSR
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById(targetId);
      if (!element) {
        throw new Error('No se encontró el elemento con id ' + targetId);
      }

      // Hide elements that shouldn't be in the PDF (buttons, etc.)
      const noPrintElements = element.querySelectorAll('.no-print');
      noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');

      const opt = {
        margin:       15,
        filename:     `${projectName ? projectName.replace(/[^a-z0-9]/gi, '_') + '_' : ''}${filename}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();

      // Restore elements
      noPrintElements.forEach(el => (el as HTMLElement).style.display = '');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Hubo un error al exportar el PDF. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className="no-print"
      title="Exportar a PDF"
    >
      <Download size={16} style={{ marginRight: '8px' }} />
      {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
    </Button>
  );
}
