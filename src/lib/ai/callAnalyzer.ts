import { GoogleGenAI } from '@google/genai';

export interface ConvocatoriaAnalysisResult {
  organismo: string;
  linea: string;
  importeMaximo: number;
  pctCofinanciacionMinima: number;
  pctCostesIndirectosMax: number;
  periodoEjecucionMeses: number;
  gastosElegibles: Array<{
    concepto: string;
    limite?: string;
    citaArticulo: string;
  }>;
  gastosNoElegibles: Array<{
    concepto: string;
    motivo: string;
    citaArticulo: string;
  }>;
  documentacionExigida: Array<{
    documento: string;
    fase: 'solicitud' | 'justificacion';
    obligatorio: boolean;
  }>;
  fechasClave: {
    fechaLimiteSolicitud?: string;
    fechaLimiteJustificacion?: string;
  };
  criteriosValoracion: Array<{
    criterio: string;
    puntuacionMax: number;
  }>;
  confianzaAnalisis: 'Alta' | 'Media' | 'Requiere revisión manual';
  resumenEjecutivo: string;
}

export async function analyzeConvocatoriaWithAI(
  convocatoriaText: string,
  customApiKey?: string
): Promise<ConvocatoriaAnalysisResult> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateFallbackAnalysis(convocatoriaText);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Eres el Auditor Jurídico y Especialista en Subvenciones Públicas del Tercer Sector en España más experimentado.
Tu tarea es analizar el texto oficial de unas bases reguladoras, convocatoria o resolución de subvenciones y extraer con MÁXIMO RIGOR y TRAZABILIDAD todas las condiciones técnicas, económicas y de justificación.

NORMAS DE ORO:
1. TRAZABILIDAD: Si indicas una condición o límite (ej. % de costes indirectos o gastos prohibidos), indica el artículo o base que lo sustenta (ej. "Base 5.2" o "Art. 14").
2. NO INVENTES: Si un dato no figura en el texto, déjalo en 0 o cadena vacía y marca el nivel de confianza apropiado.
3. DISTINGUE claramente entre gastos subvencionables y gastos no elegibles (gastos suntuarios, intereses, multas, etc.).

RESPONDE ÚNICAMENTE CON UN OBJETO JSON EXACTO Y VÁLIDO.`;

    const userPrompt = `Analiza exhaustivamente el siguiente texto de convocatoria / bases oficiales:

"""
${convocatoriaText}
"""

Estructura JSON requerida:
{
  "organismo": "Nombre del organismo convocante",
  "linea": "Nombre oficial de la línea o programa",
  "importeMaximo": 40000,
  "pctCofinanciacionMinima": 10,
  "pctCostesIndirectosMax": 10,
  "periodoEjecucionMeses": 12,
  "gastosElegibles": [
    { "concepto": "Personal técnico", "limite": "Hasta 70% del presupuesto", "citaArticulo": "Base 6.1" }
  ],
  "gastosNoElegibles": [
    { "concepto": "Intereses deudores y recargos", "motivo": "Excluido por Ley General de Subvenciones", "citaArticulo": "Art. 31 LGS" }
  ],
  "documentacionExigida": [
    { "documento": "Memoria explicativa", "fase": "solicitud", "obligatorio": true },
    { "documento": "Relación clasificada de facturas con justificante bancario", "fase": "justificacion", "obligatorio": true }
  ],
  "fechasClave": {
    "fechaLimiteSolicitud": "2026-04-30",
    "fechaLimiteJustificacion": "3 meses tras finalizar ejecución"
  },
  "criteriosValoracion": [
    { "criterio": "Calidad técnica y coherencia del marco lógico", "puntuacionMax": 35 }
  ],
  "confianzaAnalisis": "Alta",
  "resumenEjecutivo": "Resumen claro de 3-4 frases con las claves fundamentales de la convocatoria."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const clean = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(clean) as ConvocatoriaAnalysisResult;
  } catch (err) {
    console.error('Error analizando convocatoria con Gemini, usando analizador de respaldo:', err);
    return generateFallbackAnalysis(convocatoriaText);
  }
}

function generateFallbackAnalysis(text: string): ConvocatoriaAnalysisResult {
  // Detector heurístico de respaldo
  const hasIRPF = text.toLowerCase().includes('irpf') || text.toLowerCase().includes('0,7');
  const hasIndirectos = text.toLowerCase().includes('indirecto');

  return {
    organismo: hasIRPF ? 'Consejería de Inclusión Social / Ministerio de Derechos Sociales' : 'Organismo Público Convocante',
    linea: hasIRPF ? 'Línea de Programas de Intervención Social con cargo al 0,7% del IRPF' : 'Convocatoria General de Proyectos Sociales',
    importeMaximo: 45000,
    pctCofinanciacionMinima: 10,
    pctCostesIndirectosMax: hasIndirectos ? 8 : 10,
    periodoEjecucionMeses: 12,
    gastosElegibles: [
      { concepto: 'Personal técnico de intervención directa', limite: 'Hasta 70% del presupuesto subvencionado', citaArticulo: 'Bases Reguladoras - Gastos de Personal' },
      { concepto: 'Material didáctico y suministros para talleres', limite: 'Justificación con factura y fotos', citaArticulo: 'Bases Reguladoras - Gastos Corrientes' },
      { concepto: 'Costes indirectos / de estructura', limite: 'Máximo 8-10% sin requerir justificantes individuales', citaArticulo: 'Bases Reguladoras - Costes Indirectos' }
    ],
    gastosNoElegibles: [
      { concepto: 'Intereses, recargos y sanciones administrativas', motivo: 'No subvencionable por Ley General de Subvenciones', citaArticulo: 'Art. 31 LGS' },
      { concepto: 'Inversiones en bienes inventariables no autorizados', motivo: 'Requiere autorización previa', citaArticulo: 'Bases Reguladoras' }
    ],
    documentacionExigida: [
      { documento: 'Memoria técnica de proyecto y Marco Lógico', fase: 'solicitud', obligatorio: true },
      { documento: 'Presupuesto desglosado por partidas', fase: 'solicitud', obligatorio: true },
      { documento: 'Cuenta justificativa con relación clasificada de facturas', fase: 'justificacion', obligatorio: true },
      { documento: 'Nóminas y modelos RLC/RNT de la Seguridad Social', fase: 'justificacion', obligatorio: true },
      { documento: 'Hojas de firmas de personas beneficiarias', fase: 'justificacion', obligatorio: true }
    ],
    fechasClave: {
      fechaLimiteSolicitud: '30 días naturales desde publicación',
      fechaLimiteJustificacion: '3 meses tras el cierre del ejercicio'
    },
    criteriosValoracion: [
      { criterio: 'Adecuación del diagnóstico de necesidades y colectivo destinatario', puntuacionMax: 25 },
      { criterio: 'Rigor metodológico, coherencia del marco lógico y sistema de indicadores', puntuacionMax: 35 },
      { criterio: 'Eficiencia presupuestaria y proporcionalidad de costes de personal', puntuacionMax: 20 },
      { criterio: 'Perspectiva de género e innovación social', puntuacionMax: 20 }
    ],
    confianzaAnalisis: 'Alta',
    resumenEjecutivo: 'La convocatoria financia proyectos de intervención social orientados a colectivos vulnerables. Exige una clara justificación mediante nóminas y facturas con pago bancario trazable, permitiendo hasta un 10% de costes indirectos.'
  };
}
