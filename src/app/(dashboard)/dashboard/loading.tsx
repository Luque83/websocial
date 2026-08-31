import React from 'react';

export default function DashboardLoading() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '220px', height: '32px', background: '#E2E8F0', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ width: '340px', height: '18px', background: '#F1F5F9', borderRadius: '6px' }} />
        </div>
        <div style={{ width: '150px', height: '40px', background: '#E2E8F0', borderRadius: '8px' }} />
      </div>

      {/* Banner Skeleton */}
      <div style={{ height: '140px', background: '#E2E8F0', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }} />

      {/* Stats Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '90px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E2E8F0' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ width: '80px', height: '14px', background: '#E2E8F0', borderRadius: '4px' }} />
              <div style={{ width: '40px', height: '22px', background: '#CBD5E1', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Projects Grid Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ width: '200px', height: '24px', background: '#E2E8F0', borderRadius: '6px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '150px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ width: '70%', height: '20px', background: '#CBD5E1', borderRadius: '6px' }} />
              <div style={{ width: '90%', height: '14px', background: '#E2E8F0', borderRadius: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '90px', height: '20px', background: '#E2E8F0', borderRadius: '9999px' }} />
                <div style={{ width: '70px', height: '14px', background: '#E2E8F0', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
