import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  published: boolean;
}

export interface ResourceMeta {
  slug: string;
  title: string;
  description: string;
  category: 'guia' | 'legislacion' | 'plantilla' | 'convocatoria';
  date: string;
  tags: string[];
  downloadUrl?: string;
  externalUrl?: string;
  published: boolean;
}

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');
const RECURSOS_DIR = path.join(process.cwd(), 'src', 'content', 'recursos');

export function getBlogPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
  const posts = files.map(filename => {
    const slug = filename.replace(/\.mdx$/, '');
    const filePath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    return {
      slug,
      title: data.title ?? '',
      excerpt: data.excerpt ?? '',
      date: data.date ? String(data.date) : '',
      category: data.category ?? '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author ?? 'WebSocial',
      readTime: data.readTime ?? '5 min',
      published: data.published !== false,
    } satisfies BlogPostMeta;
  });
  return posts
    .filter(p => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(slug: string): { meta: BlogPostMeta; content: string } | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const meta: BlogPostMeta = {
    slug,
    title: data.title ?? '',
    excerpt: data.excerpt ?? '',
    date: data.date ? String(data.date) : '',
    category: data.category ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author ?? 'WebSocial',
    readTime: data.readTime ?? '5 min',
    published: data.published !== false,
  };
  return { meta, content };
}

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace(/\.mdx$/, ''));
}

function readMdxFiles(dir: string): ResourceMeta[] {
  if (!fs.existsSync(dir)) return [];
  const results: ResourceMeta[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readMdxFiles(fullPath));
    } else if (entry.name.endsWith('.mdx')) {
      const slug = entry.name.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);
      results.push({
        slug,
        title: data.title ?? '',
        description: data.description ?? '',
        category: data.category ?? 'guia',
        date: data.date ? String(data.date) : '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        downloadUrl: data.downloadUrl,
        externalUrl: data.externalUrl,
        published: data.published !== false,
      });
    }
  }
  return results;
}

export function getResources(category?: ResourceMeta['category']): ResourceMeta[] {
  const all = readMdxFiles(RECURSOS_DIR);
  const filtered = category ? all.filter(r => r.category === category) : all;
  return filtered
    .filter(r => r.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getResourceSlugs(): { slug: string }[] {
  const all = readMdxFiles(RECURSOS_DIR);
  return all.filter(r => r.published).map(r => ({ slug: r.slug }));
}
