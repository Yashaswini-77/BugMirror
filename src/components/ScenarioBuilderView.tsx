import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Play,
  Save,
  CheckCircle2,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Scenario, ScenarioStep, Project } from '../types';

interface ScenarioBuilderViewProps {
  scenarios: Scenario[];
  projects: Project[];
  selectedProjectId: string;
  onNavigate: (tab: any) => void;
  onSelectRun: (run: any) => void;
  onRefreshScenarios: () => void;
}

export const ScenarioBuilderView: React.FC<ScenarioBuilderViewProps> = ({
  scenarios,
  projects,
  selectedProjectId,
  onNavigate,
  onSelectRun,
  onRefreshScenarios,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || ''
  );

  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const [name, setName] = useState<string>(activeScenario?.name || 'Custom High-Contention Scenario');
  const [description, setDescription] = useState<string>(activeScenario?.description || '');
  const [virtualUsers, setVirtualUsers] = useState<number>(activeScenario?.virtualUsers || 2);
  const [category, setCategory] = useState<Scenario['category']>(activeScenario?.category || 'concurrency');
  const [steps, setSteps] = useState<ScenarioStep[]>(activeScenario?.steps || []);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSelectScenario = (scen: Scenario) => {
    setSelectedScenarioId(scen.id);
    setName(scen.name);
    setDescription(scen.description);
    setVirtualUsers(scen.virtualUsers);
    setCategory(scen.category);
    setSteps(scen.steps);
  };

  const handleAddStep = () => {
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}: Custom Action`,
      type: 'CALL_API',
      endpoint: '/api/sandbox/inventory/checkout',
      method: 'POST',
      payload: { itemId: 'item-99', quantity: 1 },
      delayMs: 15,
      expectedStatus: 200,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (index: number, updates: Partial<ScenarioStep>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.createScenario({
        projectId: selectedProjectId || projects[0]?.id || 'proj-1',
        name,
        description,
        category,
        virtualUsers,
        steps,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onRefreshScenarios();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = (templateType: 'race' | 'coupon' | 'underflow' | 'idempotency') => {
    if (templateType === 'race') {
      setName('Flash Sale: 2 Concurrent Users On 1 Last Item (Race Condition)');
      setDescription('Simulates two buyers submitting concurrent purchases on stock=1.');
      setCategory('concurrency');
      setVirtualUsers(2);
      setSteps([
        {
          id: `step-t1`,
          name: 'Concurrent User Authentication',
          type: 'LOGIN_AUTH',
          endpoint: '/api/sandbox/users/login',
          method: 'POST',
          delayMs: 10,
          expectedStatus: 200,
        },
        {
          id: `step-t2`,
          name: 'Inspect Stock Level',
          type: 'VERIFY_INVENTORY',
          endpoint: '/api/sandbox/inventory/item-99',
          method: 'GET',
          delayMs: 15,
          expectedStatus: 200,
        },
        {
          id: `step-t3`,
          name: 'Simultaneous Checkout Request',
          type: 'CHECKOUT_PAYMENT',
          endpoint: '/api/sandbox/inventory/checkout',
          method: 'POST',
          payload: { itemId: 'item-99', quantity: 1 },
          delayMs: 0,
          expectedStatus: 200,
        },
      ]);
    } else if (templateType === 'coupon') {
      setName('Promo Code Double-Spend Under Parallel Submissions');
      setDescription('Simulates parallel redemption of a single-use coupon in multi-tab sessions.');
      setCategory('concurrency');
      setVirtualUsers(5);
      setSteps([
        {
          id: `step-cp1`,
          name: 'Add Item to Cart',
          type: 'ADD_TO_CART',
          endpoint: '/api/sandbox/cart/items',
          method: 'POST',
          delayMs: 10,
          expectedStatus: 200,
        },
        {
          id: `step-cp2`,
          name: 'Parallel Coupon Claim',
          type: 'CALL_API',
          endpoint: '/api/sandbox/cart/apply-coupon',
          method: 'POST',
          payload: { couponCode: 'SAVE50-SINGLE-USE' },
          delayMs: 0,
          expectedStatus: 200,
        },
      ]);
    } else if (templateType === 'underflow') {
      setName('Cart Quantity Underflow & Boundary Validation');
      setDescription('Injects negative integer quantity to test defensive input validation.');
      setCategory('ecommerce');
      setVirtualUsers(1);
      setSteps([
        {
          id: `step-un1`,
          name: 'Negative Quantity Update',
          type: 'UPDATE_QUANTITY',
          endpoint: '/api/sandbox/cart/update-quantity',
          method: 'POST',
          payload: { itemId: 'item-99', quantity: -5 },
          delayMs: 20,
          expectedStatus: 400,
        },
      ]);
    } else if (templateType === 'idempotency') {
      setName('Payment Webhook Idempotency Check');
      setDescription('Fires 10 requests with identical Idempotency-Key headers.');
      setCategory('api');
      setVirtualUsers(10);
      setSteps([
        {
          id: `step-id1`,
          name: 'Duplicate Payment Request',
          type: 'CALL_API',
          endpoint: '/api/sandbox/payments/charge',
          method: 'POST',
          payload: { amount: 49.99, idempotencyKey: 'idem_batch_9901' },
          delayMs: 5,
          expectedStatus: 200,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="text-sky-700 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Test Sequencing
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Pipeline Builder</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scenario Builder</h1>
          <p className="text-xs text-slate-500">
            Construct realistic sequences of user behaviors, concurrent traffic bursts, and expected assertions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('concurrency')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute in Concurrency Lab</span>
        </button>
      </div>

      {/* STARTER TEMPLATES BAR */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <span className="text-xs font-semibold text-slate-700 block">Starter Templates:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadTemplate('race')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 border border-slate-200 hover:border-sky-200 transition"
          >
            Flash Sale Race Condition (Stock: 1)
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('coupon')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 border border-slate-200 hover:border-sky-200 transition"
          >
            Coupon Double-Spend Replay
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('underflow')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 border border-slate-200 hover:border-sky-200 transition"
          >
            Cart Negative Quantity Injection
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('idempotency')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 hover:bg-sky-50 hover:text-sky-800 text-slate-700 border border-slate-200 hover:border-sky-200 transition"
          >
            Payment Idempotency Storm
          </button>
        </div>
      </div>

      {/* MAIN BUILDER FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Config Panel (Col 4) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm">Scenario Configuration</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Scenario Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Description &amp; Intent</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                >
                  <option value="concurrency">Concurrency</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="security">Security</option>
                  <option value="api">API Idempotency</option>
                  <option value="workflow">Workflow</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Virtual Users</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={virtualUsers}
                  onChange={(e) => setVirtualUsers(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveScenario}
            disabled={saving}
            className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved to Project' : 'Save Scenario'}</span>
          </button>
        </div>

        {/* Steps Sequencer (Col 8) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Action Sequence Pipeline</h3>
              <p className="text-xs text-slate-500">Events executed sequentially by virtual workers</p>
            </div>
            <button
              onClick={handleAddStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-sky-50 hover:text-sky-800 text-slate-700 border border-slate-300 transition"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>Add Step</span>
            </button>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-mono text-[11px] font-bold flex items-center justify-center border border-sky-200">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleUpdateStep(idx, { name: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 text-xs font-semibold text-slate-900 focus:outline-none px-1"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveStep(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                    title="Delete Step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-600 text-[11px] font-medium block mb-1">Action Type</label>
                    <select
                      value={step.type}
                      onChange={(e) => handleUpdateStep(idx, { type: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="LOGIN_AUTH">Login / Auth</option>
                      <option value="ADD_TO_CART">Add To Cart</option>
                      <option value="UPDATE_QUANTITY">Update Quantity</option>
                      <option value="CHECKOUT_PAYMENT">Checkout / Payment</option>
                      <option value="CALL_API">Call REST API</option>
                      <option value="VERIFY_INVENTORY">Verify Inventory</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 text-[11px] font-medium block mb-1">Method &amp; Endpoint</label>
                    <div className="flex gap-1.5">
                      <select
                        value={step.method}
                        onChange={(e) => handleUpdateStep(idx, { method: e.target.value as any })}
                        className="bg-white border border-slate-300 rounded-md p-1.5 text-sky-700 font-mono text-xs font-bold focus:outline-none"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                      <input
                        type="text"
                        value={step.endpoint}
                        onChange={(e) => handleUpdateStep(idx, { endpoint: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 text-[11px] font-medium block mb-1">Expected Status</label>
                    <input
                      type="number"
                      value={step.expectedStatus}
                      onChange={(e) => handleUpdateStep(idx, { expectedStatus: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-emerald-700 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {step.payload && (
                  <div>
                    <label className="text-slate-600 text-[11px] font-medium block mb-1">JSON Payload</label>
                    <textarea
                      rows={2}
                      value={typeof step.payload === 'string' ? step.payload : JSON.stringify(step.payload)}
                      onChange={(e) => {
                        try {
                          handleUpdateStep(idx, { payload: JSON.parse(e.target.value) });
                        } catch {
                          handleUpdateStep(idx, { payload: e.target.value });
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
