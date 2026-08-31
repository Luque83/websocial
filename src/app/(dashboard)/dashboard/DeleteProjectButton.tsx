'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { deleteProject } from '@/app/actions/projects';
import styles from './page.module.css';

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await deleteProject(projectId);
        router.refresh();
      } catch (error) {
        console.error('Error al eliminar el proyecto:', error);
        setIsConfirming(false);
      }
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(false);
  };

  return (
    <>
      <button
        className={styles.deleteBtn}
        onClick={handleDeleteClick}
        title="Eliminar proyecto"
        aria-label="Eliminar proyecto"
      >
        <Trash2 size={16} />
      </button>

      {/* Modal de confirmación */}
      {isConfirming && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(2px)',
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '0.6rem', display: 'flex' }}>
                  <AlertTriangle size={22} color="#DC2626" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A' }}>
                  Eliminar expediente
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94A3B8', padding: '0.25rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo */}
            <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              ¿Estás seguro de que quieres eliminar el expediente?
            </p>
            <p style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.6rem 0.85rem',
              margin: '0 0 1.25rem 0',
              fontWeight: 700,
              color: '#0D3A5F',
              fontSize: '0.9375rem',
            }}>
              &ldquo;{projectName}&rdquo;
            </p>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Esta acción eliminará el expediente y todos sus módulos (presupuesto, Marco Lógico, personal, documentos). <strong>No se puede deshacer.</strong>
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#475569',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isPending ? '#FCA5A5' : '#DC2626',
                  color: 'white',
                  cursor: isPending ? 'wait' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isPending ? (
                  <>
                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
