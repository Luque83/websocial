'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteProject } from '@/app/actions/projects';
import styles from './page.module.css';

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`¿Eliminar el proyecto "${projectName}"? Esta acción no se puede deshacer.`)) {
      setIsDeleting(true);
      try {
        await deleteProject(projectId);
        router.refresh();
      } catch (error) {
        console.error(error);
        alert('Error al eliminar el proyecto');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      className={styles.deleteBtn} 
      onClick={handleDelete} 
      disabled={isDeleting}
      title="Eliminar proyecto"
      aria-label="Eliminar proyecto"
    >
      {isDeleting ? <span className={styles.spinner}></span> : <Trash2 size={16} />}
    </button>
  );
}
