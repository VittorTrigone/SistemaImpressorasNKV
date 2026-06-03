import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js para rodar no navegador via CDN
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Lê um arquivo (PDF, PNG, JPG) e o desenha em um elemento Canvas.
 * @param {File} file O arquivo selecionado pelo usuário.
 * @param {boolean} isPortrait Se true, rotaciona a imagem em 90 graus (caso venha em paisagem).
 * @returns {Promise<HTMLCanvasElement>}
 */
export const fileToCanvas = async (file, isPortrait = true) => {
  return new Promise((resolve, reject) => {
    const isPdf = file.type === 'application/pdf';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let imgWidth, imgHeight;
        let imageElement = null;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        if (isPdf) {
          // Lógica para PDF
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const page = await pdf.getPage(1); // Pega a primeira página

          // Escala de 3.0 para garantir boa resolução na impressão térmica
          const viewport = page.getViewport({ scale: 3.0 });
          
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

        // Se a largura for maior que a altura, e queremos modo Retrato, devemos rotacionar?
        // Geralmente etiquetas do Mercado Livre vêm em paisagem. Se isPortrait for true, forçamos a rotação se for paisagem.
        let shouldRotate = false;
        if (isPortrait && imgWidth > imgHeight) {
          shouldRotate = true;
        } else if (!isPortrait && imgHeight > imgWidth) {
          // Se o usuário pedir paisagem mas a imagem veio retrato (raro), rotacionamos
          shouldRotate = true;
        }

        if (shouldRotate) {
          canvas.width = imgHeight;
          canvas.height = imgWidth;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(imageElement, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        } else {
          canvas.width = imgWidth;
          canvas.height = imgHeight;
          ctx.drawImage(imageElement, 0, 0, imgWidth, imgHeight);
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
