import React from 'react';
import { TargetMetrics } from '../types';
import { 
  FolderTree, 
  FileCode2, 
  Files, 
  FileText, 
  Settings, 
  ShieldAlert, 
  Code,
  GitCommit,
  GitBranch,
  Calendar,
  User,
  Layers
} from 'lucide-react';

interface TargetMetricsViewProps {
  metrics?: TargetMetrics;
}

export const TargetMetricsView: React.FC<TargetMetricsViewProps> = ({ metrics }) => {
  if (!metrics || metrics.total_files === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FolderTree className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Target Repository Not Yet Analyzed</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
            Clone any git repository into the <code className="text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">target/</code> folder and run the analyzer script to automatically extract language breakdown, lines of code, and structure.
          </p>
        </div>
        <div className="pt-2">
          <div className="inline-block bg-slate-950 border border-slate-800 rounded-xl p-3 text-left font-mono text-xs text-slate-300">
            <p className="text-slate-500"># 1. Clone a repository into target/</p>
            <p className="text-emerald-400">git clone https://github.com/&lt;owner&gt;/&lt;repo&gt;.git target</p>
            <p className="text-slate-500 mt-2"># 2. Extract metrics and structure</p>
            <p className="text-cyan-400">npm run analyze</p>
          </div>
        </div>
      </div>
    );
  }

  const languages = metrics.languages_sorted || [];
  const totalCodeLines = metrics.code_lines || 1;
  const git = metrics.git_info;

  // Language color palette
  const langColors = [
    'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500'
  ];

  return (
    <div className="space-y-6">
      {/* Target Git Commit Information Card */}
      {git && git.commit_hash && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <GitCommit className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Commit:</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                    {git.short_hash || git.commit_hash.slice(0, 7)}
                  </span>
                  {git.branch && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                      {git.branch}
                    </span>
                  )}
                </div>
                {git.commit_message && (
                  <p className="text-xs text-slate-300 font-medium mt-1 truncate max-w-xl">
                    "{git.commit_message}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {git.author && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{git.author}</span>
                </div>
              )}
              {git.commit_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{git.commit_date.split(' ')[0]}</span>
                </div>
              )}
              {metrics.analyzed_at && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Analyzed: {new Date(metrics.analyzed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Files className="w-4 h-4 text-indigo-400" /> Total Files
          </span>
          <p className="text-2xl font-extrabold text-white mt-1">
            {metrics.total_files.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500">{metrics.total_dirs} directories</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Code className="w-4 h-4 text-cyan-400" /> Code Lines (LOC)
          </span>
          <p className="text-2xl font-extrabold text-cyan-300 mt-1">
            {metrics.code_lines.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500">Excludes docs, comments & data</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Layers className="w-4 h-4 text-amber-400" /> Physical Lines
          </span>
          <p className="text-2xl font-extrabold text-white mt-1">
            {metrics.total_lines.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500">{(metrics.blank_lines || 0).toLocaleString()} blank lines</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <FileText className="w-4 h-4 text-emerald-400" /> Docs & Data
          </span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1">
            {((metrics.doc_lines || 0) + (metrics.data_lines || 0)).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500">{metrics.key_files.docs.length} documentation files</span>
        </div>
      </div>

      {/* Granular Line Classification Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Granular Line Category Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-cyan-400 font-semibold block">Executable Code</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{metrics.code_lines.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">
              {((metrics.code_lines / metrics.total_lines) * 100).toFixed(1)}% of physical
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-indigo-400 font-semibold block">Data Files (JSON/SQL)</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{(metrics.data_lines || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">
              {(((metrics.data_lines || 0) / metrics.total_lines) * 100).toFixed(1)}% of physical
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-emerald-400 font-semibold block">Documentation (MD/Doc)</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{(metrics.doc_lines || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">
              {(((metrics.doc_lines || 0) / metrics.total_lines) * 100).toFixed(1)}% of physical
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-amber-400 font-semibold block">Comments</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{(metrics.comment_lines || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">
              {(((metrics.comment_lines || 0) / metrics.total_lines) * 100).toFixed(1)}% of physical
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 font-semibold block">Blank Lines</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{metrics.blank_lines.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">
              {((metrics.blank_lines / metrics.total_lines) * 100).toFixed(1)}% of physical
            </span>
          </div>
        </div>
      </div>

      {/* Language Distribution Bar & Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
          <FileCode2 className="w-5 h-5 text-indigo-400" />
          Language Breakdown & Code Distribution
        </h3>

        {/* Progress Bar Stack */}
        <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex mb-4">
          {languages.map((l, i) => {
            const pct = (l.code_lines / totalCodeLines) * 100;
            if (pct < 0.5) return null;
            return (
              <div
                key={l.name}
                style={{ width: `${pct}%` }}
                className={`${langColors[i % langColors.length]} transition-all`}
                title={`${l.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {languages.map((l, i) => {
            const pct = (l.code_lines / totalCodeLines) * 100;
            return (
              <div key={l.name} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${langColors[i % langColors.length]}`} />
                  <span className="font-semibold text-slate-200 truncate">{l.name}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{l.code_lines.toLocaleString()} loc</span>
                  <span className="font-mono text-slate-300">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detected Project Assets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Configs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-indigo-400 mb-3">
            <Settings className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white">Config & Tooling Files ({metrics.key_files.configs.length})</h4>
          </div>
          <ul className="space-y-1.5 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
            {metrics.key_files.configs.length === 0 ? (
              <li className="text-slate-500 font-sans">None detected</li>
            ) : (
              metrics.key_files.configs.map((f, i) => (
                <li key={i} className="truncate bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {f}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Documentation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-emerald-400 mb-3">
            <FileText className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white">Documentation Files ({metrics.key_files.docs.length})</h4>
          </div>
          <ul className="space-y-1.5 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
            {metrics.key_files.docs.length === 0 ? (
              <li className="text-slate-500 font-sans">None detected</li>
            ) : (
              metrics.key_files.docs.map((f, i) => (
                <li key={i} className="truncate bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {f}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Security Scan Warnings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-rose-400 mb-3">
            <ShieldAlert className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white">Automated Secret & Flag Checks</h4>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 max-h-48 overflow-y-auto">
            {metrics.security_flags.length === 0 ? (
              <li className="text-emerald-400 text-xs">No hardcoded secrets detected by automated scanner.</li>
            ) : (
              metrics.security_flags.map((s, i) => (
                <li key={i} className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.type}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-rose-500/30 uppercase">
                      {s.severity || 'WARN'}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 truncate mt-0.5">{s.file}</div>
                  {s.match && (
                    <div className="font-mono text-[10px] text-rose-300/80 mt-1">Match: {s.match}</div>
                  )}
                </li>
              ))
            )}
          </ul>
          <div className="text-[10px] text-slate-500 mt-2">
            * Preliminary heuristic pattern scan. Does not substitute a full static security analysis.
          </div>
        </div>
      </div>
    </div>
  );
};
