export type BulkFreeListingCsvRow = {
  readonly line: number;
  readonly nome: string;
  readonly categoria: string;
  readonly bairro: string;
  readonly whatsapp: string;
};

const HEADER_ALIASES: Record<string, keyof Omit<BulkFreeListingCsvRow, "line">> = {
  nome: "nome",
  name: "nome",
  titulo: "nome",
  título: "nome",
  title: "nome",
  anuncio: "nome",
  anúncio: "nome",
  categoria: "categoria",
  category: "categoria",
  bairro: "bairro",
  neighborhood: "bairro",
  whatsapp: "whatsapp",
  zap: "whatsapp",
  telefone: "whatsapp",
  phone: "whatsapp",
  celular: "whatsapp",
};

export const BULK_FREE_LISTING_CSV_TEMPLATE = `nome,categoria,bairro,whatsapp
Padaria Exemplo,Alimentação,Nazaré,91999999999
Salão Exemplo,Beleza,Umarizal,91988887766
`;

export const BULK_FREE_LISTING_MAX_ROWS = 100;

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Parse CSV line respecting aspas simples. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

export function parseBulkFreeListingCsv(text: string): {
  readonly rows: BulkFreeListingCsvRow[];
  readonly parseError?: string;
} {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    return { rows: [], parseError: "Arquivo vazio" };
  }

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      parseError: "Inclua o cabeçalho e pelo menos uma linha de dados",
    };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const rawHeaders = splitCsvLine(lines[0]!, delimiter).map(normalizeHeader);
  const columnMap: Partial<
    Record<keyof Omit<BulkFreeListingCsvRow, "line">, number>
  > = {};

  rawHeaders.forEach((header, index) => {
    const key = HEADER_ALIASES[header];
    if (key && columnMap[key] === undefined) {
      columnMap[key] = index;
    }
  });

  const missing = (["nome", "categoria", "bairro", "whatsapp"] as const).filter(
    (key) => columnMap[key] === undefined
  );
  if (missing.length > 0) {
    return {
      rows: [],
      parseError: `Cabeçalho incompleto. Faltam colunas: ${missing.join(", ")}. Use: nome,categoria,bairro,whatsapp`,
    };
  }

  const dataLines = lines.slice(1);
  if (dataLines.length > BULK_FREE_LISTING_MAX_ROWS) {
    return {
      rows: [],
      parseError: `Limite de ${BULK_FREE_LISTING_MAX_ROWS} linhas por importação. Este arquivo tem ${dataLines.length}.`,
    };
  }

  const rows: BulkFreeListingCsvRow[] = dataLines.map((line, index) => {
    const cells = splitCsvLine(line, delimiter);
    return {
      line: index + 2,
      nome: cells[columnMap.nome!] ?? "",
      categoria: cells[columnMap.categoria!] ?? "",
      bairro: cells[columnMap.bairro!] ?? "",
      whatsapp: cells[columnMap.whatsapp!] ?? "",
    };
  });

  return { rows };
}
