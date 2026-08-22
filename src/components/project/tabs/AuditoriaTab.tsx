'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Building2,
  DollarSign
} from 'lucide-react';
import type { CrossValidationIssue } from '@/types/grant-lifecycle';
import styles from '../ProjectWorkspace/ProjectWorkspace.module.css';

interface AuditoriaTabProps {
  auditScore: number;
  auditIssues: CrossValidationIssue[];
  projectName: string;
  subvencion: {
    organismo?: string;
    linea?: string;
    expedienteNum?: string;
    importeSolicitado?: number;
    importeConcedido?: number;
    aportacionPropia?: number;
    fechaInicio?: string;
    fechaFin?: string;
  };
  diagnostico: {
    colectivo?: string;
    justificacion?: string;
    beneficiariosDirectos?: number;
    localizacion?: string;
  };
  marcoLogico: {
    objetivoGeneral?: string;
    objetivosEspecificos?: Array<{
      id: string;
      code?: string;
      name?: string;
      actividades?: Array<{ id: string; name: string; targetBeneficiaries?: number; startMonth?: number; endMonth?: number }>;
      indicadores?: Array<{ id: string; name: string; target?: number; baseline?: number; source?: string }>;
    }>;
  };
  personal: Array<{
    id: string;
    name: string;
    role: string;
    monthlySalary: number;
    ssPct: number;
    weeklyHours: number;
    maxWeeklyHours: number;
    months: number;
  }>;
  presupuesto: {
    partidas?: Array<{
      id: string;
      category: string;
      description: string;
      costeReal: number;
    }>;
    indirectPct?: number;
    grantAmount?: number;
  };
  gastosFacturas: Array<{
    id: string;
    proveedor: string;
    nif?: string;
    numFactura: string;
    fecha: string;
    concepto?: string;
    totalFactura: number;
    pctImputado: number;
    importeImputado: number;
    justificantePago: boolean;
  }>;
  nominasMensuales?: Array<{
    id: string;
    workerName: string;
    role: string;
    periodoMes: string;
    salarioBruto: number;
    ssPatronal: number;
    costeEmpresaTotal: number;
    pctImputado: number;
    importeImputado: number;
    justificantePago: boolean;
  }>;
  formatCurrency: (n: number) => string;
}

export function AuditoriaTab({
  auditScore,
  auditIssues,
  projectName,
  subvencion,
  diagnostico,
  marcoLogico,
  personal,
  presupuesto,
  gastosFacturas,
  nominasMensuales = [],
  formatCurrency,
}: AuditoriaTabProps) {
  const [copied, setCopied] = useState(false);
  const [activeReport, setActiveReport] = useState<'auditor' | 'cuenta_justificativa' | 'memoria_tecnica'>('auditor');

  const totalNominas = nominasMensuales.reduce((acc, n) => acc + (n.importeImputado || 0), 0);
  const totalFacturas = gastosFacturas.reduce((acc, f) => acc + (f.importeImputado || 0), 0);
  const totalGastoImputado = totalNominas + totalFacturas;
  const totalConcedido = subvencion.importeConcedido || 0;
  const desviacionGasto = totalGastoImputado - totalConcedido;

  const handleCopyMemoria = () => {
    const el = document.getElementById('printable-official-memoria');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.contentCard}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}><ShieldCheck size={20} color="#16C7B2" /> 8. Auditoría de Coherencia y Justificación Oficial</h2>
          <p className={styles.sectionSubtitle}>
            Escaneo preventivo de cumplimiento normativo y generación automática de la Memoria Técnica y Cuenta Justificativa para el organismo financiador.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={handlePrint} className={styles.exportBtn}>
            <Printer size={15} /> Imprimir / PDF Oficial
          </button>
          <button type="button" onClick={handleCopyMemoria} className={styles.exportBtn}>
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            {copied ? '¡Copiado!' : 'Copiar Texto'}
          </button>
        </div>
      </div>

      {/* Selector de Vistas de Justificación */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveReport('auditor')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeReport === 'auditor' ? '#0D3A5F' : '#EAF5FB',
            color: activeReport === 'auditor' ? '#ffffff' : '#0D3A5F',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          🛡️ Auditor de Coherencia ({auditScore}/100)
        </button>
        <button
          type="button"
          onClick={() => setActiveReport('cuenta_justificativa')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeReport === 'cuenta_justificativa' ? '#0D3A5F' : '#EAF5FB',
            color: activeReport === 'cuenta_justificativa' ? '#ffffff' : '#0D3A5F',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          📊 Cuenta Justificativa Económica
        </button>
        <button
          type="button"
          onClick={() => setActiveReport('memoria_tecnica')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeReport === 'memoria_tecnica' ? '#0D3A5F' : '#EAF5FB',
            color: activeReport === 'memoria_tecnica' ? '#ffffff' : '#0D3A5F',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          📝 Memoria Técnica y de Actividades
        </button>
      </div>

      {/* 1. AUDITOR DE COHERENCIA CRUZADA */}
      {activeReport === 'auditor' && (
        <div>
          <div className={styles.auditorBanner} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`${styles.auditScoreCircle} ${auditScore >= 85 ? styles.auditScoreGood : auditScore >= 60 ? styles.auditScoreWarn : styles.auditScoreBad}`}>
                {auditScore}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>
                  {auditScore >= 85 ? 'Expediente Conforme y Coherente' : auditScore >= 60 ? 'Advertencias Detectadas — Revisar Antes de Justificar' : 'Riesgo Crítico de Reintegro'}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#5C7E9B' }}>
                  {auditIssues.length === 0 ? 'No se han detectado inconsistencias entre objetivos, actividades, nóminas y facturas.' : `Se han identificado ${auditIssues.length} puntos de control que requieren tu atención.`}
                </p>
              </div>
            </div>
          </div>

          <div>
            {auditIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#F0FDFA', borderRadius: '10px', border: '1px solid #99F6E4' }}>
                <CheckCircle2 size={32} color="#0D9488" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                <strong style={{ color: '#0F766E' }}>¡Auditoría Preventiva Superada con Éxito!</strong>
                <p style={{ fontSize: '0.8125rem', color: '#115E59', margin: '0.25rem 0 0 0' }}>
                  El proyecto cumple las reglas de cofinanciación, jornadas laborales legales, justificación bancaria y congruencia técnica.
                </p>
              </div>
            ) : (
              auditIssues.map((issue) => {
                const isError = issue.severity === 'error';
                return (
                  <div key={issue.id} className={`${styles.issueCard} ${isError ? styles.issueCardError : styles.issueCardWarning}`}>
                    {isError ? <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} /> : <ShieldAlert size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.875rem', color: isError ? '#991B1B' : '#92400E' }}>{issue.title}</strong>
                        {issue.citationRule && (
                          <span style={{ fontSize: '0.6875rem', background: '#E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#334155', fontWeight: 700 }}>
                            {issue.citationRule}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.8125rem', color: '#475569' }}>
                        {issue.message}
                      </p>
                      {issue.suggestedAction && (
                        <div style={{ fontSize: '0.75rem', color: '#0D3A5F', fontWeight: 700, marginTop: '0.2rem' }}>
                          💡 Acción recomendada: {issue.suggestedAction}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. CUENTA JUSTIFICATIVA ECONÓMICA */}
      {activeReport === 'cuenta_justificativa' && (
        <div id="printable-official-memoria">
          <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 800, color: '#0D3A5F' }}>
              Liquidación Económica del Proyecto: {projectName}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Concesión Oficial</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D3A5F' }}>{formatCurrency(totalConcedido)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Gasto Imputado Total</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#009E96' }}>{formatCurrency(totalGastoImputado)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Desviación / Saldo</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: desviacionGasto < 0 ? '#D97706' : '#166534' }}>
                  {formatCurrency(desviacionGasto)}
                </div>
              </div>
            </div>
          </div>

          {/* A. Nóminas y Personal */}
          {nominasMensuales.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0D3A5F', margin: '1rem 0 0.5rem 0' }}>
                A. Relación Justificativa de Nóminas y Seguridad Social del Personal:
              </h4>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Trabajador/a</th>
                      <th>Mes</th>
                      <th className={styles.numCol}>Bruto</th>
                      <th className={styles.numCol}>SS Patronal</th>
                      <th className={styles.numCol}>Coste Empresa</th>
                      <th className={styles.numCol}>% Imp.</th>
                      <th className={styles.numCol}>Imputado Subvención</th>
                      <th>Pago Bancario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nominasMensuales.map(nom => (
                      <tr key={nom.id}>
                        <td><strong>{nom.workerName}</strong> ({nom.role})</td>
                        <td>{nom.periodoMes}</td>
                        <td className={styles.numCol}>{formatCurrency(nom.salarioBruto)}</td>
                        <td className={styles.numCol}>{formatCurrency(nom.ssPatronal)}</td>
                        <td className={styles.numCol}>{formatCurrency(nom.costeEmpresaTotal)}</td>
                        <td className={styles.numCol}>{nom.pctImputado}%</td>
                        <td className={styles.numCol} style={{ fontWeight: 800, color: '#0D3A5F' }}>{formatCurrency(nom.importeImputado)}</td>
                        <td>
                          {nom.justificantePago ? (
                            <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.75rem', background: '#DCFCE7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              ✓ Acreditado SEPA
                            </span>
                          ) : (
                            <span style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', background: '#FEE2E2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              ⏳ Pendiente Justificante
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={6}>TOTAL GASTO PERSONAL IMPUTADO</td>
                      <td className={styles.numCol} style={{ color: '#0D3A5F' }}>{formatCurrency(totalNominas)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* B. Facturas y Proveedores */}
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0D3A5F', margin: '1rem 0 0.5rem 0' }}>
            B. Relación Clasificada de Facturas de Actividades y Suministros:
          </h4>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proveedor / Emisor</th>
                  <th>NIF</th>
                  <th>Nº Factura / Doc</th>
                  <th>Fecha</th>
                  <th className={styles.numCol}>Importe Total</th>
                  <th className={styles.numCol}>% Imputado</th>
                  <th className={styles.numCol}>Imputado Subvención</th>
                  <th>Pago Bancario</th>
                </tr>
              </thead>
              <tbody>
                {gastosFacturas.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.proveedor}</strong></td>
                    <td>{f.nif || 'N/A'}</td>
                    <td>{f.numFactura}</td>
                    <td>{f.fecha}</td>
                    <td className={styles.numCol}>{formatCurrency(f.totalFactura)}</td>
                    <td className={styles.numCol}>{f.pctImputado}%</td>
                    <td className={styles.numCol} style={{ fontWeight: 800, color: '#0D3A5F' }}>{formatCurrency(f.importeImputado)}</td>
                    <td>
                      {f.justificantePago ? (
                        <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.75rem', background: '#DCFCE7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          ✓ Acreditado SEPA
                        </span>
                      ) : (
                        <span style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', background: '#FEE2E2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          ⏳ Pendiente Justificante
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MEMORIA TÉCNICA Y DE ACTIVIDADES */}
      {activeReport === 'memoria_tecnica' && (
        <div id="printable-official-memoria" className={styles.docWrapper} style={{ background: '#FFFFFF', padding: '2rem', border: '1.5px solid #CBD5E1', borderRadius: '12px' }}>
          <div style={{ borderBottom: '3px solid #0D3A5F', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#5C7E9B', fontWeight: 800, textTransform: 'uppercase' }}>
              DOCUMENTO OFICIAL DE JUSTIFICACIÓN TÉCNICA · WEBSOCIAL
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0D3A5F', margin: '0.35rem 0' }}>
              Memoria de Actividades y Resultados: {projectName}
            </h1>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: '#475569', flexWrap: 'wrap' }}>
              <span><strong>Organismo:</strong> {subvencion.organismo || 'Administración Convocante'}</span>
              <span><strong>Expediente:</strong> {subvencion.expedienteNum || 'S/N'}</span>
              <span><strong>Periodo:</strong> {subvencion.fechaInicio || '2026-01-01'} a {subvencion.fechaFin || '2026-12-31'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
              1. Diagnóstico, Colectivo y Población Atendida
            </h3>
            <p style={{ fontSize: '0.9375rem', lineHeight: '1.7', color: '#334155' }}>
              {diagnostico.justificacion || 'El proyecto se ha desarrollado atendiendo a las necesidades detectadas en el colectivo de intervención.'}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#0D3A5F', fontWeight: 700 }}>
              Total de beneficiarios directos alcanzados: {diagnostico.beneficiariosDirectos || 0} personas en {diagnostico.localizacion || 'Territorio de intervención'}.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
              2. Cumplimiento de Objetivos y Ejecución de Actividades
            </h3>
            <p style={{ fontSize: '0.9375rem', lineHeight: '1.7', color: '#334155' }}>
              <strong>Objetivo General:</strong> {marcoLogico.objetivoGeneral || 'Garantizar la inclusión social y laboral de los colectivos destinatarios.'}
            </p>
            {(marcoLogico.objetivosEspecificos || []).map((oe, idx) => (
              <div key={oe.id} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0D3A5F' }}>Objetivo Específico {idx + 1}: {oe.name}</strong>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.875rem', color: '#334155' }}>
                  {(oe.actividades || []).map(act => (
                    <li key={act.id}>
                      <strong>{act.name}:</strong> Ejecutada entre los meses {act.startMonth || 1} y {act.endMonth || 12}. Alcance: {act.targetBeneficiaries || 0} participantes.
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.4rem' }}>
              3. Recursos Humanos y Nóminas Imputadas
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569' }}>
              El equipo profesional adscrito a la ejecución de las actividades ha estado integrado por:
            </p>
            <ul style={{ fontSize: '0.875rem', color: '#334155' }}>
              {personal.map(p => (
                <li key={p.id}>
                  <strong>{p.name}:</strong> {p.role} con dedicación de {p.weeklyHours}h/semana durante {p.months} meses (Salario bruto: {formatCurrency(p.monthlySalary)}/mes).
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditoriaTab;
