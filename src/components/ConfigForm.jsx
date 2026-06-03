import React, { useState, useEffect } from 'react';

const ConfigForm = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [columns, setColumns] = useState(initialData?.columns || '1');
  const [width, setWidth] = useState(initialData?.width || '');
  const [height, setHeight] = useState(initialData?.height || '');
  const [gap, setGap] = useState(initialData?.gap || '');
  const [offsetX, setOffsetX] = useState(initialData?.offsetX || '0');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setColumns(initialData.columns || '1');
      setWidth(initialData.width || '');
      setHeight(initialData.height || '');
      setGap(initialData.gap || '');
      setOffsetX(initialData.offsetX || '0');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      id: initialData?.id || Date.now().toString(),
      name,
      columns: parseInt(columns, 10) || 1,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      gap: parseFloat(gap) || 0,
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Colunas na Bobina</label>
            <select 
              value={columns} 
              onChange={(e) => setColumns(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}
            >
              <option value="1">1 Coluna</option>
              <option value="2">2 Colunas</option>
              <option value="3">3 Colunas</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Largura de 1 Etiqueta (cm)</label>
            <input 
              type="number" 
              step="0.1"
              value={width} 
              onChange={(e) => setWidth(e.target.value)} 
              placeholder="Ex: 4"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Espaçamento entre colunas (cm)</label>
            <input 
              type="number" 
              step="0.1"
              value={gap} 
              onChange={(e) => setGap(e.target.value)} 
              placeholder="Ex: 0.2"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Ajuste p/ Direita (Pontos ZPL)</label>
            <input 
              type="number" 
              value={offsetX} 
              onChange={(e) => setOffsetX(e.target.value)} 
              placeholder="Ex: 50 ou -30"
              style={{ width: '100%' }}
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
