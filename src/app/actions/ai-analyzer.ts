'use server';

import { createClient } from '@/lib/supabase/server';
import { analyzeConvocatoriaWithAI, ConvocatoriaAnalysisResult } from '@/lib/ai/callAnalyzer';

export async function analyzeConvocatoriaAction(
  convocatoriaText: string,
  customApiKey?: string
): Promise<{ success: boolean; data?: ConvocatoriaAnalysisResult; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Debes iniciar sesión para utilizar el analizador documental con IA.' };
  }

  if (!convocatoriaText || convocatoriaText.trim().length < 20) {
    return { success: false, error: 'Por favor, introduce al menos 20 caracteres del texto de la convocatoria o bases.' };
  }

  try {
    const analysis = await analyzeConvocatoriaWithAI(convocatoriaText, customApiKey);
    return { success: true, data: analysis };
  } catch (err: unknown) {
    console.error('Error en analyzeConvocatoriaAction:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error inesperado al analizar el documento con IA.' 
    };
  }
}
