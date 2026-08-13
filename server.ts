import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Papa from "papaparse";
import JSZip from "jszip";

function timingSafeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

function parseList(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedDashboardUser(suppliedUser: string, expectedUser?: string) {
  const normalizedUser = suppliedUser.trim().toLowerCase();
  const allowedDomains = parseList(process.env.DASHBOARD_ALLOWED_DOMAINS);
  const allowedEmails = parseList(process.env.DASHBOARD_ALLOWED_EMAILS);

  if (allowedEmails.includes(normalizedUser)) {
    return true;
  }

  const emailDomain = normalizedUser.includes("@") ? normalizedUser.split("@").pop() : "";
  if (emailDomain && allowedDomains.includes(emailDomain)) {
    return true;
  }

  if (expectedUser) {
    return timingSafeEqual(suppliedUser, expectedUser);
  }

  return false;
}

function requireDashboardAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expectedUser = process.env.DASHBOARD_USER;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  const hasDomainRules = Boolean(process.env.DASHBOARD_ALLOWED_DOMAINS || process.env.DASHBOARD_ALLOWED_EMAILS);

  if (!expectedPassword || (!expectedUser && !hasDomainRules)) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const [scheme, encoded] = authHeader.split(" ");

  if (scheme !== "Basic" || !encoded) {
    res.setHeader("WWW-Authenticate", 'Basic realm="AllevoTech Dashboard"');
    return res.status(401).send("Login obrigatório");
  }

  let decoded = "";
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    res.setHeader("WWW-Authenticate", 'Basic realm="AllevoTech Dashboard"');
    return res.status(401).send("Login inválido");
  }

  const separatorIndex = decoded.indexOf(":");
  const suppliedUser = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : "";
  const suppliedPassword = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

  const validUser = isAllowedDashboardUser(suppliedUser, expectedUser);
  const validPassword = timingSafeEqual(suppliedPassword, expectedPassword);

  if (!validUser || !validPassword) {
    res.setHeader("WWW-Authenticate", 'Basic realm="AllevoTech Dashboard"');
    return res.status(401).send("Login inválido");
  }

  next();
}

async function fetchCsv(gid: string, sheetId: string = "1fYoNt2OgXNFRsGg8-5xG8BkZHQJvKpUrHZA8nyeN6W8"): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`A planilha (ID: ${sheetId}) está privada. No Google Sheets, clique em 'Compartilhar' no canto superior direito e mude o acesso para 'Qualquer pessoa com o link pode ver'.`);
    }
    throw new Error(`Erro ao buscar dados da planilha (gid ${gid}): HTTP ${response.status}`);
  }
  const csvText = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`Não foi possível interpretar os dados da planilha: ${results.errors[0].message}`));
          return;
        }
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}
// Cache em memória para thumbnails do Instagram para alta performance
const instagramThumbCache = new Map<string, string>();
const ALLOWED_IMAGE_HOSTS = [
  "drive.google.com",
  "lh3.googleusercontent.com",
  "images.unsplash.com",
  "fbcdn.net",
  "cdninstagram.com",
  "instagram.com",
  "facebook.com"
];

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

async function getInstagramThumb(url: string): Promise<string> {
  if (!url || !url.includes("instagram.com/p/")) return "";
  if (instagramThumbCache.has(url)) return instagramThumbCache.get(url) || "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
      },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
      if (match) {
        const imgUrl = match[1].replace(/&amp;/g, "&");
        instagramThumbCache.set(url, imgUrl);
        return imgUrl;
      }
    }
  } catch (e) {
    // Silencioso se der timeout
  }
  return "";
}

function parseCellVal(rowXml: string, col: string, rowNum: number, strings: string[]): string {
  // Se célula for auto-fechada (<c r="A3" s="10"/>), não tem conteúdo
  const selfClosing = rowXml.match(new RegExp(`<c r="${col}${rowNum}"[^>]*/>`, "s"));
  if (selfClosing) return "";

  const cellMatch = rowXml.match(new RegExp(`<c r="${col}${rowNum}"([^>]*)>(.*?)</c>`, "s"));
  if (!cellMatch) return "";
  const attrs = cellMatch[1] || "";
  const body = cellMatch[2] || "";
  
  const fMatch = body.match(/<f[^>]*>(.*?)<\/f>/s);
  const vMatch = body.match(/<v[^>]*>(.*?)<\/v>/s);
  
  let val = vMatch ? vMatch[1] : "";
  if (attrs.includes('t="s"') && val !== "") {
    const idx = parseInt(val, 10);
    val = strings[idx] !== undefined ? strings[idx] : val;
  }
  
  if (fMatch) {
    let f = fMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const strMatches = [...f.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (strMatches.length > 0) {
      if (/IMAGE/i.test(f) || /http/i.test(f)) {
        return strMatches.join("");
      }
      if (!val || val === "#REF!" || val === "#N/A") {
        val = strMatches[strMatches.length - 1];
      }
    }
  }
  return (val || "").trim();
}

async function fetchCriativosWithThumbs(sheetId: string): Promise<any[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Shared strings
    const ssXml = await zip.file("xl/sharedStrings.xml")?.async("text");
    const strings: string[] = [];
    if (ssXml) {
      const siList = ssXml.split("</si>");
      for (const si of siList) {
        if (!si.trim()) continue;
        const tMatches = si.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
        const text = tMatches.map(m => m.replace(/<t[^>]*>|<\/t>/g, '')).join('');
        strings.push(text);
      }
    }

    // Workbook to map sheet name to sheet file
    const wbXml = await zip.file("xl/workbook.xml")?.async("text") || "";
    const sheetMatches = [...wbXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g)];
    
    const relsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("text") || "";
    const relMatches = [...relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)];
    const relMap: Record<string, string> = {};
    relMatches.forEach(m => {
      relMap[m[1]] = m[2].startsWith("/") ? m[2].substring(1) : "xl/" + m[2];
    });
    
    let metaSheetFile = "xl/worksheets/sheet2.xml";
    let targetSheetFile = "xl/worksheets/sheet3.xml";
    for (const s of sheetMatches) {
      const name = s[1];
      const rId = s[3];
      if (/meta/i.test(name) && relMap[rId]) {
        metaSheetFile = relMap[rId];
      }
      if (/criativo/i.test(name) && relMap[rId]) {
        targetSheetFile = relMap[rId];
      }
    }

    // Extrair lista ordenada e única de nomes de anúncios da aba Meta Ads (caso a aba Criativos use UNIQUE/FILTER dinâmico)
    const metaAdNames: string[] = [];
    const metaXml = await zip.file(metaSheetFile)?.async("text");
    if (metaXml) {
      const metaRows = metaXml.split("</row>");
      for (const r of metaRows) {
        const rMatch = r.match(/<row[^>]*r="(\d+)"/);
        const rowNum = rMatch ? parseInt(rMatch[1], 10) : 0;
        if (!rowNum || rowNum === 1) continue;
        const eVal = parseCellVal(r, "E", rowNum, strings);
        if (eVal && !metaAdNames.includes(eVal) && eVal !== "Nome do Anúncio") {
          metaAdNames.push(eVal);
        }
      }
    }
    
    const sheetXml = await zip.file(targetSheetFile)?.async("text");
    if (!sheetXml) {
      throw new Error("Sheet XML not found");
    }
    
    const rows = sheetXml.split("</row>");
    const items: any[] = [];

    // Detectar colunas dinamicamente a partir do cabeçalho (linha 1)
    let colName = "A";
    let colLink = "B";
    let colThumb = "D";

    for (const row of rows) {
      const rMatch = row.match(/<row[^>]*r="1"/);
      if (rMatch || rows.indexOf(row) === 0) {
        const cells = [...row.matchAll(/<c r="([A-Z]+)1"([^>]*)>(.*?)<\/c>/gs)];
        for (const c of cells) {
          const col = c[1];
          const attrs = c[2];
          const body = c[3];
          const vMatch = body.match(/<v[^>]*>(.*?)<\/v>/);
          let val = vMatch ? vMatch[1] : "";
          if (attrs.includes('t="s"')) {
            val = strings[parseInt(val, 10)] || "";
          }
          const lower = val.toLowerCase().trim();
          if ((lower.includes("nome") || lower.includes("criativo") || lower.includes("anúncio") || lower.includes("anuncio")) && !lower.includes("link") && !lower.includes("thumb")) {
            colName = col;
          }
          if (lower.includes("link") && !lower.includes("instagram") && !lower.includes("thumb")) {
            colLink = col;
          }
          if (lower.includes("thumb") || lower.includes("imagem") || lower.includes("preview") || lower.includes("foto") || lower.includes("capa")) {
            colThumb = col;
          }
        }
      }
    }
    
    for (const row of rows) {
      if (!row.trim()) continue;
      const rMatch = row.match(/<row[^>]*r="(\d+)"/);
      const rowNum = rMatch ? parseInt(rMatch[1], 10) : 0;
      if (!rowNum || rowNum === 1) continue; // Pular cabeçalho
      
      let nameVal = parseCellVal(row, colName, rowNum, strings) || parseCellVal(row, "A", rowNum, strings);
      // Se o nome for vazio ou #REF! gerado por fórmula ARRAY/UNIQUE não renderizada no XLSX, usar o nome correspondente do Meta Ads
      if (!nameVal || nameVal.startsWith("#REF") || nameVal.startsWith("#N/A")) {
        nameVal = metaAdNames[rowNum - 2] || "";
      }

      const linkVal = parseCellVal(row, colLink, rowNum, strings) || parseCellVal(row, "B", rowNum, strings);
      let thumbVal = parseCellVal(row, colThumb, rowNum, strings) || parseCellVal(row, "D", rowNum, strings);

      // Se a thumb não estiver na coluna D, checar se alguma outra célula da linha contém uma imagem/IMAGE()
      if (!thumbVal) {
        const allCells = [...row.matchAll(/<c r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/gs)];
        for (const c of allCells) {
          const body = c[3];
          if (body.includes("IMAGE(") || body.includes("fbcdn.net") || body.includes("googleusercontent.com") || body.includes("drive.google.com") || body.includes(".jpg") || body.includes(".png")) {
            const fMatch = body.match(/<f[^>]*>(.*?)<\/f>/);
            if (fMatch) {
              let f = fMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
              const strMatches = [...f.matchAll(/"([^"]+)"/g)].map(m => m[1]);
              if (strMatches.length > 0) {
                thumbVal = strMatches.join('');
                break;
              }
            }
          }
        }
      }
      
      if (nameVal || linkVal || thumbVal) {
        items.push({
          "Criativos": nameVal,
          "Link": linkVal,
          "Thumb_Criativo": thumbVal
        });
      }
    }

    // Para itens com link do Instagram e sem thumb explícita, tentar resolver a thumb via OpenGraph
    const promises = items.map(async (item) => {
      if (!item["Thumb_Criativo"] && item["Link"] && item["Link"].includes("instagram.com/p/")) {
        const ogImg = await getInstagramThumb(item["Link"]);
        if (ogImg) {
          item["Thumb_Criativo"] = ogImg;
        }
      }
      return item;
    });
    await Promise.all(promises);
    
    if (items.length > 0) {
      return items;
    }
  } catch (err) {
    console.warn("XLSX parsing failed or empty, falling back to CSV for criativos:", err);
  }

  // Fallback to CSV
  const csvRows = await fetchCsv("1468046400", sheetId);
  return csvRows.map((item: any) => ({
    "Criativos": item["Nome Criativo"] || item["Criativos"] || item["Nome do Anúncio"] || item["Nome"] || "",
    "Link": item["Link Criativo"] || item["Link"] || "",
    "Thumb_Criativo": item["Thumb_Criativo"] || item["Thumb Criativo"] || item["thumb_criativo"] || item["Thumbnail"] || item["Thumb"] || item["Imagem"] || item["Preview"] || item["Prévia"] || ""
  }));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(requireDashboardAuth);

  // Endpoint de proxy de imagem para evitar bloqueios de CORS/Referer
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
        return res.status(400).send("URL inválida");
      }
      
      const imgRes = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(7000)
      });
      
      if (!imgRes.ok) {
        return res.status(imgRes.status).send("Falha ao buscar imagem externa");
      }
      
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const contentLength = Number(imgRes.headers.get("content-length") || "0");
      if (!contentType.startsWith("image/") || contentLength > 8 * 1024 * 1024) {
        return res.status(415).send("Imagem externa não suportada");
      }
      const buffer = await imgRes.arrayBuffer();
      if (buffer.byteLength > 8 * 1024 * 1024) {
        return res.status(413).send("Imagem externa muito grande");
      }
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(500).send(err.message || "Erro no proxy de imagem");
    }
  });

  // API routes FIRST
  app.get("/api/spreadsheet", async (req, res) => {
    try {
      const project = (req.query.project as string) || "1";
      const sheetId1 = "1fYoNt2OgXNFRsGg8-5xG8BkZHQJvKpUrHZA8nyeN6W8";
      const sheetId2 = "1qzE3zNFvUQwi_yIDcOrRy00wHxkhMTLzMeb9aCTRAbA";

      if (!['1', '2', 'all', 'consolidado', 'both'].includes(project)) {
        return res.status(400).json({ error: 'Funil inválido. Selecione um funil disponível e tente novamente.' });
      }

      const getField = (item: any, ...keys: string[]) => {
        for (const k of keys) {
          if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') {
            return String(item[k]).trim();
          }
        }
        const itemKeys = Object.keys(item || {});
        for (const k of keys) {
          const target = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          const foundKey = itemKeys.find(ik => ik.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
          if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null && String(item[foundKey]).trim() !== '') {
            return String(item[foundKey]).trim();
          }
        }
        return '';
      };

      const formatMeta = (item: any) => ({
        "Data": item["Data"],
        "Nome da Campanha": item["Nome da Campanha"],
        "Nome do Conjunto": item["Nome do Conjunto"],
        "Nome do Anúncio": item["Nome do Anúncio"],
        "Gasto": parseFloat((item["Gasto"] || '0').replace(',', '.')),
        "Impressões": parseInt(item["Impressões"] || '0', 10),
        "Cliques no Link": parseInt(item["Cliques no Link"] || '0', 10),
        "Visualizações da Página de Destino": parseInt(item["Visualizações da Página de Destino"] || '0', 10),
        "Iniciate Checkout": parseInt(item["Iniciate Checkout"] || '0', 10),
        "Thumb_Criativo": getField(item, "Thumb_Criativo", "Thumb Criativo", "thumb_criativo", "Thumb_criativo", "Thumbnail", "Thumb", "Imagem", "Preview", "Prévia")
      });

function parseUtcToUtcMinus3(rawStr: any): { dateStr: string; formattedDisplay: string; timestamp: number } {
  if (!rawStr) return { dateStr: '', formattedDisplay: '', timestamp: 0 };
  const str = String(rawStr).trim();
  if (!str) return { dateStr: '', formattedDisplay: '', timestamp: 0 };

  // Match ISO pattern: 2026-08-04T15:41:25.000Z or 2026-08-04 15:41:25 or 2026-08-04
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  
  // Match DD/MM/YYYY pattern: 11/07/2026 - 20:00 or 11/07/2026 às 16:14 or 11/07/2026 20:00:00 or 11/07/2026
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:(?:\s*(?:-|às|at|\s)\s*)(\d{2}):(\d{2})(?::(\d{2}))?)?/);

  let utcMs = 0;
  let hasTime = false;

  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = isoMatch[4] !== undefined ? parseInt(isoMatch[4], 10) : 0;
    const minutes = isoMatch[5] !== undefined ? parseInt(isoMatch[5], 10) : 0;
    const seconds = isoMatch[6] !== undefined ? parseInt(isoMatch[6], 10) : 0;
    hasTime = isoMatch[4] !== undefined;

    if (hasTime) {
      utcMs = Date.UTC(year, month, day, hours, minutes, seconds);
    } else {
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return {
        dateStr: `${y}-${m}-${d}`,
        formattedDisplay: `${d}/${m}/${y}`,
        timestamp: Date.UTC(year, month, day, 12, 0, 0)
      };
    }
  } else if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] !== undefined ? parseInt(dmyMatch[4], 10) : 0;
    const minutes = dmyMatch[5] !== undefined ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] !== undefined ? parseInt(dmyMatch[6], 10) : 0;
    hasTime = dmyMatch[4] !== undefined;

    if (hasTime) {
      utcMs = Date.UTC(year, month, day, hours, minutes, seconds);
    } else {
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return {
        dateStr: `${y}-${m}-${d}`,
        formattedDisplay: `${d}/${m}/${y}`,
        timestamp: Date.UTC(year, month, day, 12, 0, 0)
      };
    }
  } else {
    const t = Date.parse(str);
    if (!isNaN(t)) {
      utcMs = t;
      hasTime = true;
    } else {
      return { dateStr: str, formattedDisplay: str, timestamp: 0 };
    }
  }

  // Converter de UTC para UTC-3 (subtrair 3 horas = 3 * 3600 * 1000 ms)
  const utcMinus3Ms = utcMs - 3 * 60 * 60 * 1000;
  const d = new Date(utcMinus3Ms);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');

  const dateStr = `${y}-${m}-${day}`;
  const formattedDisplay = `${day}/${m}/${y} ${hh}:${mm}`;

  return {
    dateStr,
    formattedDisplay,
    timestamp: utcMinus3Ms
  };
}

      const formatBuyers = (item: any, funil: 'Estratégia' | 'Gestão IA') => {
        // Column B carries the source purchase timestamp. Use C only when B is empty.
        // Both values are converted from UTC to UTC-3 below.
        const buyerValues = Object.values(item || {});
        const rawPurchaseDate = String(buyerValues[1] || buyerValues[2] || "").trim();
        // The sales sheets keep the offer data in fixed columns: L = main product,
        // O = accepted order bump. Read the positions so different header labels do
        // not break the dashboard's commercial metrics.
        const produtoPrincipal = String(item["Produto Principal"] || item["Produto"] || buyerValues[11] || "").trim();
        const orderBump = String(item["Order Bump"] || item["Order bump"] || buyerValues[14] || "").trim();

        const parsedDate = parseUtcToUtcMinus3(rawPurchaseDate);

        return {
          "Data": parsedDate.dateStr,
          "Data_Original": rawPurchaseDate,
          "Data_Hora_Formatada": parsedDate.formattedDisplay,
          "timestamp": parsedDate.timestamp,
          "Valor": parseFloat((item["Valor da Transação"] || item["Valor"] || item["Valor Líquido Estimado"] || '0').replace(',', '.')),
          "utm_campaign": item["utm_campaign"] || item["Campanha"] || "",
          "utm_source": item["utm_source"] || item["Origem"] || "",
          "utm_medium": item["utm_medium"] || item["Medium"] || "",
          "utm_term": item["utm_term"] || "",
          "utm_content": item["utm_content"] || "",
          "Produto": produtoPrincipal,
          "Produto Principal": produtoPrincipal,
          "Order Bump": orderBump,
          "Funil": funil
        };
      };

      if (project === "all" || project === "consolidado" || project === "both") {
        const [
          [metaItems1, compradoresItems1, criativosItems1],
          [metaItems2, compradoresItems2, criativosItems2]
        ] = await Promise.all([
          Promise.all([fetchCsv("57289144", sheetId1), fetchCsv("0", sheetId1), fetchCriativosWithThumbs(sheetId1)]),
          Promise.all([fetchCsv("57289144", sheetId2), fetchCsv("0", sheetId2), fetchCriativosWithThumbs(sheetId2)])
        ]);

        const data: any = {
          "Dados da Meta": [...metaItems1.map(formatMeta), ...metaItems2.map(formatMeta)],
          "Dados dos Compradores": [
            ...compradoresItems1.map((item) => formatBuyers(item, 'Estratégia')),
            ...compradoresItems2.map((item) => formatBuyers(item, 'Gestão IA'))
          ],
          "Link dos criativos": [...criativosItems1, ...criativosItems2]
        };

        return res.json({ data, project: "all", sheetId: "consolidated" });
      }

      let sheetId = sheetId1;
      if (project === "2") {
        sheetId = sheetId2;
      }

      const [metaItems, compradoresItems, criativosItems] = await Promise.all([
        fetchCsv("57289144", sheetId),
        fetchCsv("0", sheetId),
        fetchCriativosWithThumbs(sheetId)
      ]);

      const data: any = {
        "Dados da Meta": metaItems.map(formatMeta),
        "Dados dos Compradores": compradoresItems.map((item) => formatBuyers(item, project === '2' ? 'Gestão IA' : 'Estratégia')),
        "Link dos criativos": criativosItems
      };

      res.json({ data, project, sheetId });
    } catch (error: any) {
      console.error("Erro ao buscar dados da planilha:", error);
      const message = error.message || "Erro interno no servidor ao processar os dados";
      const isPermissionError = /privada|permissão|compartilhar/i.test(message);
      const isTimeout = error?.name === 'TimeoutError' || /timed out|timeout/i.test(message);
      res.status(isPermissionError ? 403 : isTimeout ? 504 : 502).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
