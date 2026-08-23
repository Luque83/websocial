'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Paperclip,
  Calendar,
  Clock,
  Printer,
  DollarSign,
  Search,
  Receipt,
  FileCheck
} from 'lucide-react';
import { TimeSheetModal } from './TimeSheetModal';
import styles from './execution.module.css';

export interface NominaItem {
  id: string;
  workerId?: string;
  workerName: string;
  role: string;
  periodoMes: string; // '2026-01'
  salarioBruto: number;
  ssPatronal: number;
  costeEmpresaTotal: number;
  pctImputado: number;
  importeImputado: number;
  justificantePago: boolean;
  reciboNominaUrl?: string;
  reciboNominaName?: string;
  justificantePagoUrl?: string;
  justificantePagoName?: string;
  rlcDocUrl?: string;
  rlcDocName?: string;
}

export interface NominasManagerProps {
  nominas: NominaItem[];
  onChange: (nominas: NominaItem[]) => void;
  assignedStaff: Array<{
    id: string;
    workerId?: string;
    name: string;
    role: string;
    monthlySalary: number;
    ssPct?: number;
    weeklyHours: number;
    maxWeeklyHours?: number;
  }>;
  projectName: string;
  subvencionConcedida: number;
}

export function NominasManager({
  nominas,
  onChange,
  assignedStaff,
  projectName,
  subvencionConcedida,
}: NominasManagerProps) {
  const [selectedWorkerForSheet, setSelectedWorkerForSheet] = useState<{
    worker: {
      id?: string;
      workerId?: string;
      name: string;
      role: string;
      monthlySalary: number;
      ssPct?: number;
      weeklyHours: number;
      maxWeeklyHours?: number;
    };
    month: number;
    year: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // KPIs
  const totalImputado = nominas.reduce((s, n) => s + (n.importeImputado || 0), 0);
  const nominasConPago = nominas.filter(n => n.justificantePago);
  const nominasConRlc = nominas.filter(n => !!n.rlcDocName);
  const pctConPago = nominas.length > 0 ? Math.round((nominasConPago.length / nominas.length) * 100) : 100;

  // Filtered List
  const filteredNominas = nominas.filter(n => {
    const matchText = (n.workerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (n.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchMonth = filterMonth === 'all' || n.periodoMes === filterMonth;
    return matchText && matchMonth;
  });

  const handleAddNomina = () => {
    const defaultStaff = assignedStaff[0] || {
      id: 'pers-1',
      workerId: 'w-1',
      name: 'Elena Gómez',
      role: 'Trabajadora Social',
      monthlySalary: 2100,
      ssPct: 31.4,
      weeklyHours: 20,
      maxWeeklyHours: 37.5
    };

    const sal = defaultStaff.monthlySalary || 2000;
    const ss = (sal * (defaultStaff.ssPct || 31.4)) / 100;
    const costeEmpresa = sal + ss;
    const maxH = defaultStaff.maxWeeklyHours || 37.5;
    const pct = maxH > 0 ? (defaultStaff.weeklyHours / maxH) * 100 : 50;
    const imp = Number((costeEmpresa * (pct / 100)).toFixed(2));

    const newNom: NominaItem = {
      id: `nom-${Date.now()}`,
      workerId: defaultStaff.workerId || defaultStaff.id,
      workerName: defaultStaff.name,
      role: defaultStaff.role,
      periodoMes: `${new Date().getFullYear()}-0${Math.min(12, nominas.length + 1)}`.slice(0, 7),
      salarioBruto: sal,
      ssPatronal: Number(ss.toFixed(2)),
      costeEmpresaTotal: Number(costeEmpresa.toFixed(2)),
      pctImputado: Number(pct.toFixed(1)),
      importeImputado: imp,
      justificantePago: true,
      reciboNominaName: `Nomina_${defaultStaff.name.split(' ')[0]}_${nominas.length + 1}.pdf`,
      justificantePagoName: `SEPA_Transf_${defaultStaff.name.split(' ')[0]}_${nominas.length + 1}.pdf`,
      rlcDocName: `RLC_TGSS_${nominas.length + 1}.pdf`
    };

    onChange([...nominas, newNom]);
  };

  const handleExportCSV = () => {
    const headers = [
      'Periodo',
      'Trabajador/a',
      'Puesto / Categoría',
      'Salario Bruto (€)',
      'SS Patronal (€)',
      'Coste Empresa (€)',
      '% Imputado',
      'Importe Subvención (€)',
      'Pago SEPA',
      'Doc RLC'
    ];

    const rows = nominas.map(n => [
      n.periodoMes,
      `"${n.workerName}"`,
      `"${n.role}"`,
      n.salarioBruto,
      n.ssPatronal,
      n.costeEmpresaTotal,
      `${n.pctImputado}%`,
      n.importeImputado,
      n.justificantePago ? '"SI (SEPA)"' : '"PENDIENTE"',
      n.rlcDocName ? '"SI (TGSS)"' : '"NO"'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Libro_Nominas_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>
            <Users size={22} color="#16C7B2" />
            <span>Ejecución de Personal, Nóminas y Control Horario (Time-Sheets)</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Liquidación mensual de nóminas, transferencias bancarias SEPA, cotizaciones a la Seguridad Social (RLC/RNT) y partes horarios oficiales firmables.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.btnSecondary}
          >
            <Download size={15} /> Exportar Nóminas (CSV)
          </button>
          <button
            type="button"
            onClick={handleAddNomina}
            className={styles.btnPrimary}
          >
            <Plus size={16} /> Añadir Nómina Mensual
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{formatCurrency(totalImputado)}</div>
            <div className={styles.kpiLabel}>Masa Salarial Imputada</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{nominasConPago.length} <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>/ {nominas.length}</span></div>
            <div className={styles.kpiLabel}>Nóminas Pagadas con SEPA ({pctConPago}%)</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
            <FileCheck size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{nominasConRlc.length} <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>/ {nominas.length}</span></div>
            <div className={styles.kpiLabel}>Con Liquidación TGSS (RLC/TC1)</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#FAF5FF', color: '#7C3AED' }}>
            <Users size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{assignedStaff.length}</div>
            <div className={styles.kpiLabel}>Trabajadores Asignados</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o puesto..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          >
            <option value="all">Todos los meses</option>
            {['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
          Mostrando <strong>{filteredNominas.length}</strong> nóminas registradas
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '170px' }}>Trabajador/a</th>
              <th style={{ minWidth: '100px' }}>Periodo</th>
              <th style={{ minWidth: '110px', textAlign: 'right' }}>Salario Bruto</th>
              <th style={{ minWidth: '100px', textAlign: 'right' }}>SS Patronal</th>
              <th style={{ minWidth: '110px', textAlign: 'right' }}>Coste Empresa</th>
              <th style={{ minWidth: '80px', textAlign: 'right' }}>% Dedic.</th>
              <th style={{ minWidth: '120px', textAlign: 'right' }}>Imp. Subvención</th>
              <th style={{ minWidth: '220px', textAlign: 'center' }}>Documentos y Evidencias</th>
              <th style={{ minWidth: '140px', textAlign: 'center' }}>Parte Horario</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredNominas.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8' }}>
                  No hay nóminas registradas para este periodo.
                </td>
              </tr>
            ) : (
              filteredNominas.map(nom => {
                const matchedWorker = assignedStaff.find(s => s.workerId === nom.workerId || s.name.toLowerCase() === nom.workerName.toLowerCase()) || {
                  name: nom.workerName,
                  role: nom.role,
                  monthlySalary: nom.salarioBruto,
                  weeklyHours: (nom.pctImputado / 100) * 37.5,
                  maxWeeklyHours: 37.5
                };

                const [yStr, mStr] = nom.periodoMes.split('-');
                const monthNum = parseInt(mStr, 10) || 1;
                const yearNum = parseInt(yStr, 10) || 2026;

                return (
                  <tr key={nom.id}>
                    {/* Trabajador */}
                    <td>
                      <select
                        className={styles.inputField}
                        value={nom.workerName}
                        onChange={e => {
                          const val = e.target.value;
                          const found = assignedStaff.find(s => s.name === val);
                          const updated = [...nominas];
                          const nIndex = nominas.findIndex(n => n.id === nom.id);
                          if (found) {
                            updated[nIndex].workerId = found.workerId || found.id;
                            updated[nIndex].workerName = found.name;
                            updated[nIndex].role = found.role;
                            updated[nIndex].salarioBruto = found.monthlySalary;
                            const ss = (found.monthlySalary * (found.ssPct || 31.4)) / 100;
                            updated[nIndex].ssPatronal = Number(ss.toFixed(2));
                            const ce = found.monthlySalary + ss;
                            updated[nIndex].costeEmpresaTotal = Number(ce.toFixed(2));
                            const pct = (found.weeklyHours / (found.maxWeeklyHours || 37.5)) * 100;
                            updated[nIndex].pctImputado = Number(pct.toFixed(1));
                            updated[nIndex].importeImputado = Number((ce * (pct / 100)).toFixed(2));
                          } else {
                            updated[nIndex].workerName = val;
                          }
                          onChange(updated);
                        }}
                      >
                        {assignedStaff.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                        {nom.role}
                      </span>
                    </td>

                    {/* Periodo */}
                    <td>
                      <input
                        type="month"
                        className={styles.inputField}
                        value={nom.periodoMes}
                        onChange={e => {
                          const updated = [...nominas];
                          const nIndex = nominas.findIndex(n => n.id === nom.id);
                          updated[nIndex].periodoMes = e.target.value;
                          onChange(updated);
                        }}
                      />
                    </td>

                    {/* Salario Bruto */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        step="10"
                        className={styles.inputField}
                        style={{ textAlign: 'right' }}
                        value={nom.salarioBruto}
                        onChange={e => {
                          const updated = [...nominas];
                          const nIndex = nominas.findIndex(n => n.id === nom.id);
                          const val = parseFloat(e.target.value) || 0;
                          updated[nIndex].salarioBruto = val;
                          const ss = (val * 0.314);
                          updated[nIndex].ssPatronal = Number(ss.toFixed(2));
                          const ce = val + ss;
                          updated[nIndex].costeEmpresaTotal = Number(ce.toFixed(2));
                          updated[nIndex].importeImputado = Number((ce * (updated[nIndex].pctImputado / 100)).toFixed(2));
                          onChange(updated);
                        }}
                      />
                    </td>

                    {/* SS Patronal */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                      {formatCurrency(nom.ssPatronal)}
                    </td>

                    {/* Coste Empresa */}
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0D3A5F' }}>
                      {formatCurrency(nom.costeEmpresaTotal)}
                    </td>

                    {/* % Imputado */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className={styles.inputField}
                        style={{ width: '65px', textAlign: 'right', fontWeight: 800 }}
                        value={nom.pctImputado}
                        onChange={e => {
                          const updated = [...nominas];
                          const nIndex = nominas.findIndex(n => n.id === nom.id);
                          const pct = parseFloat(e.target.value) || 0;
                          updated[nIndex].pctImputado = pct;
                          updated[nIndex].importeImputado = Number((updated[nIndex].costeEmpresaTotal * (pct / 100)).toFixed(2));
                          onChange(updated);
                        }}
                      />
                    </td>

                    {/* Importe Subvención */}
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#009E96', fontSize: '0.9375rem' }}>
                        {formatCurrency(nom.importeImputado)}
                      </strong>
                    </td>

                    {/* Documentos & Evidencias (Nómina, SEPA, RLC) */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Recibo Nómina */}
                        {nom.reciboNominaName ? (
                          <span className={styles.fileBadge} title={nom.reciboNominaName}>
                            📑 Nómina
                          </span>
                        ) : (
                          <label className={styles.uploadLabel} title="Subir recibo de nómina firmado">
                            <Upload size={10} /> Nómina
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const updated = [...nominas];
                                  const nIndex = nominas.findIndex(n => n.id === nom.id);
                                  updated[nIndex].reciboNominaName = file.name;
                                  onChange(updated);
                                }
                              }}
                            />
                          </label>
                        )}

                        {/* Pago SEPA */}
                        {nom.justificantePagoName ? (
                          <span className={styles.badgePaid} style={{ fontSize: '0.6875rem' }} title={nom.justificantePagoName}>
                            🏦 SEPA OK
                          </span>
                        ) : (
                          <label className={styles.uploadLabel} title="Subir justificante de transferencia bancaria">
                            <Upload size={10} /> SEPA
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const updated = [...nominas];
                                  const nIndex = nominas.findIndex(n => n.id === nom.id);
                                  updated[nIndex].justificantePagoName = file.name;
                                  updated[nIndex].justificantePago = true;
                                  onChange(updated);
                                }
                              }}
                            />
                          </label>
                        )}

                        {/* RLC TGSS */}
                        {nom.rlcDocName ? (
                          <span className={styles.fileBadge} style={{ background: '#EEF2FF', color: '#3730A3' }} title={nom.rlcDocName}>
                            📑 RLC SS
                          </span>
                        ) : (
                          <label className={styles.uploadLabel} title="Subir RLC/TC1 de liquidación de cotizaciones TGSS">
                            <Upload size={10} /> RLC
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const updated = [...nominas];
                                  const nIndex = nominas.findIndex(n => n.id === nom.id);
                                  updated[nIndex].rlcDocName = file.name;
                                  onChange(updated);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </td>

                    {/* Botón Parte Horario Time-Sheet */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedWorkerForSheet({
                          worker: matchedWorker,
                          month: monthNum,
                          year: yearNum
                        })}
                        className={styles.btnSecondary}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        <Printer size={13} /> Time-Sheet
                      </button>
                    </td>

                    {/* Delete */}
                    <td>
                      <button
                        type="button"
                        onClick={() => onChange(nominas.filter(n => n.id !== nom.id))}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* TIME-SHEET MODAL */}
      {selectedWorkerForSheet && (
        <TimeSheetModal
          isOpen={true}
          onClose={() => setSelectedWorkerForSheet(null)}
          worker={selectedWorkerForSheet.worker}
          project={{
            name: projectName,
            expediente: 'SUBV-2026/048',
            organismo: 'Consejería de Inclusión Social y Tercer Sector',
            entityName: 'Asociación para la Intervención y el Desarrollo Social',
            entityCif: 'G-82910482'
          }}
          month={selectedWorkerForSheet.month}
          year={selectedWorkerForSheet.year}
        />
      )}
    </div>
  );
}
