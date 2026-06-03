import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Usar Unpkg para garantir que o worker não falhe no build do Vite
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Remove bordas brancas de um canvas (Auto-crop).
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement}
 */
const autoCropCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      // Considera não-branco se alfa > 0 e a cor não for quase branca pura
      if (a > 10 && (r < 240 || g < 240 || b < 240)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        hasPixels = true;
      }
    }
  }

  if (!hasPixels) return canvas;

  // Dá uma margenzinha
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const croppedWidth = maxX - minX;
  const croppedHeight = maxY - minY;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;
  croppedCanvas.getContext('2d').putImageData(ctx.getImageData(minX, minY, croppedWidth, croppedHeight), 0, 0);

  return croppedCanvas;
};

/**
 * Lê um arquivo (PDF, PNG, JPG) e o desenha em um elemento Canvas.
 * Escala e centraliza a imagem para caber na etiqueta (203 DPI).
 * @param {File} file O arquivo selecionado pelo usuário.
 * @param {boolean} isPortrait Se true, rotaciona a imagem em 90 graus (caso venha em paisagem).
 * @param {number} labelWidthCm Largura da etiqueta em cm.
 * @param {number} labelHeightCm Altura da etiqueta em cm.
 * @returns {Promise<HTMLCanvasElement>}
 */
export const fileToCanvas = async (file, isPortrait = true, labelWidthCm = 10, labelHeightCm = 15) => {
  return new Promise((resolve, reject) => {
    const isPdf = file.type === 'application/pdf';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let sourceCanvas = document.createElement('canvas');
        let sourceCtx = sourceCanvas.getContext('2d');

        if (isPdf) {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const page = await pdf.getPage(1);

          const viewport = page.getViewport({ scale: 4.0 });
          sourceCanvas.width = viewport.width;
          sourceCanvas.height = viewport.height;

          await page.render({ canvasContext: sourceCtx, viewport: viewport }).promise;
        } else {
          let imageElement = new Image();
          await new Promise((res) => {
            imageElement.onload = res;
            imageElement.src = e.target.result;
          });
          sourceCanvas.width = imageElement.width;
          sourceCanvas.height = imageElement.height;
          sourceCtx.drawImage(imageElement, 0, 0);
        }

        // Corta as bordas brancas do sourceCanvas
        const croppedSource = autoCropCanvas(sourceCanvas);
        let imgWidth = croppedSource.width;
        let imgHeight = croppedSource.height;

        const finalWidthCm = labelWidthCm || 10;
        const finalHeightCm = labelHeightCm || 15;
        const dotsPerCm = 80;
        const canvasWidth = Math.round(finalWidthCm * dotsPerCm);
        const canvasHeight = Math.round(finalHeightCm * dotsPerCm);

        let canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let ctx = canvas.getContext('2d');

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        let shouldRotate = isPortrait;

        let drawWidth = imgWidth;
        let drawHeight = imgHeight;

        if (shouldRotate) {
          drawWidth = imgHeight;
          drawHeight = imgWidth;
        }

        const scale = Math.min(canvasWidth / drawWidth, canvasHeight / drawHeight);
        const finalDrawWidth = drawWidth * scale;
        const finalDrawHeight = drawHeight * scale;

        const offsetX = (canvasWidth - finalDrawWidth) / 2;
        const offsetY = (canvasHeight - finalDrawHeight) / 2;

        if (shouldRotate) {
          ctx.translate(canvasWidth / 2, canvasHeight / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(
            croppedSource, 
            -finalDrawHeight / 2, 
            -finalDrawWidth / 2, 
            finalDrawHeight, 
            finalDrawWidth
          );
        } else {
          ctx.drawImage(croppedSource, offsetX, offsetY, finalDrawWidth, finalDrawHeight);
        }

        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;

    if (isPdf) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

/**
 * Cria um canvas contendo um texto grande centralizado, dimensionado para a etiqueta.
 */
export const textToCanvas = async (text, isPortrait = true, labelWidthCm = 10, labelHeightCm = 15) => {
  return new Promise((resolve) => {
    const finalWidthCm = labelWidthCm || 10;
    const finalHeightCm = labelHeightCm || 15;
    const dotsPerCm = 80;
    const canvasWidth = Math.round(finalWidthCm * dotsPerCm);
    const canvasHeight = Math.round(finalHeightCm * dotsPerCm);

    let canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    let ctx = canvas.getContext('2d');

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;

    if (isPortrait) {
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((90 * Math.PI) / 180);
      drawWidth = canvasHeight;
      drawHeight = canvasWidth;
      // Ajusta o contexto para o ponto 0,0 temporário
      ctx.translate(-drawWidth / 2, -drawHeight / 2);
    }

    let fontSize = 400;
    ctx.font = `bold ${fontSize}px sans-serif`;
    let textWidth = ctx.measureText(text).width;
    
    while (textWidth > drawWidth * 0.9 || fontSize > drawHeight * 0.8) {
      fontSize -= 10;
      ctx.font = `bold ${fontSize}px sans-serif`;
      textWidth = ctx.measureText(text).width;
      if (fontSize <= 20) break;
    }

    if (isPortrait) {
      ctx.fillText(text, drawWidth / 2, drawHeight / 2);
    } else {
      ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
    }

    resolve(canvas);
  });
};

/**
 * Converte um Canvas em código ZPL nativo (^GF - Graphic Field).
 * Utiliza o algoritmo de threshold (limiar) para Preto e Branco.
 * @param {HTMLCanvasElement} canvas
 * @returns {string} Código ZPL Puro
 */
export const canvasToZpl = (canvas) => {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calcula os bytes por linha
  const bytesPerRow = Math.ceil(width / 8);
  const totalBytes = bytesPerRow * height;
  
  let hexString = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < bytesPerRow; x++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const pixelX = x * 8 + bit;
        if (pixelX < width) {
          const index = (y * width + pixelX) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          // Thresholding (P/B): considera transparente como branco (0)
          // Fórmula simples de luminância
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
          
          // Se for escuro e não for transparente, é um pixel impresso (1)
          if (a > 128 && luminance < 128) {
            byte |= (1 << (7 - bit));
          }
        }
      }
      
      // Converte o byte para hexadecimal (2 dígitos)
      let hex = byte.toString(16).toUpperCase();
      if (hex.length === 1) hex = '0' + hex;
      hexString += hex;
    }
    hexString += '\n'; // Apenas para debug legível (o ZPL ignora quebras de linha no HEX)
  }

  // Remove quebras de linha (não usadas no GFA contínuo)
  const cleanHexString = hexString.replace(/\n/g, '');

  // Compressão RLE (Zebra Graphic Compression)
  let compressedHex = '';
  let i = 0;
  while (i < cleanHexString.length) {
    const char = cleanHexString[i];
    let count = 1;
    while (i + count < cleanHexString.length && cleanHexString[i + count] === char) {
      count++;
    }
    
    if (count > 1) {
      let zCount = Math.floor(count / 400);
      compressedHex += 'z'.repeat(zCount);
      let rem = count % 400;
      if (rem >= 20) {
        let tens = Math.floor(rem / 20);
        compressedHex += String.fromCharCode(103 + tens - 1); // 'g' = 103
        rem = rem % 20;
      }
      if (rem > 0) {
        compressedHex += String.fromCharCode(71 + rem - 1); // 'G' = 71
      }
      compressedHex += char;
      i += count;
    } else {
      compressedHex += char;
      i++;
    }
  }

  // Formato: ^FO0,0^GFA,totalBytes,totalBytes,bytesPerRow,compressedHex^FS
  const zpl = `^XA\n^FO0,0^GFA,${totalBytes},${totalBytes},${bytesPerRow},${compressedHex}^FS\n^XZ`;
  return zpl;
};
