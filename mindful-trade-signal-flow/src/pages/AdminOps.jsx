import React, { useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATASETS = [
  { value: "politicians", label: "Politicians" },
  { value: "issuers", label: "Issuers" },
  { value: "trades", label: "Trades" },
  { value: "openinsider_companies", label: "OpenInsider Companies" },
  { value: "openinsider_transactions", label: "OpenInsider Transactions" },
];

const TOKEN_KEY = "insiderflow_admin_token";

async function callAdminApi(path, token, payload) {
  const response = await fetch(path, {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
    },
    credentials: "include",
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    throw new Error(parsed?.error || `HTTP ${response.status}`);
  }

  return parsed;
}

export default function AdminOps() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [dataset, setDataset] = useState("openinsider_companies");
  const [filePath, setFilePath] = useState("neonIssuer.csv");
  const [limit, setLimit] = useState("200");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const hasToken = useMemo(() => adminToken.trim().length > 0, [adminToken]);

  const persistToken = (value) => {
    setAdminToken(value);
    if (value.trim()) {
      localStorage.setItem(TOKEN_KEY, value.trim());
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const run = async (action) => {
    if (!hasToken) {
      setError("Admin token required");
      return;
    }

    setRunning(true);
    setError("");

    try {
      let data;
      if (action === "dryRun") {
        data = await callAdminApi("/api/admin/import/csv", adminToken, {
          dataset,
          filePath,
          dryRun: true,
          limit: limit ? Number(limit) : undefined,
        });
      } else if (action === "import") {
        data = await callAdminApi("/api/admin/import/csv", adminToken, {
          dataset,
          filePath,
          dryRun: false,
        });
      } else if (action === "alertsSync") {
        data = await callAdminApi("/api/admin/jobs/alerts-sync", adminToken, {});
      } else {
        data = await callAdminApi("/api/admin/jobs/alerts-sync", adminToken);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Admin Ops" />
      <div className="px-4 pt-4 space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Admin Auth</CardTitle>
            <CardDescription>Token is stored locally on this device only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="password"
              value={adminToken}
              onChange={(e) => persistToken(e.target.value)}
              placeholder="ADMIN_TOKEN"
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => persistToken("")}>Clear Token</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>CSV Import</CardTitle>
            <CardDescription>Run dry-run first, then committed import.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dataset</p>
              <Select value={dataset} onValueChange={setDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {DATASETS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">File path (relative to backend workspace)</p>
              <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="neonIssuer.csv" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dry-run limit</p>
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="200" />
            </div>
            <div className="flex gap-2">
              <Button disabled={running} onClick={() => run("dryRun")}>Dry Run</Button>
              <Button disabled={running} variant="outline" onClick={() => run("import")}>Run Import</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Jobs</CardTitle>
            <CardDescription>Manual controls for background jobs.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button disabled={running} onClick={() => run("alertsSync")}>Run Alerts Sync</Button>
            <Button disabled={running} variant="outline" onClick={() => run("alertsStatus")}>Check Alerts Status</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Textarea
              readOnly
              className="min-h-[220px] font-mono text-[11px]"
              value={result ? JSON.stringify(result, null, 2) : "No output yet."}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

