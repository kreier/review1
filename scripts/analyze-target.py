#!/usr/bin/env python3
"""
Target Repository Analyzer
Analyzes the codebase in `target/` to extract metrics:
- Languages used and breakdown by lines/files
- Scope (total files, code lines, directories)
- Structure and directory hierarchy
- Documentation completeness
- Key config & security sanity checks

Outputs to stdout and saves to target-metrics.json and src/data/target-metrics.json
"""

import os
import sys
import json
import re
from pathlib import Path
from collections import defaultdict

# Mapping of file extensions to languages
EXTENSION_MAP = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".py": "Python",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".kt": "Kotlin",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".cs": "C#",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".sh": "Shell Script",
    ".bash": "Shell Script",
    ".zsh": "Shell Script",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "SASS",
    ".less": "LESS",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".xml": "XML",
    ".sql": "SQL",
    ".md": "Markdown",
    ".mdx": "MDX",
    ".graphql": "GraphQL",
    ".proto": "Protocol Buffers",
    ".sol": "Solidity",
    ".dockerfile": "Dockerfile",
}

SPECIAL_FILENAMES = {
    "Dockerfile": "Dockerfile",
    "docker-compose.yml": "Docker Compose",
    "docker-compose.yaml": "Docker Compose",
    "Makefile": "Makefile",
    "CMakeLists.txt": "CMake",
    "Jenkinsfile": "Jenkinsfile",
}

IGNORED_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "vendor", "dist", "build",
    "out", "target", ".next", ".nuxt", ".output", ".venv", "venv",
    "env", "__pycache__", ".idea", ".vscode", ".turbo", "coverage",
    ".gradle", ".pytest_cache", ".mypy_cache", ".cargo"
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp4", ".mov", ".avi", ".mp3", ".wav",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".pdf", ".exe", ".dll", ".so", ".dylib", ".bin",
    ".lock", ".log"
}

SUSPICIOUS_PATTERNS = [
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----", "Private Key"),
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token"),
    (r"AIza[0-9A-Za-z-_]{35}", "Google API Key"),
    (r"sk-[a-zA-Z0-9]{32,}", "OpenAI API Key format"),
    (r"password\s*=\s*['\"][^'\"]{6,}['\"]", "Hardcoded password variable"),
]

def find_target_root(base_dir="target"):
    target_path = Path(base_dir)
    if not target_path.exists():
        print(f"Error: directory '{base_dir}' does not exist.")
        sys.exit(1)

    # Check if target contains only one subdirectory that might be the cloned repo
    subdirs = [p for p in target_path.iterdir() if p.is_dir() and p.name not in IGNORED_DIRS and not p.name.startswith(".")]
    files = [p for p in target_path.iterdir() if p.is_file() and p.name not in {".gitkeep", "README.md"}]

    if len(subdirs) == 1 and len(files) == 0:
        return subdirs[0]
    return target_path

def count_lines(filepath):
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            total = len(lines)
            blank = sum(1 for line in lines if not line.strip())
            code = total - blank
            return total, code, blank
    except Exception:
        return 0, 0, 0

def check_security_flaws(filepath):
    findings = []
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            for pattern, desc in SUSPICIOUS_PATTERNS:
                matches = re.finditer(pattern, content)
                for m in matches:
                    findings.append({
                        "file": str(filepath),
                        "type": desc,
                        "match": m.group(0)[:8] + "..." if len(m.group(0)) > 8 else m.group(0)
                    })
    except Exception:
        pass
    return findings

def get_tree(dir_path, max_depth=3, current_depth=1):
    items = []
    try:
        for entry in sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.name in IGNORED_DIRS or entry.name.startswith(".git"):
                continue
            if entry.name in {".gitkeep", "README.md"} and str(dir_path) == "target":
                continue

            item = {
                "name": entry.name,
                "is_dir": entry.is_dir()
            }
            if entry.is_dir() and current_depth < max_depth:
                item["children"] = get_tree(entry.path, max_depth, current_depth + 1)
            items.append(item)
    except PermissionError:
        pass
    return items

def analyze_target(target_root):
    metrics = {
        "target_path": str(target_root),
        "total_files": 0,
        "total_dirs": 0,
        "total_lines": 0,
        "code_lines": 0,
        "blank_lines": 0,
        "languages": defaultdict(lambda: {"files": 0, "lines": 0, "code_lines": 0}),
        "key_files": {
            "configs": [],
            "docs": [],
            "ci_cd": [],
            "tests": []
        },
        "security_flags": [],
        "structure": []
    }

    test_patterns = re.compile(r"(test|spec|\b__tests__\b)", re.IGNORECASE)
    doc_patterns = re.compile(r"^(readme|license|contributing|changelog|security|architecture|docs?|code_of_conduct)", re.IGNORECASE)
    config_files = {
        "package.json", "tsconfig.json", "pyproject.toml", "requirements.txt",
        "Cargo.toml", "go.mod", "pom.xml", "build.gradle", "CMakeLists.txt",
        "Makefile", "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
        ".env.example", ".env", "composer.json"
    }

    for root, dirs, files in os.walk(target_root):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".git")]
        metrics["total_dirs"] += len(dirs)

        rel_root = os.path.relpath(root, target_root)

        for filename in files:
            filepath = Path(root) / filename
            ext = filepath.suffix.lower()

            # Skip target placeholder readme / gitkeep if inspecting raw target/
            if str(target_root) == "target" and rel_root == "." and filename in {".gitkeep", "README.md"}:
                continue

            if ext in IGNORED_EXTENSIONS or filename.endswith(".min.js") or filename.endswith(".min.css"):
                continue

            rel_file = os.path.relpath(filepath, target_root)
            metrics["total_files"] += 1

            # Detect language
            lang = SPECIAL_FILENAMES.get(filename) or EXTENSION_MAP.get(ext) or ("Other (" + ext + ")" if ext else "Plain Text")

            tot_lines, c_lines, b_lines = count_lines(filepath)
            metrics["total_lines"] += tot_lines
            metrics["code_lines"] += c_lines
            metrics["blank_lines"] += b_lines

            metrics["languages"][lang]["files"] += 1
            metrics["languages"][lang]["lines"] += tot_lines
            metrics["languages"][lang]["code_lines"] += c_lines

            # Key files categorization
            if filename in config_files or filename.startswith(".env"):
                metrics["key_files"]["configs"].append(rel_file)
                if filename == ".env":
                    metrics["security_flags"].append({
                        "file": rel_file,
                        "type": "Unencrypted .env file found in target repo",
                        "severity": "HIGH"
                    })

            if doc_patterns.match(filename) or "doc" in rel_root.lower():
                metrics["key_files"]["docs"].append(rel_file)

            if ".github" in rel_root or "jenkins" in filename.lower() or "ci" in filename.lower():
                metrics["key_files"]["ci_cd"].append(rel_file)

            if test_patterns.search(filename) or test_patterns.search(rel_root):
                metrics["key_files"]["tests"].append(rel_file)

            # Security sanity check
            flaws = check_security_flaws(filepath)
            for flaw in flaws:
                metrics["security_flags"].append({
                    "file": os.path.relpath(flaw["file"], target_root),
                    "type": flaw["type"],
                    "match": flaw["match"],
                    "severity": "CRITICAL"
                })

    metrics["structure"] = get_tree(target_root, max_depth=3)
    return metrics

def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "target"
    print(f"\n🔍 Investigating repository in: {target_dir}")
    target_root = find_target_root(target_dir)

    metrics = analyze_target(target_root)

    # Sort languages by code lines
    sorted_langs = sorted(
        [{"name": k, **v} for k, v in metrics["languages"].items()],
        key=lambda x: x["code_lines"],
        reverse=True
    )
    metrics["languages_sorted"] = sorted_langs
    # Convert defaultdict for JSON serialization
    metrics["languages"] = dict(metrics["languages"])

    # Pretty print summary
    print("\n" + "="*50)
    print(f"📊 REPOSITORY METRICS SUMMARY: {metrics['target_path']}")
    print("="*50)
    print(f"Total Files Analyzed : {metrics['total_files']:,}")
    print(f"Total Lines of Code  : {metrics['code_lines']:,} (Total: {metrics['total_lines']:,}, Blank: {metrics['blank_lines']:,})")
    print(f"Total Directories    : {metrics['total_dirs']:,}")
    print("\nTop Languages:")
    for l in sorted_langs[:8]:
        pct = (l['code_lines'] / metrics['code_lines'] * 100) if metrics['code_lines'] > 0 else 0
        print(f"  - {l['name']:<22} {l['code_lines']:>8,} lines ({pct:>5.1f}%) | {l['files']} files")

    print(f"\nDocumentation Files Found ({len(metrics['key_files']['docs'])}):")
    for d in metrics['key_files']['docs'][:5]:
        print(f"  - {d}")

    print(f"\nConfiguration Files Found ({len(metrics['key_files']['configs'])}):")
    for c in metrics['key_files']['configs'][:5]:
        print(f"  - {c}")

    print(f"\nSecurity Flags / Secret Detections: {len(metrics['security_flags'])}")
    for s in metrics['security_flags']:
        print(f"  ⚠️ [{s.get('severity', 'WARN')}] {s['file']}: {s['type']}")

    print("="*50 + "\n")

    # Save to JSON
    out_file = Path("target-metrics.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"✅ Saved metrics to {out_file}")

    # Also save to src/data/target-metrics.json for the Vite app
    web_data_dir = Path("src/data")
    web_data_dir.mkdir(parents=True, exist_ok=True)
    with open(web_data_dir / "target-metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"✅ Saved web metrics to {web_data_dir / 'target-metrics.json'}")

if __name__ == "__main__":
    main()
