'use client';

import React, { useState, useId } from 'react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import styles from './bajas.module.css';

type ContingenciaType = 'comun' | 'profesional';
type ConvenioComplemento = 'ninguno' | 'hasta100' | 'hasta80';

interface BajasData {
  projectName?: string;
  workerName: string;
  contingencia: ContingenciaType;
  baseReguladoraMes: number;
  diasBaja: number;
  diasMesTotal: number;
  complemento: ConvenioComplemento;
  ssPct: number;
  hasSustituto: boolean;
  sustitutoCosteMes: number;
  diasSustituto: number;
  hasBonificacionSustituto: boolean;
}

interface BajasCalculatorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const parseInit = (data: unknown): BajasData => {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  return {
    projectName: typeof d.projectName === 'string' ? d.projectName : '',
    workerName: typeof d.workerName === 'string' ? d.workerName : 'Técnico de Intervención',
    contingencia: (d.contingencia === 'profesional' ? 'profesional' : 'comun') as ContingenciaType,
    baseReguladoraMes: Number(d.baseReguladoraMes) || 1800,
    diasBaja: Number(d.diasBaja) || 18,
    diasMesTotal: Number(d.diasMesTotal) || 30,
    complemento: (d.complemento as ConvenioComplemento) || 'hasta100',
    ssPct: Number(d.ssPct) !== undefined && !isNaN(Number(d.ssPct)) ? Number(d.ssPct) : 31.4,
    hasSustituto: Boolean(d.hasSustituto),
    sustitutoCosteMes: Number(d.sustitutoCosteMes) || 1800,
    diasSustituto: Number(d.diasSustituto) || 15,
    hasBonificacionSustituto: Boolean(d.hasBonificacionSustituto),
  };
};

export function BajasCalculator({ initialData, projectId, projectName: externalProjectName }: BajasCalculatorProps) {
  const uid = useId();
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [projectName, setProjectName] = useState<string>(externalProjectName || init.projectName || '');
  const [workerName, setWorkerName] = useState<string>(init.workerName);
  const [contingencia, setContingencia] = useState<ContingenciaType>(init.contingencia);
  const [baseReguladoraMes, setBaseReguladoraMes] = useState<number>(init.baseReguladoraMes);
  const [diasBaja, setDiasBaja] = useState<number>(init.diasBaja);
  const [diasMesTotal, setDiasMesTotal] = useState<number>(init.diasMesTotal || 30);
  const [complemento, setComplemento] = useState<ConvenioComplemento>(init.complemento);
  const [ssPct, setSsPct] = useState<number>(init.ssPct);

  // Sustituto
  const [hasSustituto, setHasSustituto] = useState<boolean>(init.hasSustituto);
  const [sustitutoCosteMes, setSustitutoCosteMes] = useState<number>(init.sustitutoCosteMes);
  const [diasSustituto, setDiasSustituto] = useState<number>(init.diasSustituto);
  const [hasBonificacionSustituto, setHasBonificacionSustituto] = useState<boolean>(init.hasBonificacionSustituto);

  const [isSaving, setIsSaving] = useState(false);

  // Cálculos diarios
  const baseDiaria = baseReguladoraMes / (diasMesTotal || 30);
  const diasTrabajados = Math.max(0, diasMesTotal - diasBaja);
  const salarioDiasTrabajados = baseDiaria * diasTrabajados;

  // Cuota Patronal (la empresa cotiza el 100% de la base durante la IT)
  const ssEmpresaTotalMes = (baseReguladoraMes * ssPct) / 100;

  // Tramos IT
  let costeIT_Empresa = 0;
  let prestacionPagoDelegadoINSS = 0;
  let costeComplementoConvenio = 0;

  if (contingencia === 'comun') {
    // Días 1 a 3 (Sin prestación legal, solo si hay complemento)
    const dias1a3 = Math.min(diasBaja, 3);
    if (complemento === 'hasta100') {
      costeComplementoConvenio += dias1a3 * baseDiaria;
    } else if (complemento === 'hasta80') {
      costeComplementoConvenio += dias1a3 * baseDiaria * 0.8;
    }

    // Días 4 a 15 (60% a cargo exclusivo de la empresa)
    if (diasBaja >= 4) {
      const dias4a15 = Math.min(diasBaja - 3, 12);
      const prestacionLegal4a15 = dias4a15 * baseDiaria * 0.6;
      costeIT_Empresa += prestacionLegal4a15;

      if (complemento === 'hasta100') {
        costeComplementoConvenio += dias4a15 * baseDiaria * 0.4;
      } else if (complemento === 'hasta80') {
        costeComplementoConvenio += dias4a15 * baseDiaria * 0.2;
      }
    }

    // Días 16 a 20 (60% pago delegado INSS/Mutua)
    if (diasBaja >= 16) {
      const dias16a20 = Math.min(diasBaja - 15, 5);
      prestacionPagoDelegadoINSS += dias16a20 * baseDiaria * 0.6;

      if (complemento === 'hasta100') {
        costeComplementoConvenio += dias16a20 * baseDiaria * 0.4;
      } else if (complemento === 'hasta80') {
        costeComplementoConvenio += dias16a20 * baseDiaria * 0.2;
      }
    }

    // Días 21 en adelante (75% pago delegado INSS/Mutua)
    if (diasBaja >= 21) {
      const dias21Mas = diasBaja - 20;
      prestacionPagoDelegadoINSS += dias21Mas * baseDiaria * 0.75;

      if (complemento === 'hasta100') {
        costeComplementoConvenio += dias21Mas * baseDiaria * 0.25;
      } else if (complemento === 'hasta80') {
        costeComplementoConvenio += dias21Mas * baseDiaria * 0.05;
      }
    }
  } else {
    // Contingencia Profesional: 75% pago delegado desde día 2
    const diasPagoDelegado = Math.max(0, diasBaja - 1);
    // Día 1 a cargo empresa
    if (diasBaja >= 1) costeIT_Empresa += baseDiaria;
    prestacionPagoDelegadoINSS += diasPagoDelegado * baseDiaria * 0.75;

    if (complemento === 'hasta100') {
      costeComplementoConvenio += diasPagoDelegado * baseDiaria * 0.25;
    } else if (complemento === 'hasta80') {
      costeComplementoConvenio += diasPagoDelegado * baseDiaria * 0.05;
    }
  }

  // Coste real que asume la entidad por el trabajador de baja:
  const costeRealEmpresaTitular = salarioDiasTrabajados + costeIT_Empresa + costeComplementoConvenio + ssEmpresaTotalMes;

  // Coste del sustituto (si hay)
  const sustitutoDiario = sustitutoCosteMes / (diasMesTotal || 30);
  const sustitutoSalario = sustitutoDiario * (diasSustituto || 0);
  const sustitutoSSEmpresa = hasBonificacionSustituto ? 0 : (sustitutoSalario * ssPct) / 100;
  const costeTotalSustituto = hasSustituto ? sustitutoSalario + sustitutoSSEmpresa : 0;

  // Gasto subvencionable total
  const gastoSubvencionableTitular = costeRealEmpresaTitular;
  const gastoSubvencionableTotal = gastoSubvencionableTitular + costeTotalSustituto;

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload: BajasData = {
        projectName,
        workerName,
        contingencia,
        baseReguladoraMes,
        diasBaja,
        diasMesTotal,
        complemento,
        ssPct,
        hasSustituto,
        sustitutoCosteMes,
        diasSustituto,
        hasBonificacionSustituto,
      };
      await saveToolData(projectId, 'calculadora-bajas', payload);
      showToast('Cálculo de baja guardado con éxito', 'success');
    } catch {
      showToast('Error al guardar el cálculo', 'error');
    }
    setIsSaving(false);
  };

  const copyText = [
    `LIQUIDACIÓN Y JUSTIFICACIÓN DE INCAPACIDAD TEMPORAL (IT) - ${workerName}`,
    `Proyecto: ${projectName || 'Sin especificar'}`,
    `Contingencia: ${contingencia === 'comun' ? 'Enfermedad común / Accidente no laboral' : 'Accidente de trabajo / Enfermedad profesional'}`,
    `Días de baja: ${diasBaja} de ${diasMesTotal} días | Días trabajados: ${diasTrabajados}`,
    `Base Reguladora: ${formatCurrency(baseReguladoraMes)}/mes (${formatCurrency(baseDiaria)}/día)`,
    '',
    '--- DESGLOSE DEL TRABAJADOR TITULAR ---',
    `• Salario días efectivamente trabajados (${diasTrabajados} días): ${formatCurrency(salarioDiasTrabajados)}`,
    `• Prestación IT a cargo directo de la entidad: ${formatCurrency(costeIT_Empresa)}`,
    `• Complemento de convenio (${complemento === 'hasta100' ? 'hasta el 100%' : complemento === 'hasta80' ? 'hasta el 80%' : 'Sin complemento'}): ${formatCurrency(costeComplementoConvenio)}`,
    `• Seguridad Social Patronal (${ssPct}% sobre base íntegra): ${formatCurrency(ssEmpresaTotalMes)}`,
    `• Prestación en Pago Delegado (Descontado en TC1/TGSS, NO imputable): ${formatCurrency(prestacionPagoDelegadoINSS)}`,
    `TOTAL COSTE IMPUTABLE TITULAR: ${formatCurrency(costeRealEmpresaTitular)}`,
    '',
    hasSustituto ? [
      '--- DESGLOSE DEL CONTRATO DE SUSTITUCIÓN ---',
      `• Días de sustitución: ${diasSustituto} días`,
      `• Salario bruto sustituto: ${formatCurrency(sustitutoSalario)}`,
      `• SS Empresa sustituto ${hasBonificacionSustituto ? '(100% Bonificada)' : `(${ssPct}%)`}: ${formatCurrency(sustitutoSSEmpresa)}`,
      `TOTAL COSTE IMPUTABLE SUSTITUTO: ${formatCurrency(costeTotalSustituto)}`,
      '',
    ].join('\n') : '',
    `=========================================`,
    `TOTAL GASTO SUBVENCIONABLE IMPUTABLE AL PROYECTO: ${formatCurrency(gastoSubvencionableTotal)}`,
  ].join('\n');

  return (
    <div id="bajas-export-target" className={styles.container}>
      <div className={styles.alertInfo}>
        📋 <strong>Criterio de Justificación para Subvenciones:</strong> Cuando un técnico causa baja por IT, la entidad solo puede imputar a la subvención el <strong>coste efectivamente soportado</strong> (días trabajados, prestación a cargo empresarial de los días 4 al 15, complementos de convenio y la SS patronal que sigue cotizando). La prestación en pago delegado (a partir del día 16) no se puede imputar porque se compensa en los seguros sociales (TC1).
      </div>

      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-pname`} className={styles.label}>Nombre del proyecto</label>
          <input
            id={`${uid}-pname`}
            type="text"
            className={styles.input}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            disabled={!!externalProjectName}
            placeholder="Ej: Proyecto de Intervención Comunitaria"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-wname`} className={styles.label}>Nombre / Puesto del trabajador titular</label>
          <input
            id={`${uid}-wname`}
            type="text"
            className={styles.input}
            value={workerName}
            onChange={e => setWorkerName(e.target.value)}
            placeholder="Ej: Educador/a Social"
          />
        </div>
      </div>

      <div className={styles.sectionHeader}>1. Datos de la Incapacidad Temporal (IT)</div>
      <div className={styles.row3}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-cont`} className={styles.label}>Tipo de Contingencia</label>
          <select
            id={`${uid}-cont`}
            className={styles.input}
            value={contingencia}
            onChange={e => setContingencia(e.target.value as ContingenciaType)}
          >
            <option value="comun">Enfermedad común / Accidente no laboral</option>
            <option value="profesional">Accidente de trabajo / Enfermedad profesional</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-base`} className={styles.label}>Base Reguladora mensual (€)</label>
          <input
            id={`${uid}-base`}
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={baseReguladoraMes || ''}
            onChange={e => setBaseReguladoraMes(parseFloat(e.target.value) || 0)}
            placeholder="Ej: 1.850"
          />
          <span className={styles.helperText}>Base de cotización por contingencias del mes anterior</span>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-compl`} className={styles.label}>Complemento de Convenio</label>
          <select
            id={`${uid}-compl`}
            className={styles.input}
            value={complemento}
            onChange={e => setComplemento(e.target.value as ConvenioComplemento)}
          >
            <option value="hasta100">Complemento al 100% (Acción e Intervención Social)</option>
            <option value="hasta80">Complemento al 80%</option>
            <option value="ninguno">Sin complemento (solo prestación legal)</option>
          </select>
        </div>
      </div>

      <div className={styles.row3}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-diasb`} className={styles.label}>Días de baja médica en el mes</label>
          <input
            id={`${uid}-diasb`}
            type="number"
            min="1"
            max="31"
            className={styles.input}
            value={diasBaja || ''}
            onChange={e => setDiasBaja(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-diasm`} className={styles.label}>Días totales del mes</label>
          <select
            id={`${uid}-diasm`}
            className={styles.input}
            value={diasMesTotal}
            onChange={e => setDiasMesTotal(parseInt(e.target.value) || 30)}
          >
            <option value={30}>30 días (Mes comercial / nómina)</option>
            <option value={31}>31 días</option>
            <option value={28}>28 días (Febrero)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-ss`} className={styles.label}>Seguridad Social Empresa (%)</label>
          <input
            id={`${uid}-ss`}
            type="number"
            min="0"
            max="50"
            step="0.1"
            className={styles.input}
            value={ssPct}
            onChange={e => setSsPct(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className={styles.sectionHeader}>2. Contrato de Sustitución / Interinidad (Opcional)</div>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          id={`${uid}-hassust`}
          type="checkbox"
          checked={hasSustituto}
          onChange={e => setHasSustituto(e.target.checked)}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        <label htmlFor={`${uid}-hassust`} className={styles.label} style={{ margin: 0, cursor: 'pointer' }}>
          Se ha contratado a una persona sustituta para cubrir la baja
        </label>
      </div>

      {hasSustituto && (
        <div className={styles.row3}>
          <div className={styles.formGroup}>
            <label htmlFor={`${uid}-sustsal`} className={styles.label}>Salario bruto mensual sustituto (€)</label>
            <input
              id={`${uid}-sustsal`}
              type="number"
              min="0"
              step="0.01"
              className={styles.input}
              value={sustitutoCosteMes || ''}
              onChange={e => setSustitutoCosteMes(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor={`${uid}-sustdias`} className={styles.label}>Días trabajados por el sustituto</label>
            <input
              id={`${uid}-sustdias`}
              type="number"
              min="1"
              max="31"
              className={styles.input}
              value={diasSustituto || ''}
              onChange={e => setDiasSustituto(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
            <label htmlFor={`${uid}-bonif`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                id={`${uid}-bonif`}
                type="checkbox"
                checked={hasBonificacionSustituto}
                onChange={e => setHasBonificacionSustituto(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Bonificación 100% SS Cuota Patronal (RDL 1/2023)
            </label>
          </div>
        </div>
      )}

      <ResultPanel
        title="Liquidación y Desglose de Gastos Justificables"
        copyText={copyText}
      >
        <div id="bajas-document-target">
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Coste Imputable Titular</span>
              <span className={styles.cardValue}>{formatCurrency(costeRealEmpresaTitular)}</span>
              <span className={styles.cardSubtitle}>{diasTrabajados}d trabajados + {diasBaja}d de baja</span>
            </div>

            {hasSustituto && (
              <div className={styles.card}>
                <span className={styles.cardTitle}>Coste Imputable Sustituto</span>
                <span className={styles.cardValue}>{formatCurrency(costeTotalSustituto)}</span>
                <span className={styles.cardSubtitle}>{diasSustituto} días de sustitución</span>
              </div>
            )}

            <div className={`${styles.card} ${styles.cardHighlight}`}>
              <span className={styles.cardTitle}>TOTAL IMPUTABLE A SUBVENCIÓN</span>
              <span className={styles.cardValue}>{formatCurrency(gastoSubvencionableTotal)}</span>
              <span className={styles.cardSubtitle}>Gasto subvencionable justificado</span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Concepto Liquidativo</th>
                  <th>Detalle / Tramo</th>
                  <th className={styles.numCol}>A Cargo Entidad</th>
                  <th className={styles.numCol}>Pago Delegado (INSS)</th>
                  <th className={styles.numCol}>Imputable al Proyecto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Salario Días Trabajados</strong></td>
                  <td>{diasTrabajados} días a {formatCurrency(baseDiaria)}/día</td>
                  <td className={styles.numCol}>{formatCurrency(salarioDiasTrabajados)}</td>
                  <td className={styles.numCol}>—</td>
                  <td className={styles.numCol} style={{ fontWeight: 600 }}>{formatCurrency(salarioDiasTrabajados)}</td>
                </tr>
                <tr>
                  <td><strong>Prestación IT (Días 4 al 15)</strong></td>
                  <td>60% base reguladora a cargo empresa</td>
                  <td className={styles.numCol}>{formatCurrency(costeIT_Empresa)}</td>
                  <td className={styles.numCol}>—</td>
                  <td className={styles.numCol} style={{ fontWeight: 600 }}>{formatCurrency(costeIT_Empresa)}</td>
                </tr>
                {costeComplementoConvenio > 0 && (
                  <tr>
                    <td><strong>Complemento Convenio</strong></td>
                    <td>Mejora voluntaria / Convenio ({complemento === 'hasta100' ? 'al 100%' : 'al 80%'})</td>
                    <td className={styles.numCol}>{formatCurrency(costeComplementoConvenio)}</td>
                    <td className={styles.numCol}>—</td>
                    <td className={styles.numCol} style={{ fontWeight: 600 }}>{formatCurrency(costeComplementoConvenio)}</td>
                  </tr>
                )}
                <tr>
                  <td><strong>Seguridad Social Patronal</strong></td>
                  <td>Cuota empresarial ({ssPct}%) cotizada íntegra</td>
                  <td className={styles.numCol}>{formatCurrency(ssEmpresaTotalMes)}</td>
                  <td className={styles.numCol}>—</td>
                  <td className={styles.numCol} style={{ fontWeight: 600 }}>{formatCurrency(ssEmpresaTotalMes)}</td>
                </tr>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <td><em>Prestación Pago Delegado (Día 16+)</em></td>
                  <td><em>Compensado en cotizaciones TGSS (No imputable)</em></td>
                  <td className={styles.numCol}><em>—</em></td>
                  <td className={styles.numCol}><em>{formatCurrency(prestacionPagoDelegadoINSS)}</em></td>
                  <td className={styles.numCol}><em>0,00 €</em></td>
                </tr>
                {hasSustituto && (
                  <tr style={{ background: 'var(--color-primary-50)' }}>
                    <td><strong>Contrato de Sustitución</strong></td>
                    <td>{diasSustituto} días de servicio técnico sustituto</td>
                    <td className={styles.numCol}>{formatCurrency(costeTotalSustituto)}</td>
                    <td className={styles.numCol}>—</td>
                    <td className={styles.numCol} style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{formatCurrency(costeTotalSustituto)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan={2}><strong>TOTAL GASTO SUBVENCIONABLE JUSTIFICABLE</strong></td>
                  <td className={styles.numCol}><strong>{formatCurrency(gastoSubvencionableTotal)}</strong></td>
                  <td className={styles.numCol}><strong>{formatCurrency(prestacionPagoDelegadoINSS)}</strong></td>
                  <td className={styles.numCol} style={{ color: 'var(--color-primary-700)', fontSize: '1rem' }}>
                    <strong>{formatCurrency(gastoSubvencionableTotal)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="bajas-document-target" filename="liquidacion-it-justificacion" projectName={projectName} />
          {projectId && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 500,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSaving ? 'Guardando...' : '💾 Guardar en Proyecto'}
            </button>
          )}
        </div>
      </ResultPanel>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
