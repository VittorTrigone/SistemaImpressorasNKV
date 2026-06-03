import React from 'react';

const PrinterCard = ({ config, onClick, onEdit, onDelete }) => {
  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '1.75rem', 
        cursor: 'pointer', 
        position: 'relative', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)'
      }} 
      onClick={() => onClick(config)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{config.name}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></span>
            {config.width ? `${config.width}cm x ${config.height}cm` : 'Tamanho Padrão'}
            {config.offsetX !== 0 && config.offsetX !== undefined && ` • Aj. X: ${config.offsetX}pt`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(config); }}
            style={{ color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s', background: 'transparent' }}
            title="Editar"
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(config.id); }}
            style={{ color: 'var(--danger-color)', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s', background: 'transparent', opacity: 0.8 }}
            title="Excluir"
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.opacity = 1 }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = 0.8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', opacity: 0.9 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Imprimir Etiqueta</span>
      </div>
    </div>
  );
};

export default PrinterCard;
