import React, { useState, useEffect } from 'react';

const ConfigForm = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [width, setWidth] = useState(initialData?.width || '');
  const [height, setHeight] = useState(initialData?.height || '');
  const [offsetX, setOffsetX] = useState(initialData?.offsetX || '0');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setWidth(initialData.width || '');
      setHeight(initialData.height || '');
      setOffsetX(initialData.offsetX || '0');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      id: initialData?.id || Date.now().toString(),
      name,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      offsetX: parseInt(offsetX, 10) || 0
    });
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
        {initialData ? 'Editar Configuração' : 'Nova Configuração de Etiqueta'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nome da Etiqueta (ex: Meli Produtos)</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={{ width: '100%' }}
              placeholder="Digite um nome..."
            />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Largura da Bobina (cm) - Opcional</label>
            <input 
              type="number" 
              step="0.1"
              value={width} 
              onChange={(e) => setWidth(e.target.value)} 
              placeholder="Ex: 8"
              style={{ width: '100%' }}
              title="Largura total da bobina"
            />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Altura (cm) - Opcional</label>
            <input 
              type="number" 
              step="0.1"
              value={height} 
              onChange={(e) => setHeight(e.target.value)} 
              placeholder="Ex: 4"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Ajuste p/ Direita (Pontos)</label>
            <input 
              type="number" 
              value={offsetX} 
              onChange={(e) => setOffsetX(e.target.value)} 
              placeholder="Ex: 50 ou -30"
              style={{ width: '100%' }}
              title="Move toda a impressão para a direita (positivo) ou esquerda (negativo)."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Salvar Configuração</button>
        </div>
      </form>
    </div>
  );
};

export default ConfigForm;
