export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export const mainNavigation: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Herramientas', href: '/herramientas', description: 'Calculadoras, generadores y utilidades profesionales' },
  { label: 'Recursos', href: '/recursos', description: 'Guías, legislación y documentación profesional' },
  { label: 'Blog', href: '/blog', description: 'Artículos, noticias y actualizaciones del sector' },
  { label: 'Contacto', href: '/contacto' },
];

export const footerNavigation = {
  product: {
    title: 'Producto',
    links: [
      { label: 'Herramientas', href: '/herramientas' },
      { label: 'Recursos', href: '/recursos' },
      { label: 'Blog', href: '/blog' },
      { label: 'Sobre nosotros', href: '/sobre-nosotros' },
    ],
  },
  resources: {
    title: 'Recursos',
    links: [
      { label: 'Guías profesionales', href: '/recursos' },
      { label: 'Legislación', href: '/recursos' },
      { label: 'Plantillas', href: '/recursos' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Aviso legal', href: '#' },
      { label: 'Política de privacidad', href: '#' },
      { label: 'Política de cookies', href: '#' },
    ],
  },
  contact: {
    title: 'Contacto',
    links: [
      { label: 'Formulario de contacto', href: '/contacto' },
      { label: 'contacto@websocial.es', href: 'mailto:contacto@websocial.es' },
    ],
  },
} as const;
