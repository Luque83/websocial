'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Camera, 
  History, 
  AlertCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sliders, 
  Calendar, 
  Building2, 
  FileCheck, 
  Paperclip,
  Upload,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import type { ProjectVersion, RequirementItem, VersionType } from '@/types/grant-lifecycle';
import styles from '../ProjectWorkspace/ProjectWorkspace.module.css';

interface TramitacionTabProps {
  versions: ProjectVersion[];
  requirements: RequirementItem[];
  onRequestSnapshot: (versionType: VersionType, summary: string) => void;
  onUpdateRequirements: (newRequirements: RequirementItem[]) => void;
  solicitadoAmount: number;
  concedidoAmount: number;
  totalPresupuesto: number;
  beneficiariosDirectos: number;
  activeViewMode?: 'versiones' | 'subsanaciones' | 'reformulacion';
  formatCurrency: (n: number) => string;
}

export function TramitacionTab({
  versions,
  requirements,
  onRequestSnapshot,
  onUpdateRequirements,
  solicitadoAmount,
  concedidoAmount,
  totalPresupuesto,
  beneficiariosDirectos,
  activeViewMode = 'versiones',
  formatCurrency,
}: TramitacionTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'versiones' | 'subsanaciones' | 'reformulacion'>(activeViewMode);

  React.useEffect(() => {
    if (activeViewMode) {
      setActiveSubTab(activeViewMode);
    }
  }, [activeViewMode]);
  const [snapshotSummary, setSnapshotSummary] = useState('');
  const [selectedVersionType, setSelectedVersionType] = useState<VersionType>('solicitud_presentada');

  // New requirement state
  const [newReqOrganismo, setNewReqOrganismo] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqDocs, setNewReqDocs] = useState('');
  const [newReqDays, setNewReqDays] = useState(10);
  const [isAddingReq, setIsAddingReq] = useState(false);

  const handleAddRequirement = () => {
    if (!newReqOrganismo || !newReqDesc) {
      alert('Por favor indica el organismo y la descripción del requerimiento.');
      return;
    }

    const notifDate = new Date();
    const deadlineDate = new Date();
    // Añadir días hábiles aproximados
    deadlineDate.setDate(deadlineDate.getDate() + Math.round(newReqDays * 1.4));

    const newReq: RequirementItem = {
      id: `req-${Date.now()}`,
      notificationDate: notifDate.toISOString().split('T')[0],
      deadlineDays: newReqDays,
      deadlineDate: deadlineDate.toISOString().split('T')[0],
      funderOrganism: newReqOrganismo,
      description: newReqDesc,
      affectedDocuments: newReqDocs,
      status: 'pendiente',
    };

    onUpdateRequirements([...requirements, newReq]);
    setNewReqOrganismo('');
    setNewReqDesc('');
    setNewReqDocs('');
    setIsAddingReq(false);
  };

  const handleToggleReqStatus = (reqId: string, newStatus: RequirementItem['status']) => {
    const updated = requirements.map(r => r.id === reqId ? { ...r, status: newStatus } : r);
    onUpdateRequirements(updated);
  };

  const handleDeleteReq = (reqId: string) => {
    if (confirm('¿Eliminar este requerimiento?')) {
      onUpdateRequirements(requirements.filter(r => r.id !== reqId));
    }
  };

  // Reformulation calculation
  const fundingDifference = concedidoAmount - solicitadoAmount;
  const fundingPctVariation = solicitadoAmount > 0 ? (fundingDifference / solicitadoAmount) * 100 : 0;
  const estimatedReformulatedBeneficiaries = fundingPctVariation < 0 
    ? Math.round(beneficiariosDirectos * (1 + (fundingPctVariation * 0.7) / 100))
    : beneficiariosDirectos;

  return (
    <div className={styles.contentCard}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}><History size={20} color="#2563eb" /> 5. Tramitación Administrativa y Versionado</h2>
          <p className={styles.sectionSubtitle}>
            Gestiona las fotografías inmutables del proyecto (Snapshots), atiende requerimientos de subsanación y planifica la reformulación de compromisos.
          </p>
        </div>
      </div>

      {/* Sub-tabs switch */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('versiones')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'versiones' ? '#0D3A5F' : '#EAF5FB',
            color: activeSubTab === 'versiones' ? '#ffffff' : '#0D3A5F',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          📸 Versiones y Snapshots ({versions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('subsanaciones')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'subsanaciones' ? '#0D3A5F' : '#EAF5FB',
            color: activeSubTab === 'subsanaciones' ? '#ffffff' : '#0D3A5F',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          ⚠️ Subsanaciones y Requerimientos ({requirements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('reformulacion')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'reformulacion' ? '#0D3A5F' : '#EAF5FB',
            color: activeSubTab === 'reformulacion' ? '#ffffff' : '#0D3A5F',
            fontWeight: 800,
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          🔄 Comparador de Reformulación
        </button>
      </div>

      {/* 1. VERSIONES Y SNAPSHOTS */}
      {activeSubTab === 'versiones' && (
        <div>
          <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', fontWeight: 800, color: '#0D3A5F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Camera size={16} color="#16C7B2" /> Congelar Fotografía Inmutable del Proyecto (Snapshot)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 1rem 0' }}>
              Guarda el estado exacto actual del proyecto como versión histórica de referencia legal. Nunca se sobrescribirá.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={selectedVersionType}
                onChange={e => setSelectedVersionType(e.target.value as VersionType)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '0.8125rem', fontWeight: 700, color: '#0D3A5F' }}
              >
                <option value="solicitud_presentada">1. Solicitud Presentada (V1)</option>
                <option value="reformulacion">2. Reformulación Aprobada (V2)</option>
                <option value="baseline_autorizada">3. Resolución Definitiva / Baseline Autorizada</option>
                <option value="modificacion_autorizada">4. Modificación de Proyecto Autorizada</option>
              </select>

              <input
                type="text"
                placeholder="Motivo o resumen del cambio (ej: Presentación formal en sede electrónica)..."
                value={snapshotSummary}
                onChange={e => setSnapshotSummary(e.target.value)}
                style={{ flex: 1, minWidth: '220px', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '0.8125rem' }}
              />

              <button
                type="button"
                onClick={() => {
                  if (!snapshotSummary) {
                    alert('Por favor escribe un breve resumen del motivo de la versión.');
                    return;
                  }
                  onRequestSnapshot(selectedVersionType, snapshotSummary);
                  setSnapshotSummary('');
                }}
                style={{
                  background: '#0D3A5F',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Camera size={14} color="#16C7B2" /> Crear Snapshot Inmutable
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Versión</th>
                  <th>Tipo de Hito</th>
                  <th>Fecha de Creación</th>
                  <th>Motivo / Resumen del Cambio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {versions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: '2rem' }}>
                      Aún no hay versiones archivadas. Crea un snapshot al presentar la solicitud.
                    </td>
                  </tr>
                ) : (
                  versions.map((ver) => (
                    <tr key={ver.id} style={{ background: ver.isActive ? '#F0FDFA' : 'inherit' }}>
                      <td>
                        <strong>Versión {ver.versionNumber}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#0D3A5F', fontWeight: 700, background: '#EAF5FB', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {ver.versionType}
                        </span>
                      </td>
                      <td>{new Date(ver.createdAt).toLocaleString('es-ES')}</td>
                      <td>{ver.changeSummary || 'Sin resumen'}</td>
                      <td>
                        {ver.isActive ? (
                          <span style={{ color: '#166534', fontWeight: 800, fontSize: '0.75rem', background: '#DCFCE7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            ✓ Activa
                          </span>
                        ) : (
                          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Archivada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUBSANACIONES Y REQUERIMIENTOS */}
      {activeSubTab === 'subsanaciones' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
              Control de notificaciones administrativas con plazo estricto de subsanación (Ley 39/2015).
            </span>
            <button
              type="button"
              onClick={() => setIsAddingReq(true)}
              style={{
                background: '#0D3A5F',
                color: 'white',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Plus size={14} /> Registrar Nuevo Requerimiento
            </button>
          </div>

          {isAddingReq && (
            <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#92400E', fontSize: '0.875rem', fontWeight: 800 }}>
                Nuevo Requerimiento de Subsanación Notificado
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Organismo (ej: Consejería de Inclusión Social)..."
                  className={styles.input}
                  value={newReqOrganismo}
                  onChange={e => setNewReqOrganismo(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Días de plazo (ej: 10 días hábiles)..."
                  className={styles.input}
                  value={newReqDays}
                  onChange={e => setNewReqDays(parseInt(e.target.value) || 10)}
                />
                <input
                  type="text"
                  placeholder="Documentos requeridos (ej: Anexo II, Certificado TGSS)..."
                  className={styles.input}
                  value={newReqDocs}
                  onChange={e => setNewReqDocs(e.target.value)}
                />
              </div>
              <textarea
                placeholder="Descripción detallada del motivo de la subsanación..."
                className={styles.textarea}
                style={{ minHeight: '60px', marginBottom: '0.75rem' }}
                value={newReqDesc}
                onChange={e => setNewReqDesc(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddingReq(false)} className={styles.exportBtn}>
                  Cancelar
                </button>
                <button type="button" onClick={handleAddRequirement} className={styles.saveBtn}>
                  Guardar Requerimiento
                </button>
              </div>
            </div>
          )}

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Organismo</th>
                  <th>Notificado</th>
                  <th>Fecha Límite</th>
                  <th>Documentos Requeridos</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requirements.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '2rem' }}>
                      No hay requerimientos ni subsanaciones pendientes.
                    </td>
                  </tr>
                ) : (
                  requirements.map(req => {
                    const deadline = new Date(req.deadlineDate);
                    const now = new Date();
                    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = diffDays <= 5 && req.status === 'pendiente';

                    return (
                      <tr key={req.id} style={{ background: isUrgent ? '#FFF5F5' : 'inherit' }}>
                        <td><strong>{req.funderOrganism}</strong></td>
                        <td>{req.notificationDate}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={14} color={isUrgent ? '#DC2626' : '#2563eb'} />
                            <strong style={{ color: isUrgent ? '#DC2626' : 'inherit' }}>{req.deadlineDate}</strong>
                            {isUrgent && <span style={{ color: '#DC2626', fontSize: '0.6875rem', fontWeight: 800 }}>({diffDays}d restantes)</span>}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: '#475569' }}>{req.affectedDocuments || req.description}</span>
                        </td>
                        <td>
                          <select
                            value={req.status}
                            onChange={e => handleToggleReqStatus(req.id, e.target.value as RequirementItem['status'])}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              background: req.status === 'presentado' ? '#DCFCE7' : req.status === 'preparado' ? '#EAF5FB' : '#FEF3C7',
                              color: req.status === 'presentado' ? '#166534' : req.status === 'preparado' ? '#0D3A5F' : '#92400E',
                              border: '1px solid #CBD5E1'
                            }}
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="preparado">📝 Preparado</option>
                            <option value="presentado">✓ Presentado</option>
                            <option value="desestimado">✕ Desestimado</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteReq(req.id)}
                            className={styles.deleteIconBtn}
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

      {/* 3. REFORMULACIÓN ASISTIDA */}
      {activeSubTab === 'reformulacion' && (
        <div>
          <div style={{ background: '#F0FDFA', border: '1.5px solid #99F6E4', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.4rem 0', color: '#0F766E', fontSize: '0.9375rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sliders size={18} color="#0D9488" /> Comparador Técnico-Económico de Reformulación
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#115E59', margin: 0 }}>
                  La reformulación adapta los compromisos cuando la cuantía concedida es menor a la solicitada. No reduce linealmente sin evaluar la viabilidad de las actividades.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onRequestSnapshot('reformulacion', `Reformulación aprobada para cuantía concedida de ${formatCurrency(concedidoAmount)} (${beneficiariosDirectos} beneficiarios)`);
                }}
                style={{
                  background: '#0D3A5F',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(13, 58, 95, 0.25)'
                }}
              >
                <Camera size={15} color="#16C7B2" /> 💾 Fijar como Baseline Autorizada (V2)
              </button>
            </div>
          </div>

          <table className={styles.diffTable}>
            <thead>
              <tr>
                <th>Magnitud del Proyecto</th>
                <th className={styles.numCol}>Solicitado Original (V1)</th>
                <th className={styles.numCol}>Concedido / Reformulado (V2)</th>
                <th className={styles.numCol}>Variación</th>
                <th>Impacto Recomendado por la IA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Financiación de la Subvención</strong></td>
                <td className={styles.numCol}>{formatCurrency(solicitadoAmount)}</td>
                <td className={styles.numCol}><strong>{formatCurrency(concedidoAmount)}</strong></td>
                <td className={`${styles.numCol} ${fundingDifference < 0 ? styles.diffNegative : styles.diffPositive}`}>
                  {fundingDifference < 0 ? '' : '+'}{formatCurrency(fundingDifference)} ({fundingPctVariation.toFixed(1)}%)
                </td>
                <td>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                    {fundingDifference < 0 ? 'Requiere reajustar partidas de actividades o incrementar fondos propios.' : 'Financiación completa sin minoración.'}
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Personas Beneficiarias Directas</strong></td>
                <td className={styles.numCol}>{beneficiariosDirectos} personas</td>
                <td className={styles.numCol}><strong>{estimatedReformulatedBeneficiaries} personas</strong></td>
                <td className={`${styles.numCol} ${estimatedReformulatedBeneficiaries < beneficiariosDirectos ? styles.diffNegative : styles.diffNeutral}`}>
                  {estimatedReformulatedBeneficiaries - beneficiariosDirectos} personas
                </td>
                <td>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                    {estimatedReformulatedBeneficiaries < beneficiariosDirectos ? 'Reducción proporcional coherente con la menor dotación económica.' : 'Meta de impacto mantenida.'}
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Presupuesto Total del Proyecto</strong></td>
                <td className={styles.numCol}>{formatCurrency(totalPresupuesto)}</td>
                <td className={styles.numCol}><strong>{formatCurrency(totalPresupuesto)}</strong></td>
                <td className={`${styles.numCol} ${styles.diffNeutral}`}>0 € (0%)</td>
                <td>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                    Ajusta las partidas en la pestaña 5 (Presupuesto) para reflejar la reformulación exacta.
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TramitacionTab;
