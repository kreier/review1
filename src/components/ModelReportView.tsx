import React, { useMemo } from 'react';
import { marked } from 'marked';
import { ModelReport } from '../types';
import { 
  Award, 
  Layers, 
  FileCode2, 
  Lock, 
  BookCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileText,
  Copy,
  Check
} from 'lucide-react';

interface ModelReportViewProps {
  reports: ModelReport[];
  activeModelId: string;
  onSelectModel: (id: string) => void;
}

export const ModelReportView: React.FC<ModelReportViewProps> = ({
  reports,
  activeModelId,
  onSelectModel,
}) => {
  const [copied, setCopied] = React.useState(false);

  const currentReport = useMemo(() => {
    return reports.find(r => r.id === activeModelId) || reports[0];
  }, [reports, activeModelId]);

  const parsedHtml = useMemo(() => {
    if (!currentReport) return '';
    return marked.parse(currentReport.markdown, { async: false }) as string;
  }, [currentReport]);

  const handleCopyMarkdown = () => {
    if (!currentReport) return;
    navigator.clipboard.writeText(currentReport.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 7.0) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (score >= 5.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  if (!currentReport) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <p className="text-slate-400">No model reports found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {reports.map(r => {
          const isActive = r.id === currentReport.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectModel(r.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{r.model}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded ${
                isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {r.scores.overall.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Model Report Meta Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {currentReport.model}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/30 font-medium">
                Verified Report
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Reviewed: {currentReport.review_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-slate-300">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                reports/{currentReport.filename}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Markdown</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw Markdown</span>
              </>
            )}
          </button>
        </div>

        {/* Executive summary quote */}
        {currentReport.summary && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm text-slate-300 leading-relaxed mb-6">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
              Executive Summary
            </span>
            {currentReport.summary}
          </div>
        )}

        {/* Score Grid for this model */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              Overall <Award className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <div className={`mt-1 text-2xl font-bold ${getScoreColor(currentReport.scores.overall).split(' ')[0]}`}>
              {currentReport.scores.overall}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              Architecture <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <div className={`mt-1 text-2xl font-bold ${getScoreColor(currentReport.scores.architecture).split(' ')[0]}`}>
              {currentReport.scores.architecture}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              Code Quality <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            </span>
            <div className={`mt-1 text-2xl font-bold ${getScoreColor(currentReport.scores.code_quality).split(' ')[0]}`}>
              {currentReport.scores.code_quality}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              Security <Lock className="w-3.5 h-3.5 text-rose-400" />
            </span>
            <div className={`mt-1 text-2xl font-bold ${getScoreColor(currentReport.scores.security).split(' ')[0]}`}>
              {currentReport.scores.security}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              Documentation <BookCheck className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className={`mt-1 text-2xl font-bold ${getScoreColor(currentReport.scores.documentation).split(' ')[0]}`}>
              {currentReport.scores.documentation}
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-xs font-semibold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Noted Strengths
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentReport.key_strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-xs font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Noted Weaknesses
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentReport.key_weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Full Rendered Markdown Body */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <article 
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      </div>
    </div>
  );
};
