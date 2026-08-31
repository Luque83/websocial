'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Paperclip,
  Building2,
  DollarSign,
  Search,
  SlidersHorizontal,
  X,
  CreditCard,
  Printer
} from 'lucide-react';
import { uploadProjectDocumentAction } from '@/app/actions/storage';
import { CertificadoGastoModal } from './CertificadoGastoModal';
import styles from './execution.module.css';

export interface FacturaItem {
  id: string;
  proveedor: string;
  nif: string;
  numFactura: string;
  fecha: string;
  concepto: string;
  partidaId?: string;
  partidaName?: string;
  totalFactura: number;
  pctImputado: number;
  importeImputado: number;
  justificantePago: boolean;
  fechaPago?: string;
  metodoPago?: string;
  refBancaria?: string;
  facturaFileUrl?: string;
  facturaFileName?: string;
  justificanteFileUrl?: string;
  justificanteFileName?: string;
}

export interface FacturasManagerProps {
  facturas: FacturaItem[];
  onChange: (facturas: FacturaItem[]) => void;
  partidasPresupuesto: Array<{ id: string; category: string; description: string }>;
  subvencionConcedida: number;
  projectId?: string;
  projectName?: string;
  entityName?: string;
  entityCif?: string;
}

export function FacturasManager({
  facturas,
  onChange,
  partidasPresupuesto,
  subvencionConcedida,
  projectId = 'proj-general',
  projectName = 'Proyecto Subvencionado',
  entityName = 'Asociación para el Desarrollo e Intervención Social',
  entityCif = 'G-82910482',
}: FacturasManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [selectedFacturaForCert, setSelectedFacturaForCert] = useState<FacturaItem | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Form state for OCR / Smart add modal
  const [ocrForm, setOcrForm] = useState<Partial<FacturaItem>>({
    proveedor: 'Equipos & Formación Social S.L.',
    nif: 'B-84920193',
    numFactura: `FAC-${new Date().getFullYear()}-082`,
    fecha: new Date().toISOString().slice(0, 10),
    concepto: 'Material pedagógico y fungible para talleres de inserción',
    totalFactura: 1450.00,
    pctImputado: 100,
    metodoPago: 'transferencia_sepa',
    justificantePago: true,
    fechaPago: new Date().toISOString().slice(0, 10),
    refBancaria: 'SEPA-TRF-2026-9482',
    facturaFileName: 'Factura_Material_Talleres_082.pdf',
    justificanteFileName: 'Justificante_SEPA_Transf_9482.pdf'
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // KPIs
  const totalImputado = facturas.reduce((s, f) => s + (f.importeImputado || 0), 0);
  const facturasPagadas = facturas.filter(f => f.justificantePago);
  const facturasSinPago = facturas.filter(f => !f.justificantePago);
  const pctEjecucion = subvencionConcedida > 0 ? Math.round((totalImputado / subvencionConcedida) * 100) : 0;

  // Filtered List
  const filteredFacturas = facturas.filter(f => {
    const matchText = (f.proveedor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.concepto || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.numFactura || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (f.nif || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'paid') return matchText && f.justificantePago;
    if (filterStatus === 'pending') return matchText && !f.justificantePago;
    return matchText;
  });

  const handleAddEmptyFactura = () => {
    const newFac: FacturaItem = {
      id: `fac-${Date.now()}`,
      proveedor: '',
      nif: '',
      numFactura: `FAC-${Date.now().toString().slice(-4)}`,
      fecha: new Date().toISOString().slice(0, 10),
      concepto: '',
      partidaId: partidasPresupuesto[0]?.id || '',
      partidaName: partidasPresupuesto[0]?.description || '',
      totalFactura: 0,
      pctImputado: 100,
      importeImputado: 0,
      justificantePago: false,
      metodoPago: 'transferencia_sepa'
    };
    onChange([...facturas, newFac]);
  };

  const handleConfirmOcr = () => {
    const total = ocrForm.totalFactura || 0;
    const pct = ocrForm.pctImputado || 100;
    const imp = Number((total * (pct / 100)).toFixed(2));
    const matchedPartida = partidasPresupuesto.find(p => p.id === ocrForm.partidaId) || partidasPresupuesto[0];

    const newFac: FacturaItem = {
      id: `fac-${Date.now()}`,
      proveedor: ocrForm.proveedor || 'Proveedor',
      nif: ocrForm.nif || '',
      numFactura: ocrForm.numFactura || `FAC-${Date.now().toString().slice(-4)}`,
      fecha: ocrForm.fecha || new Date().toISOString().slice(0, 10),
      concepto: ocrForm.concepto || 'Gasto de proyecto',
      partidaId: matchedPartida?.id || '',
      partidaName: matchedPartida?.description || '',
      totalFactura: total,
      pctImputado: pct,
      importeImputado: imp,
      justificantePago: !!ocrForm.justificantePago,
      fechaPago: ocrForm.fechaPago,
      metodoPago: ocrForm.metodoPago || 'transferencia_sepa',
      refBancaria: ocrForm.refBancaria,
      facturaFileName: ocrForm.facturaFileName,
      facturaFileUrl: ocrForm.facturaFileUrl,
      justificanteFileName: ocrForm.justificanteFileName,
      justificanteFileUrl: ocrForm.justificanteFileUrl,
    };

    onChange([...facturas, newFac]);
    setIsOcrModalOpen(false);
  };

  const handleSimulateOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('category', 'facturas');
      const uploadRes = await uploadProjectDocumentAction(formData);

      setOcrForm(prev => ({
        ...prev,
        facturaFileName: file.name,
        facturaFileUrl: uploadRes.fileUrl,
        proveedor: file.name.includes('alquiler') ? 'Inmobiliaria Social Centro S.L.' : 'Suministros Pedagógicos del Sur S.A.',
        nif: file.name.includes('alquiler') ? 'B-84920193' : 'A-91823741',
        numFactura: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        totalFactura: file.name.includes('alquiler') ? 950.00 : 420.50,
        pctImputado: 100,
        concepto: file.name.includes('alquiler') ? 'Arrendamiento de sede y aulas de formación' : 'Material didáctico y kits de intervención social',
        justificantePago: true,
        justificanteFileName: `SEPA_Transf_${file.name.replace('.pdf', '')}.pdf`,
        refBancaria: `SEPA-REF-${Math.floor(100000 + Math.random() * 900000)}`
      }));
    } finally {
      setOcrLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Nº Orden',
      'Proveedor / Razón Social',
      'NIF/CIF',
      'Nº Factura',
      'Fecha Emisión',
      'Partida Presupuestaria',
      'Concepto',
      'Total Factura (€)',
      '% Imputación',
      'Importe Subvención (€)',
      'Estado Pago',
      'Fecha Pago',
      'Ref. Bancaria / SEPA'
    ];

    const rows = facturas.map((f, idx) => [
      idx + 1,
      `"${f.proveedor}"`,
      `"${f.nif}"`,
      `"${f.numFactura}"`,
      f.fecha,
      `"${f.partidaName || f.partidaId || '—'}"`,
      `"${f.concepto}"`,
      f.totalFactura,
      `${f.pctImputado}%`,
      f.importeImputado,
      f.justificantePago ? '"PAGADA (SEPA)"' : '"PENDIENTE"',
      f.fechaPago || '—',
      `"${f.refBancaria || '—'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Libro_Facturas_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <Receipt size={22} color="#16C7B2" />
            <span>Gestor de Facturas, Gastos Directos y Justificantes Bancarios</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Registro formal de facturas con auto-extracción OCR, imputación presupuestaria, comprobantes bancarios SEPA y certificados oficiales conforme a la Ley General de Subvenciones.
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
            onClick={() => setIsOcrModalOpen(true)}
            className={styles.btnOcr}
          >
            <Sparkles size={16} /> Subir Factura con OCR / IA
          </button>
          <button
            type="button"
            onClick={handleAddEmptyFactura}
            className={styles.btnPrimary}
          >
            <Plus size={16} /> Añadir Manual
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <Receipt size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{formatCurrency(totalImputado)}</div>
            <div className={styles.kpiLabel}>Gasto Imputado ({pctEjecucion}% de la subvención)</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{facturasPagadas.length} <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>/ {facturas.length}</span></div>
            <div className={styles.kpiLabel}>Con Justificante Bancario SEPA</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: facturasSinPago.length > 0 ? '#FEF2F2' : '#F8FAFC', color: facturasSinPago.length > 0 ? '#DC2626' : '#94A3B8' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className={styles.kpiVal} style={{ color: facturasSinPago.length > 0 ? '#DC2626' : '#0D3A5F' }}>
              {facturasSinPago.length}
            </div>
            <div className={styles.kpiLabel}>Facturas Pendientes de Pago</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div className={styles.kpiVal}>{formatCurrency(Math.max(0, subvencionConcedida - totalImputado))}</div>
            <div className={styles.kpiLabel}>Remanente por Ejecutar</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por proveedor, NIF, factura o concepto..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Todas las facturas ({facturas.length})</option>
            <option value="paid">✓ Pagadas con SEPA ({facturasPagadas.length})</option>
            <option value="pending">⚠️ Pendientes de Justificante ({facturasSinPago.length})</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
          Mostrando <strong>{filteredFacturas.length}</strong> de {facturas.length} facturas
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Proveedor / NIF</th>
              <th style={{ minWidth: '130px' }}>Nº Factura / Fecha</th>
              <th style={{ minWidth: '160px' }}>Partida Presupuestaria</th>
              <th style={{ minWidth: '200px' }}>Concepto</th>
              <th style={{ minWidth: '100px', textAlign: 'right' }}>Total Factura</th>
              <th style={{ minWidth: '80px', textAlign: 'right' }}>% Imp.</th>
              <th style={{ minWidth: '120px', textAlign: 'right' }}>Imputado Subv.</th>
              <th style={{ minWidth: '140px', textAlign: 'center' }}>Adjunto Factura</th>
              <th style={{ minWidth: '150px', textAlign: 'center' }}>Pago SEPA</th>
              <th style={{ minWidth: '120px', textAlign: 'center' }}>Certificado</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredFacturas.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8' }}>
                  No hay facturas registradas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredFacturas.map((fac) => (
                <tr key={fac.id}>
                  {/* Proveedor & NIF */}
                  <td>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="Razón Social / Proveedor"
                      value={fac.proveedor}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        updated[fIndex].proveedor = e.target.value;
                        onChange(updated);
                      }}
                    />
                    <input
                      type="text"
                      className={styles.inputField}
                      style={{ marginTop: '3px', fontSize: '0.75rem' }}
                      placeholder="NIF / CIF (ej. B8291029)"
                      value={fac.nif}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        updated[fIndex].nif = e.target.value;
                        onChange(updated);
                      }}
                    />
                  </td>

                  {/* Factura & Fecha */}
                  <td>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="Nº Factura"
                      value={fac.numFactura}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        updated[fIndex].numFactura = e.target.value;
                        onChange(updated);
                      }}
                    />
                    <input
                      type="date"
                      className={styles.inputField}
                      style={{ marginTop: '3px', fontSize: '0.75rem' }}
                      value={fac.fecha}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        updated[fIndex].fecha = e.target.value;
                        onChange(updated);
                      }}
                    />
                  </td>

                  {/* Partida selector */}
                  <td>
                    <select
                      className={styles.inputField}
                      value={fac.partidaId || ''}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        updated[fIndex].partidaId = e.target.value;
                        const matchedPartida = partidasPresupuesto.find(p => p.id === e.target.value);
                        if (matchedPartida) updated[fIndex].partidaName = matchedPartida.description;
                        onChange(updated);
                      }}
                    >
                      <option value="">Seleccionar partida...</option>
                      {partidasPresupuesto.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.category.toUpperCase()}: {p.description.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Concepto */}
                  <td>
                    <textarea
                      rows={2}
                      className={styles.inputField}
                      placeholder="Descripción detallada del gasto..."
                      value={fac.concepto}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        updated[fIndex].concepto = e.target.value;
                        onChange(updated);
                      }}
                    />
                  </td>

                  {/* Total Factura */}
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={styles.inputField}
                      style={{ textAlign: 'right', fontWeight: 700 }}
                      value={fac.totalFactura}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        const val = parseFloat(e.target.value) || 0;
                        updated[fIndex].totalFactura = val;
                        updated[fIndex].importeImputado = Number((val * (updated[fIndex].pctImputado / 100)).toFixed(2));
                        onChange(updated);
                      }}
                    />
                  </td>

                  {/* % Imputación */}
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      className={styles.inputField}
                      style={{ textAlign: 'right', fontWeight: 700 }}
                      value={fac.pctImputado}
                      onChange={e => {
                        const updated = [...facturas];
                        const fIndex = facturas.findIndex(f => f.id === fac.id);
                        const pct = parseFloat(e.target.value) || 0;
                        updated[fIndex].pctImputado = pct;
                        updated[fIndex].importeImputado = Number((updated[fIndex].totalFactura * (pct / 100)).toFixed(2));
                        onChange(updated);
                      }}
                    />
                  </td>

                  {/* Imputado a Subvención */}
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>
                      {formatCurrency(fac.importeImputado)}
                    </strong>
                  </td>

                  {/* Adjunto Factura con Subida Real a Supabase */}
                  <td style={{ textAlign: 'center' }}>
                    {fac.facturaFileName ? (
                      <span className={styles.fileBadge} title={fac.facturaFileName}>
                        <Paperclip size={12} /> {fac.facturaFileName.slice(0, 10)}...
                      </span>
                    ) : (
                      <label className={styles.uploadLabel}>
                        <Upload size={12} /> Subir PDF
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingId(fac.id);
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('projectId', projectId);
                              formData.append('category', 'facturas');
                              const res = await uploadProjectDocumentAction(formData);
                              if (res.success && res.fileUrl) {
                                const updated = [...facturas];
                                const fIndex = facturas.findIndex(f => f.id === fac.id);
                                updated[fIndex].facturaFileName = res.fileName;
                                updated[fIndex].facturaFileUrl = res.fileUrl;
                                onChange(updated);
                              }
                              setUploadingId(null);
                            }
                          }}
                        />
                      </label>
                    )}
                  </td>

                  {/* Pago SEPA con Subida Real */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={fac.justificantePago}
                          onChange={e => {
                            const updated = [...facturas];
                            const fIndex = facturas.findIndex(f => f.id === fac.id);
                            updated[fIndex].justificantePago = e.target.checked;
                            if (e.target.checked && !updated[fIndex].fechaPago) {
                              updated[fIndex].fechaPago = new Date().toISOString().slice(0, 10);
                            }
                            onChange(updated);
                          }}
                          style={{ accentColor: '#16A34A', width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: fac.justificantePago ? '#166534' : '#64748B' }}>
                          {fac.justificantePago ? '✓ Transferida' : 'Pendiente'}
                        </span>
                      </label>

                      {fac.justificanteFileName ? (
                        <span className={styles.badgePaid} style={{ fontSize: '0.6875rem' }}>
                          🏦 SEPA OK
                        </span>
                      ) : (
                        <label className={styles.uploadLabel} style={{ fontSize: '0.6875rem' }}>
                          <Upload size={10} /> Justif. Banco
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('projectId', projectId);
                                formData.append('category', 'justificantes');
                                const res = await uploadProjectDocumentAction(formData);
                                if (res.success && res.fileUrl) {
                                  const updated = [...facturas];
                                  const fIndex = facturas.findIndex(f => f.id === fac.id);
                                  updated[fIndex].justificanteFileName = res.fileName;
                                  updated[fIndex].justificanteFileUrl = res.fileUrl;
                                  updated[fIndex].justificantePago = true;
                                  onChange(updated);
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </td>

                  {/* Certificado Imputación Imprimible */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedFacturaForCert(fac)}
                      className={styles.btnSecondary}
                      style={{ fontSize: '0.71875rem', padding: '0.3rem 0.55rem' }}
                      title="Generar Certificado Oficial de Imputación de Gasto"
                    >
                      <Printer size={13} /> Certificado
                    </button>
                  </td>

                  {/* Delete */}
                  <td>
                    <button
                      type="button"
                      onClick={() => onChange(facturas.filter(f => f.id !== fac.id))}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* OCR UPLOAD MODAL */}
      {isOcrModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOcrModalOpen(false)}>
          <div className={styles.modalContentLarge} style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTopNav}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#4F46E5" />
                <strong style={{ color: '#0D3A5F', fontSize: '1rem' }}>
                  Auto-Extracción Inteligente de Facturas (OCR / IA)
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(false)}
                className={styles.btnClose}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Dropzone */}
              <label style={{
                border: '2px dashed #818CF8',
                background: '#EEF2FF',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Upload size={32} color="#4F46E5" />
                <strong style={{ color: '#3730A3', fontSize: '0.9375rem' }}>
                  {ocrLoading ? '⏳ Procesando y extrayendo campos con IA...' : 'Selecciona o arrastra una factura en PDF o Imagen'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#6366F1' }}>
                  Extracción automática de Proveedor, CIF, Fecha, Base Imponible, IVA y Concepto con custodia digital
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={handleSimulateOcrUpload}
                />
              </label>

              {/* Form Review */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className={styles.dataLabel}>Proveedor / Emisor</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={ocrForm.proveedor || ''}
                    onChange={e => setOcrForm({ ...ocrForm, proveedor: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.dataLabel}>NIF / CIF</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={ocrForm.nif || ''}
                    onChange={e => setOcrForm({ ...ocrForm, nif: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.dataLabel}>Nº Factura</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={ocrForm.numFactura || ''}
                    onChange={e => setOcrForm({ ...ocrForm, numFactura: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.dataLabel}>Fecha de Emisión</label>
                  <input
                    type="date"
                    className={styles.inputField}
                    value={ocrForm.fecha || ''}
                    onChange={e => setOcrForm({ ...ocrForm, fecha: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.dataLabel}>Partida Presupuestaria de Imputación</label>
                  <select
                    className={styles.inputField}
                    value={ocrForm.partidaId || ''}
                    onChange={e => setOcrForm({ ...ocrForm, partidaId: e.target.value })}
                  >
                    {partidasPresupuesto.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.category.toUpperCase()}: {p.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.dataLabel}>Concepto del Gasto</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={ocrForm.concepto || ''}
                    onChange={e => setOcrForm({ ...ocrForm, concepto: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.dataLabel}>Importe Total Factura (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.inputField}
                    style={{ fontWeight: 800 }}
                    value={ocrForm.totalFactura || 0}
                    onChange={e => setOcrForm({ ...ocrForm, totalFactura: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className={styles.dataLabel}>% Imputado a esta Subvención</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={styles.inputField}
                    style={{ fontWeight: 800 }}
                    value={ocrForm.pctImputado || 100}
                    onChange={e => setOcrForm({ ...ocrForm, pctImputado: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(false)}
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOcr}
                  className={styles.btnPrimary}
                >
                  <CheckCircle2 size={16} /> Confirmar e Incorporar Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERTIFICADO DE IMPUTACIÓN DE GASTO */}
      {selectedFacturaForCert && (
        <CertificadoGastoModal
          isOpen={true}
          onClose={() => setSelectedFacturaForCert(null)}
          factura={selectedFacturaForCert}
          project={{
            name: projectName,
            entityName: entityName,
            entityCif: entityCif,
            expediente: 'SUBV-2026/048',
            organismo: 'Administración Concedente Oficial'
          }}
        />
      )}
    </div>
  );
}
