export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VerificationStatus = 'verified' | 'probable' | 'unverified';

export interface SecurityFinding {
  id?: string;
  severity: SeverityLevel;
  status?: VerificationStatus;
  confidence?: number;
  category?: string;
  title: string;
  file: string;
  line_start?: number;
  line_end?: number;
  affected_function?: string;
  description: string;
  evidence?: string;
  impact?: string;
  recommendation?: string;
  reported_by?: string;
  model_id?: string;
}

export interface SecurityCluster {
  id?: string;
  title: string;
  file: string;
  severity: SeverityLevel;
  category?: string;
  status: VerificationStatus;
  confidence: number;
  description: string;
  evidence?: string;
  recommendation?: string;
  reportedByModels: string[];
  instances: SecurityFinding[];
}

export interface ModelScores {
  overall: number | null;
  architecture: number | null;
  code_quality: number | null;
  security: number | null;
  documentation: number | null;
}

export interface ModelReport {
  id: string;
  filename: string;
  model: string;
  target_repo: string;
  target_commit?: string;
  review_date: string;
  scores: ModelScores;
  summary: string;
  key_strengths: string[];
  key_weaknesses: string[];
  security_findings: SecurityFinding[];
  markdown: string;
}

export interface ScoreComparisonItem {
  metric: string;
  key: keyof ModelScores;
  average: number | null;
  [modelId: string]: number | string | null;
}

export interface ReportsData {
  updated_at: string;
  target_repo: string;
  model_count: number;
  models: Array<{ id: string; name: string }>;
  average_scores: ModelScores;
  score_comparison: ScoreComparisonItem[];
  security_audit: {
    total_findings: number;
    clusters: SecurityCluster[];
  };
  reports: ModelReport[];
}

export interface TargetGitInfo {
  commit_hash?: string;
  short_hash?: string;
  branch?: string;
  commit_date?: string;
  author?: string;
  commit_message?: string;
  remote_url?: string;
}

export interface LanguageMetrics {
  files: number;
  lines: number;
  code_lines: number;
  comment_lines?: number;
  blank_lines?: number;
  doc_lines?: number;
  data_lines?: number;
  category?: 'code' | 'doc' | 'data' | 'config';
}

export interface TargetMetrics {
  analyzer_version?: string;
  analyzed_at?: string;
  target_path: string;
  git_info?: TargetGitInfo;
  total_files: number;
  total_dirs: number;
  total_lines: number;
  code_lines: number;
  comment_lines?: number;
  blank_lines: number;
  doc_lines?: number;
  data_lines?: number;
  languages: Record<string, LanguageMetrics>;
  languages_sorted?: Array<{ name: string } & LanguageMetrics>;
  key_files: {
    configs: string[];
    docs: string[];
    ci_cd: string[];
    tests: string[];
  };
  security_flags: Array<{
    file: string;
    type: string;
    severity?: string;
    category?: string;
    match?: string;
    confidence?: number;
    scanner?: string;
  }>;
  structure: Array<{ name: string; is_dir: boolean; children?: any[] }>;
}
