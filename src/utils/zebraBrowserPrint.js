const BASE_URL = "http://127.0.0.1:9100";

export const getAvailablePrinters = async () => {
  try {
    const response = await fetch(`${BASE_URL}/available`, {
      method: 'GET'
    });
    if (!response.ok) throw new Error("Não foi possível conectar ao Zebra Browser Print.");
    const text = await response.text();
    if (!text) return [];
    
    const data = JSON.parse(text);
    // Retorna a lista de impressoras garantindo que seja um array
    return data.printer ? (Array.isArray(data.printer) ? data.printer : [data.printer]) : [];
  } catch (error) {
    console.error("Erro ao buscar impressoras disponíveis:", error);
    return [];
  }
};

export const getDefaultPrinter = async () => {
  try {
    const response = await fetch(`${BASE_URL}/default`, {
      method: 'GET'
    });
    if (!response.ok) throw new Error("Não foi possível conectar ao Zebra Browser Print.");
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao buscar impressora padrão:", error);
    throw new Error("Zebra Browser Print não está rodando ou site não foi permitido.");
  }
}

export const printZpl = async (zplData, device) => {
  const payload = {
    device: {
      name: device.name,
      uid: device.uid,
      connection: device.connection,
      deviceType: device.deviceType,
      version: 2,
      provider: device.provider,
      manufacturer: device.manufacturer
    },
    data: zplData
  };

  try {
    const response = await fetch(`${BASE_URL}/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Falha na impressão: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao enviar para a impressora:", error);
    throw error;
  }
};
