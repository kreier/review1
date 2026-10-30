import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Layers, 
  FileCode2, 
  Lock, 
  BookCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ReportsData, TargetMetrics, ScoreComparisonItem } from '../types';

interface ConsensusOverviewProps {
  reportsData: ReportsData;
  targetMetrics?: TargetMetrics;
  onSelectModel: (modelId: string) => void;
}

export const ConsensusOverview: React.FC<ConsensusOverviewProps> = ({
  reportsData,
  targetMetrics,
  onSelectModel,
}) => {
  const { average_scores, score_comparison, security_audit, reports, models } = reportsData;

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 7.0) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (score >= 5.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40 ring-1 ring-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Top Score Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Consensus Review Scorecard
          </h2>
          <span className="text-xs text-slate-400">
            Averaged across {reports.length} independent AI models
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{average_scores.overall}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Composite verdict</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Architecture</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{average_scores.architecture}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Modularity & design</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Code Quality</span>
              <FileCode2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{average_scores.code_quality}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Typing, linting, tests</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Security</span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{average_scores.security}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Vulnerabilities & posture</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Documentation</span>
              <BookCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{average_scores.documentation}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Readmes & docstrings</div>
          </div>
        </div>
      </div>

      {/* 2. Score Comparison Across Models */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Cross-Model Score Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing how each AI model rated the repository across core technical dimensions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {models.map(m => (
              <button
                key={m.id}
                onClick={() => onSelectModel(m.id)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                <th className="py-3 px-4">Evaluation Dimension</th>
                <th className="py-3 px-4 text-center">Consensus Avg</th>
                {models.map(m => (
                  <th key={m.id} className="py-3 px-4 text-center">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {score_comparison.map((row: ScoreComparisonItem) => (
                <tr key={row.key} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {row.metric}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(row.average)}`}>
                      {row.average.toFixed(1)}
                    </span>
                  </td>
                  {models.map(m => {
                    const score = Number(row[m.id]) || 0;
                    return (
                      <td key={m.id} className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getScoreColor(score)}`}>
                          {score.toFixed(1)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Consolidated Security Vulnerability Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Consolidated Security Vulnerability Audit
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {security_audit.clusters.length} Flaws Identified
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Issues flagged across models, synthesized into unified findings with consensus tracking
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          {security_audit.clusters.map((finding, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <h4 className="font-semibold text-slate-200 text-sm">
                    {finding.title}
                  </h4>
                </div>
                {finding.file && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                    {finding.file}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {finding.description}
              </p>

              <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-400">
                <span className="font-medium text-slate-400">Identified by:</span>
                <div className="flex flex-wrap gap-1.5">
                  {finding.reportedByModels.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                  {finding.reportedByModels.length > 1 && (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                      Model Consensus
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Consensus Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-4 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Key Strengths (Consensus)</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {reports.flatMap(r => r.key_strengths).slice(0, 5).map((str, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-4 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Areas for Improvement</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {reports.flatMap(r => r.key_weaknesses).slice(0, 5).map((weak, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Target Codebase Quick Snapshot */}
      {targetMetrics && targetMetrics.total_files > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
            Target Codebase Quantitative Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Files</span>
              <p className="text-2xl font-bold text-white mt-1">{targetMetrics.total_files.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Lines of Code</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{targetMetrics.code_lines.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Directories</span>
              <p className="text-2xl font-bold text-white mt-1">{targetMetrics.total_dirs.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Docs Detected</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{targetMetrics.key_files.docs.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
