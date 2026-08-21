'use client';

import React, { useState } from 'react';
import type { BlogPostMeta } from '@/lib/content';
import { BlogCard } from '@/components/content/BlogCard';
import { Badge } from '@/components/ui/Badge';
import styles from './BlogList.module.css';

interface BlogListProps {
  initialPosts: BlogPostMeta[];
  categories: string[];
}

export function BlogList({ initialPosts, categories }: BlogListProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  const filteredPosts = activeCategory === 'Todas' 
    ? initialPosts 
    : initialPosts.filter(post => post.category === activeCategory);

  const allCategories = ['Todas', ...categories];

  return (
    <div>
      {categories.length > 0 && (
        <div className={styles.categories}>
          {allCategories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={styles.categoryButton}
              aria-pressed={activeCategory === cat}
            >
              <Badge variant={activeCategory === cat ? 'primary' : 'default'} size="md">
                {cat}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className={styles.empty}>
          <p>Próximamente publicaremos artículos y guías para profesionales del sector social.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPosts.map(post => (
            <BlogCard key={post.slug} {...post} />
          ))}
        </div>
      )}
    </div>
  );
}
