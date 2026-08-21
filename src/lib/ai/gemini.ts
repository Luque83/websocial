import { GoogleGenAI } from '@google/genai';

export interface AIProjectInput {
  convocatoriaText: string;
  colectivo?: string;
  territorio?: string;
  presupuestoMax?: number;
  duracionMeses?: number;
  customApiKey?: string;
}

export interface GeneratedProjectData {
  name: string;
  description: string;
  marcoLogico: {
    finDescription: string;
    finIndicator: string;
    finSource: string;
    finAssumption: string;
    propositoDescription: string;
    propositoIndicator: string;
    propositoSource: string;
    propositoAssumption: string;
    objectives: Array<{
      id: string;
      description: string;
      indicator: string;
      source: string;
      assumption: string;
      results: Array<{
        id: string;
        description: string;
        indicator: string;
        source: string;
        assumption: string;
        activities: Array<{
          id: string;
          description: string;
          resources: string;
          cost: string;
          assumption: string;
        }>;
      }>;
    }>;
  };
  costes: {
    durationMonths: number;
    indirectPct: number;
    aportacionPropia: number;
    partidas: Array<{
      id: string;
      category: string;
      description: string;
      monthlyAmount: number;
      months: number;
    }>;
  };
  indicadores: {
    indicadores: Array<{
      id: string;
      name: string;
      type: 'cuantitativo' | 'porcentaje' | 'cualitativo';
      fuenteVerificacion: string;
      baseline: number;
      target: number;
      current: number;
    }>;
  };
  cronograma: {
    durationMonths: number;
    activities: Array<{
      id: string;
      description: string;
      responsible: string;
      startMonth: number;
      endMonth: number;
    }>;
  };
  memoria: {
    contexto: string;
    destinatarios: string;
    objetivos: string;
    metodologia: string;
    actividades: string;
    cronograma: string;
    evaluacion: string;
    presupuesto: string;
  };
}

export async function generateSocialProjectWithAI(input: AIProjectInput): Promise<GeneratedProjectData> {
  const apiKey = input.customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Retornamos un proyecto formulado con el motor de plantillas experto si no hay API Key configurada
    return generateFallbackSocialProject(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Eres el Evaluador y Formulador Principal de Proyectos Sociales del Tercer Sector en España, con más de 20 años de experiencia en convocatorias del IRPF (0,7% social), FSE+, Ministerio de Derechos Sociales, Comunidades Autónomas y Ayuntamientos.

Tu tarea es recibir información sobre una convocatoria o idea de proyecto social y generar una FORMULACIÓN TÉCNICA COMPLETA y rigurosa en formato JSON EXACTO.

Instrucciones de formulación:
1. El Nombre del Proyecto debe ser técnico, conciso y formal (ej: "Programa IMPULSA: Itinerarios integrales de inserción sociolaboral para mujeres en situación de vulnerabilidad").
2. El Marco Lógico debe seguir la metodología internacional GTZ/UE con Fin (Impacto a largo plazo), Propósito (Objetivo General), 2-3 Objetivos Específicos con Resultados medibles y Actividades concretas.
3. El Presupuesto debe estar perfectamente equilibrado dentro del límite indicado (${input.presupuestoMax || 35000} €), con aprox. 65-70% de Personal, partidas de material, actividades y un 9-10% de costes indirectos.
4. Los Indicadores deben ser SMART, con tipos (cuantitativo, porcentaje, cualitativo) y Fuentes de Verificación realistas.
5. El Cronograma debe distribuir las actividades a lo largo de ${input.duracionMeses || 12} meses.
6. La Memoria debe redactarse con lenguaje técnico formal, perspectiva de género e innovación social.

RESPONDE ÚNICAMENTE CON EL OBJETO JSON VÁLIDO SIN BLOQUES DE CÓDIGO MARKDOWN EXTRA.`;

    const userPrompt = `Formula un proyecto social completo con estos parámetros:
- Convocatoria / Idea: ${input.convocatoriaText}
- Colectivo prioritario: ${input.colectivo || 'Personas en situación de vulnerabilidad y exclusión social'}
- Territorio: ${input.territorio || 'Comunidad Autónoma'}
- Presupuesto máximo: ${input.presupuestoMax || 35000} €
- Duración: ${input.duracionMeses || 12} meses

Estructura JSON requerida:
{
  "name": "...",
  "description": "...",
  "marcoLogico": {
    "finDescription": "...",
    "finIndicator": "...",
    "finSource": "...",
    "finAssumption": "...",
    "propositoDescription": "...",
    "propositoIndicator": "...",
    "propositoSource": "...",
    "propositoAssumption": "...",
    "objectives": [
      {
        "id": "1",
        "description": "...",
        "indicator": "...",
        "source": "...",
        "assumption": "...",
        "results": [
          {
            "id": "1.1",
            "description": "...",
            "indicator": "...",
            "source": "...",
            "assumption": "...",
            "activities": [
              {
                "id": "1.1.1",
                "description": "...",
                "resources": "...",
                "cost": "...",
                "assumption": "..."
              }
            ]
          }
        ]
      }
    ]
  },
  "costes": {
    "durationMonths": ${input.duracionMeses || 12},
    "indirectPct": 10,
    "aportacionPropia": 0,
    "partidas": [
      { "id": "1", "category": "personal", "description": "...", "monthlyAmount": 0, "months": 12 }
    ]
  },
  "indicadores": {
    "indicadores": [
      { "id": "1", "name": "...", "type": "cuantitativo", "fuenteVerificacion": "...", "baseline": 0, "target": 50, "current": 0 }
    ]
  },
  "cronograma": {
    "durationMonths": ${input.duracionMeses || 12},
    "activities": [
      { "id": "1", "description": "...", "responsible": "...", "startMonth": 1, "endMonth": 12 }
    ]
  },
  "memoria": {
    "contexto": "...",
    "destinatarios": "...",
    "objetivos": "...",
    "metodologia": "...",
    "actividades": "...",
    "cronograma": "...",
    "evaluacion": "...",
    "presupuesto": "..."
  }
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

    const responseText = response.text || '';
    const cleanJson = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed as GeneratedProjectData;
  } catch (error) {
    console.error('Error llamando a Gemini API, usando generador experto de respaldo:', error);
    return generateFallbackSocialProject(input);
  }
}

function generateFallbackSocialProject(input: AIProjectInput): GeneratedProjectData {
  const dur = input.duracionMeses || 12;
  const maxCost = input.presupuestoMax || 36000;
  const col = input.colectivo || 'personas en situación de vulnerabilidad social';
  const ter = input.territorio || 'ámbito autonómico';
  
  const monthlyPersonal = Math.round(((maxCost * 0.65) / dur) * 100) / 100;
  const monthlyMaterial = Math.round(((maxCost * 0.15) / dur) * 100) / 100;
  const monthlyActividades = Math.round(((maxCost * 0.10) / dur) * 100) / 100;

  return {
    name: `Proyecto Integrar: Itinerarios de inclusión e impacto para ${col} en ${ter}`,
    description: `Programa de intervención social integral dirigido a mejorar la autonomía, empleabilidad y bienestar de ${col} mediante atención individualizada y comunitaria.`,
    marcoLogico: {
      finDescription: `Contribuir a la reducción de la brecha de desigualdad y exclusión social en ${ter}, facilitando la plena integración social y laboral de ${col}.`,
      finIndicator: `Tasa de inserción sociolaboral y mejora del índice de autonomía personal en un 40% de las personas participantes.`,
      finSource: `Informes del Observatorio de Exclusión Social, encuestas de calidad de vida y registros de la Seguridad Social.`,
      finAssumption: `Estabilidad socioeconómica y mantenimiento de las redes de derivación de servicios sociales en el territorio.`,
      propositoDescription: `Desarrollar itinerarios personalizados de acompañamiento social, formativo y competencial para 50 ${col}.`,
      propositoIndicator: `Al menos 50 personas inician el itinerario y el 80% completa con éxito su plan de intervención individualizado.`,
      propositoSource: `Fichas de acogida, expedientes individuales de intervención y actas de seguimiento técnico.`,
      propositoAssumption: `Adhesión y compromiso continuado de las personas participantes a lo largo del proceso de intervención.`,
      objectives: [
        {
          id: '1',
          description: `Diagnóstico y diseño de planes de trabajo individualizados de apoyo social y competencial.`,
          indicator: `50 diagnósticos sociolaborales y planes de intervención individualizados firmados.`,
          source: `Entrevistas de diagnóstico inicial y acuerdos de intervención.`,
          assumption: `Coordinación fluida con los centros municipales de servicios sociales de referencia.`,
          results: [
            {
              id: '1.1',
              description: `Protocolo de acogida, valoración de necesidades y mapa competencial ejecutado.`,
              indicator: `100% de las personas derivadas cuentan con informe diagnóstico en menos de 15 días.`,
              source: `Registro de derivaciones y fichas técnicas de acogida.`,
              assumption: `Disponibilidad de las personas para las citas de valoración.`,
              activities: [
                {
                  id: '1.1.1',
                  description: `Entrevistas individuales de diagnóstico social y detección de factores de vulnerabilidad.`,
                  resources: `Trabajador/a Social y sala de atención confidencial.`,
                  cost: '0',
                  assumption: `Asistencia puntual de las personas usuarias.`
                },
                {
                  id: '1.1.2',
                  description: `Elaboración conjunta del Plan Individualizado de Inserción (PII).`,
                  resources: `Herramientas de evaluación diagnóstica.`,
                  cost: '0',
                  assumption: `Voluntariedad e implicación de la persona.`
                }
              ]
            }
          ]
        },
        {
          id: '2',
          description: `Capacitación formativa en habilidades prelaborales, competencias digitales y empoderamiento.`,
          indicator: `4 talleres grupales ejecutados con al menos 40 participantes formados.`,
          source: `Listados de asistencia firmados y cuestionarios de evaluación de competencias.`,
          assumption: `Mantenimiento de los espacios formativos y recursos tecnológicos adecuados.`,
          results: [
            {
              id: '2.1',
              description: `Módulos formativos prácticos en competencias digitales básicas y búsqueda activa de empleo impartidos.`,
              indicator: `80% de asistencia media y valoración de satisfacción superior a 4,5 sobre 5.`,
              source: `Hojas de firmas diarias y encuestas de satisfacción.`,
              assumption: `Motivación de los alumnos y adecuación del nivel pedagógico.`,
              activities: [
                {
                  id: '2.1.1',
                  description: `Talleres de alfabetización digital y trámites electrónicos con la administración pública.`,
                  resources: `Aula de informática y material didáctico.`,
                  cost: '1500',
                  assumption: `Conectividad a internet estable en las aulas.`
                },
                {
                  id: '2.1.2',
                  description: `Sesiones de entrenamiento en habilidades sociales, comunicación y preparación de entrevistas.`,
                  resources: `Educador/a Social y dinámicas de grupo.`,
                  cost: '500',
                  assumption: `Clima de confianza y respeto grupal.`
                }
              ]
            }
          ]
        }
      ]
    },
    costes: {
      durationMonths: dur,
      indirectPct: 10,
      aportacionPropia: 0,
      partidas: [
        {
          id: '1',
          category: 'personal',
          description: `Técnico/a de Proyecto - Trabajador/a Social (Coste Empresa)`,
          monthlyAmount: monthlyPersonal,
          months: dur
        },
        {
          id: '2',
          category: 'material',
          description: `Material didáctico, licencias y suministros directos del proyecto`,
          monthlyAmount: monthlyMaterial,
          months: dur
        },
        {
          id: '3',
          category: 'actividades',
          description: `Gastos de ejecución de talleres, dinamización y transporte de participantes`,
          monthlyAmount: monthlyActividades,
          months: dur
        }
      ]
    },
    indicadores: {
      indicadores: [
        {
          id: '1',
          name: `Número de personas usuarias atendidas en itinerarios`,
          type: 'cuantitativo',
          fuenteVerificacion: `Fichas de acogida y registro de participantes con DNI/NIE`,
          baseline: 0,
          target: 50,
          current: 0
        },
        {
          id: '2',
          name: `Talleres formativos grupales realizados`,
          type: 'cuantitativo',
          fuenteVerificacion: `Listados de asistencia firmados y memoria pedagógica`,
          baseline: 0,
          target: 4,
          current: 0
        },
        {
          id: '3',
          name: `Porcentaje de personas que mejoran su empleabilidad y autonomía`,
          type: 'porcentaje',
          fuenteVerificacion: `Cuestionarios de evaluación competencial y contratos de trabajo`,
          baseline: 0,
          target: 75,
          current: 0
        },
        {
          id: '4',
          name: `Guía de recursos de apoyo social y empleo editada`,
          type: 'cualitativo',
          fuenteVerificacion: `Documento técnico en formato PDF y registro de distribución`,
          baseline: 0,
          target: 1,
          current: 0
        }
      ]
    },
    cronograma: {
      durationMonths: dur,
      activities: [
        { id: '1', description: 'Coordinación inicial y puesta en marcha con servicios sociales', responsible: 'Coordinador/a', startMonth: 1, endMonth: 2 },
        { id: '2', description: 'Acogida, diagnóstico social e itinerarios individualizados', responsible: 'Trabajador/a Social', startMonth: 2, endMonth: 10 },
        { id: '3', description: 'Impartición de talleres formativos y competencias digitales', responsible: 'Educador/a Social', startMonth: 3, endMonth: 9 },
        { id: '4', description: 'Acompañamiento en inserción y prospección en el entorno', responsible: 'Equipo Técnico', startMonth: 4, endMonth: 11 },
        { id: '5', description: 'Evaluación final de impacto y redacción de memoria justificativa', responsible: 'Coordinador/a', startMonth: 11, endMonth: 12 }
      ]
    },
    memoria: {
      contexto: `La situación de ${col} en ${ter} requiere de respuestas integrales y coordinadas que aborden las múltiples dimensiones de la exclusión social. La falta de oportunidades laborales, la brecha digital y la escasez de redes de apoyo formal intensifican los factores de vulnerabilidad. Este proyecto nace para dar respuesta a las necesidades detectadas en el territorio mediante un modelo de intervención centrado en la persona y basado en derechos.`,
      destinatarios: `El proyecto se dirige a 50 ${col} residentes en ${ter}, priorizando a aquellas personas con cargas familiares no compartidas, desempleo de larga duración o escasa cualificación formativa.`,
      objetivos: `OBJETIVO GENERAL:\nDesarrollar itinerarios personalizados de acompañamiento social, formativo y competencial para 50 ${col}.\n\nOBJETIVOS ESPECÍFICOS:\n1. Diseñar e implementar planes de trabajo individualizados de apoyo social y competencial.\n2. Mejorar las competencias digitales y habilidades para la autonomía e inserción social.`,
      metodologia: `El proyecto aplica la Metodología de Acompañamiento Social Centrado en la Persona (PCP), incorporando de forma transversal la perspectiva de género, la no discriminación y la accesibilidad universal. La intervención se estructura en 4 fases: Acogida y Diagnóstico, Capacitación Grupal, Tutorización Individualizada y Evaluación de Impacto.`,
      actividades: `1. Entrevistas individuales de valoración diagnóstica y diseño del Plan de Intervención.\n2. Talleres de competencias digitales básicas y trámites electrónicos con la administración.\n3. Sesiones grupales de empoderamiento, comunicación y habilidades para la vida.\n4. Tutorías de seguimiento mensual y derivación a recursos especializados.`,
      cronograma: `Duración total de ${dur} meses, iniciando con la fase de diagnóstico (Meses 1-2), desarrollo formativo e intervención continuada (Meses 3-10) y cierre y evaluación final (Meses 11-12).`,
      evaluacion: `Sistema de evaluación continua basado en indicadores cuantitativos (50 personas atendidas, 4 talleres) y cualitativos (mejora de competencias, grado de satisfacción). Se utilizarán listados de firmas, rúbricas de competencias y encuestas de satisfacción.`,
      presupuesto: `Presupuesto total estimado de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(maxCost)}, con un desglose equilibrado entre costes directos de personal técnico (65%), suministros y actividades formativas (25%) y costes indirectos de gestión (10%).`
    }
  };
}
