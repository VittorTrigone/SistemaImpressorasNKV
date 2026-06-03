/**
 * ZPL Processor
 * Utilitário para parsear e manipular código ZPL.
 */

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
 * Injeta ou substitui os comandos de largura e altura totais no ZPL
 * @param {string} rawZpl - O ZPL original
 * @param {number} widthCm - Largura total em cm
 * @param {number} heightCm - Altura total em cm
 * @returns {string} - Novo ZPL
 */
export const injectDimensions = (rawZpl, widthCm = 0, heightCm = 0) => {
  let modifiedZpl = rawZpl;

  if (widthCm > 0) {
    const widthDots = Math.round(widthCm * 80); // Conversão para 203 DPI
    if (/\^PW\d+/i.test(modifiedZpl)) {
      modifiedZpl = modifiedZpl.replace(/\^PW\d+/gi, `^PW${widthDots}`);
    } else {
      modifiedZpl = modifiedZpl.replace(/\^XA/i, `^XA\n^PW${widthDots}`);
    }
  }

  if (heightCm > 0) {
    const heightDots = Math.round(heightCm * 80);
    if (/\^LL\d+/i.test(modifiedZpl)) {
      modifiedZpl = modifiedZpl.replace(/\^LL\d+/gi, `^LL${heightDots}`);
    } else {
      modifiedZpl = modifiedZpl.replace(/\^XA/i, `^XA\n^LL${heightDots}`);
    }
  }

  return modifiedZpl;
};

/**
 * Injeta o comando de quantidade no ZPL
 * @param {string} rawZpl - ZPL original
 * @param {number} quantity - Número de cópias
 * @returns {string} - Novo ZPL
 */
export const injectQuantity = (rawZpl, quantity = 1) => {
  if (quantity <= 1) return rawZpl;
  
  let modifiedZpl = rawZpl;
  
  // Se já existe um comando de quantidade (^PQ), nós o atualizamos
  if (/\^PQ\d+/i.test(modifiedZpl)) {
    modifiedZpl = modifiedZpl.replace(/\^PQ\d+/gi, `^PQ${quantity}`);
  } else {
    // Caso contrário, injetamos logo antes do fechamento ^XZ
    modifiedZpl = modifiedZpl.replace(/\^XZ/i, `^PQ${quantity}\n^XZ`);
  }
  
  return modifiedZpl;
};
