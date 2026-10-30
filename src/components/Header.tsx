import React from 'react';
import { ShieldCheck, Sparkles, BookOpen, GitBranch } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

interface HeaderProps {
  targetRepo: string;
  modelCount: number;
  updatedAt: string;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  targetRepo,
  modelCount,
  updatedAt,
  onOpenGuide,
}) => {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Repo Title */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AI Repository Review Hub
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                Target:
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">
                {targetRepo || 'Target Codebase'}
              </span>
              <span className="text-slate-600">•</span>
              <span>Updated {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Badges */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-white font-semibold">{modelCount}</strong> Model Reports
            </span>
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm shadow-indigo-600/30 cursor-pointer"
            title="How to run AI reviews on target repository"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Workflow Guide</span>
          </button>

          <a
            href="https://github.com/kreier/review1"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition"
            title="GitHub Repository"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
