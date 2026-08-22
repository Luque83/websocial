import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para procesar documentos.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha adjuntado ningún archivo.' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un documento PDF.' },
        { status: 400 }
      );
    }

    // Limit to 30MB
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo PDF no debe superar los 30 MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);

    const extractedText = (pdfData.text || '').trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se ha podido extraer texto legible del PDF. Comprueba que no sea un PDF escaneado como imagen plana.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      numPages: pdfData.numpages || 1,
    });
  } catch (err: unknown) {
    console.error('Error in /api/extract-pdf:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Error procesando el documento PDF.',
      },
      { status: 500 }
    );
  }
}
