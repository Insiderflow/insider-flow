import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin";
import { runAdminCsvImport, type SupportedDataset } from "@/lib/adminCsvImport";

type ImportPayload = {
  dataset: SupportedDataset;
  filePath: string;
  dryRun?: boolean;
  limit?: number;
};

function isDataset(value: string): value is SupportedDataset {
  return [
    "politicians",
    "issuers",
    "trades",
    "openinsider_companies",
    "openinsider_transactions",
  ].includes(value);
}

export async function POST(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<ImportPayload>;
    if (!body.dataset || !isDataset(body.dataset)) {
      return NextResponse.json({ error: "Invalid dataset" }, { status: 400 });
    }
    if (!body.filePath) {
      return NextResponse.json({ error: "filePath is required" }, { status: 400 });
    }

    const result = await runAdminCsvImport({
      dataset: body.dataset,
      filePath: body.filePath,
      dryRun: body.dryRun,
      limit: body.limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "import failed" },
      { status: 500 },
    );
  }
}

