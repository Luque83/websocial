import React from 'react';
import Link from 'next/link';
import { Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import styles from './BlogCard.module.css';

export interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  featured?: boolean;
  className?: string;
}

export function BlogCard({
  slug,
  title,
  excerpt,
  date,
  category,
  tags,
  readTime,
  featured = false,
  className = '',
}: BlogCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''} ${className}`}>
      <Link href={`/blog/${slug}`} className={styles.link}>
        <div className={styles.top}>
          <Badge variant="primary" size="sm">{category}</Badge>
          <span className={styles.readTime}>
            <Clock size={12} />
            {readTime}
          </span>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.excerpt}>{excerpt}</p>
        <div className={styles.meta}>
          <span className={styles.date}>
            <Calendar size={12} />
            {formattedDate}
          </span>
          {tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
        </div>
      </Link>
    </article>
  );
}

export default BlogCard;
