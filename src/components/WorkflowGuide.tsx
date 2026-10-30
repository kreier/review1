import React, { useState } from 'react';
import { X, Copy, Check, Bot } from 'lucide-react';

interface WorkflowGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowGuide: React.FC<WorkflowGuideProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const cloneSnippet = `# Clone repository into target folder
git clone https://github.com/<owner>/<repo>.git target`;

  const analyzeSnippet = `# Run automatic repository scope & language analyzer
npm run analyze`;

  const buildSnippet = `# Compile reviews & build Vite website
npm run build

# Or test locally
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">How This AI Review Workflow Works</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                5 simple steps to investigate any target repository with multiple AI models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-4 text-sm text-slate-300">
          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-semibold text-white">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white">1</span>
                <span>Clone Target Repository</span>
              </div>
              <button
                onClick={() => copyToClipboard(cloneSnippet, 'step1')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedStep === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Clone the project you want to review into the <code className="text-cyan-300">target/</code> folder. (The folder is pre-configured in .gitignore so target files will not be committed).
            </p>
            <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {cloneSnippet}
            </pre>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-semibold text-white">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white">2</span>
                <span>Analyze Metrics & Structure</span>
              </div>
              <button
                onClick={() => copyToClipboard(analyzeSnippet, 'step2')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedStep === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Run the analyzer script to automatically measure language lines, file count, and folder layout:
            </p>
            <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {analyzeSnippet}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-white">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white">3</span>
              <span>Prompt AI Models</span>
            </div>
            <p className="text-xs text-slate-400">
              Feed the codebase and instructions to different models (Claude, Gemini, GPT-4o, DeepSeek, etc.) using the standardized prompt template located in <code className="text-cyan-300">prompts/REVIEW_PROMPT.md</code>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-white">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white">4</span>
              <span>Save Reports into reports/</span>
            </div>
            <p className="text-xs text-slate-400">
              Save each model's markdown report into the <code className="text-cyan-300">reports/</code> folder (e.g. <code className="text-slate-300 font-mono">reports/gemini-2-5-pro.md</code>, <code className="text-slate-300 font-mono">reports/claude-3-7-sonnet.md</code>).
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-semibold text-white">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white">5</span>
                <span>Compile & Publish to GitHub Pages</span>
              </div>
              <button
                onClick={() => copyToClipboard(buildSnippet, 'step5')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedStep === 'step5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Compile the reports and push to GitHub. The included GitHub Actions workflow will automatically build and publish the website to GitHub Pages!
            </p>
            <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {buildSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
};
