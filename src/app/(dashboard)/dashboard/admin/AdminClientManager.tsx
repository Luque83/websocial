'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard,
  FolderKanban,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import type { AdminCommercialMetrics, ClientProfile } from '@/app/actions/admin';
import { updateClientPlanAction } from '@/app/actions/admin';
import styles from './admin.module.css';

interface AdminClientManagerProps {
  initialMetrics: AdminCommercialMetrics;
}

export function AdminClientManager({ initialMetrics }: AdminClientManagerProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'all' | 'free' | 'pro' | 'entidad'>('all');
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePlanChange = async (clientId: string, newPlan: ClientProfile['plan']) => {
    setUpdatingClientId(clientId);
    try {
      const res = await updateClientPlanAction(clientId, newPlan, 'active');
      if (res.success) {
        setMetrics(prev => {
          const updatedClients = prev.clients.map(c => {
            if (c.id !== clientId) return c;
            const price = newPlan === 'pro' ? 29 : newPlan === 'entidad' ? 79 : newPlan === 'enterprise' ? 199 : 0;
            return { ...c, plan: newPlan, monthlyPrice: price, status: 'active' as const };
          });

          const pb = {
            free: updatedClients.filter(c => c.plan === 'free').length,
            pro: updatedClients.filter(c => c.plan === 'pro').length,
            entidad: updatedClients.filter(c => c.plan === 'entidad').length,
            enterprise: updatedClients.filter(c => c.plan === 'enterprise').length,
          };
          const mrr = (pb.pro * 29) + (pb.entidad * 79) + (pb.enterprise * 199);

          return {
            ...prev,
            clients: updatedClients,
            planBreakdown: pb,
            mrr,
            arr: mrr * 12,
            activeSubscriptions: pb.pro + pb.entidad + pb.enterprise,
          };
        });
        showToast(res.message);
      } else {
        alert(res.message);
      }
    } catch {
      alert('Error al actualizar el plan.');
    } finally {
      setUpdatingClientId(null);
    }
  };

  const filteredClients = useMemo(() => {
    return metrics.clients.filter(c => {
      const matchesSearch = 
        c.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.cif && c.cif.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPlan = selectedPlanFilter === 'all' || c.plan === selectedPlanFilter;
      return matchesSearch && matchesPlan;
    });
  }, [metrics.clients, searchQuery, selectedPlanFilter]);

  const exportClientsCsv = () => {
    const headers = ['ID', 'Entidad', 'Email', 'CIF', 'Plan', 'Precio Mes (€)', 'Proyectos', 'Uso IA', 'Estado', 'Fecha Registro'];
    const rows = filteredClients.map(c => [
      c.id,
      `"${c.organizationName}"`,
      c.email,
      c.cif || '',
      c.plan.toUpperCase(),
      c.monthlyPrice,
      c.projectsCount,
      c.aiUsageCount,
      c.status,
      c.createdAt.split('T')[0]
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `informe_clientes_websocial_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Informe de clientes exportado en CSV.');
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0D3A5F',
          color: 'white',
          padding: '0.85rem 1.5rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          border: '1.5px solid #16C7B2'
        }}>
          <CheckCircle2 size={18} color="#16C7B2" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#EAF5FB', color: '#0D3A5F', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', border: '1px solid #D5ECF8' }}>
            <ShieldCheck size={14} color="#16C7B2" /> Centro de Operaciones y Facturación
          </div>
          <h1 className={styles.title}>Panel de Control Comercial (SuperAdmin)</h1>
          <p className={styles.subtitle}>
            Supervisa en tiempo real las suscripciones activas, clientes del sector social, ingresos recurrentes (MRR) y consumo de IA.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={exportClientsCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#0D3A5F',
              color: 'white',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(13, 58, 95, 0.25)'
            }}
          >
            <Download size={16} color="#16C7B2" /> Exportar Clientes (CSV)
          </button>
        </div>
      </div>

      {/* KPI Globales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderTop: '4px solid #16C7B2' }}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <TrendingUp size={24} color="#16C7B2" />
          </div>
          <div className={styles.statInfo}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className={styles.statValue}>{metrics.mrr.toLocaleString('es-ES')} €</span>
              <span style={{ fontSize: '0.75rem', color: '#009E96', fontWeight: 800 }}>/mes</span>
            </div>
            <span className={styles.statLabel}>MRR (Ingresos Recurrentes)</span>
            <span style={{ fontSize: '0.75rem', color: '#5C7E9B', fontWeight: 600, marginTop: '0.2rem' }}>
              ARR Estimado: {metrics.arr.toLocaleString('es-ES')} €/año
            </span>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderTop: '4px solid #009E96' }}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#009E96' }}>
            <CreditCard size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{metrics.activeSubscriptions}</span>
            <span className={styles.statLabel}>Suscripciones de Pago</span>
            <span style={{ fontSize: '0.75rem', color: '#5C7E9B', fontWeight: 600, marginTop: '0.2rem' }}>
              {metrics.planBreakdown.entidad} Entidades · {metrics.planBreakdown.pro} Pro
            </span>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderTop: '4px solid #0D3A5F' }}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <Building2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{metrics.totalClients}</span>
            <span className={styles.statLabel}>Entidades Clientes Registradas</span>
            <span style={{ fontSize: '0.75rem', color: '#5C7E9B', fontWeight: 600, marginTop: '0.2rem' }}>
              {metrics.totalProjects} Expedientes Gestionados
            </span>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderTop: '4px solid #FF7A3F' }}>
          <div className={styles.statIcon} style={{ background: '#FFF5EB', color: '#FF7A3F' }}>
            <Sparkles size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{metrics.totalAiAnalyses}</span>
            <span className={styles.statLabel}>Convocatorias Analizadas (IA)</span>
            <span style={{ fontSize: '0.75rem', color: '#009E96', fontWeight: 700, marginTop: '0.2rem' }}>
              🟢 Google Gemini Operativo
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{
        background: 'white',
        border: '1.5px solid #D5ECF8',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#5C7E9B" />
          <input
            type="text"
            placeholder="Buscar por nombre de ONG, CIF o email de contacto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.875rem',
              color: '#0D3A5F',
              fontFamily: 'inherit',
              fontWeight: 600
            }}
          />
        </div>

        {/* Filtros de Plan */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Todos (${metrics.clients.length})` },
            { id: 'entidad', label: `Entidad 79€ (${metrics.planBreakdown.entidad})` },
            { id: 'pro', label: `Pro 29€ (${metrics.planBreakdown.pro})` },
            { id: 'free', label: `Gratuito (${metrics.planBreakdown.free})` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedPlanFilter(f.id as typeof selectedPlanFilter)}
              style={{
                background: selectedPlanFilter === f.id ? '#0D3A5F' : '#EAF5FB',
                color: selectedPlanFilter === f.id ? 'white' : '#0D3A5F',
                border: '1px solid #D5ECF8',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Detallada de Clientes y Gestión de Licencias */}
      <div className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            <Building2 size={20} color="#16C7B2" /> Directorio de Clientes y Asignación de Licencias
          </h2>
          <span style={{ fontSize: '0.8125rem', color: '#5C7E9B', fontWeight: 600 }}>
            Mostrando <strong>{filteredClients.length}</strong> de {metrics.clients.length} entidades
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entidad Social / Cliente</th>
                <th>Contacto y Email</th>
                <th>Expedientes</th>
                <th>Uso IA</th>
                <th>Plan Contratado</th>
                <th>Cuota Mensual</th>
                <th>Acción Administrador</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.9375rem', color: '#0D3A5F' }}>{client.organizationName}</strong>
                        {client.cif && (
                          <div style={{ fontSize: '0.75rem', color: '#5C7E9B' }}>
                            CIF: {client.cif}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', color: '#0D3A5F', fontWeight: 600 }}>{client.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#5C7E9B' }}>{client.email}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: '#0D3A5F',
                        background: '#EAF5FB',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        <FolderKanban size={14} color="#16C7B2" /> {client.projectsCount}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: '#009E96',
                        background: '#EAF5FB',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        <Sparkles size={14} color="#009E96" /> {client.aiUsageCount} peticiones
                      </span>
                    </td>
                    <td>
                      <select
                        value={client.plan}
                        disabled={updatingClientId === client.id}
                        onChange={e => handlePlanChange(client.id, e.target.value as ClientProfile['plan'])}
                        style={{
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.8125rem',
                          fontFamily: 'inherit',
                          border: '1.5px solid #D5ECF8',
                          background: client.plan === 'entidad' ? '#EAF5FB' : client.plan === 'pro' ? '#F0FDF4' : '#F8FAFC',
                          color: client.plan === 'entidad' ? '#0D3A5F' : client.plan === 'pro' ? '#166534' : '#64748B',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="free">🟢 Gratuito (0€)</option>
                        <option value="pro">🔵 Profesional (29€/m)</option>
                        <option value="entidad">🟣 Entidad Social (79€/m)</option>
                        <option value="enterprise">🏢 Institucional (199€/m)</option>
                      </select>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: client.monthlyPrice > 0 ? '#009E96' : '#64748B' }}>
                        {client.monthlyPrice} €/mes
                      </strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => showToast(`Factura proforma de ${client.monthlyPrice}€ generada para ${client.organizationName}`)}
                        className={styles.actionBtn}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <FileText size={14} /> Factura Proforma
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#5C7E9B' }}>
                    No se encontraron clientes con el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminClientManager;
