export async function fetchSpreadsheetData(project: string = '1', sheetId?: string, retries = 2, delay = 1500): Promise<any> {
  let url = `/api/spreadsheet?project=${project}&t=` + Date.now();
  if (sheetId) {
    url += `&sheetId=${encodeURIComponent(sheetId)}`;
  }
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn("Recebido HTML em vez de JSON:", text.substring(0, 100));
      if (retries > 0) {
        console.log(`Retentando em ${delay}ms... (${retries} tentativas restantes)`);
        await new Promise(res => setTimeout(res, delay));
        return fetchSpreadsheetData(project, sheetId, retries - 1, delay * 1.5);
      }
      throw new Error("O servidor ainda está iniciando. Por favor, recarregue a página em alguns instantes.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erro na rede: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Erro ao carregar os dados:", error);
    throw error;
  }
}

