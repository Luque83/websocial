'use server';

import { createClient } from '@/lib/supabase/server';

export interface UploadDocumentResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export async function uploadProjectDocumentAction(formData: FormData): Promise<UploadDocumentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const file = formData.get('file') as File | null;
  const projectId = (formData.get('projectId') as string) || 'general';
  const category = (formData.get('category') as string) || 'evidencias';

  if (!file || file.size === 0) {
    return { success: false, error: 'No se ha seleccionado ningún archivo' };
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'El archivo supera el límite de 10 MB' };
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${user.id}/${projectId}/${category}/${Date.now()}_${cleanFileName}`;

  try {
    // 1. Intentar subir al bucket de Supabase Storage 'project-documents'
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('project-documents')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (!storageError && storageData) {
      const { data: publicUrlData } = supabase
        .storage
        .from('project-documents')
        .getPublicUrl(filePath);

      return {
        success: true,
        fileUrl: publicUrlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
      };
    }

    // 2. Respaldo determinista: Base64 Data URI si el bucket aún no está creado en la instancia de Supabase
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const dataUri = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      fileUrl: dataUri,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err: unknown) {
    console.error('Error subiendo archivo:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado subiendo el archivo',
    };
  }
}
