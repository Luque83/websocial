import type { Metadata } from 'next';
import { getBlogPosts } from '@/lib/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { BlogList } from '@/components/content/BlogList';
import { siteConfig } from '@/config/site';
import styles from './blog.module.css';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artículos, guías y reflexiones sobre intervención social, gestión de entidades y tecnología con propósito.',
};

export default function BlogPage() {
  const posts = getBlogPosts();
  const categories = Array.from(new Set(posts.map(p => p.category)));
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Blog de ${siteConfig.name}`,
    description: 'Artículos, guías y reflexiones sobre intervención social, gestión de entidades y tecnología con propósito.',
    url: `${siteConfig.url}/blog`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <main className={styles.main}>
        <Container>
          <SectionHeading
            eyebrow="Recursos y reflexiones"
            title="Blog de WebSocial"
            subtitle="Artículos, guías y reflexiones sobre intervención social, gestión de entidades y tecnología con propósito."
          />
          <BlogList initialPosts={posts} categories={categories} />
        </Container>
      </main>
    </>
  );
}
