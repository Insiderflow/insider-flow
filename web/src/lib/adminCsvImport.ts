import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type SupportedDataset =
  | "politicians"
  | "issuers"
  | "trades"
  | "openinsider_companies"
  | "openinsider_transactions";

type ImportOptions = {
  dataset: SupportedDataset;
  filePath: string;
  dryRun?: boolean;
  limit?: number;
};

type ImportResult = {
  dataset: SupportedDataset;
  filePath: string;
  dryRun: boolean;
  totalRows: number;
  processedRows: number;
  importedRows: number;
  skippedRows: number;
  errors: Array<{ row: number; message: string }>;
  sample: Record<string, unknown>[];
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
    });
    return row;
  });
}

function resolveImportPath(inputPath: string): string {
  const absolute = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);

  const normalized = path.normalize(absolute);
  const workspaceRoot = path.normalize(process.cwd());

  if (!normalized.startsWith(workspaceRoot)) {
    throw new Error("filePath must be inside project workspace");
  }

  return normalized;
}

function numberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,%\s,]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hashId(...parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 28);
}

function requireFields(row: Record<string, string>, fields: string[]) {
  for (const field of fields) {
    if (!row[field]) {
      throw new Error(`missing required field: ${field}`);
    }
  }
}

export async function runAdminCsvImport(options: ImportOptions): Promise<ImportResult> {
  const dryRun = options.dryRun !== false;
  const importPath = resolveImportPath(options.filePath);
  const content = await fs.readFile(importPath, "utf8");
  const rows = parseCsv(content);
  const cappedRows = options.limit && options.limit > 0 ? rows.slice(0, options.limit) : rows;

  const result: ImportResult = {
    dataset: options.dataset,
    filePath: importPath,
    dryRun,
    totalRows: rows.length,
    processedRows: 0,
    importedRows: 0,
    skippedRows: 0,
    errors: [],
    sample: [],
  };

  for (let i = 0; i < cappedRows.length; i += 1) {
    const row = cappedRows[i];
    result.processedRows += 1;
    try {
      if (options.dataset === "politicians") {
        requireFields(row, ["id", "name"]);
        const normalized = {
          id: row.id,
          name: row.name,
          party: row.party || null,
          chamber: row.chamber || null,
          state: row.state || null,
        };
        if (result.sample.length < 5) result.sample.push(normalized);
        if (!dryRun) {
          await prisma.politician.upsert({
            where: { id: normalized.id },
            create: normalized,
            update: normalized,
          });
        }
      }

      if (options.dataset === "issuers") {
        requireFields(row, ["id", "name"]);
        const normalized = {
          id: row.id,
          name: row.name,
          ticker: row.ticker || null,
          sector: row.sector || null,
          country: row.country || null,
        };
        if (result.sample.length < 5) result.sample.push(normalized);
        if (!dryRun) {
          await prisma.issuer.upsert({
            where: { id: normalized.id },
            create: normalized,
            update: normalized,
          });
        }
      }

      if (options.dataset === "trades") {
        requireFields(row, ["id", "politician_id", "issuer_id", "type", "traded_at"]);
        const tradedAt = dateOrNull(row.traded_at);
        if (!tradedAt) throw new Error("invalid traded_at");
        const publishedAt = dateOrNull(row.published_at);

        const normalized = {
          id: row.id,
          politician_id: row.politician_id,
          issuer_id: row.issuer_id,
          type: row.type,
          traded_at: tradedAt,
          published_at: publishedAt,
          filed_after_days: row.filed_after_days ? Number(row.filed_after_days) : null,
          owner: row.owner || null,
          size_min: numberOrNull(row.size_min),
          size_max: numberOrNull(row.size_max),
          price: numberOrNull(row.price),
          source_url: row.source_url || null,
        };
        if (result.sample.length < 5) result.sample.push(normalized);

        if (!dryRun) {
          await prisma.trade.upsert({
            where: { id: normalized.id },
            create: normalized,
            update: normalized,
          });
        }
      }

      if (options.dataset === "openinsider_companies") {
        requireFields(row, ["ticker", "name"]);
        const normalized = {
          ticker: row.ticker.toUpperCase(),
          name: row.name,
        };
        if (result.sample.length < 5) result.sample.push(normalized);
        if (!dryRun) {
          await prisma.openInsiderCompany.upsert({
            where: { ticker: normalized.ticker },
            create: normalized,
            update: { name: normalized.name },
          });
        }
      }

      if (options.dataset === "openinsider_transactions") {
        requireFields(row, ["company_ticker", "company_name", "owner_name", "transaction_type", "trade_date"]);
        const companyTicker = row.company_ticker.toUpperCase();
        const ownerName = row.owner_name;
        const tradeDate = dateOrNull(row.trade_date);
        const transactionDate = dateOrNull(row.transaction_date || row.trade_date);
        if (!tradeDate || !transactionDate) throw new Error("invalid trade_date/transaction_date");

        const deterministicId = row.id || `oi_${hashId(companyTicker, ownerName, row.transaction_type, tradeDate.toISOString())}`;
        const normalized = {
          id: deterministicId,
          company_ticker: companyTicker,
          company_name: row.company_name,
          owner_name: ownerName,
          transaction_type: row.transaction_type,
          trade_date: tradeDate.toISOString(),
        };
        if (result.sample.length < 5) result.sample.push(normalized);

        if (!dryRun) {
          const company = await prisma.openInsiderCompany.upsert({
            where: { ticker: companyTicker },
            create: {
              ticker: companyTicker,
              name: row.company_name,
            },
            update: {
              name: row.company_name,
            },
          });

          const owner = await prisma.openInsiderOwner.upsert({
            where: { name: ownerName },
            create: {
              name: ownerName,
              title: row.owner_title || null,
              isInstitution: row.is_institution ? row.is_institution.toLowerCase() === "true" : false,
            },
            update: {
              title: row.owner_title || undefined,
            },
          });

          await prisma.openInsiderTransaction.upsert({
            where: { id: deterministicId },
            create: {
              id: deterministicId,
              companyId: company.id,
              ownerId: owner.id,
              transactionType: row.transaction_type,
              transactionDate,
              tradeDate,
              lastPrice: numberOrNull(row.last_price),
              quantity: row.quantity || "",
              sharesHeld: row.shares_held || "",
              owned: row.owned || "",
              value: row.value || "",
              valueNumeric: numberOrNull(row.value_numeric ?? row.value),
            },
            update: {
              companyId: company.id,
              ownerId: owner.id,
              transactionType: row.transaction_type,
              transactionDate,
              tradeDate,
              lastPrice: numberOrNull(row.last_price),
              quantity: row.quantity || "",
              sharesHeld: row.shares_held || "",
              owned: row.owned || "",
              value: row.value || "",
              valueNumeric: numberOrNull(row.value_numeric ?? row.value),
            },
          });
        }
      }

      result.importedRows += 1;
    } catch (error) {
      result.skippedRows += 1;
      result.errors.push({
        row: i + 2, // include header offset
        message: error instanceof Error ? error.message : "unknown import error",
      });
    }
  }

  return result;
}

