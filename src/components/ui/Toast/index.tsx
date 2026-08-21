'use client';

import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';
import type { Toast } from '@/hooks/useToast';

export interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => {
        let IconComponent = Info;
        let styleClass = styles.info;

        if (toast.type === 'success') {
          IconComponent = CheckCircle;
          styleClass = styles.success;
        } else if (toast.type === 'error') {
          IconComponent = XCircle;
          styleClass = styles.error;
        }

        return (
          <div key={toast.id} className={`${styles.toast} ${styleClass}`}>
            <IconComponent className={styles.icon} size={20} />
            <span className={styles.message}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className={styles.closeBtn}
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
