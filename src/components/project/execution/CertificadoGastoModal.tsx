'use client';

import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Receipt,
  FileCheck2,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import styles from './execution.module.css';

export interface CertificadoGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura: {
    id: string;
    numFactura: string;
    fecha: string;
    proveedor: string;
    nif: string;
    concepto: string;
    totalFactura: number;
    pctImputado: number;
    importeImputado: number;
    partidaId?: string;
    partidaName?: string;
    metodoPago?: string;
    fechaPago?: string;
    refBancaria?: string;
    facturaFileName?: string;
    justificanteFileName?: string;
  };
  project: {
    name: string;
    expediente?: string;
    organismo?: string;
    entityName?: string;
    entityCif?: string;
  };
}

export function CertificadoGastoModal({
  isOpen,
  onClose,
  factura,
  project,
}: CertificadoGastoModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const baseImponible = factura.totalFactura > 0 ? Number((factura.totalFactura / 1.21).toFixed(2)) : 0;
  const ivaTotal = Number((factura.totalFactura - baseImponible).toFixed(2));
  const baseImputada = Number((baseImponible * (factura.pctImputado / 100)).toFixed(2));
  const ivaImputado = Number((ivaTotal * (factura.pctImputado / 100)).toFixed(2));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
        {/* Top bar (Hidden during printing) */}
        <div className={styles.modalTopNav}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 size={20} color="#16C7B2" />
            <strong style={{ color: '#0D3A5F', fontSize: '1rem' }}>
              Certificado Oficial de Imputación de Gasto / Factura
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className={styles.btnPrint}
            >
              <Printer size={16} /> Imprimir / Guardar PDF Oficial
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL SHEET */}
        <div className={styles.sheetContainer} ref={printAreaRef}>
          {/* Header */}
          <div className={styles.sheetHeader}>
            <div className={styles.sheetHeaderLeft}>
              <h2 className={styles.sheetTitle}>CERTIFICADO DE IMPUTACIÓN Y JUSTIFICACIÓN DE GASTO</h2>
              <div className={styles.sheetSubtitle}>
                DOCUMENTO DE CONFORMIDAD Y ASIGNACIÓN DE FACTURAS — LEY GENERAL DE SUBVENCIONES (ART. 30 Y 31 LGS)
              </div>
            </div>
            <div className={styles.sheetHeaderRight}>
              <div className={styles.periodBadge} style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                <strong>FACTURA: {factura.numFactura || 'S/N'}</strong>
              </div>
            </div>
          </div>

          {/* Project & Entity Identity Grid */}
          <div className={styles.sheetDataGrid}>
            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>1. ENTIDAD BENEFICIARIA</span>
              <strong className={styles.dataVal}>{project.entityName || 'Asociación para el Desarrollo e Intervención Social'}</strong>
              <div className={styles.dataSub}>CIF: {project.entityCif || 'G-82910482'}</div>
            </div>

            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>2. PROYECTO SUBVENCIONADO</span>
              <strong className={styles.dataVal}>{project.name}</strong>
              <div className={styles.dataSub}>Expediente: {project.expediente || 'SUBV-2026/048'} · {project.organismo || 'Administración Concedente'}</div>
            </div>

            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>3. PROVEEDOR / EMISOR</span>
              <strong className={styles.dataVal}>{factura.proveedor || 'Sin proveedor'}</strong>
              <div className={styles.dataSub}>NIF/CIF: {factura.nif || '—'} · Fecha Emisión: {factura.fecha || '—'}</div>
            </div>

            <div className={styles.dataBox}>
              <span className={styles.dataLabel}>4. PARTIDA PRESUPUESTARIA</span>
              <strong className={styles.dataVal}>{factura.partidaName || 'Gasto Corriente / Actividades'}</strong>
              <div className={styles.dataSub}>Porcentaje Imputado al Proyecto: <strong>{factura.pctImputado}%</strong></div>
            </div>
          </div>

          {/* Economic Breakdown Table */}
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0D3A5F', margin: '1.25rem 0 0.5rem 0', textTransform: 'uppercase' }}>
            5. Desglose Económico y Criterio de Imputación
          </h3>

          <table className={styles.sheetTable}>
            <thead>
              <tr>
                <th>Concepto / Descripción del Gasto</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Base Imponible</th>
                <th style={{ width: '90px', textAlign: 'right' }}>IVA / Imp.</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Total Factura</th>
                <th style={{ width: '80px', textAlign: 'center' }}>% Imputado</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Importe Subvención</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{factura.concepto || 'Gasto vinculado al desarrollo de las actividades del proyecto'}</strong>
                  <div style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '2px' }}>
                    Factura Nº {factura.numFactura} de fecha {factura.fecha}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(baseImponible)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(ivaTotal)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(factura.totalFactura)}</td>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#0D3A5F' }}>{factura.pctImputado}%</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#009E96', fontSize: '0.9375rem' }}>
                  {formatCurrency(factura.importeImputado)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className={styles.sheetTotalRow}>
                <td>TOTALES IMPUTADOS AL EXPEDIENTE:</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(baseImputada)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(ivaImputado)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(factura.totalFactura)}</td>
                <td style={{ textAlign: 'center' }}>{factura.pctImputado}%</td>
                <td style={{ textAlign: 'right', fontWeight: 900, color: '#0D3A5F', background: '#E2E8F0' }}>
                  {formatCurrency(factura.importeImputado)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Traceability Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            margin: '1rem 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                Forma y Estado de Pago
              </span>
              <strong style={{ color: '#166534', fontSize: '0.8125rem' }}>
                {factura.metodoPago === 'transferencia_sepa' ? '✓ Transferencia Bancaria SEPA' : (factura.metodoPago || 'Transferencia')}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                Fecha de Cargo Bancario
              </span>
              <strong style={{ color: '#0D3A5F', fontSize: '0.8125rem' }}>
                {factura.fechaPago || factura.fecha || 'Conforme extracto'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                Referencia SEPA / Identificador
              </span>
              <strong style={{ color: '#0D3A5F', fontSize: '0.8125rem' }}>
                {factura.refBancaria || 'TRF-SEPA-OFICIAL'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                Comprobante Digital
              </span>
              <strong style={{ color: '#2563EB', fontSize: '0.75rem' }}>
                {factura.facturaFileName || 'Archivo PDF custodia en Bóveda'}
              </strong>
            </div>
          </div>

          {/* Declaración responsable & Firma */}
          <div className={styles.declarationBox}>
            <p style={{ margin: 0, fontSize: '0.71875rem', color: '#334155', lineHeight: 1.5 }}>
              <strong>DECLARACIÓN RESPONSABLE DE IMPUTACIÓN Y EFECTIVIDAD DEL GASTO:</strong> La persona representante legal de la entidad beneficiaria certifica bajo su responsabilidad que el gasto reflejado en la factura reseñada ha sido efectivamente realizado, facturado y pagado para los fines directos del proyecto subvencionado, habiéndose aplicado criterios objetivos y proporcionales para su imputación, sin que en ningún caso supere el coste real del servicio ni concurra doble financiación pública o privada para el porcentaje imputado, de conformidad con lo establecido en los artículos 19, 30 y 31 de la Ley 38/2003, de 17 de noviembre, General de Subvenciones.
            </p>
          </div>

          {/* Signature Boxes */}
          <div className={styles.signatureGrid} style={{ marginTop: '1.5rem' }}>
            <div className={styles.signatureBox}>
              <span className={styles.sigTitle}>Responsable de Administración / Finanzas:</span>
              <div className={styles.sigLine} />
              <strong className={styles.sigName}>Responsable Económico/a</strong>
              <span className={styles.sigRole}>Control de Justificaciones y Tesorería</span>
            </div>

            <div className={styles.signatureBox}>
              <span className={styles.sigTitle}>Vº Bº Representante Legal / Presidencia:</span>
              <div className={styles.sigLine} />
              <strong className={styles.sigName}>Representación Legal Oficial</strong>
              <span className={styles.sigRole}>{project.entityName || 'Asociación para el Desarrollo e Intervención Social'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
