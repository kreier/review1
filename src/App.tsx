import { useState } from 'react';
import rawReportsData from './data/reports.json';
import rawTargetMetrics from './data/target-metrics.json';
import { ReportsData, TargetMetrics } from './types';
import { Header } from './components/Header';
import { ConsensusOverview } from './components/ConsensusOverview';
import { ModelReportView } from './components/ModelReportView';
import { ModelCompareView } from './components/ModelCompareView';
import { TargetMetricsView } from './components/TargetMetricsView';
import { WorkflowGuide } from './components/WorkflowGuide';
import { 
  LayoutDashboard, 
  FileText, 
  ArrowLeftRight, 
  FolderTree, 
  BookOpen
} from 'lucide-react';
import { GithubIcon } from './components/GithubIcon';

const reportsData = rawReportsData as ReportsData;
const targetMetrics = rawTargetMetrics as TargetMetrics;

export function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'compare' | 'metrics'>('overview');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    reportsData.models[0]?.id || 'gemini-3-8-flash'
  );
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        targetRepo={reportsData.target_repo}
        modelCount={reportsData.model_count}
        updatedAt={reportsData.updated_at}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Hero Sub-header */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                Multi-Model Code Review & Audit
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                {reportsData.target_repo}
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Synthesized insights, architecture evaluations, and security vulnerability audits across {reportsData.model_count} state-of-the-art AI models.
              </p>
            </div>

            {/* Quick Hero Stat Chips */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm text-center">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Consensus Score</span>
                <span className="text-xl font-extrabold text-indigo-400">
                  {reportsData.average_scores.overall !== null ? reportsData.average_scores.overall : '—'}{' '}
                  {reportsData.average_scores.overall !== null && <span className="text-xs text-slate-500">/ 10</span>}
                </span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm text-center">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Security Flaws</span>
                <span className="text-xl font-extrabold text-rose-400">
                  {reportsData.security_audit.clusters.length}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 sm:space-x-2 mt-6 border-b border-slate-800/80 -mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Consensus Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Model Reports</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {reportsData.model_count}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'compare'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Compare Models</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'metrics'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Target Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'overview' && (
          <ConsensusOverview
            reportsData={reportsData}
            targetMetrics={targetMetrics}
            onSelectModel={handleSelectModel}
          />
        )}

        {activeTab === 'reports' && (
          <ModelReportView
            reports={reportsData.reports}
            activeModelId={selectedModelId}
            onSelectModel={setSelectedModelId}
          />
        )}

        {activeTab === 'compare' && (
          <ModelCompareView reports={reportsData.reports} />
        )}

        {activeTab === 'metrics' && (
          <TargetMetricsView metrics={targetMetrics} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            AI Multi-Model Repository Investigation Hub • Published with Vite & GitHub Pages
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Review Workflow Guide</span>
            </button>
            <a
              href="https://github.com/kreier/review1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Workflow Guide Modal */}
      <WorkflowGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default App;
