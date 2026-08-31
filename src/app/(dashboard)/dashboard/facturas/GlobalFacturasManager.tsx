'use client';

import React, { useState, useTransition } from 'react';
import { 
  Receipt, 
  Plus, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Paperclip,
  Building2,
  DollarSign,
  Search,
  SlidersHorizontal,
  X,
  CreditCard,
  Layers,
  FileSpreadsheet,
  Calendar,
  ShieldCheck,
  Printer,
  Upload,
  PieChart,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { 
  FacturaGlobalItem, 
  ProveedorItem, 
  CategoriaGasto,
  FacturaImputacionProject 
} from '@/types/facturas';
import { CATEGORIAS_GASTO_LABELS } from '@/types/facturas';
import { saveGlobalFacturasAction, saveProveedoresCatalogAction } from '@/app/actions/facturas';
import { uploadProjectDocumentAction } from '@/app/actions/storage';
import { CertificadoGastoModal } from '@/components/project/execution/CertificadoGastoModal';
import { getProjectTheme } from '@/app/(dashboard)/dashboard/matriz-imputacion/GlobalImputationMatrix';
import styles from './facturas.module.css';

interface GlobalFacturasManagerProps {
  initialFacturas: FacturaGlobalItem[];
  initialProveedores: ProveedorItem[];
  projects: Array<{ id: string; name: string; phase?: string; grantAmount?: number }>;
}

type TabMode = 'libro' | 'reparto' | 'proveedores' | 'calendario';

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function GlobalFacturasManager({
  initialFacturas,
  initialProveedores,
  projects,
}: GlobalFacturasManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabMode>('libro');
  const [facturas, setFacturas] = useState<FacturaGlobalItem[]>(initialFacturas);
  const [proveedores, setProveedores] = useState<ProveedorItem[]>(initialProveedores);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal de añadir factura
  const [isAddFacturaModalOpen, setIsAddFacturaModalOpen] = useState(false);
  const [facturaForm, setFacturaForm] = useState<Partial<FacturaGlobalItem>>({
    proveedorNombre: '',
    nif: '',
    numFactura: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    concepto: '',
    categoria: 'suministros',
    baseImponible: 0,
    ivaPct: 21,
    ivaImporte: 0,
    totalFactura: 0,
    metodoPago: 'transferencia_sepa',
    justificantePago: false,
    imputaciones: []
  });

  // Modal de reparto de factura
  const [selectedFacturaForSplit, setSelectedFacturaForSplit] = useState<FacturaGlobalItem | null>(null);

  // Modal de certificado imprimible
  const [selectedFacturaForCert, setSelectedFacturaForCert] = useState<{
    factura: FacturaGlobalItem;
    project: { id: string; name: string };
  } | null>(null);

  // Modal de añadir proveedor
  const [isAddProveedorModalOpen, setIsAddProveedorModalOpen] = useState(false);
  const [proveedorForm, setProveedorForm] = useState<Partial<ProveedorItem>>({
    nombre: '',
    nif: '',
    categoria: 'servicios_profesionales',
    email: '',
    telefono: '',
    iban: '',
    direccion: '',
    contacto: '',
    notas: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // KPIs
  const totalFacturasEntidad = facturas.reduce((s, f) => s + (f.totalFactura || 0), 0);
  const totalImputadoAProyectos = facturas.reduce((s, f) => {
    return s + (f.imputaciones || []).reduce((sum, imp) => sum + (imp.importeImputado || 0), 0);
  }, 0);
  const facturasPagadas = facturas.filter(f => f.justificantePago);
  const facturasPendientesPago = facturas.filter(f => !f.justificantePago);

  // Proveedores con riesgo LGS (> 15.000 € anuales acumulados)
  const proveedoresConRiesgoLGS = proveedores.filter(p => {
    const totalGastoProveedor = facturas
      .filter(f => f.nif === p.nif || f.proveedorNombre.toLowerCase() === p.nombre.toLowerCase())
      .reduce((s, f) => s + (f.totalFactura || 0), 0);
    return totalGastoProveedor >= 15000;
  });

  // Facturas con sobreimputación (> 100%)
  const facturasSobreimputadas = facturas.filter(f => {
    const totalPct = (f.imputaciones || []).reduce((s, imp) => s + (imp.pctImputado || 0), 0);
    return totalPct > 100.01;
  });

  // Guardar y sincronizar con BD y Proyectos
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const res = await saveGlobalFacturasAction({ facturas, proveedores }, true);
      if (res.success) {
        showToast('¡Libro de facturas e imputaciones sincronizado con éxito con todos los proyectos!');
        router.refresh();
      } else {
        alert(res.error || 'Error al guardar facturas.');
      }
    } catch {
      alert('Error inesperado al sincronizar.');
    } finally {
      setIsSaving(false);
    }
  };

  // Añadir nueva factura
  const handleCreateFactura = () => {
    if (!facturaForm.numFactura || !facturaForm.proveedorNombre || !facturaForm.totalFactura) {
      showToast('Por favor completa el proveedor, número de factura y el importe total.');
      return;
    }

    const defaultProj = projects[0];
    const initialImputaciones: FacturaImputacionProject[] = defaultProj ? [
      {
        id: `imp-${crypto.randomUUID()}-${defaultProj.id}`,
        projectId: defaultProj.id,
        projectName: defaultProj.name,
        pctImputado: 100,
        importeImputado: facturaForm.totalFactura || 0,
      }
    ] : [];

    const newFac: FacturaGlobalItem = {
      id: crypto.randomUUID(),
      proveedorId: facturaForm.proveedorId,
      proveedorNombre: facturaForm.proveedorNombre || 'Proveedor',
      nif: facturaForm.nif || '',
      numFactura: facturaForm.numFactura || '',
      fechaEmision: facturaForm.fechaEmision || new Date().toISOString().slice(0, 10),
      concepto: facturaForm.concepto || 'Gasto de proyecto',
      categoria: facturaForm.categoria || 'suministros',
      baseImponible: facturaForm.baseImponible || 0,
      ivaPct: facturaForm.ivaPct || 21,
      ivaImporte: facturaForm.ivaImporte || 0,
      totalFactura: facturaForm.totalFactura || 0,
      metodoPago: facturaForm.metodoPago || 'transferencia_sepa',
      justificantePago: !!facturaForm.justificantePago,
      fechaPago: facturaForm.fechaPago,
      refBancaria: facturaForm.refBancaria,
      facturaFileName: facturaForm.facturaFileName,
      facturaFileUrl: facturaForm.facturaFileUrl,
      justificanteFileName: facturaForm.justificanteFileName,
      justificanteFileUrl: facturaForm.justificanteFileUrl,
      imputaciones: initialImputaciones,
      createdAt: new Date().toISOString()
    };

    setFacturas([newFac, ...facturas]);
    setIsAddFacturaModalOpen(false);
    showToast('Factura registrada en el libro. Pulsa "Guardar y Sincronizar" para aplicar a los proyectos.');
  };

  // Añadir nuevo proveedor
  const handleCreateProveedor = () => {
    if (!proveedorForm.nombre || !proveedorForm.nif) {
      showToast('Por favor introduce el nombre y NIF/CIF del proveedor.');
      return;
    }

    const newProv: ProveedorItem = {
      id: crypto.randomUUID(),
      nombre: proveedorForm.nombre || '',
      nif: proveedorForm.nif || '',
      categoria: proveedorForm.categoria || 'servicios_profesionales',
      email: proveedorForm.email,
      telefono: proveedorForm.telefono,
      iban: proveedorForm.iban,
      direccion: proveedorForm.direccion,
      contacto: proveedorForm.contacto,
      notas: proveedorForm.notas,
      createdAt: new Date().toISOString()
    };

    const updated = [newProv, ...proveedores];
    setProveedores(updated);
    saveProveedoresCatalogAction(updated);
    setIsAddProveedorModalOpen(false);
    showToast('Proveedor añadido al directorio.');
  };

  // Exportar CSV oficial
  const handleExportCSV = () => {
    const headers = [
      'Nº Factura',
      'Fecha Emisión',
      'Proveedor / Razón Social',
      'NIF/CIF',
      'Categoría de Gasto',
      'Concepto',
      'Base Imponible (€)',
      '% IVA',
      'Cuota IVA (€)',
      'Total Factura (€)',
      'Total Imputado Proyectos (€)',
      'Estado Pago',
      'Fecha Pago',
      'Método Pago',
      'Referencia SEPA',
      'Proyectos Asignados'
    ];

    const rows = facturas.map(f => {
      const impTotal = (f.imputaciones || []).reduce((s, imp) => s + (imp.importeImputado || 0), 0);
      const projsText = (f.imputaciones || []).map(imp => `${imp.projectName} (${imp.pctImputado}%)`).join(' | ');

      return [
        `"${f.numFactura}"`,
        f.fechaEmision,
        `"${f.proveedorNombre}"`,
        `"${f.nif}"`,
        `"${CATEGORIAS_GASTO_LABELS[f.categoria] || f.categoria}"`,
        `"${f.concepto}"`,
        f.baseImponible,
        `${f.ivaPct}%`,
        f.ivaImporte,
        f.totalFactura,
        impTotal,
        f.justificantePago ? '"PAGADA (SEPA)"' : '"PENDIENTE"',
        f.fechaPago || '—',
        `"${f.metodoPago}"`,
        `"${f.refBancaria || '—'}"`,
        `"${projsText}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Libro_Oficial_Facturas_Entidad_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Facturas filtradas
  const filteredFacturas = facturas.filter(f => {
    const matchText = (f.proveedorNombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.concepto || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.numFactura || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.nif || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'all' || f.categoria === filterCategory;
    const matchPay = filterPayment === 'all' || 
                     (filterPayment === 'paid' && f.justificantePago) || 
                     (filterPayment === 'pending' && !f.justificantePago);
    const matchProj = filterProject === 'all' || (f.imputaciones || []).some(imp => imp.projectId === filterProject);

    return matchText && matchCat && matchPay && matchProj;
  });

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#0D3A5F', color: 'white',
          padding: '0.85rem 1.5rem', borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.875rem', fontWeight: 700, border: '1.5px solid #16C7B2'
        }}>
          <CheckCircle2 size={18} color="#16C7B2" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestor Central de Facturas, Gastos y Proveedores</h1>
          <p className={styles.subtitle}>
            Control unificado de facturas directas y compartidas, matriz de reparto multiproyecto con alertas de sobreimputación y cumplimiento de límites de contratación de la Ley General de Subvenciones.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.btnSecondary}
          >
            <Download size={15} /> Exportar Libro (CSV)
          </button>
          <button
            type="button"
            onClick={() => setIsAddProveedorModalOpen(true)}
            className={styles.btnSecondary}
          >
            <Building2 size={15} /> Añadir Proveedor
          </button>
          <button
            type="button"
            onClick={() => setIsAddFacturaModalOpen(true)}
            className={styles.btnPrimary}
          >
            <Plus size={15} /> Registrar Nueva Factura
          </button>
          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className={styles.btnPrimary}
            style={{ background: '#16A34A' }}
          >
            <CheckCircle2 size={15} /> {isSaving ? 'Sincronizando...' : '💾 Guardar y Sincronizar'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <Receipt size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{formatCurrency(totalFacturasEntidad)}</div>
            <div className={styles.statLabel}>Gasto Total Registrado ({facturas.length} facturas)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <PieChart size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{formatCurrency(totalImputadoAProyectos)}</div>
            <div className={styles.statLabel}>Imputado a Subvenciones</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: facturasPendientesPago.length > 0 ? '#FFFBEB' : '#F0FDF4', color: facturasPendientesPago.length > 0 ? '#D97706' : '#16A34A' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className={styles.statVal} style={{ color: facturasPendientesPago.length > 0 ? '#D97706' : '#16A34A' }}>
              {facturasPagadas.length} <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>/ {facturas.length}</span>
            </div>
            <div className={styles.statLabel}>Pagadas con Justificante SEPA</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: proveedoresConRiesgoLGS.length > 0 ? '#FEE2E2' : '#DCFCE7', color: proveedoresConRiesgoLGS.length > 0 ? '#DC2626' : '#166534' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className={styles.statVal} style={{ color: proveedoresConRiesgoLGS.length > 0 ? '#DC2626' : '#166534' }}>
              {proveedoresConRiesgoLGS.length === 0 ? '0 Alertas' : `${proveedoresConRiesgoLGS.length} Proveedores > 15.000€`}
            </div>
            <div className={styles.statLabel}>Control LGS (3 Ofertas)</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className={styles.modeNav}>
        <button
          type="button"
          onClick={() => setActiveTab('libro')}
          className={`${styles.modeBtn} ${activeTab === 'libro' ? styles.modeBtnActive : ''}`}
        >
          <Receipt size={17} color="#2563EB" />
          <span>1. 📋 Libro Oficial de Facturas y Gastos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reparto')}
          className={`${styles.modeBtn} ${activeTab === 'reparto' ? styles.modeBtnActive : ''}`}
        >
          <Layers size={17} color="#0D9488" />
          <span>2. 📊 Matriz de Reparto Multiproyecto (Facturas Compartidas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proveedores')}
          className={`${styles.modeBtn} ${activeTab === 'proveedores' ? styles.modeBtnActive : ''}`}
        >
          <Building2 size={17} color="#7C3AED" />
          <span>3. 🏢 Directorio de Proveedores & Control LGS (15.000 €)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendario')}
          className={`${styles.modeBtn} ${activeTab === 'calendario' ? styles.modeBtnActive : ''}`}
        >
          <Calendar size={17} color="#D97706" />
          <span>4. 📅 Calendario Mensual de Gastos (Ene - Dic)</span>
        </button>
      </nav>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: LIBRO OFICIAL DE FACTURAS                                     */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'libro' && (
        <div className={styles.mainCard}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por proveedor, NIF, factura o concepto..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select
                className={styles.filterSelect}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORIAS_GASTO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                className={styles.filterSelect}
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value as any)}
              >
                <option value="all">Todos los pagos</option>
                <option value="paid">✓ Pagadas (SEPA)</option>
                <option value="pending">⚠️ Pendientes de pago</option>
              </select>
              <select
                className={styles.filterSelect}
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
              >
                <option value="all">Todos los proyectos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
              Mostrando <strong>{filteredFacturas.length}</strong> facturas
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '170px' }}>Proveedor / NIF</th>
                  <th style={{ minWidth: '120px' }}>Nº Factura / Fecha</th>
                  <th style={{ minWidth: '150px' }}>Categoría</th>
                  <th style={{ minWidth: '200px' }}>Concepto</th>
                  <th style={{ minWidth: '100px', textAlign: 'right' }}>Total Factura</th>
                  <th style={{ minWidth: '180px' }}>Imputación a Proyectos</th>
                  <th style={{ minWidth: '110px', textAlign: 'center' }}>Estado Pago</th>
                  <th style={{ minWidth: '160px', textAlign: 'center' }}>Documentos & Certificado</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8' }}>
                      No hay facturas registradas que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredFacturas.map((fac) => {
                    const totalPct = (fac.imputaciones || []).reduce((s, imp) => s + (imp.pctImputado || 0), 0);
                    const isOver = totalPct > 100.01;

                    return (
                      <tr key={fac.id}>
                        {/* Proveedor */}
                        <td>
                          <strong style={{ color: '#0D3A5F', display: 'block', fontSize: '0.875rem' }}>
                            {fac.proveedorNombre}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>CIF: {fac.nif || '—'}</span>
                        </td>

                        {/* Factura / Fecha */}
                        <td>
                          <strong style={{ color: '#0D3A5F' }}>{fac.numFactura}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{fac.fechaEmision}</div>
                        </td>

                        {/* Categoría */}
                        <td>
                          <span className={styles.badgeCategory}>
                            {CATEGORIAS_GASTO_LABELS[fac.categoria] || fac.categoria}
                          </span>
                        </td>

                        {/* Concepto */}
                        <td>
                          <div style={{ fontSize: '0.8125rem', color: '#334155', maxWidth: '260px' }}>
                            {fac.concepto}
                          </div>
                        </td>

                        {/* Total Factura */}
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>
                            {formatCurrency(fac.totalFactura)}
                          </strong>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            IVA: {fac.ivaPct}% ({formatCurrency(fac.ivaImporte)})
                          </div>
                        </td>

                        {/* Imputación a Proyectos */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {(fac.imputaciones || []).map((imp) => {
                              const pIdx = projects.findIndex(p => p.id === imp.projectId);
                              const theme = getProjectTheme(imp.projectId, pIdx >= 0 ? pIdx : 0);

                              return (
                                <div
                                  key={imp.projectId}
                                  className={styles.splitPill}
                                  style={{ background: theme.light, color: '#0D3A5F', border: `1px solid ${theme.border}` }}
                                  title={`${imp.projectName}: ${imp.pctImputado}% (${formatCurrency(imp.importeImputado)})`}
                                >
                                  <span style={{ fontWeight: 800, color: theme.bg }}>{imp.pctImputado}%</span>
                                  <span>{imp.projectName.length > 18 ? `${imp.projectName.slice(0, 16)}...` : imp.projectName}</span>
                                </div>
                              );
                            })}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                              {isOver ? (
                                <span className={styles.badgeAlert} style={{ fontSize: '0.6875rem' }}>
                                  ⚠️ {totalPct}% (Sobreimputada)
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                                  Total: {totalPct}%
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedFacturaForSplit(fac)}
                                style={{
                                  background: 'none', border: 'none', color: '#2563EB',
                                  fontSize: '0.71875rem', fontWeight: 700, cursor: 'pointer', padding: 0
                                }}
                              >
                                Editar reparto
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Estado Pago */}
                        <td style={{ textAlign: 'center' }}>
                          {fac.justificantePago ? (
                            <span className={styles.badgePaid}>
                              ✓ Pagada
                            </span>
                          ) : (
                            <span className={styles.badgePending}>
                              Pendiente
                            </span>
                          )}
                          {fac.refBancaria && (
                            <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>
                              {fac.refBancaria}
                            </div>
                          )}
                        </td>

                        {/* Documentos & Certificado */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {fac.facturaFileName ? (
                              <span className={styles.badgeCategory} style={{ background: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }} title={fac.facturaFileName}>
                                <Paperclip size={11} /> Factura PDF
                              </span>
                            ) : (
                              <label style={{ fontSize: '0.6875rem', cursor: 'pointer', color: '#2563EB', fontWeight: 700 }}>
                                + PDF
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('projectId', 'global-facturas');
                                      formData.append('category', fac.categoria);
                                      const res = await uploadProjectDocumentAction(formData);
                                      if (res.success && res.fileUrl) {
                                        const updated = facturas.map(f => f.id === fac.id ? {
                                          ...f,
                                          facturaFileName: res.fileName,
                                          facturaFileUrl: res.fileUrl
                                        } : f);
                                        setFacturas(updated);
                                        showToast('Factura digital subida correctamente.');
                                      }
                                    }
                                  }}
                                />
                              </label>
                            )}

                            {/* Botón Certificado Imprimible */}
                            <button
                              type="button"
                              onClick={() => {
                                const targetProj = projects.find(p => (fac.imputaciones || []).some(imp => imp.projectId === p.id)) || projects[0] || { id: 'p-1', name: 'Proyecto General' };
                                setSelectedFacturaForCert({
                                  factura: fac,
                                  project: targetProj
                                });
                              }}
                              className={styles.btnSecondary}
                              style={{ fontSize: '0.71875rem', padding: '0.25rem 0.5rem' }}
                              title="Generar Certificado Oficial de Imputación de Gasto"
                            >
                              <Printer size={12} /> Certificado
                            </button>
                          </div>
                        </td>

                        {/* Delete */}
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('¿Eliminar esta factura del libro general?')) {
                                setFacturas(facturas.filter(f => f.id !== fac.id));
                                showToast('Factura eliminada.');
                              }
                            }}
                            className={styles.btnDelete}
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
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: MATRIZ DE REPARTO MULTIPROYECTO                                */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reparto' && (
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                <Layers size={20} color="#0D9488" />
                <span>Matriz de Distribución e Imputación de Facturas Compartidas</span>
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                Asignación de porcentajes de gastos directos e indirectos compartidos (alquileres, auditoría, software) con control antifraude en tiempo real.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className={styles.btnPrimary}
            >
              <CheckCircle2 size={15} /> {isSaving ? 'Guardando...' : 'Sincronizar Repartos'}
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Factura & Proveedor</th>
                  <th style={{ minWidth: '100px', textAlign: 'right' }}>Total Factura</th>
                  {projects.map((p, pIdx) => {
                    const theme = getProjectTheme(p.id, pIdx);
                    return (
                      <th key={p.id} style={{ minWidth: '140px', textAlign: 'center', background: theme.light, color: '#0D3A5F' }}>
                        <div>{p.name.length > 20 ? `${p.name.slice(0, 18)}...` : p.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B' }}>% Imputado</div>
                      </th>
                    );
                  })}
                  <th style={{ minWidth: '130px', textAlign: 'center' }}>Total Asignado</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((fac) => {
                  const totalPct = (fac.imputaciones || []).reduce((s, imp) => s + (imp.pctImputado || 0), 0);
                  const totalImporteImp = (fac.imputaciones || []).reduce((s, imp) => s + (imp.importeImputado || 0), 0);
                  const isOver = totalPct > 100.01;

                  return (
                    <tr key={fac.id}>
                      <td>
                        <strong style={{ color: '#0D3A5F' }}>{fac.numFactura}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{fac.proveedorNombre}</div>
                        <span className={styles.badgeCategory} style={{ marginTop: '3px' }}>
                          {CATEGORIAS_GASTO_LABELS[fac.categoria] || fac.categoria}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>
                          {formatCurrency(fac.totalFactura)}
                        </strong>
                      </td>

                      {projects.map((p) => {
                        const imp = (fac.imputaciones || []).find(i => i.projectId === p.id);
                        const pct = imp ? imp.pctImputado : 0;
                        const impVal = imp ? imp.importeImputado : 0;

                        return (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                className={styles.formInput}
                                style={{ width: '65px', textAlign: 'center', fontWeight: 800, padding: '0.3rem' }}
                                value={pct}
                                onChange={(e) => {
                                  const newPct = parseFloat(e.target.value) || 0;
                                  const newImpVal = Number((fac.totalFactura * (newPct / 100)).toFixed(2));
                                  const newImps = [...(fac.imputaciones || [])];
                                  const impIdx = newImps.findIndex(i => i.projectId === p.id);

                                  if (impIdx >= 0) {
                                    if (newPct === 0) {
                                      newImps.splice(impIdx, 1);
                                    } else {
                                      newImps[impIdx].pctImputado = newPct;
                                      newImps[impIdx].importeImputado = newImpVal;
                                    }
                                  } else if (newPct > 0) {
                                    newImps.push({
                                      id: `imp-${fac.id}-${p.id}`,
                                      projectId: p.id,
                                      projectName: p.name,
                                      pctImputado: newPct,
                                      importeImputado: newImpVal,
                                    });
                                  }

                                  setFacturas(facturas.map(f => f.id === fac.id ? { ...f, imputaciones: newImps } : f));
                                }}
                              />
                              <span style={{ fontSize: '0.6875rem', color: pct > 0 ? '#16A34A' : '#94A3B8', fontWeight: 700 }}>
                                {formatCurrency(impVal)}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      <td style={{ textAlign: 'center' }}>
                        {isOver ? (
                          <div className={styles.badgeAlert}>
                            ⚠️ {totalPct}% ({formatCurrency(totalImporteImp)})
                          </div>
                        ) : totalPct > 0 ? (
                          <div className={styles.badgePaid}>
                            ✓ {totalPct}% ({formatCurrency(totalImporteImp)})
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>0%</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedFacturaForSplit(fac)}
                          className={styles.btnSecondary}
                          style={{ fontSize: '0.71875rem', padding: '0.3rem 0.55rem' }}
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: DIRECTORIO DE PROVEEDORES & CONTROL LGS                       */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'proveedores' && (
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                <Building2 size={20} color="#7C3AED" />
                <span>Directorio de Proveedores y Supervisión de Contratación Menor (LGS 38/2003)</span>
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                Control acumulado de volumen de gasto anual por CIF. Alerta preventiva para contratos de suministros y servicios cuando se alcanzan los <strong>15.000 €</strong> para adjuntar 3 presupuestos previos obligatorios.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddProveedorModalOpen(true)}
              className={styles.btnPrimary}
            >
              <Plus size={15} /> Añadir Proveedor
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>Proveedor / Razón Social</th>
                  <th style={{ minWidth: '110px' }}>NIF / CIF</th>
                  <th style={{ minWidth: '150px' }}>Categoría Principal</th>
                  <th style={{ minWidth: '180px' }}>Contacto & IBAN</th>
                  <th style={{ minWidth: '110px', textAlign: 'right' }}>Nº Facturas</th>
                  <th style={{ minWidth: '140px', textAlign: 'right' }}>Gasto Acumulado Año</th>
                  <th style={{ minWidth: '170px', textAlign: 'center' }}>Semáforo LGS (3 Ofertas)</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((prov) => {
                  const provFacturas = facturas.filter(f => f.nif === prov.nif || f.proveedorNombre.toLowerCase() === prov.nombre.toLowerCase());
                  const totalGasto = provFacturas.reduce((s, f) => s + (f.totalFactura || 0), 0);
                  const isRisk = totalGasto >= 15000;
                  const isWarning = totalGasto >= 10000 && totalGasto < 15000;

                  return (
                    <tr key={prov.id}>
                      <td>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.875rem', display: 'block' }}>
                          {prov.nombre}
                        </strong>
                        {prov.direccion && (
                          <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>{prov.direccion}</div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#0D3A5F' }}>{prov.nif}</span>
                      </td>

                      <td>
                        <span className={styles.badgeCategory}>
                          {CATEGORIAS_GASTO_LABELS[prov.categoria] || prov.categoria}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                          {prov.contacto && <div>👤 {prov.contacto}</div>}
                          {prov.telefono && <div>📞 {prov.telefono}</div>}
                          {prov.iban && <div style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>🏦 {prov.iban.slice(0, 14)}...</div>}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {provFacturas.length}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: isRisk ? '#DC2626' : '#0D3A5F', fontSize: '0.9375rem' }}>
                          {formatCurrency(totalGasto)}
                        </strong>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {isRisk ? (
                          <span className={styles.badgeAlert} title="Supera 15.000 €: Obligatorio adjuntar 3 ofertas previas de proveedores distintos según la Ley 38/2003">
                            ⚠️ &gt;15.000€ (3 Ofertas Requeridas)
                          </span>
                        ) : isWarning ? (
                          <span className={styles.badgePending} title="Próximo al límite de 15.000 €">
                            🟡 Próximo al Límite LGS
                          </span>
                        ) : (
                          <span className={styles.badgePaid}>
                            ✓ Conforme LGS (&lt;15k€)
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar proveedor ${prov.nombre}?`)) {
                              const updated = proveedores.filter(p => p.id !== prov.id);
                              setProveedores(updated);
                              saveProveedoresCatalogAction(updated);
                              showToast('Proveedor eliminado.');
                            }
                          }}
                          className={styles.btnDelete}
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
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: CALENDARIO MENSUAL DE GASTOS (ENE - DIC)                       */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendario' && (
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                <Calendar size={20} color="#D97706" />
                <span>Calendario Mensualizado de Gastos y Devengos (Enero - Diciembre)</span>
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                Cronología de facturación por mes de emisión o pago para cuadre de justificaciones intermedias y anuales.
              </p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Proveedor / Categoría</th>
                  {MONTH_NAMES_SHORT.map((mShort, mIdx) => (
                    <th key={mIdx} style={{ minWidth: '100px', textAlign: 'center' }}>
                      <div>{mShort}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Mes {mIdx + 1}</div>
                    </th>
                  ))}
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Total Anual</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((prov) => {
                  let annualCost = 0;

                  return (
                    <tr key={prov.id}>
                      <td>
                        <strong style={{ color: '#0D3A5F' }}>{prov.nombre}</strong>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {CATEGORIAS_GASTO_LABELS[prov.categoria] || prov.categoria}
                        </div>
                      </td>

                      {MONTH_NAMES_SHORT.map((_, mIdx) => {
                        const monthNum = mIdx + 1;
                        // Buscar facturas de este proveedor emitidas en este mes
                        const monthFacturas = facturas.filter(f => {
                          const isProv = f.nif === prov.nif || f.proveedorNombre.toLowerCase() === prov.nombre.toLowerCase();
                          if (!isProv) return false;
                          const fMonth = new Date(f.fechaEmision).getMonth() + 1;
                          return fMonth === monthNum;
                        });

                        const monthTotal = monthFacturas.reduce((s, f) => s + (f.totalFactura || 0), 0);
                        annualCost += monthTotal;

                        return (
                          <td key={monthNum} style={{ textAlign: 'center' }}>
                            {monthTotal > 0 ? (
                              <div>
                                <strong style={{ color: '#0D3A5F', fontSize: '0.8125rem' }}>
                                  {formatCurrency(monthTotal)}
                                </strong>
                                <div style={{ fontSize: '0.65rem', color: '#16A34A', fontWeight: 700 }}>
                                  {monthFacturas.length} fac.
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#CBD5E1' }}>—</span>
                            )}
                          </td>
                        );
                      })}

                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>
                          {formatCurrency(annualCost)}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: AÑADIR FACTURA                                                   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {isAddFacturaModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '650px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>
                  Incorporar Nueva Factura al Libro
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFacturaModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Seleccionar Proveedor Registrado o Escribir:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className={styles.formInput}
                    onChange={(e) => {
                      const found = proveedores.find(p => p.id === e.target.value);
                      if (found) {
                        setFacturaForm({
                          ...facturaForm,
                          proveedorId: found.id,
                          proveedorNombre: found.nombre,
                          nif: found.nif,
                          categoria: found.categoria
                        });
                      }
                    }}
                  >
                    <option value="">Seleccionar del catálogo...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.nif})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Razón Social / Proveedor</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={facturaForm.proveedorNombre || ''}
                  onChange={e => setFacturaForm({ ...facturaForm, proveedorNombre: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>NIF / CIF</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={facturaForm.nif || ''}
                  onChange={e => setFacturaForm({ ...facturaForm, nif: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nº Factura</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="FAC-2026-001"
                  value={facturaForm.numFactura || ''}
                  onChange={e => setFacturaForm({ ...facturaForm, numFactura: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de Emisión</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={facturaForm.fechaEmision || ''}
                  onChange={e => setFacturaForm({ ...facturaForm, fechaEmision: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría de Gasto</label>
                <select
                  className={styles.formInput}
                  value={facturaForm.categoria || 'suministros'}
                  onChange={e => setFacturaForm({ ...facturaForm, categoria: e.target.value as CategoriaGasto })}
                >
                  {Object.entries(CATEGORIAS_GASTO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Importe Total Factura (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  style={{ fontWeight: 800 }}
                  value={facturaForm.totalFactura || 0}
                  onChange={(e) => {
                    const total = parseFloat(e.target.value) || 0;
                    const base = Number((total / 1.21).toFixed(2));
                    const iva = Number((total - base).toFixed(2));
                    setFacturaForm({
                      ...facturaForm,
                      totalFactura: total,
                      baseImponible: base,
                      ivaImporte: iva
                    });
                  }}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Concepto del Gasto</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Descripción detallada del servicio o material adquirido..."
                  value={facturaForm.concepto || ''}
                  onChange={e => setFacturaForm({ ...facturaForm, concepto: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Método de Pago</label>
                <select
                  className={styles.formInput}
                  value={facturaForm.metodoPago || 'transferencia_sepa'}
                  onChange={e => setFacturaForm({ ...facturaForm, metodoPago: e.target.value as any })}
                >
                  <option value="transferencia_sepa">Transferencia Bancaria SEPA</option>
                  <option value="tarjeta">Tarjeta Corporativa</option>
                  <option value="domiciliacion">Domiciliación Bancaria</option>
                  <option value="otro">Otro Método</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Referencia Bancaria / SEPA</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="TRF-SEPA-9482..."
                  value={facturaForm.refBancaria || ''}
                  onChange={e => setFacturaForm({ ...facturaForm, refBancaria: e.target.value })}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={facturaForm.justificantePago || false}
                    onChange={e => setFacturaForm({ ...facturaForm, justificantePago: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#16A34A' }}
                  />
                  <strong style={{ fontSize: '0.875rem', color: '#0D3A5F' }}>Factura Pagada (Comprobante SEPA disponible)</strong>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAddFacturaModalOpen(false)}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateFactura}
                className={styles.btnPrimary}
              >
                Guardar Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: AÑADIR PROVEEDOR                                                 */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {isAddProveedorModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '560px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="#7C3AED" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>
                  Añadir Proveedor al Catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProveedorModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Razón Social / Nombre Comercial</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={proveedorForm.nombre || ''}
                  onChange={e => setProveedorForm({ ...proveedorForm, nombre: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>NIF / CIF</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={proveedorForm.nif || ''}
                  onChange={e => setProveedorForm({ ...proveedorForm, nif: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría</label>
                <select
                  className={styles.formInput}
                  value={proveedorForm.categoria || 'servicios_profesionales'}
                  onChange={e => setProveedorForm({ ...proveedorForm, categoria: e.target.value as CategoriaGasto })}
                >
                  {Object.entries(CATEGORIAS_GASTO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={proveedorForm.telefono || ''}
                  onChange={e => setProveedorForm({ ...proveedorForm, telefono: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={proveedorForm.email || ''}
                  onChange={e => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Cuenta Bancaria IBAN</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="ES91 2100 0418..."
                  value={proveedorForm.iban || ''}
                  onChange={e => setProveedorForm({ ...proveedorForm, iban: e.target.value })}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Dirección / Sede Social</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={proveedorForm.direccion || ''}
                  onChange={e => setProveedorForm({ ...proveedorForm, direccion: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAddProveedorModalOpen(false)}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateProveedor}
                className={styles.btnPrimary}
              >
                Guardar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: REPARTO DE FACTURA MULTIPROYECTO                                  */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {selectedFacturaForSplit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>
                  Reparto Multiproyecto: Factura {selectedFacturaForSplit.numFactura}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {selectedFacturaForSplit.proveedorNombre} · Total: {formatCurrency(selectedFacturaForSplit.totalFactura)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacturaForSplit(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.map((p, pIdx) => {
                const theme = getProjectTheme(p.id, pIdx);
                const currentImp = (selectedFacturaForSplit.imputaciones || []).find(i => i.projectId === p.id);
                const currentPct = currentImp ? currentImp.pctImputado : 0;
                const currentImpVal = currentImp ? currentImp.importeImputado : 0;

                return (
                  <div 
                    key={p.id}
                    style={{
                      background: theme.light,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>{p.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: theme.bg, fontWeight: 700 }}>
                        {formatCurrency(currentImpVal)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className={styles.formInput}
                        style={{ width: '70px', textAlign: 'center', fontWeight: 800 }}
                        value={currentPct}
                        onChange={(e) => {
                          const newPct = parseFloat(e.target.value) || 0;
                          const newImpVal = Number((selectedFacturaForSplit.totalFactura * (newPct / 100)).toFixed(2));
                          const newImps = [...(selectedFacturaForSplit.imputaciones || [])];
                          const idx = newImps.findIndex(i => i.projectId === p.id);

                          if (idx >= 0) {
                            if (newPct === 0) {
                              newImps.splice(idx, 1);
                            } else {
                              newImps[idx].pctImputado = newPct;
                              newImps[idx].importeImputado = newImpVal;
                            }
                          } else if (newPct > 0) {
                            newImps.push({
                              id: `imp-${selectedFacturaForSplit.id}-${p.id}`,
                              projectId: p.id,
                              projectName: p.name,
                              pctImputado: newPct,
                              importeImputado: newImpVal
                            });
                          }

                          const updatedFac = { ...selectedFacturaForSplit, imputaciones: newImps };
                          setSelectedFacturaForSplit(updatedFac);
                          setFacturas(facturas.map(f => f.id === updatedFac.id ? updatedFac : f));
                        }}
                      />
                      <span style={{ fontWeight: 800, color: '#0D3A5F' }}>%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedFacturaForSplit(null);
                  showToast('Reparto actualizado. Pulsa "Guardar y Sincronizar" para aplicar a los proyectos.');
                }}
                className={styles.btnPrimary}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: CERTIFICADO OFICIAL IMPRIMIBLE                                   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {selectedFacturaForCert && (
        <CertificadoGastoModal
          isOpen={true}
          onClose={() => setSelectedFacturaForCert(null)}
          factura={{
            id: selectedFacturaForCert.factura.id,
            numFactura: selectedFacturaForCert.factura.numFactura,
            fecha: selectedFacturaForCert.factura.fechaEmision,
            proveedor: selectedFacturaForCert.factura.proveedorNombre,
            nif: selectedFacturaForCert.factura.nif,
            concepto: selectedFacturaForCert.factura.concepto,
            totalFactura: selectedFacturaForCert.factura.totalFactura,
            pctImputado: (selectedFacturaForCert.factura.imputaciones || []).find(i => i.projectId === selectedFacturaForCert.project.id)?.pctImputado || 100,
            importeImputado: (selectedFacturaForCert.factura.imputaciones || []).find(i => i.projectId === selectedFacturaForCert.project.id)?.importeImputado || selectedFacturaForCert.factura.totalFactura,
            metodoPago: selectedFacturaForCert.factura.metodoPago,
            fechaPago: selectedFacturaForCert.factura.fechaPago,
            refBancaria: selectedFacturaForCert.factura.refBancaria,
            facturaFileName: selectedFacturaForCert.factura.facturaFileName,
            justificanteFileName: selectedFacturaForCert.factura.justificanteFileName,
          }}
          project={{
            name: selectedFacturaForCert.project.name,
            entityName: 'Asociación para el Desarrollo e Intervención Social',
            entityCif: 'G-82910482',
            expediente: 'SUBV-2026/048',
            organismo: 'Administración Concedente Oficial'
          }}
        />
      )}
    </div>
  );
}
