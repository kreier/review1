import React, { useState } from 'react';
import { ModelReport } from '../types';
import { ArrowLeftRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ModelCompareViewProps {
  reports: ModelReport[];
}

export const ModelCompareView: React.FC<ModelCompareViewProps> = ({ reports }) => {
  const [modelAId, setModelAId] = useState<string>(reports[0]?.id || '');
  const [modelBId, setModelBId] = useState<string>(reports[1]?.id || reports[0]?.id || '');

  const modelA = reports.find(r => r.id === modelAId) || reports[0];
  const modelB = reports.find(r => r.id === modelBId) || reports[1] || reports[0];

  const metrics: Array<{ key: keyof typeof modelA.scores; label: string }> = [
    { key: 'overall', label: 'Overall' },
    { key: 'architecture', label: 'Architecture' },
    { key: 'code_quality', label: 'Code Quality' },
    { key: 'security', label: 'Security' },
    { key: 'documentation', label: 'Documentation' },
  ];

  if (reports.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <ArrowLeftRight className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p>At least two AI model reports are required to enable side-by-side comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-400 mb-4">
          <ArrowLeftRight className="w-5 h-5" />
          <h3 className="font-bold text-white text-lg">Compare AI Perspectives</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Model A
            </label>
            <select
              value={modelAId}
              onChange={(e) => setModelAId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>{r.model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Model B
            </label>
            <select
              value={modelBId}
              onChange={(e) => setModelBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>{r.model}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Numerical Scores Comparison Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          Score Divergence Matrix
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
          {metrics.map(m => {
            const scoreA = modelA.scores[m.key] || 0;
            const scoreB = modelB.scores[m.key] || 0;
            const diff = Number((scoreA - scoreB).toFixed(1));

            return (
              <div key={m.key} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">{m.label}</span>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block truncate max-w-[70px]">{modelA.model}</span>
                    <span className="text-lg font-bold text-white">{scoreA}</span>
                  </div>
                  <div className="text-center px-1">
                    <span className="text-[10px] text-slate-400 block">Diff</span>
                    <span className={`text-xs font-bold ${
                      diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? '0.0' : diff}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block truncate max-w-[70px]">{modelB.model}</span>
                    <span className="text-lg font-bold text-white">{scoreB}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Content Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model A Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-lg font-bold text-white">{modelA.model}</h4>
            <p className="text-xs text-slate-400 mt-1">{modelA.summary}</p>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Strengths Highlighted
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {modelA.key_strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Weaknesses Highlighted
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {modelA.key_weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Security Flaws Flagged ({modelA.security_findings.length})
            </h5>
            <div className="space-y-2">
              {modelA.security_findings.map((finding, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{finding.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{finding.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model B Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-lg font-bold text-white">{modelB.model}</h4>
            <p className="text-xs text-slate-400 mt-1">{modelB.summary}</p>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Strengths Highlighted
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {modelB.key_strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Weaknesses Highlighted
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {modelB.key_weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Security Flaws Flagged ({modelB.security_findings.length})
            </h5>
            <div className="space-y-2">
              {modelB.security_findings.map((finding, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{finding.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{finding.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
