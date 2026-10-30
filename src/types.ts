export interface SecurityFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  file: string;
  description: string;
  reportedBy?: string;
  modelId?: string;
}

export interface SecurityCluster {
  title: string;
  file: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  reportedByModels: string[];
}

export interface ModelScores {
  overall: number;
  architecture: number;
  code_quality: number;
  security: number;
  documentation: number;
}

export interface ModelReport {
  id: string;
  filename: string;
  model: string;
  target_repo: string;
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
  average: number;
  [modelId: string]: number | string;
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

export interface TargetMetrics {
  target_path: string;
  total_files: number;
  total_dirs: number;
  total_lines: number;
  code_lines: number;
  blank_lines: number;
  languages: Record<string, { files: number; lines: number; code_lines: number }>;
  languages_sorted?: Array<{ name: string; files: number; lines: number; code_lines: number }>;
  key_files: {
    configs: string[];
    docs: string[];
    ci_cd: string[];
    tests: string[];
  };
  security_flags: Array<{ file: string; type: string; severity?: string; match?: string }>;
  structure: Array<{ name: string; is_dir: boolean; children?: any[] }>;
}
