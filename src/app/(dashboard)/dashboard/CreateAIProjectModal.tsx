'use client';

import React, { useState } from 'react';
import { Sparkles, X, Loader2, ShieldCheck, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createProjectWithAI } from '@/app/actions/ai-project';
import { extractTextFromPdfAction } from '@/app/actions/pdf-extractor';
import styles from './ai-modal.module.css';

export function CreateAIProjectModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // PDF Upload states
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadedPdfInfo, setUploadedPdfInfo] = useState<{ name: string; pages: number } | null>(null);

  // Form fields
  const [convocatoriaText, setConvocatoriaText] = useState('');
  const [colectivo, setColectivo] = useState('Personas en situación de vulnerabilidad y exclusión');
  const [territorio, setTerritorio] = useState('Comunidad Autónoma');
  const [presupuestoMax, setPresupuestoMax] = useState('35000');
  const [duracionMeses, setDuracionMeses] = useState('12');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convocatoriaText.trim()) {
      setError('Por favor, escribe o pega el texto de la convocatoria o tu idea de proyecto.');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulación de pasos de progreso para feedback visual
    setLoadingStep('1/4: Analizando bases de la convocatoria y prioridades del financiador...');
    
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('2/4: Diseñando Matriz de Marco Lógico (Objetivos, Resultados y Actividades)...');
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('3/4: Calculando presupuesto equilibrado y costes de personal...');
    }, 5500);

    const stepTimer3 = setTimeout(() => {
      setLoadingStep('4/4: Redactando Memoria Técnica y Sistema de Indicadores...');
    }, 8500);

    try {
      const res = await createProjectWithAI({
        convocatoriaText,
        colectivo,
        territorio,
        presupuestoMax: parseFloat(presupuestoMax) || 35000,
        duracionMeses: parseInt(duracionMeses) || 12,
        customApiKey: customApiKey.trim() || undefined,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!res.success || !res.projectId) {
        setError(res.error || 'Error al generar el proyecto');
        setLoading(false);
        return;
      }

      setLoadingStep('¡Proyecto formulado con éxito! Redirigiendo a tu espacio de trabajo...');
      setTimeout(() => {
        router.push(`/dashboard/proyectos/${res.projectId}`);
      }, 1000);
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setError(err instanceof Error ? err.message : 'Error al conectar con el asistente de IA');
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await extractTextFromPdfAction(formData);
      if (!res.success || !res.text) {
        setError(res.error || 'No se pudo procesar el archivo PDF');
      } else {
        setConvocatoriaText(res.text);
        setUploadedPdfInfo({ name: res.fileName || file.name, pages: res.numPages || 1 });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={styles.triggerBtn}
        type="button"
      >
        <Sparkles size={18} color="#f59e0b" />
        <span>✨ Formular con IA (Convocatoria)</span>
      </button>

      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={styles.iconBadge}>
                  <Sparkles size={22} color="#2563eb" />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Asistente de Formulación con IA</h3>
                  <p className={styles.modalSubtitle}>
                    Sube el PDF de las bases oficiales o describe tu idea. La IA estructurará el proyecto completo.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => !loading && setIsOpen(false)} 
                className={styles.closeBtn}
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <Loader2 size={48} className={styles.spinner} />
                <h4 className={styles.loadingTitle}>Generando tu Proyecto Social</h4>
                <p className={styles.loadingStep}>{loadingStep}</p>
                <div className={styles.loadingBadge}>
                  <ShieldCheck size={16} /> Estructurando Marco Lógico, Presupuesto, Indicadores y Memoria
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                  <div className={styles.alertError}>
                    ⚠️ {error}
                  </div>
                )}

                {/* ZONA DE SUBIDA DE PDF DE BASES / CONVOCATORIA */}
                <div style={{
                  border: '2px dashed #93c5fd',
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af', fontWeight: 700, fontSize: '0.9375rem' }}>
                    <Upload size={20} color="#2563eb" />
                    <span>Subir Documento PDF de las Bases o Convocatoria</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#3b82f6' }}>
                    Extrae automáticamente todas las directrices, límites presupuestarios y objetivos del PDF oficial del BOE/Bases.
                  </p>

                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#2563eb',
                    color: 'white',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: isUploadingPdf ? 'not-allowed' : 'pointer',
                    marginTop: '0.25rem',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}>
                    {isUploadingPdf ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} /> Extrayendo texto del PDF...
                      </>
                    ) : (
                      <>
                        <FileText size={16} /> Seleccionar PDF de Convocatoria
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      disabled={isUploadingPdf}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {uploadedPdfInfo && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      marginTop: '0.25rem',
                      border: '1px solid #86efac'
                    }}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      PDF cargado: {uploadedPdfInfo.name} ({uploadedPdfInfo.pages} páginas analizadas)
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Texto Extraído de las Bases o Idea del Proyecto <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={convocatoriaText}
                    onChange={(e) => setConvocatoriaText(e.target.value)}
                    placeholder="El texto extraído del PDF aparecerá aquí, o puedes escribir directamente tu idea..."
                    required
                  />
                  <span className={styles.hint}>
                    Puedes editar o complementar el texto extraído antes de generar el proyecto con IA.
                  </span>
                </div>

                <div className={styles.row2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Colectivo Destinatario</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={colectivo}
                      onChange={(e) => setColectivo(e.target.value)}
                      placeholder="Ej: Mujeres víctimas de violencia, Jóvenes extutelados..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Territorio / Ámbito</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={territorio}
                      onChange={(e) => setTerritorio(e.target.value)}
                      placeholder="Ej: Comunidad de Madrid, Distrito de Usera..."
                    />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Presupuesto Máximo Subvencionable (€)</label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      className={styles.input}
                      value={presupuestoMax}
                      onChange={(e) => setPresupuestoMax(e.target.value)}
                      placeholder="35000"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Duración de Ejecución (Meses)</label>
                    <select
                      className={styles.input}
                      value={duracionMeses}
                      onChange={(e) => setDuracionMeses(e.target.value)}
                    >
                      <option value="6">6 meses</option>
                      <option value="9">9 meses</option>
                      <option value="12">12 meses (Anual)</option>
                      <option value="24">24 meses (Plurianual)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontSize: '0.8125rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                  >
                    {showAdvanced ? '− Ocultar opciones avanzadas' : '+ Opciones avanzadas (Clave API propia)'}
                  </button>
                </div>

                {showAdvanced && (
                  <div className={styles.formGroup} style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <label className={styles.label}>Google Gemini API Key (Opcional)</label>
                    <input
                      type="password"
                      className={styles.input}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                    />
                    <span className={styles.hint}>
                      Si no introduces una clave, se utilizará el modelo de respaldo predeterminado del sistema.
                    </span>
                  </div>
                )}

                <div className={styles.footer}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={styles.cancelBtn}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.generateBtn}
                  >
                    <Sparkles size={18} />
                    <span>Generar Proyecto Completo con IA</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
