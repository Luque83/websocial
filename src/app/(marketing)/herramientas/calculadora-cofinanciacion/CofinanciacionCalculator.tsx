'use client';

import React, { useState } from 'react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { ProjectBridgeBanner } from '@/components/tools/ProjectBridgeBanner';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { PieChart, Landmark, Building2, HeartHandshake } from 'lucide-react';
import styles from './cofinanciacion.module.css';

export function CofinanciacionCalculator() {
  const [totalProject, setTotalProject] = useState<number>(45000);
  const [grantPct, setGrantPct] = useState<number>(80);
  const [inKindAmount, setInKindAmount] = useState<number>(3000);
  const [otherGrants, setOtherGrants] = useState<number>(0);

  // Calculations
  const grantAmount = (totalProject * grantPct) / 100;
  const cashOwnAmount = Math.max(0, totalProject - grantAmount - inKindAmount - otherGrants);
  const totalOwnAndOther = cashOwnAmount + inKindAmount + otherGrants;

  const realGrantPct = totalProject > 0 ? (grantAmount / totalProject) * 100 : 0;
  const realOwnCashPct = totalProject > 0 ? (cashOwnAmount / totalProject) * 100 : 0;
  const realInKindPct = totalProject > 0 ? (inKindAmount / totalProject) * 100 : 0;
  const realOtherPct = totalProject > 0 ? (otherGrants / totalProject) * 100 : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  const copyText = `PLAN DE COFINANCIACIÓN DEL PROYECTO
Presupuesto Total: ${formatCurrency(totalProject)}
------------------------------------------------
1. Subvención Principal (${realGrantPct.toFixed(1)}%): ${formatCurrency(grantAmount)}
2. Fondos Propios Dinerarios (${realOwnCashPct.toFixed(1)}%): ${formatCurrency(cashOwnAmount)}
3. Aportación en Especie / Voluntariado (${realInKindPct.toFixed(1)}%): ${formatCurrency(inKindAmount)}
4. Otras Subvenciones / Cofinanciadores (${realOtherPct.toFixed(1)}%): ${formatCurrency(otherGrants)}
------------------------------------------------
Total Financiación: ${formatCurrency(totalProject)} (100%)`;

  return (
    <div className={styles.container}>
      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Presupuesto Total del Proyecto (€)</label>
          <input
            type="number"
            min="0"
            step="500"
            className={styles.input}
            value={totalProject}
            onChange={e => setTotalProject(parseFloat(e.target.value) || 0)}
          />
          <span className={styles.helperText}>Coste total 100% de la intervención a ejecutar.</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Porcentaje Máximo Subvencionable por la Convocatoria (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className={styles.input}
            value={grantPct}
            onChange={e => setGrantPct(parseFloat(e.target.value) || 0)}
          />
          <span className={styles.helperText}>Típicamente 70%, 75%, 80% o 90% según las bases.</span>
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Valoración en Especie / Voluntariado (€)</label>
          <input
            type="number"
            min="0"
            step="100"
            className={styles.input}
            value={inKindAmount}
            onChange={e => setInKindAmount(parseFloat(e.target.value) || 0)}
          />
          <span className={styles.helperText}>Cesión de espacios, voluntarios o equipos si la base lo admite.</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Otras Subvenciones / Financiadores Privados (€)</label>
          <input
            type="number"
            min="0"
            step="500"
            className={styles.input}
            value={otherGrants}
            onChange={e => setOtherGrants(parseFloat(e.target.value) || 0)}
          />
          <span className={styles.helperText}>Aportaciones de ayuntamientos, fundaciones o empresas.</span>
        </div>
      </div>

      {/* RESULT PANEL */}
      <ResultPanel title="Plan Financiero de Fuentes de Financiación" copyText={copyText}>
        {/* KPI Cards */}
        <div className={styles.summaryCards}>
          <div className={`${styles.card} ${styles.cardHighlight}`}>
            <span className={styles.cardTitle}>Subvención Solicitada</span>
            <span className={styles.cardValue}>{formatCurrency(grantAmount)}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{realGrantPct.toFixed(1)}% del proyecto</span>
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>Fondos Propios (Dinerarios)</span>
            <span className={styles.cardValue} style={{ color: '#2563eb' }}>{formatCurrency(cashOwnAmount)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{realOwnCashPct.toFixed(1)}% a aportar por la ONG</span>
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>Aportación en Especie</span>
            <span className={styles.cardValue} style={{ color: '#16a34a' }}>{formatCurrency(inKindAmount)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{realInKindPct.toFixed(1)}% valor no monetario</span>
          </div>
        </div>

        {/* Stacked Percentage Bar */}
        <div className={styles.stackedBar}>
          {realGrantPct > 0 && (
            <div className={styles.segment} style={{ width: `${realGrantPct}%`, background: '#2563eb' }}>
              Subvención {realGrantPct.toFixed(0)}%
            </div>
          )}
          {realOwnCashPct > 0 && (
            <div className={styles.segment} style={{ width: `${realOwnCashPct}%`, background: '#f59e0b' }}>
              Fondos Propios {realOwnCashPct.toFixed(0)}%
            </div>
          )}
          {realInKindPct > 0 && (
            <div className={styles.segment} style={{ width: `${realInKindPct}%`, background: '#10b981' }}>
              Especie {realInKindPct.toFixed(0)}%
            </div>
          )}
          {realOtherPct > 0 && (
            <div className={styles.segment} style={{ width: `${realOtherPct}%`, background: '#8b5cf6' }}>
              Otros {realOtherPct.toFixed(0)}%
            </div>
          )}
        </div>

        {/* Official Financing Sources Table */}
        <div className={styles.tableWrapper} id="cofinanciacion-table">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fuente de Financiación</th>
                <th>Tipo de Aportación</th>
                <th className={styles.numCol}>Porcentaje (%)</th>
                <th className={styles.numCol}>Importe (€)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Organismo Convocante (Subvención Principal)</strong></td>
                <td>Pública Dineraria</td>
                <td className={styles.numCol}>{realGrantPct.toFixed(2)}%</td>
                <td className={styles.numCol}><strong>{formatCurrency(grantAmount)}</strong></td>
              </tr>
              <tr>
                <td><strong>Entidad Solicitante (Fondos Propios)</strong></td>
                <td>Privada Dineraria</td>
                <td className={styles.numCol}>{realOwnCashPct.toFixed(2)}%</td>
                <td className={styles.numCol}>{formatCurrency(cashOwnAmount)}</td>
              </tr>
              <tr>
                <td><strong>Entidad Solicitante (En Especie / Voluntariado)</strong></td>
                <td>No Dineraria</td>
                <td className={styles.numCol}>{realInKindPct.toFixed(2)}%</td>
                <td className={styles.numCol}>{formatCurrency(inKindAmount)}</td>
              </tr>
              {otherGrants > 0 && (
                <tr>
                  <td><strong>Otras Entidades / Cofinanciadores</strong></td>
                  <td>Pública / Privada</td>
                  <td className={styles.numCol}>{realOtherPct.toFixed(2)}%</td>
                  <td className={styles.numCol}>{formatCurrency(otherGrants)}</td>
                </tr>
              )}
              <tr className={styles.totalRow}>
                <td colSpan={2}>PRESUPUESTO TOTAL FINANCIADO</td>
                <td className={styles.numCol}>100.00%</td>
                <td className={styles.numCol}>{formatCurrency(totalProject)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <ExportPdfButton targetId="cofinanciacion-table" filename="plan-cofinanciacion-proyecto" />
        </div>
      </ResultPanel>

      {/* STRATEGIC BRIDGE BANNER */}
      <ProjectBridgeBanner toolName="Calculadora de Cofinanciación" />
    </div>
  );
}

export default CofinanciacionCalculator;
