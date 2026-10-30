import React, { useState } from 'react';
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { api } from '../services/api';

export const ApiWorkspaceView: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [url, setUrl] = useState<string>('/api/sandbox/inventory/checkout');
  const [headers, setHeaders] = useState<string>(
    JSON.stringify({ 'Content-Type': 'application/json', 'X-Client': 'BugMirror-Workspace' }, null, 2)
  );
  const [body, setBody] = useState<string>(
    JSON.stringify({ itemId: 'item-99', quantity: 1 }, null, 2)
  );

  const [expectedStatus, setExpectedStatus] = useState<number>(200);
  const [maxLatencyMs, setMaxLatencyMs] = useState<number>(500);

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleEndpoints = [
    { label: 'Inventory Checkout', method: 'POST', url: '/api/sandbox/inventory/checkout', body: { itemId: 'item-99', quantity: 1 } },
    { label: 'Check Item Stock', method: 'GET', url: '/api/sandbox/inventory/item-99', body: null },
    { label: 'User Login Auth', method: 'POST', url: '/api/sandbox/users/login', body: { username: 'qa.lead@bugmirror.ai' } },
    { label: 'Apply Promo Coupon', method: 'POST', url: '/api/sandbox/cart/apply-coupon', body: { couponCode: 'SAVE50-SINGLE-USE' } },
    { label: 'Idempotent Payment', method: 'POST', url: '/api/sandbox/payments/charge', body: { amount: 49.99, idempotencyKey: 'idem_key_771' } },
  ];

  const handleSelectSample = (sample: any) => {
    setMethod(sample.method);
    setUrl(sample.url);
    if (sample.body) {
      setBody(JSON.stringify(sample.body, null, 2));
    } else {
      setBody('');
    }
    setErrorMsg(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResponse(null);

    let parsedHeaders = {};
    try {
      if (headers.trim()) parsedHeaders = JSON.parse(headers);
    } catch {
      setErrorMsg('Invalid JSON in headers field');
      setLoading(false);
      return;
    }

    let parsedBody = undefined;
    if (body.trim() && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    try {
      const res = await api.executeApiTest({
        method,
        url,
        headers: parsedHeaders,
        body: parsedBody,
      });
      setResponse(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution error');
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response?.body) {
      navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isStatusAssertPassed = response ? response.status === expectedStatus : null;
  const isLatencyAssertPassed = response ? response.latencyMs <= maxLatencyMs : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
          <span className="text-sky-700 font-semibold flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> REST Client
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>HTTP Sandbox</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Testing Workspace</h1>
        <p className="text-xs text-slate-500">
          Execute target requests with configurable headers, payloads, latency thresholds, and assertions.
        </p>
      </div>

      {/* SAMPLE ENDPOINTS BAR */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
        <span className="text-xs font-semibold text-slate-700 block">Sandbox Endpoints:</span>
        <div className="flex flex-wrap items-center gap-2">
          {sampleEndpoints.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSample(s)}
              className="px-2.5 py-1.5 rounded-md text-xs font-mono bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-200 transition"
            >
              <span className="text-sky-700 font-bold mr-1">{s.method}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* REQUEST BUILDER BAR */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs font-mono font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. /api/sandbox/inventory/checkout"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
          />

          <button
            onClick={handleExecute}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs transition disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>

        {/* HEADERS, BODY, & ASSERTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-slate-700 text-[11px] font-sans font-semibold">Headers (JSON)</label>
            <textarea
              rows={5}
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[11px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 text-[11px] font-sans font-semibold">Request Body</label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={method === 'GET'}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[11px] disabled:opacity-30"
            />
          </div>

          <div className="space-y-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans">
            <span className="font-semibold text-slate-900 block mb-1">Assertions</span>
            <div>
              <label className="text-slate-600 text-[11px] font-medium block">Expected HTTP Status</label>
              <input
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-600 text-[11px] font-medium block">Max Latency (ms)</label>
              <input
                type="number"
                value={maxLatencyMs}
                onChange={(e) => setMaxLatencyMs(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-xs text-slate-900 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* RESPONSE VIEWER */}
      {response && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded font-mono border ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                HTTP {response.status} {response.statusText}
              </span>
              <span className="text-xs font-mono text-slate-600 flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{response.latencyMs}ms</span>
              </span>
            </div>

            {/* Assertion Badges */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border ${
                  isStatusAssertPassed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isStatusAssertPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Status == {expectedStatus}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border ${
                  isLatencyAssertPassed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isLatencyAssertPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Latency &lt;= {maxLatencyMs}ms</span>
              </span>

              <button
                onClick={copyResponse}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                title="Copy Response Body"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-700">Payload Response:</span>
            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 overflow-x-auto max-h-80 leading-relaxed shadow-inner">
              {typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
