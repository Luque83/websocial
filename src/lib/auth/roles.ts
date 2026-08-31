/**
 * Helper de roles y autorización para WebSocial
 */

// Lista de correos con permisos de Administrador General / SuperAdmin
export const ADMIN_EMAILS = [
  'jlluquef@gmail.com',
  'jlluquef@hotmail.com',
  'admin@websocial.es',
  'contacto@websocial.es',
];

/**
 * Determina si un usuario tiene permisos de Administrador General (SuperAdmin).
 * Solo se otorga acceso a emails explícitamente autorizados.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  
  const normalized = email.toLowerCase().trim();

  // 1. Coincidencia con lista de administradores autorizados
  if (ADMIN_EMAILS.includes(normalized)) return true;

  // 2. Lista adicional mediante variable de entorno ADMIN_EMAILS (separado por comas)
  if (process.env.ADMIN_EMAILS) {
    const envAdmins = process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());
    if (envAdmins.includes(normalized)) return true;
  }

  return false;
}
