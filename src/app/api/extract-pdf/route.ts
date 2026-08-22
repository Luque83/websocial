import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractText } from 'unpdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Polyfill DOMMatrix for node environments if needed
if (typeof (globalThis as unknown as { DOMMatrix?: unknown }).DOMMatrix === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    transformPoint(point: unknown) { return point; }
    inverse() { return this; }
    toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
  };
}

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
    const uint8Array = new Uint8Array(arrayBuffer);

    let extractedText = '';
    let totalPages = 1;

    try {
      const result = await extractText(uint8Array);
      extractedText = Array.isArray(result.text) ? result.text.join('\n\n') : String(result.text || '');
      totalPages = result.totalPages || 1;
    } catch (unpdfErr) {
      console.warn('unpdf fallback to pdf-parse:', unpdfErr);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(Buffer.from(arrayBuffer));
      extractedText = (pdfData.text || '').trim();
      totalPages = pdfData.numpages || 1;
    }

    extractedText = extractedText.trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se ha podido extraer texto legible del PDF. Comprueba que no sea un PDF escaneado como imagen plana sin capa de texto.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      numPages: totalPages,
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
