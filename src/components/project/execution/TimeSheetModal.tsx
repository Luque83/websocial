'use client';

import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  FileCheck2
} from 'lucide-react';
import styles from './execution.module.css';

export interface TimeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: {
    id?: string;
    workerId?: string;
    name: string;
    role: string;
    nif?: string;
    monthlySalary: number;
    ssPct?: number;
    weeklyHours: number;
    maxWeeklyHours?: number;
  };
  project: {
    name: string;
    expediente?: string;
    organismo?: string;
    entityName?: string;
    entityCif?: string;
  };
  month: number; // 1..12
  year: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function TimeSheetModal({
  isOpen,
  onClose,
  worker,
  project,
  month,
  year
}: TimeSheetModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1] || 'Enero';
  const maxWeeklyHours = worker.maxWeeklyHours || 37.5;
  const projectWeeklyHours = worker.weeklyHours || 0;
  const otherWeeklyHours = Math.max(0, maxWeeklyHours - projectWeeklyHours);
  const pctDedicacion = maxWeeklyHours > 0 ? Math.round((projectWeeklyHours / maxWeeklyHours) * 100) : 0;

  // Compute number of days in this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyHoursProject = (projectWeeklyHours / 5);
  const dailyHoursOther = (otherWeeklyHours / 5);

  const daysArray = Array.from({ length: daysInMonth }, (_, idx) => {
    const dayNum = idx + 1;
    const dateObj = new Date(year, month - 1, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });

    return {
      dayNum,
      dayName: dayName.toUpperCase(),
      isWeekend,
      hoursProject: isWeekend ? 0 : dailyHoursProject,
      hoursOther: isWeekend ? 0 : dailyHoursOther,
      totalHours: isWeekend ? 0 : (dailyHoursProject + dailyHoursOther)
    };
  });

  const totalMonthlyProjectHours = daysArray.reduce((s, d) => s + d.hoursProject, 0);
  const totalMonthlyOtherHours = daysArray.reduce((s, d) => s + d.hoursOther, 0);
  const totalMonthlyHours = totalMonthlyProjectHours + totalMonthlyOtherHours;

  const salMes = worker.monthlySalary || 0;
  const ssMes = (salMes * (worker.ssPct || 31.4)) / 100;
  const costeEmpresaTotal = salMes + ssMes;
  const costeImputadoMes = costeEmpresaTotal * (pctDedicacion / 100);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
        {/* Modal Top Actions (Hidden when printing) */}
        <div className={styles.modalTopNav}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 size={20} color="#16C7B2" />
            <strong style={{ color: '#0D3A5F', fontSize: '1rem' }}>
              Parte Mensual de Dedicación e Imputación Horaria (Time-Sheet)
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className={styles.btnPrint}
            >
              <Printer size={16} /> Imprimir / Guardar PDF Oficial
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL SHEET */}
        <div className={styles.sheetContainer} ref={printAreaRef}>
          {/* Header */}
          <div className={styles.sheetHeader}>
            <div className={styles.sheetHeaderLeft}>
              <h2 className={styles.sheetTitle}>PARTE MENSUAL DE DEDICACIÓN Y CONTROL HORARIO</h2>
              <div className={styles.sheetSubtitle}>
                ANEXO DE JUSTIFICACIÓN DE GASTOS DE PERSONAL — LEY GENERAL DE SUBVENCIONES (ART. 31 Y 72 RGS)
              </div>
            </div>
            <div className={styles.sheetHeaderRight}>
              <div className={styles.periodBadge}>
                <strong>{monthName.toUpperCase()} {year}</strong>
              </div>
            </div>
          </div>

          {/* Project & Worker Identity Grid */}
          <div className={styles.sheetDataGrid}>
            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>1. ENTIDAD BENEFICIARIA</span>
              <strong className={styles.dataVal}>{project.entityName || 'Asociación para el Desarrollo e Intervención Social'}</strong>
              <div className={styles.dataSub}>CIF: {project.entityCif || 'G-82910482'}</div>
            </div>

            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>2. PROYECTO SUBVENCIONADO</span>
              <strong className={styles.dataVal}>{project.name}</strong>
              <div className={styles.dataSub}>Expediente: {project.expediente || 'SUBV-2026/048'} · {project.organismo || 'Consejería de Inclusión Social'}</div>
            </div>

            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>3. TRABAJADOR / TRABAJADORA</span>
              <strong className={styles.dataVal}>{worker.name}</strong>
              <div className={styles.dataSub}>Puesto: {worker.role} · DNI: {worker.nif || '***4821**'}</div>
            </div>

            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>4. RÉGIMEN DE DEDICACIÓN</span>
              <strong className={styles.dataVal}>{projectWeeklyHours} h/sem ({pctDedicacion}% de la jornada)</strong>
              <div className={styles.dataSub}>Jornada Contractual: {maxWeeklyHours} h/sem · Coste Imputado: {formatCurrency(costeImputadoMes)}</div>
            </div>
          </div>

          {/* Table of Daily Hours */}
          <table className={styles.sheetTable}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Día</th>
                <th style={{ width: '50px' }}>Sem.</th>
                <th>Horas en Proyecto Subvencionado</th>
                <th>Horas en Otras Actividades / Sede</th>
                <th style={{ width: '90px' }}>Total Día</th>
                <th>Observaciones / Tareas Principales</th>
              </tr>
            </thead>
            <tbody>
              {daysArray.map(d => (
                <tr key={d.dayNum} className={d.isWeekend ? styles.weekendRow : undefined}>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>{d.dayNum}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.75rem', color: d.isWeekend ? '#94A3B8' : '#0D3A5F' }}>{d.dayName}</td>
                  <td style={{ textAlign: 'center', fontWeight: d.isWeekend ? 400 : 700, color: d.isWeekend ? '#94A3B8' : '#0D3A5F' }}>
                    {d.isWeekend ? '—' : `${d.hoursProject.toFixed(1)} h`}
                  </td>
                  <td style={{ textAlign: 'center', color: d.isWeekend ? '#94A3B8' : '#64748B' }}>
                    {d.isWeekend ? '—' : `${d.hoursOther.toFixed(1)} h`}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, background: d.isWeekend ? '#F8FAFC' : '#F1F5F9' }}>
                    {d.isWeekend ? '—' : `${d.totalHours.toFixed(1)} h`}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {d.isWeekend ? 'Descanso semanal' : 'Atención directa, itinerarios y coordinación técnica'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.sheetTotalRow}>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 800 }}>TOTALES DEL MES:</td>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#0D3A5F' }}>{totalMonthlyProjectHours.toFixed(1)} h</td>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>{totalMonthlyOtherHours.toFixed(1)} h</td>
                <td style={{ textAlign: 'center', fontWeight: 900, color: '#0D3A5F', background: '#E2E8F0' }}>{totalMonthlyHours.toFixed(1)} h</td>
                <td style={{ fontSize: '0.75rem', fontWeight: 700 }}>Concordante con Nómina y RLC</td>
              </tr>
            </tfoot>
          </table>

          {/* Declaración responsable & Firma */}
          <div className={styles.declarationBox}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#334155', lineHeight: 1.5 }}>
              <strong>DECLARACIÓN RESPONSABLE DE DEDICACIÓN EFECTIVA:</strong> El/La trabajador/a y la persona representante legal de la entidad declaran bajo su responsabilidad que los datos de dedicación y horarios reflejados en este documento corresponden fielmente a la actividad real desempeñada durante el mes, no existiendo solapamiento horario ni doble imputación de costes de personal en otros proyectos o subvenciones públicas conforme a los artículos 19 y 31 de la Ley 38/2003, General de Subvenciones.
            </p>
          </div>

          {/* Signature Boxes */}
          <div className={styles.signatureGrid}>
            <div className={styles.signatureBox}>
              <span className={styles.sigTitle}>Firma del Trabajador/a:</span>
              <div className={styles.sigLine} />
              <strong className={styles.sigName}>{worker.name}</strong>
              <span className={styles.sigRole}>{worker.role}</span>
            </div>

            <div className={styles.signatureBox}>
              <span className={styles.sigTitle}>Vº Bº Representante Legal / Dirección:</span>
              <div className={styles.sigLine} />
              <strong className={styles.sigName}>Dirección Técnica / Presidencia</strong>
              <span className={styles.sigRole}>{project.entityName || 'Asociación para el Desarrollo e Intervención Social'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
