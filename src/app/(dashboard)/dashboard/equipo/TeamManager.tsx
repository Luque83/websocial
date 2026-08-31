'use client';

import React, { useState, useTransition } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  FileText, 
  Receipt, 
  Eye, 
  X,
  AlertTriangle,
} from 'lucide-react';
import { 
  OrganizationProfile, 
  UserRole, 
  inviteTeamMemberAction, 
  removeTeamMemberAction 
} from '@/app/actions/organizations';
import styles from './equipo.module.css';

interface TeamManagerProps {
  initialOrg: OrganizationProfile;
}

const ROLE_INFO: Record<UserRole, { label: string; class: string; icon: React.ElementType; desc: string }> = {
  director: {
    label: 'Dirección / Coordinación',
    class: styles.badgeDirector,
    icon: ShieldCheck,
    desc: 'Acceso total a proyectos, semáforos de riesgo, asignación de personal y aprobación de memorias.'
  },
  tecnico: {
    label: 'Técnico Social / Proyectos',
    class: styles.badgeTecnico,
    icon: FileText,
    desc: 'Diseño del marco lógico, registro de actividades, cronograma y carga de evidencias (firmas, fotos).'
  },
  economico: {
    label: 'Gestor Económico / Admin',
    class: styles.badgeEconomico,
    icon: Receipt,
    desc: 'Imputación de facturas, costes de nóminas, control de desviaciones y verificación de pagos bancarios.'
  },
  auditor: {
    label: 'Auditor Externo / Consulta',
    class: styles.badgeAuditor,
    icon: Eye,
    desc: 'Acceso de solo lectura para revisión de cuentas justificativas, expedientes y descarga de memorias.'
  }
};

export function TeamManager({ initialOrg }: TeamManagerProps) {
  const [org, setOrg] = useState(initialOrg);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    startTransition(async () => {
      const res = await inviteTeamMemberAction({ name, email, role });
      if (res.success) {
        setOrg(prev => ({
          ...prev,
          members: [
            ...prev.members,
            {
              id: crypto.randomUUID(),
              name,
              email,
              role,
              status: 'active',
              joinedAt: new Date().toISOString().split('T')[0]
            }
          ]
        }));
        setIsModalOpen(false);
        setName('');
        setEmail('');
        showToast(`Invitación enviada a ${email} correctamente.`);
      } else {
        showToast(res.error || 'Error al invitar al miembro.', 'error');
      }
    });
  };

  const handleRemoveConfirm = () => {
    if (!removeConfirmId) return;
    startTransition(async () => {
      await removeTeamMemberAction(removeConfirmId);
      setOrg(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== removeConfirmId)
      }));
      setRemoveConfirmId(null);
      showToast('Colaborador dado de baja correctamente.');
    });
  };

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toast.type === 'error' ? '#991B1B' : '#0D3A5F',
          color: 'white',
          padding: '0.85rem 1.5rem', borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999, fontSize: '0.875rem', fontWeight: 700,
          border: `1.5px solid ${toast.type === 'error' ? '#FCA5A5' : '#16C7B2'}`,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {removeConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '420px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '0.6rem', display: 'flex' }}>
                <AlertTriangle size={20} color="#DC2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                ¿Dar de baja a este colaborador?
              </h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              El colaborador perderá acceso a los proyectos de la entidad. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRemoveConfirmId(null)}
                disabled={isPending}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                disabled={isPending}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#DC2626', color: 'white', cursor: isPending ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.875rem' }}
              >
                {isPending ? 'Procesando...' : 'Sí, dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Equipo y Colaboradores de la Entidad</h1>
          <p className={styles.subtitle}>
            {org.name} · CIF: {org.cif} ({org.members.length} miembros activos)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={styles.inviteBtn}
        >
          <UserPlus size={16} /> Invitar Colaborador
        </button>
      </header>

      {/* ROLES INFO CARDS */}
      <section className={styles.rolesGrid}>
        {(Object.entries(ROLE_INFO) as [UserRole, typeof ROLE_INFO[UserRole]][]).map(([key, info]) => {
          const Icon = info.icon;
          return (
            <div key={key} className={styles.roleCard}>
              <span className={`${styles.roleBadge} ${info.class}`}>
                <Icon size={13} /> {info.label}
              </span>
              <p className={styles.roleDesc}>{info.desc}</p>
            </div>
          );
        })}
      </section>

      {/* MEMBERS TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre y Apellidos</th>
              <th>Email</th>
              <th>Rol y Permisos</th>
              <th>Fecha de Alta</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {org.members.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                  No hay colaboradores registrados. Invita al primer miembro del equipo.
                </td>
              </tr>
            )}
            {org.members.map(member => {
              const roleData = ROLE_INFO[member.role] || ROLE_INFO.tecnico;
              const Icon = roleData.icon;

              return (
                <tr key={member.id}>
                  <td>
                    <div className={styles.memberName}>
                      <Users size={16} color="#64748b" />
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.memberEmail}>{member.email}</span>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${roleData.class}`}>
                      <Icon size={12} /> {roleData.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{member.joinedAt}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setRemoveConfirmId(member.id)}
                      className={styles.deleteBtn}
                      title="Dar de baja a este colaborador"
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

      {/* INVITE MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Invitar Nuevo Colaborador a la Entidad</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. María Fernández Soler"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Correo Electrónico Corporativo</label>
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="m.fernandez@asociacion.org"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rol y Nivel de Acceso</label>
                <select
                  className={styles.select}
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                >
                  <option value="tecnico">Técnico Social / Proyectos (Marco Lógico, Actividades, Firmas)</option>
                  <option value="economico">Gestor Económico / Administración (Facturas, Pagos, Nóminas)</option>
                  <option value="director">Dirección / Coordinación General (Control Total y Aprobación)</option>
                  <option value="auditor">Auditor Externo / Consulta (Solo Lectura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.65rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.inviteBtn}
                >
                  {isPending ? 'Enviando...' : 'Enviar Invitación de Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManager;
