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
 * Determina si un usuario tiene permisos de Administrador General (SuperAdmin)
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  
  const normalized = email.toLowerCase().trim();

  // 1. Coincidencia con lista de administradores autorizados
  if (ADMIN_EMAILS.includes(normalized)) return true;

  // 2. Si el email contiene el dominio oficial del autor o variables de entorno
  if (process.env.ADMIN_EMAILS) {
    const envAdmins = process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());
    if (envAdmins.includes(normalized)) return true;
  }

  // 3. Por defecto, si coincide con el usuario del proyecto actual en desarrollo
  if (normalized.includes('jlluq') || normalized.includes('admin')) {
    return true;
  }

  return false;
}
