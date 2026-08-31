'use client';

import React, { useState, useTransition } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  Calculator, 
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import type { Worker } from '@/config/staff';
import { saveOrgStaffCatalogAction } from '@/app/actions/personal';
import { calcularCosteEmpresa } from '@/lib/cost-calculator';
import styles from './personal.module.css';

interface StaffDirectoryManagerProps {
  initialWorkers: Worker[];
}

export function StaffDirectoryManager({ initialWorkers }: StaffDirectoryManagerProps) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddWorker = () => {
    const newWorker: Worker = {
      id: crypto.randomUUID(),
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

  const handleUpdateWorker = <K extends keyof Worker>(idx: number, field: K, value: Worker[K]) => {
    const updated = [...workers];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    setWorkers(updated);
  };

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;
    setWorkers(workers.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
    showToast('Trabajador/a eliminado de la plantilla.');
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await saveOrgStaffCatalogAction(workers);
        if (res.success) {
          showToast('Plantilla oficial y datos económicos guardados correctamente.');
        } else {
          showToast(res.error || 'Error guardando la plantilla.', 'error');
        }
      } catch {
        showToast('Error inesperado al guardar.', 'error');
      }
    });
  };

  // KPIs con cost-calculator
  const totalWorkers = workers.length;
  const totalMonthlyGross = workers.reduce((acc, w) => {
    const calc = calcularCosteEmpresa(w.salaryMonthly, w.pagas || 12, w.ssPct || 31.4);
    return acc + calc.salarioBase;
  }, 0);

  const totalMonthlyCompanyCost = workers.reduce((acc, w) => {
    const calc = calcularCosteEmpresa(w.salaryMonthly, w.pagas || 12, w.ssPct || 31.4);
    return acc + calc.costeEmpresaMes;
  }, 0);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toastMessage.type === 'error' ? '#991B1B' : '#0D3A5F',
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
          border: `1.5px solid ${toastMessage.type === 'error' ? '#FCA5A5' : '#16C7B2'}`
        }}>
          <CheckCircle2 size={18} color={toastMessage.type === 'error' ? '#FCA5A5' : '#16C7B2'} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteIndex !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '420px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '0.6rem', display: 'flex' }}>
                <AlertTriangle size={20} color="#DC2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                ¿Eliminar trabajador/a?
              </h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Se eliminará a <strong>{workers[deleteIndex]?.name || 'este trabajador'}</strong> de la plantilla oficial. Recuerda guardar los cambios tras confirmar.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteIndex(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#DC2626', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
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
            disabled={isPending}
            className={styles.btnPrimary}
          >
            <Save size={16} /> {isPending ? 'Guardando...' : 'Guardar Plantilla'}
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
              {workers.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                    No hay trabajadores en la plantilla. Añade el primer trabajador/a.
                  </td>
                </tr>
              )}
              {workers.map((worker, idx) => {
                const calc = calcularCosteEmpresa(worker.salaryMonthly, worker.pagas || 12, worker.ssPct || 31.4);

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
                        {Math.round(calc.costeEmpresaMes).toLocaleString('es-ES')} €/m
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setDeleteIndex(idx)}
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
            disabled={isPending}
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
