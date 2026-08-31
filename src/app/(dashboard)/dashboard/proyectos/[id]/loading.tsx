import React from 'react';

export default function ProjectDetailLoading() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '280px', height: '24px', background: '#E2E8F0', borderRadius: '6px' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ width: '120px', height: '36px', background: '#E2E8F0', borderRadius: '8px' }} />
          <div style={{ width: '140px', height: '36px', background: '#CBD5E1', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Project Title Header */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ width: '400px', height: '32px', background: '#CBD5E1', borderRadius: '8px' }} />
        <div style={{ width: '600px', height: '18px', background: '#E2E8F0', borderRadius: '6px' }} />
      </div>

      {/* Tabs Bar Skeleton */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ width: '110px', height: '36px', background: '#F1F5F9', borderRadius: '8px' }} />
        ))}
      </div>

      {/* Content Workspace Skeleton */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ width: '300px', height: '24px', background: '#CBD5E1', borderRadius: '6px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '100px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
