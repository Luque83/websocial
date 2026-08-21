'use client';

import React, { useState } from 'react';
import { Copy, Printer, Check, FileText } from 'lucide-react';
import styles from './ResultPanel.module.css';

export interface ResultPanelProps {
  title?: string;
  children: React.ReactNode;
  copyText?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ResultPanel({
  title = 'Resultados',
  children,
  copyText,
  isEmpty = false,
  emptyMessage = 'Rellena el formulario para ver los resultados.',
  className = '',
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = copyText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.actions}>
          {copyText && (
            <button
              className={styles.iconButton}
              onClick={handleCopy}
              title={copied ? '¡Copiado!' : 'Copiar al portapapeles'}
              aria-label="Copiar resultados"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className={styles.btnLabel}>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          )}
          <button
            className={styles.iconButton}
            onClick={handlePrint}
            title="Imprimir"
            aria-label="Imprimir resultados"
          >
            <Printer size={16} />
            <span className={styles.btnLabel}>Imprimir</span>
          </button>
        </div>
      </div>
      <div className={styles.content}>
        {isEmpty ? (
          <div className={styles.empty}>
            <FileText size={32} />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default ResultPanel;
