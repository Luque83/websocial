'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  FileText, 
  Receipt, 
  Eye, 
  Check, 
  X,
  Building2,
  Mail
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await inviteTeamMemberAction({ name, email, role });
      if (res.success) {
        setOrg(prev => ({
          ...prev,
          members: [
            ...prev.members,
            {
              id: `mem-${Date.now()}`,
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
      } else {
        alert(res.error || 'Error invitando al miembro.');
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Seguro que deseas dar de baja a este colaborador de la entidad?')) return;
    await removeTeamMemberAction(id);
    setOrg(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
  };

  return (
    <div className={styles.page}>
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
                      onClick={() => handleRemove(member.id)}
                      className={styles.deleteBtn}
                      title="Eliminar colaborador"
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
                  disabled={isSubmitting}
                  className={styles.inviteBtn}
                >
                  {isSubmitting ? 'Enviando Invitación...' : 'Enviar Invitación de Acceso'}
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
