'use client';

import React, { useState, useTransition } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2,
  Upload,
} from 'lucide-react';
import type { OrganizationDocument } from '@/types/grant-lifecycle';
import { saveOrganizationDocumentsAction } from '@/app/actions/grant-lifecycle';
import { uploadProjectDocumentAction } from '@/app/actions/storage';
import styles from '../personal/personal.module.css';

interface DocumentVaultManagerProps {
  initialDocuments: OrganizationDocument[];
}

const CATEGORY_NAMES: Record<OrganizationDocument['category'], string> = {
  estatutos: 'Estatutos Registrados',
  cif: 'CIF Definitivo',
  poderes_representacion: 'Poderes Notariales',
  certificado_aeat: 'Certificado AEAT (Hacienda)',
  certificado_tgss: 'Certificado TGSS (Seguridad Social)',
  memoria_anual: 'Memoria Anual de la Entidad',
  anexo_convocatoria: 'Anexo de Convocatoria',
  factura: 'Factura de Gasto',
  justificante_pago: 'Justificante Bancario SEPA',
  evidencia_actividad: 'Evidencia / Fotografías',
  hoja_firmas: 'Hoja de Firmas de Beneficiarios',
  resolucion_concesion: 'Resolución de Concesión',
  otro: 'Otro Documento Administrativo',
};

export function DocumentVaultManager({ initialDocuments }: DocumentVaultManagerProps) {
  const [documents, setDocuments] = useState<OrganizationDocument[]>(initialDocuments);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OrganizationDocument['category']>('certificado_aeat');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAdd = () => {
    if (!title) {
      showToast('Por favor introduce el nombre del documento');
      return;
    }

    startTransition(async () => {
      let fileUrl = '#';
      let fileName = selectedFile?.name ?? `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      let fileSize = selectedFile?.size ?? 0;

      // Subir archivo real si se ha seleccionado
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('projectId', 'org-vault');
        formData.append('category', category);

        const uploadResult = await uploadProjectDocumentAction(formData);
        if (uploadResult.success && uploadResult.fileUrl) {
          fileUrl = uploadResult.fileUrl;
          fileName = uploadResult.fileName ?? fileName;
          fileSize = uploadResult.fileSize ?? fileSize;
        } else {
          showToast('Error al subir el archivo. El documento se registrará sin archivo adjunto.');
        }
      }

      const newDoc: OrganizationDocument = {
        id: crypto.randomUUID(),
        title,
        category,
        fileName,
        fileUrl,
        fileSize,
        expirationDate: expirationDate || undefined,
        isValid: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const updated = [...documents, newDoc];
      setDocuments(updated);
      await saveOrganizationDocumentsAction(updated);
      setTitle('');
      setSelectedFile(null);
      setExpirationDate('');
      setIsAdding(false);
      showToast('Documento guardado en la bóveda correctamente');
    });
  };

  const handleDeleteConfirm = (docId: string) => {
    startTransition(async () => {
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      await saveOrganizationDocumentsAction(updated);
      setDeleteConfirmId(null);
      showToast('Documento eliminado');
    });
  };

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#0D3A5F', color: 'white',
          padding: '0.85rem 1.5rem', borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999, fontSize: '0.875rem', fontWeight: 700,
          border: '1.5px solid #16C7B2'
        }}>
          {toast}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '420px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#0D3A5F' }}>¿Eliminar documento?</h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Esta acción eliminará el documento de la bóveda. Esta operación no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                disabled={isPending}
                style={{ background: '#DC2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bóveda Documental de la Entidad</h1>
          <p className={styles.subtitle}>
            Repositorio centralizado de documentación corporativa. Los documentos se reutilizan automáticamente en todos tus proyectos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={styles.btnPrimary}
        >
          <Plus size={16} /> Subir Documento a la Bóveda
        </button>
      </div>

      {isAdding && (
        <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 800, color: '#0D3A5F' }}>
            Incorporar Documento Corporativo
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Título del documento..."
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <select
              className={styles.select}
              value={category}
              onChange={e => setCategory(e.target.value as OrganizationDocument['category'])}
            >
              {Object.entries(CATEGORY_NAMES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="date"
              placeholder="Fecha de caducidad (opcional)..."
              className={styles.input}
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#0D3A5F', marginBottom: '0.35rem' }}>
                Archivo del documento (PDF, imagen):
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className={styles.input}
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile && (
                <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
                  ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => { setIsAdding(false); setSelectedFile(null); }} className={styles.btnSecondary} style={{ background: '#e2e8f0', color: '#334155' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleAdd} className={styles.btnPrimary} disabled={isPending}>
              <Upload size={14} /> {isPending ? 'Guardando...' : 'Guardar en Bóveda'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Documento Corporativo</th>
                <th>Tipo / Categoría</th>
                <th>Fecha de Subida</th>
                <th>Caducidad</th>
                <th>Estado de Vigencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                    La bóveda está vacía. Sube el primer documento corporativo.
                  </td>
                </tr>
              )}
              {documents.map(doc => {
                const isExpiring = doc.expirationDate && new Date(doc.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const isExpired = doc.expirationDate && new Date(doc.expirationDate) < new Date();

                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="#0D3A5F" />
                        <div>
                          <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>{doc.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{doc.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: '#EAF5FB', color: '#0D3A5F', fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                        {CATEGORY_NAMES[doc.category] || doc.category}
                      </span>
                    </td>
                    <td>{doc.createdAt}</td>
                    <td>
                      {doc.expirationDate ? (
                        <span style={{ fontWeight: 700, color: isExpired ? '#DC2626' : isExpiring ? '#D97706' : '#166534' }}>
                          {doc.expirationDate}
                        </span>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>Sin caducidad</span>
                      )}
                    </td>
                    <td>
                      {isExpired ? (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                          ❌ Caducado — Renovar
                        </span>
                      ) : isExpiring ? (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                          ⚠️ Próximo a Caducar
                        </span>
                      ) : (
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                          ✓ Vigente y Válido
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className={styles.deleteBtn}
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
    </div>
  );
}

export default DocumentVaultManager;
