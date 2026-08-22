'use server';

import { createClient } from '@/lib/supabase/server';

export async function extractTextFromPdfAction(
  formData: FormData
): Promise<{ success: boolean; text?: string; fileName?: string; numPages?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para procesar documentos.' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No se ha adjuntado ningún archivo.' };
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return { success: false, error: 'El archivo seleccionado debe ser un documento PDF.' };
    }

    // Limit size to 25MB for safety
    if (file.size > 25 * 1024 * 1024) {
      return { success: false, error: 'El archivo PDF no debe superar los 25 MB.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to prevent bundling issues in some environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);

    const extractedText = (pdfData.text || '').trim();

    if (!extractedText || extractedText.length < 10) {
      return {
        success: false,
        error: 'No se ha podido extraer texto legible del PDF. Comprueba que no sea un PDF escaneado como imagen.',
      };
    }

    return {
      success: true,
      text: extractedText,
      fileName: file.name,
      numPages: pdfData.numpages || 1,
    };
  } catch (err: unknown) {
    console.error('Error al extraer texto del PDF:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar el archivo PDF.',
    };
  }
}
