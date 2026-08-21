'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ResourceCard } from '@/components/content/ResourceCard';
import type { ResourceMeta } from '@/lib/content';
import styles from './ResourceList.module.css';

export interface ResourceListProps {
  initialResources: ResourceMeta[];
}

type Category = 'all' | ResourceMeta['category'];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'guia', label: 'Guías' },
  { id: 'legislacion', label: 'Legislación' },
  { id: 'plantilla', label: 'Plantillas' },
  { id: 'convocatoria', label: 'Convocatorias' },
];

export function ResourceList({ initialResources }: ResourceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filteredResources = useMemo(() => {
    return initialResources.filter((resource) => {
      const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch =
        resource.title.toLowerCase().includes(lowerSearch) ||
        resource.description.toLowerCase().includes(lowerSearch);
      return matchesCategory && matchesSearch;
    });
  }, [initialResources, searchTerm, activeCategory]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`${styles.filterButton} ${activeCategory === category.id ? styles.activeFilter : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No se encontraron recursos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.slug} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
