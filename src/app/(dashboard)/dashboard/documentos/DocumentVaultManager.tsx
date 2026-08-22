'use client';

import React, { useState } from 'react';
import { 
  FolderLock, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle,
  Download,
  Building2,
  ExternalLink
} from 'lucide-react';
import type { OrganizationDocument } from '@/types/grant-lifecycle';
import { saveOrganizationDocumentsAction } from '@/app/actions/grant-lifecycle';
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
  const [fileName, setFileName] = useState('');

  const handleAdd = async () => {
    if (!title) {
      alert('Por favor introduce el nombre del documento');
      return;
    }

    const newDoc: OrganizationDocument = {
      id: `doc-${Date.now()}`,
      title,
      category,
      fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileUrl: '#',
      fileSize: 1024000,
      expirationDate: expirationDate || undefined,
      isValid: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...documents, newDoc];
    setDocuments(updated);
    await saveOrganizationDocumentsAction(updated);
    setTitle('');
    setFileName('');
    setExpirationDate('');
    setIsAdding(false);
  };

  const handleDelete = async (docId: string) => {
    if (confirm('¿Eliminar este documento de la bóveda?')) {
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      await saveOrganizationDocumentsAction(updated);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bóveda Documental de la Entidad</h1>
          <p className={styles.subtitle}>
            Repositorio centralizado de documentación corporativa (Estatutos, CIF, Certificados AEAT/TGSS, Poderes). Se reutilizan automáticamente en todos tus proyectos sin duplicar archivos.
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
              placeholder="Título (ej. Certificado de estar al corriente AEAT)..."
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
              placeholder="Fecha de caducidad..."
              className={styles.input}
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setIsAdding(false)} className={styles.btnSecondary} style={{ background: '#e2e8f0', color: '#334155' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleAdd} className={styles.btnPrimary}>
              Guardar en Bóveda
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
                        onClick={() => handleDelete(doc.id)}
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
