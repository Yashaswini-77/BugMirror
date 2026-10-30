import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Copy,
  Download,
  Check,
  AlertTriangle,
  FolderGit2,
  ChevronDown,
  FileCode,
  FileSpreadsheet,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { DefectItem, TestRun } from '../types';

interface BugReportViewProps {
  defects: DefectItem[];
  runs: TestRun[];
  onSelectRun: (run: TestRun) => void;
  onNavigate: (tab: any) => void;
}

export const BugReportView: React.FC<BugReportViewProps> = ({
  defects,
  runs,
  onSelectRun,
  onNavigate,
}) => {
  const [selectedDefectId, setSelectedDefectId] = useState<string>(
    defects[0]?.id || ''
  );
  const [format, setFormat] = useState<'jira' | 'markdown' | 'json' | 'csv'>('jira');
  const [copied, setCopied] = useState<boolean>(false);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDefect =
    defects.find((d) => d.id === selectedDefectId) || defects[0];
  const associatedRun = runs.find((r) => r.id === selectedDefect?.runId);

  const [title, setTitle] = useState<string>(
    selectedDefect?.title || 'Race Condition: Inventory Oversold During Flash Sale Checkout'
  );
  const [severity, setSeverity] = useState<string>(selectedDefect?.severity || 'CRITICAL');
  const [rootCause, setRootCause] = useState<string>(
    selectedDefect?.rootCause ||
      'Unsynchronized Time-of-Check to Time-of-Use (TOCTOU) condition allowing concurrent deductions on depleted stock.'
  );

  const handleSelectDefect = (defect: DefectItem) => {
    setSelectedDefectId(defect.id);
    setTitle(defect.title);
    setSeverity(defect.severity);
    setRootCause(defect.rootCause);
  };

  const preStock = associatedRun?.initialStock ?? 1;
  const postStock = associatedRun?.finalStock ?? -1;
  const users = associatedRun?.virtualUsers ?? 2;
  const runId = associatedRun?.id ?? 'run-seed-defective-race';
  const defectId = selectedDefect?.id || 'BM-2026-084';

  const generateReportContent = (targetFormat: 'jira' | 'markdown' | 'json' | 'csv' = format): string => {
    if (targetFormat === 'jira') {
      return `h2. [${severity}] ${title}
*Issue ID:* ${defectId}
*Severity:* ${severity}
*Component:* Inventory & Concurrency Engine
*Environment:* Node.js 22 LTS / Spring Boot 3 Reference

h3. Preconditions
* Initial stock configured to ${preStock} unit(s).
* Concurrent user load: ${users} virtual workers.

h3. Reproduction Steps
# Initialize item "item-99" stock to ${preStock}.
# Trigger ${users} simultaneous HTTP POST requests to /api/sandbox/inventory/checkout with payload {"itemId": "item-99", "quantity": 1}.
# Observe parallel execution interleaving between read validation and update transaction.

h3. Expected Result
Exactly ${preStock} purchase succeeds (HTTP 200). All subsequent requests fail with HTTP 409 Conflict (OUT_OF_STOCK). Final inventory must remain >= 0.

h3. Actual Result
Multiple orders created (${associatedRun?.successOrders ?? 2} confirmed orders). Final database inventory dropped to ${postStock} (Oversold condition).

h3. Suspected Root Cause
${rootCause}

h3. Evidence & Trace
* Test Run Trace ID: ${runId}
* Time-of-Check to Time-of-Use gap: ~25ms interleaving window.`;
    }

    if (targetFormat === 'markdown') {
      return `# [${severity}] ${title}

- **Defect ID:** ${defectId}
- **Severity:** ${severity}
- **Component:** Inventory Concurrency Pipeline
- **Target Tracker:** GitHub Issues

## Preconditions
- Initial inventory stock: ${preStock}
- Virtual user concurrency: ${users} workers

## Reproduction Steps
1. Set item inventory to ${preStock}.
2. Dispatch ${users} concurrent requests to \`/api/sandbox/inventory/checkout\`.
3. Verify that requests arrive within the un-isolated read window.

## Expected Result
Only ${preStock} order succeeds with HTTP 200 OK. Remaining orders rejected with HTTP 409 Conflict. Stock remains >= 0.

## Actual Result
${associatedRun?.successOrders ?? 2} orders confirmed. Stock dropped to ${postStock} (invariant violation).

## Suspected Root Cause
${rootCause}

## Technical Trace
\`\`\`json
{
  "runId": "${runId}",
  "concurrencyWindowMs": 25,
  "mode": "defective",
  "isolatedEvidenceVerified": true
}
\`\`\`
`;
    }

    if (targetFormat === 'json') {
      return JSON.stringify(
        {
          trackerIntegration: {
            targetTrackers: ['Jira Software', 'GitHub Issues', 'Linear'],
            schemaVersion: '2.5.0',
            exportedAt: new Date().toISOString(),
          },
          defect: {
            id: defectId,
            summary: title,
            issueType: 'Bug',
            priority: severity === 'CRITICAL' ? 'Highest' : severity === 'HIGH' ? 'High' : 'Medium',
            severity,
            status: selectedDefect?.status || 'OPEN',
            component: 'Inventory & Transaction Concurrency',
            labels: ['bugmirror-ai', 'concurrency-bug', 'race-condition', 'toctou'],
            environment: 'Node.js 22 LTS / Spring Boot 3 Engine',
            preconditions: `Initial stock: ${preStock} unit(s), Virtual user load: ${users} threads`,
            reproductionSteps: [
              `Set inventory stock to ${preStock} unit(s).`,
              `Dispatch ${users} concurrent HTTP POST requests to /api/sandbox/inventory/checkout with payload {"itemId": "item-99", "quantity": 1}.`,
              'Observe unsynchronized interleaving during inventory deduction.',
            ],
            expectedResult: `Only ${preStock} purchase succeeds. Remaining requests return HTTP 409 Conflict. Final stock >= 0.`,
            actualResult: `${associatedRun?.successOrders ?? 2} purchases confirmed. Final inventory reached ${postStock} (overselling defect).`,
            rootCause,
            telemetry: {
              runId,
              initialStock: preStock,
              finalStock: postStock,
              virtualUsers: users,
              successfulPurchases: associatedRun?.successOrders ?? 2,
              failedPurchases: associatedRun?.failedOrders ?? 0,
            },
          },
        },
        null,
        2
      );
    }

    if (targetFormat === 'csv') {
      // Jira & GitHub CSV Importer compliant headers
      const csvHeader = 'Summary,Issue Type,Priority,Severity,Component,Labels,Environment,Preconditions,Expected Result,Actual Result,Root Cause,Run Trace ID,Status\n';
      const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
      
      const csvRow = [
        escapeCsv(title),
        escapeCsv('Bug'),
        escapeCsv(severity === 'CRITICAL' ? 'Highest' : severity === 'HIGH' ? 'High' : 'Medium'),
        escapeCsv(severity),
        escapeCsv('Inventory Concurrency'),
        escapeCsv('bugmirror-ai,race-condition,toctou'),
        escapeCsv('Node.js 22 LTS / Spring Boot 3'),
        escapeCsv(`Initial stock: ${preStock}, Users: ${users}`),
        escapeCsv(`Only ${preStock} succeeds. Final stock >= 0.`),
        escapeCsv(`Oversold. Stock reached ${postStock}.`),
        escapeCsv(rootCause),
        escapeCsv(runId),
        escapeCsv(selectedDefect?.status || 'OPEN'),
      ].join(',');

      return csvHeader + csvRow;
    }

    return '';
  };

  const reportText = generateReportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generic file downloader helper
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Direct download of selected format
  const handleDownload = () => {
    const ext = format === 'jira' || format === 'markdown' ? 'md' : format;
    const mime = format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/markdown';
    triggerDownload(reportText, `bugmirror-defect-${defectId}.${ext}`, mime);
    showNotice(`Downloaded defect report as .${ext}`);
  };

  // Specific Export as JSON for Jira/GitHub
  const handleExportJson = () => {
    const jsonContent = generateReportContent('json');
    triggerDownload(
      jsonContent,
      `bugmirror-defect-${defectId}-tracker.json`,
      'application/json'
    );
    setExportMenuOpen(false);
    showNotice(`Exported ${defectId} as JSON (Jira/GitHub Issues compatible)`);
  };

  // Specific Export as CSV for Jira Import
  const handleExportCsv = () => {
    const csvContent = generateReportContent('csv');
    triggerDownload(
      csvContent,
      `bugmirror-defect-${defectId}-jira-import.csv`,
      'text/csv'
    );
    setExportMenuOpen(false);
    showNotice(`Exported ${defectId} as CSV (Jira Issue Importer compatible)`);
  };

  // Export all logged defects in one bundle
  const handleExportAllDefects = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      platform: 'BugMirror AI Enterprise',
      totalDefects: defects.length,
      defects: defects.map((d) => ({
        id: d.id,
        title: d.title,
        severity: d.severity,
        status: d.status,
        rootCause: d.rootCause,
        runId: d.runId,
      })),
    };
    triggerDownload(
      JSON.stringify(bundle, null, 2),
      `bugmirror-all-defects-bundle.json`,
      'application/json'
    );
    setExportMenuOpen(false);
    showNotice(`Exported all ${defects.length} logged defects as JSON bundle`);
  };

  const showNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-sky-500/30 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{exportNotice}</span>
        </div>
      )}

      {/* Header with Prominent 'Export Report' Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="text-sky-700 font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Documentation
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Defect Export</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bug Report Generator</h1>
          <p className="text-xs text-slate-500">
            Generate reproducible defect documentation ready for Jira, GitHub Issues, JSON APIs, and CSV imports.
          </p>
        </div>

        {/* Top Header Export Report Button with Dropdown */}
        <div className="relative shrink-0" ref={exportMenuRef}>
          <div className="inline-flex rounded-lg shadow-xs">
            <button
              onClick={() => handleExportJson()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-l-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition"
              title="Download findings as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="inline-flex items-center px-2.5 py-2 rounded-r-lg text-xs bg-sky-700 hover:bg-sky-800 text-white border-l border-sky-500 transition"
              title="Choose format to export (JSON or CSV)"
              aria-haspopup="true"
              aria-expanded={exportMenuOpen}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Format Dropdown Menu */}
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-sky-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Export Defect Findings
                </span>
              </div>

              <div className="py-1">
                {/* JSON Option */}
                <button
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-sky-50 transition group"
                >
                  <div className="p-1.5 rounded-md bg-sky-100 text-sky-700 mt-0.5 group-hover:bg-sky-600 group-hover:text-white transition">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Download JSON</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        .json
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Structured payload for GitHub Issues API &amp; Jira REST API
                    </p>
                  </div>
                </button>

                {/* CSV Option */}
                <button
                  onClick={handleExportCsv}
                  className="w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-sky-50 transition group"
                >
                  <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Download CSV</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        .csv
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Spreadsheet for Jira Bulk Issue Importer
                    </p>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* Bulk Export Option */}
                <button
                  onClick={handleExportAllDefects}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-sky-800 hover:bg-slate-50 transition"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export All Defects ({defects.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Info Banner */}
      <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-slate-800">
            <strong className="font-semibold text-slate-900">Issue Tracker Ready:</strong> Export defect findings directly as{' '}
            <strong className="text-sky-700 font-mono">JSON</strong> (for GitHub Issues API &amp; automation) or{' '}
            <strong className="text-emerald-700 font-mono">CSV</strong> (for Jira Bulk Issue Importer).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-white border border-sky-300 text-sky-800 hover:bg-sky-50 transition shadow-2xs"
          >
            <Download className="w-3 h-3 text-sky-600" /> JSON
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition shadow-2xs"
          >
            <Download className="w-3 h-3 text-emerald-600" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Defect List Selector & Editor (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Select Logged Defect</h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {defects.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No defects logged yet. Run a test in Defective mode to generate an issue.
                </div>
              ) : (
                defects.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDefect(d)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedDefect?.id === d.id
                        ? 'bg-sky-50/80 border-sky-300 text-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-sky-700 font-bold">{d.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {d.severity}
                      </span>
                    </div>
                    <div className="text-xs font-semibold truncate text-slate-900">{d.title}</div>
                  </button>
                ))
              )}
            </div>

            {/* Editable Fields */}
            <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Report Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                >
                  <option value="CRITICAL">CRITICAL (Blocker)</option>
                  <option value="HIGH">HIGH (Major Flow Broken)</option>
                  <option value="MEDIUM">MEDIUM (Defensive Guard Missing)</option>
                  <option value="LOW">LOW (Minor / Cosmetic)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Suspected Root Cause</label>
                <textarea
                  rows={3}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Preview & Export Canvas (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Format Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono">
                {[
                  { id: 'jira', label: 'JIRA' },
                  { id: 'markdown', label: 'GitHub MD' },
                  { id: 'json', label: 'JSON' },
                  { id: 'csv', label: 'CSV' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`px-3 py-1.5 rounded-md transition font-semibold ${
                      format === f.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                  title="Copy formatted text to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Primary Export Button */}
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition"
                  title={`Download current findings as ${format.toUpperCase()} file`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Generated Document */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                <span>Formatted Ticket Document:</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Target: {format === 'jira' ? 'Jira Issue Text' : format === 'markdown' ? 'GitHub Issues / PR' : format === 'json' ? 'REST API / GitHub CLI' : 'Jira CSV Importer'}
                </span>
              </div>
              <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 overflow-x-auto max-h-[480px] leading-relaxed whitespace-pre-wrap shadow-inner">
                {reportText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
