import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configurar o worker do PDF.js para rodar no navegador via Vite
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

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
        let imgWidth, imgHeight;
        let imageElement = null;

        if (isPdf) {
          // Lógica para PDF
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const page = await pdf.getPage(1); // Pega a primeira página

          // Escala generosa para garantir que não perca qualidade antes do redimensionamento
          const viewport = page.getViewport({ scale: 4.0 });
          
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;

          await page.render({ canvasContext: tempCtx, viewport: viewport }).promise;
          imageElement = tempCanvas;
          imgWidth = tempCanvas.width;
          imgHeight = tempCanvas.height;
        } else {
          // Lógica para Imagem Comum (PNG/JPG)
          imageElement = new Image();
          await new Promise((res) => {
            imageElement.onload = res;
            imageElement.src = e.target.result;
          });
          imgWidth = imageElement.width;
          imgHeight = imageElement.height;
        }

        // Definir tamanho final baseado na etiqueta (203 DPI = ~80 dots por cm)
        // Se a largura não foi configurada, assume 10x15cm
        const finalWidthCm = labelWidthCm || 10;
        const finalHeightCm = labelHeightCm || 15;
        const dotsPerCm = 80;
        const canvasWidth = Math.round(finalWidthCm * dotsPerCm);
        const canvasHeight = Math.round(finalHeightCm * dotsPerCm);

        let canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let ctx = canvas.getContext('2d');

        // Fundo branco para garantir que transparências não virem preto
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Lógica de rotação
        let shouldRotate = false;
        if (isPortrait && imgWidth > imgHeight) {
          shouldRotate = true;
        } else if (!isPortrait && imgHeight > imgWidth) {
          shouldRotate = true;
        }

        let drawWidth = imgWidth;
        let drawHeight = imgHeight;

        if (shouldRotate) {
          // Se rotacionar, inverte as proporções da imagem para o cálculo de escala
          drawWidth = imgHeight;
          drawHeight = imgWidth;
        }

        // Calcula a escala para caber (contain) dentro do canvas final
        const scale = Math.min(canvasWidth / drawWidth, canvasHeight / drawHeight);
        const finalDrawWidth = drawWidth * scale;
        const finalDrawHeight = drawHeight * scale;

        // Centraliza na etiqueta
        const offsetX = (canvasWidth - finalDrawWidth) / 2;
        const offsetY = (canvasHeight - finalDrawHeight) / 2;

        if (shouldRotate) {
          ctx.translate(canvasWidth / 2, canvasHeight / 2);
          ctx.rotate((90 * Math.PI) / 180);
          // Ao rotacionar, a largura e altura originais da imagem são usadas no drawImage
          ctx.drawImage(
            imageElement, 
            -finalDrawHeight / 2, 
            -finalDrawWidth / 2, 
            finalDrawHeight, 
            finalDrawWidth
          );
        } else {
          ctx.drawImage(imageElement, offsetX, offsetY, finalDrawWidth, finalDrawHeight);
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

  // Remove quebras de linha para ZPL compacto
  const cleanHexString = hexString.replace(/\n/g, '');

  // Formato: ^FO0,0^GFA,totalBytes,totalBytes,bytesPerRow,hexString^FS
  // Usamos ^GFA (A = não compactado em ASCII Hex)
  // ^GFA,data_length,data_length,bytes_per_row,data
  const zpl = `^XA\n^FO0,0^GFA,${totalBytes},${totalBytes},${bytesPerRow},${cleanHexString}^FS\n^XZ`;
  return zpl;
};
