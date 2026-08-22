'use client';

import React, { useState } from 'react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { ProjectBridgeBanner } from '@/components/tools/ProjectBridgeBanner';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { 
  ClipboardCheck, 
  FileCheck, 
  Receipt, 
  Users, 
  Megaphone, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import styles from './checklist.module.css';

interface CheckCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: Array<{
    id: string;
    title: string;
    description: string;
    required: boolean;
  }>;
}

const CHECKLIST_DATA: CheckCategory[] = [
  {
    id: 'admin',
    title: '1. Documentación Administrativa y de Inicio',
    icon: FileCheck,
    items: [
      { id: 'adm-1', title: 'Resolución de concesión y aceptación firmada', description: 'Documento oficial con fecha y número de expediente.', required: true },
      { id: 'adm-2', title: 'Certificados de estar al corriente con AEAT y Seguridad Social', description: 'Vigentes durante todo el periodo de justificación.', required: true },
      { id: 'adm-3', title: 'Certificado bancario de cuenta específica o titularidad', description: 'Extracto donde se ingresó el pago de la subvención.', required: true },
    ]
  },
  {
    id: 'economic',
    title: '2. Justificación Económica (Gastos y Facturas)',
    icon: Receipt,
    items: [
      { id: 'eco-1', title: 'Facturas completas a nombre de la entidad', description: 'Con CIF, dirección fiscal, desglose de IVA/IRPF y concepto detallado.', required: true },
      { id: 'eco-2', title: 'Justificantes de pago bancario (transferencia / cargo)', description: 'Extractos con sello del banco o firma electrónica del adeudo.', required: true },
      { id: 'eco-3', title: 'Estampillado / Certificado de imputación en facturas', description: 'Texto que indica el % y la subvención a la que se imputa.', required: true },
      { id: 'eco-4', title: '3 presupuestos previos en contratos > límite legal', description: 'Exigido por la Ley General de Subvenciones en importes relevantes.', required: false },
    ]
  },
  {
    id: 'personal',
    title: '3. Personal y Costes Salariales',
    icon: Users,
    items: [
      { id: 'per-1', title: 'Nóminas firmadas o con justificante de transferencia', description: 'Salarios abonados dentro del periodo subvencionable.', required: true },
      { id: 'per-2', title: 'Modelos RLC y RNT (antiguos TC1 y TC2) de Seguridad Social', description: 'Acompañados de su correspondiente justificante bancario de pago.', required: true },
      { id: 'per-3', title: 'Modelo 111 de retenciones IRPF y carta de pago 190', description: 'Ingreso trimestral en Hacienda correspondiente al personal imputado.', required: true },
      { id: 'per-4', title: 'Partes mensuales de dedicación horaria (Time-sheets)', description: 'Firmados por el trabajador y la dirección si la dedicación es parcial.', required: true },
    ]
  },
  {
    id: 'technical',
    title: '4. Memoria Técnica y Evidencias de Ejecución',
    icon: ClipboardCheck,
    items: [
      { id: 'tec-1', title: 'Memoria técnica final de actividades ejecutadas', description: 'Redactada siguiendo el formato oficial del manual de justificación.', required: true },
      { id: 'tec-2', title: 'Hojas de firmas y registro de personas beneficiarias', description: 'Con nombres, DNI y firmas en talleres o sesiones individuales.', required: true },
      { id: 'tec-3', title: 'Dossier fotográfico y materiales didácticos generados', description: 'Fotografías de actividades y folletos/guías editadas.', required: true },
      { id: 'tec-4', title: 'Informe de cumplimiento de indicadores SMART', description: 'Comparativa de meta prevista vs. resultado real alcanzado.', required: true },
    ]
  },
  {
    id: 'publicity',
    title: '5. Publicidad y Difusión de Logos Obligatorios',
    icon: Megaphone,
    items: [
      { id: 'pub-1', title: 'Inclusión del logotipo del financiador en carteles/webs', description: 'Logotipo en formato oficial con la leyenda de subvencionado.', required: true },
      { id: 'pub-2', title: 'Capturas de pantalla o fotografías de la cartelería física', description: 'Placa o cartel en la sede del proyecto visible al público.', required: true },
    ]
  }
];

export function ChecklistJustificacion() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Stats
  const allItems = CHECKLIST_DATA.flatMap(cat => cat.items);
  const totalItems = allItems.length;
  const completedCount = allItems.filter(item => checkedItems[item.id]).length;
  const requiredItems = allItems.filter(item => item.required);
  const completedRequired = requiredItems.filter(item => checkedItems[item.id]).length;
  
  const scorePct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const isReady = completedRequired === requiredItems.length;

  const copyText = `AUDITORÍA DE JUSTIFICACIÓN DE SUBVENCIÓN:
Cumplimiento Total: ${completedCount} de ${totalItems} requisitos (${scorePct}%)
Requisitos Obligatorios: ${completedRequired} de ${requiredItems.length} completados.
Estado: ${isReady ? 'LISTO PARA PRESENTAR A AUDITORÍA' : 'DOCUMENTACIÓN PENDIENTE DE REVISAR'}`;

  return (
    <div className={styles.container}>
      {/* KPI Overview */}
      <div className={styles.summaryCards}>
        <div className={`${styles.card} ${styles.cardHighlight}`}>
          <span className={styles.cardTitle}>Nivel de Cumplimiento</span>
          <span className={styles.cardValue}>{scorePct}%</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${scorePct}%`, background: isReady ? '#22c55e' : '#f59e0b' }} />
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.cardTitle}>Requisitos Obligatorios</span>
          <span className={styles.cardValue} style={{ color: isReady ? '#16a34a' : '#dc2626' }}>
            {completedRequired} / {requiredItems.length}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isReady ? 'Todos los obligatorios cumplidos' : 'Faltan documentos críticos'}
          </span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardTitle}>Dictamen de Auditoría</span>
          <span className={styles.cardValue} style={{ fontSize: '1.125rem', color: isReady ? '#16a34a' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {isReady ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            {isReady ? 'Apto para Entrega' : 'Revisión Pendiente'}
          </span>
        </div>
      </div>

      {/* CHECKLIST BLOCKS */}
      <div id="checklist-table">
        {CHECKLIST_DATA.map(category => {
          const Icon = category.icon;
          const catCompleted = category.items.filter(i => checkedItems[i.id]).length;

          return (
            <div key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <h3 className={styles.categoryTitle}>
                  <Icon size={20} color="#2563eb" />
                  {category.title}
                </h3>
                <span className={styles.categoryScore}>
                  {catCompleted} / {category.items.length} verificados
                </span>
              </div>

              <div className={styles.checkList}>
                {category.items.map(item => {
                  const isChecked = Boolean(checkedItems[item.id]);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`${styles.checkItem} ${isChecked ? styles.checkItemActive : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className={styles.checkbox}
                      />
                      <div className={styles.checkText}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={styles.checkTitle}>{item.title}</span>
                          {item.required && (
                            <span style={{ fontSize: '0.6875rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase' }}>
                              Obligatorio
                            </span>
                          )}
                        </div>
                        <span className={styles.checkDesc}>{item.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* RESULT PANEL & EXPORT */}
      <ResultPanel title="Informe de Auditoría de Justificación" copyText={copyText}>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          {isReady 
            ? '✅ El expediente cuenta con todos los documentos y evidencias obligatorias exigidas por la Ley General de Subvenciones.'
            : '⚠️ Existen documentos obligatorios pendientes de verificar. Completa todos los puntos marcados en rojo antes de enviar la cuenta justificativa a la administración.'}
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <ExportPdfButton targetId="checklist-table" filename="auditoria-justificacion-subvencion" />
        </div>
      </ResultPanel>

      {/* STRATEGIC BRIDGE BANNER */}
      <ProjectBridgeBanner toolName="Checklist de Justificación" />
    </div>
  );
}

export default ChecklistJustificacion;
