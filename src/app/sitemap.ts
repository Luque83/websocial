import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getBlogSlugs, getResourceSlugs } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const blogSlugs = getBlogSlugs();
  const resourceSlugs = getResourceSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/herramientas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/herramientas/prorrateo-nominas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/herramientas/costes-proyecto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/herramientas/marco-logico`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/recursos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/sobre-nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const resourceRoutes: MetadataRoute.Sitemap = resourceSlugs.map(({ slug }) => ({
    url: `${baseUrl}/recursos/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...resourceRoutes];
}
