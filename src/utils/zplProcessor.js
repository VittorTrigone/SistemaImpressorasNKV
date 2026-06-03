/**
 * ZPL Processor
 * Utilitário para parsear e manipular código ZPL.
 */

// Extrai blocos de ^XA a ^XZ de uma string ZPL
export const extractZplBlocks = (zplString) => {
  const blocks = [];
  const regex = /\^XA([\s\S]*?)\^XZ/gi;
  let match;
  while ((match = regex.exec(zplString)) !== null) {
    blocks.push(match[1]); // Guarda o conteúdo interno sem ^XA e ^XZ
  }
  
  // Se não encontrar blocos delimitados, assume que a string inteira é o corpo (fallback)
  if (blocks.length === 0 && zplString.trim().length > 0) {
    return [zplString.replace(/\^XA/i, '').replace(/\^XZ/i, '')];
  }
  
  return blocks;
};

// Aplica um offset no eixo X em todos os comandos de posição (FO, FT)
export const shiftZplX = (zplBody, offsetX) => {
  if (offsetX === 0) return zplBody;

  // Regex para ^FOx,y ou ^FTx,y
  const regex = /(\^(?:FO|FT))\s*(\d+)\s*,\s*(\d+)/gi;
  
  return zplBody.replace(regex, (match, cmd, x, y) => {
    const newX = parseInt(x, 10) + parseInt(offsetX, 10);
    return `${cmd}${newX},${y}`;
  });
};

/**
 * Agrupa N etiquetas em uma única linha (Multi-coluna)
 * @param {string} rawZpl - O ZPL original contendo uma ou mais etiquetas
 * @param {number} columns - Número de colunas na bobina
 * @param {number} labelWidth - Largura de UMA etiqueta em pontos (ex: 400)
 * @param {number} gap - Espaçamento entre as colunas em pontos (ex: 20)
 * @returns {string} - Novo ZPL combinado
 */
export const processMultiColumnZpl = (rawZpl, columns = 1, labelWidth = 0, gap = 0) => {
  const colCount = parseInt(columns, 10) || 1;
  if (colCount <= 1) return rawZpl; // Nada a processar

  const width = parseInt(labelWidth, 10) || 0;
  const gapWidth = parseInt(gap, 10) || 0;

  const blocks = extractZplBlocks(rawZpl);
  if (blocks.length === 0) return rawZpl;

  let finalZpl = '';

  // Processa em lotes de "colCount" (ex: de 2 em 2)
  for (let i = 0; i < blocks.length; i += colCount) {
    finalZpl += '^XA\n'; // Inicia a etiqueta combinada

    // Injeta PW se largura total for útil (opcional, o driver geralmente faz)
    // const totalWidth = (width * colCount) + (gapWidth * (colCount - 1));
    // if (totalWidth > 0) finalZpl += `^PW${totalWidth}\n`;

    // Processa cada coluna na linha atual
    for (let col = 0; col < colCount; col++) {
      const blockIndex = i + col;
      if (blockIndex < blocks.length) {
        const body = blocks[blockIndex];
        const offsetX = col * (width + gapWidth);
        const shiftedBody = shiftZplX(body, offsetX);
        
        finalZpl += `\n^FX --- Coluna ${col + 1} ---\n`;
        finalZpl += shiftedBody;
      }
    }

    finalZpl += '\n^XZ\n'; // Finaliza a etiqueta combinada
  }

  return finalZpl;
};
