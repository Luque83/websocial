import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPost, getBlogSlugs } from '@/lib/content';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { NewsletterCTA } from '@/components/marketing/NewsletterCTA';
import { siteConfig } from '@/config/site';
import styles from './slug.module.css';

export async function generateStaticParams() {
  return getBlogSlugs().map(slug => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.excerpt,
    openGraph: {
      title: post.meta.title,
      description: post.meta.excerpt,
      type: 'article',
      publishedTime: post.meta.date,
      authors: [post.meta.author],
      tags: post.meta.tags,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const { default: MDXContent } = await import(`@/content/blog/${slug}.mdx`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.meta.title,
    description: post.meta.excerpt,
    datePublished: post.meta.date,
    keywords: post.meta.tags.join(', '),
    author: {
      '@type': 'Organization',
      name: siteConfig.creator,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${slug}`,
    },
  };

  const formattedDate = new Date(post.meta.date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <main className={styles.main}>
        <Container size="lg">
          <Breadcrumb
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: post.meta.title },
            ]}
          />
          <header className={styles.header}>
            <Badge variant="primary">{post.meta.category}</Badge>
            <h1 className={styles.title}>{post.meta.title}</h1>
            <div className={styles.meta}>
              <span>{post.meta.author}</span>
              <span className={styles.dot}>·</span>
              <time dateTime={post.meta.date}>{formattedDate}</time>
              <span className={styles.dot}>·</span>
              <span>{post.meta.readTime} de lectura</span>
            </div>
            <p className={styles.excerpt}>{post.meta.excerpt}</p>
          </header>
          <div className={`prose ${styles.proseWrapper}`}>
            <MDXContent />
          </div>
          <footer className={styles.articleFooter}>
            <div className={styles.tags}>
              <span className={styles.tagsLabel}>Etiquetas:</span>
              {post.meta.tags.map(tag => (
                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
              ))}
            </div>
          </footer>
          <div className={styles.newsletterWrapper}>
            <NewsletterCTA />
          </div>
        </Container>
      </main>
    </>
  );
}
