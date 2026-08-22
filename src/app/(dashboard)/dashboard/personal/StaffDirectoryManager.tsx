'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  Calculator, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import type { Worker } from '@/config/staff';
import { saveOrgStaffCatalogAction } from '@/app/actions/personal';
import styles from './personal.module.css';

interface StaffDirectoryManagerProps {
  initialWorkers: Worker[];
}

export function StaffDirectoryManager({ initialWorkers }: StaffDirectoryManagerProps) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddWorker = () => {
    const newWorker: Worker = {
      id: `w-${Date.now()}`,
      name: '',
      role: 'Técnico de Proyecto',
      category: 'Titulado Medio / Grupo 2',
      salaryMonthly: 1900,
      pagas: 12,
      ssPct: 31.4,
      maxWeeklyHours: 37.5,
      allocations: [],
    };
    setWorkers([...workers, newWorker]);
  };

  const handleUpdateWorker = (idx: number, field: keyof Worker, value: unknown) => {
    const updated = [...workers];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    setWorkers(updated);
  };

  const handleDeleteWorker = (idx: number) => {
    if (confirm('¿Eliminar este trabajador/a de la plantilla?')) {
      setWorkers(workers.filter((_, i) => i !== idx));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveOrgStaffCatalogAction(workers);
      if (res.success) {
        showToast('Plantilla oficial y datos económicos guardados correctamente.');
      } else {
        alert(res.error || 'Error guardando la plantilla.');
      }
    } catch {
      alert('Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs
  const totalWorkers = workers.length;
  const totalMonthlyGross = workers.reduce((acc, w) => {
    const salMes = w.pagas === 14 ? (w.salaryMonthly * 14) / 12 : w.salaryMonthly;
    return acc + salMes;
  }, 0);

  const totalMonthlyCompanyCost = workers.reduce((acc, w) => {
    const salMes = w.pagas === 14 ? (w.salaryMonthly * 14) / 12 : w.salaryMonthly;
    const ssMes = (salMes * (w.ssPct || 31.4)) / 100;
    return acc + (salMes + ssMes);
  }, 0);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0D3A5F',
          color: 'white',
          padding: '0.85rem 1.5rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          border: '1.5px solid #16C7B2'
        }}>
          <CheckCircle2 size={18} color="#16C7B2" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Plantilla y Registro de Personal</h1>
          <p className={styles.subtitle}>
            Configura la plantilla de trabajadores de tu entidad con sus <strong>categorías, salarios brutos y costes de Seguridad Social</strong>. Estos datos económicos se importarán automáticamente en tus proyectos y en la Matriz de Imputación.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/matriz-imputacion"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#EAF5FB',
              color: '#0D3A5F',
              border: '1.5px solid #D5ECF8',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 800,
              textDecoration: 'none'
            }}
          >
            <FileSpreadsheet size={16} color="#009E96" /> Ver Matriz de Imputación Multiproyecto
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={styles.btnPrimary}
          >
            <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} style={{ borderTop: '4px solid #16C7B2' }}>
          <div className={styles.kpiIcon} style={{ background: '#EAF5FB', color: '#16C7B2' }}>
            <Users size={24} />
          </div>
          <div>
            <div className={styles.kpiVal}>{totalWorkers}</div>
            <div className={styles.kpiLabel}>Trabajadores en Plantilla</div>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderTop: '4px solid #009E96' }}>
          <div className={styles.kpiIcon} style={{ background: '#EAF5FB', color: '#009E96' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className={styles.kpiVal}>{Math.round(totalMonthlyGross).toLocaleString('es-ES')} €</div>
            <div className={styles.kpiLabel}>Masa Salarial Bruta / Mes</div>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderTop: '4px solid #0D3A5F' }}>
          <div className={styles.kpiIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className={styles.kpiVal}>{Math.round(totalMonthlyCompanyCost).toLocaleString('es-ES')} €</div>
            <div className={styles.kpiLabel}>Coste Empresa Total / Mes (Inc. SS)</div>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderTop: '4px solid #FF7A3F' }}>
          <div className={styles.kpiIcon} style={{ background: '#FFF5EB', color: '#FF7A3F' }}>
            <Calculator size={24} />
          </div>
          <div>
            <div className={styles.kpiVal}>{Math.round(totalMonthlyCompanyCost * 12).toLocaleString('es-ES')} €</div>
            <div className={styles.kpiLabel}>Coste Empresa Anualizado</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            <Building2 size={20} color="#16C7B2" /> Directorio de Trabajadores y Salarios Base
          </h2>
          <button
            type="button"
            onClick={handleAddWorker}
            className={styles.btnSecondary}
          >
            <Plus size={16} /> Dar de Alta Trabajador/a
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ minWidth: '200px' }}>Nombre y Apellidos</th>
                <th style={{ minWidth: '180px' }}>Puesto / Función</th>
                <th style={{ minWidth: '160px' }}>Categoría / Grupo</th>
                <th style={{ minWidth: '110px' }}>Salario Bruto (€)</th>
                <th style={{ width: '80px' }}>Pagas</th>
                <th style={{ width: '80px' }}>SS Patr. (%)</th>
                <th style={{ width: '90px' }}>Jornada Max</th>
                <th style={{ minWidth: '130px' }} className={styles.numCol}>Coste Empresa / Mes</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker, idx) => {
                const salMes = worker.pagas === 14 ? (worker.salaryMonthly * 14) / 12 : worker.salaryMonthly;
                const ssMes = (salMes * (worker.ssPct || 31.4)) / 100;
                const costeEmpresaMes = salMes + ssMes;

                return (
                  <tr key={worker.id}>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Nombre completo..."
                        value={worker.name}
                        onChange={e => handleUpdateWorker(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Puesto (ej. Trabajadora Social)..."
                        value={worker.role}
                        onChange={e => handleUpdateWorker(idx, 'role', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Categoría convenio..."
                        value={worker.category}
                        onChange={e => handleUpdateWorker(idx, 'category', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.input}
                        value={worker.salaryMonthly}
                        onChange={e => handleUpdateWorker(idx, 'salaryMonthly', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <select
                        className={styles.select}
                        value={worker.pagas || 12}
                        onChange={e => handleUpdateWorker(idx, 'pagas', parseInt(e.target.value) || 12)}
                      >
                        <option value={12}>12 pagas</option>
                        <option value={14}>14 pagas</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        className={styles.input}
                        value={worker.ssPct}
                        onChange={e => handleUpdateWorker(idx, 'ssPct', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        className={styles.input}
                        value={worker.maxWeeklyHours}
                        onChange={e => handleUpdateWorker(idx, 'maxWeeklyHours', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className={styles.numCol}>
                      <span className={styles.costTag}>
                        {Math.round(costeEmpresaMes).toLocaleString('es-ES')} €/m
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorker(idx)}
                        className={styles.deleteBtn}
                        title="Eliminar de plantilla"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.25rem', background: '#F8FAFC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569' }}>
            <ShieldCheck size={18} color="#16C7B2" />
            <span>Los cambios guardados aquí se sincronizan automáticamente con tus <strong>Proyectos</strong> y con la <strong>Matriz de Imputación</strong>.</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={styles.btnPrimary}
            style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
          >
            <Save size={14} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffDirectoryManager;
