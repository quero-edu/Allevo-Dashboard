class DashboardApiError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

const wait = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

export async function fetchSpreadsheetData(project: string = '1', sheetId?: string, retries = 2, delay = 1500): Promise<any> {
  let url = `/api/spreadsheet?project=${project}&t=` + Date.now();
  if (sheetId) {
    url += `&sheetId=${encodeURIComponent(sheetId)}`;
  }
  
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      await response.text();
      if (response.status === 401) {
        throw new DashboardApiError('Acesso não autorizado. Confirme seu e-mail e senha e tente novamente.');
      }
      if (response.status === 403) {
        throw new DashboardApiError('Você não tem permissão para acessar este dashboard.');
      }
      throw new DashboardApiError(
        response.status >= 500
          ? 'O servidor está temporariamente indisponível.'
          : `Não foi possível carregar os dados (HTTP ${response.status}).`,
        response.status >= 500
      );
    }

    const data = await response.json();

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new DashboardApiError(data.error || `Erro na rede: ${response.statusText}`, retryable);
    }

    return data;
  } catch (error: any) {
    console.error("Erro ao carregar os dados:", error);
    const retryable = error instanceof DashboardApiError
      ? error.retryable
      : error?.name === 'TimeoutError' || error?.name === 'AbortError' || error instanceof TypeError;
    if (retryable && retries > 0) {
      await wait(delay);
      return fetchSpreadsheetData(project, sheetId, retries - 1, Math.round(delay * 1.5));
    }
    if (retryable && (error?.name === 'TimeoutError' || error?.name === 'AbortError')) {
      throw new Error('A planilha demorou mais que o esperado para responder. Tente sincronizar novamente.');
    }
    throw error;
  }
}
