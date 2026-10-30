#!/usr/bin/env python3
"""
Target Repository Analyzer
Analyzes the codebase in `target/` to extract metrics:
- Language-aware line counting (physical, blank, comment, code, documentation, data)
- Distinguishes VCS, dependencies, build artifacts, and source directories
- Target Git commit metadata and revision tracking
- Key config, documentation, test, and CI/CD inventory
- Preliminary heuristic security pattern scanning with contextual severity and sanitization

Outputs to stdout and saves to:
- target-metrics.json
- src/data/target-metrics.json
"""

import os
import sys
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

ANALYZER_VERSION = "2.0.0"

# Language classification and file extension mappings
LANGUAGE_INFO = {
    # Extension: (Language Name, Category)
    # Categories: "code", "doc", "data", "config"
    ".py": ("Python", "code"),
    ".pyw": ("Python", "code"),
    ".ts": ("TypeScript", "code"),
    ".tsx": ("TypeScript (React)", "code"),
    ".js": ("JavaScript", "code"),
    ".jsx": ("JavaScript (React)", "code"),
    ".mjs": ("JavaScript", "code"),
    ".cjs": ("JavaScript", "code"),
    ".go": ("Go", "code"),
    ".rs": ("Rust", "code"),
    ".java": ("Java", "code"),
    ".kt": ("Kotlin", "code"),
    ".kts": ("Kotlin Script", "code"),
    ".c": ("C", "code"),
    ".cpp": ("C++", "code"),
    ".cc": ("C++", "code"),
    ".cxx": ("C++", "code"),
    ".h": ("C/C++ Header", "code"),
    ".hpp": ("C++ Header", "code"),
    ".cs": ("C#", "code"),
    ".rb": ("Ruby", "code"),
    ".php": ("PHP", "code"),
    ".swift": ("Swift", "code"),
    ".sh": ("Shell Script", "code"),
    ".bash": ("Shell Script", "code"),
    ".zsh": ("Shell Script", "code"),
    ".html": ("HTML", "code"),
    ".htm": ("HTML", "code"),
    ".css": ("CSS", "code"),
    ".scss": ("SCSS", "code"),
    ".sass": ("SASS", "code"),
    ".less": ("LESS", "code"),
    ".vue": ("Vue", "code"),
    ".svelte": ("Svelte", "code"),
    ".sol": ("Solidity", "code"),
    ".proto": ("Protocol Buffers", "code"),
    ".graphql": ("GraphQL", "code"),
    ".gql": ("GraphQL", "code"),
    ".r": ("R", "code"),
    ".lua": ("Lua", "code"),
    ".dart": ("Dart", "code"),
    ".scala": ("Scala", "code"),

    # Documentation
    ".md": ("Markdown", "doc"),
    ".markdown": ("Markdown", "doc"),
    ".mdx": ("MDX", "doc"),
    ".rst": ("reStructuredText", "doc"),
    ".txt": ("Plain Text", "doc"),
    ".adoc": ("AsciiDoc", "doc"),

    # Data
    ".json": ("JSON", "data"),
    ".csv": ("CSV", "data"),
    ".tsv": ("TSV", "data"),
    ".sql": ("SQL", "data"),
    ".xml": ("XML", "data"),

    # Configuration
    ".yaml": ("YAML", "config"),
    ".yml": ("YAML", "config"),
    ".toml": ("TOML", "config"),
    ".ini": ("INI Config", "config"),
    ".cfg": ("Config", "config"),
    ".conf": ("Config", "config"),
    ".properties": ("Properties", "config"),
    ".dockerignore": ("Docker Ignore", "config"),
    ".gitignore": ("Git Ignore", "config"),
    ".editorconfig": ("EditorConfig", "config"),
}

SPECIAL_FILENAMES = {
    "Dockerfile": ("Dockerfile", "config"),
    "docker-compose.yml": ("Docker Compose", "config"),
    "docker-compose.yaml": ("Docker Compose", "config"),
    "Makefile": ("Makefile", "code"),
    "CMakeLists.txt": ("CMake", "code"),
    "Jenkinsfile": ("Jenkinsfile", "config"),
    "Vagrantfile": ("Vagrantfile", "config"),
}

# Directory categories
DEFAULT_VCS_DIRS = {".git", ".svn", ".hg", ".bzr"}
DEFAULT_DEPENDENCY_DIRS = {
    "node_modules", "vendor", ".venv", "venv", "env",
    ".cargo", "Pods", "packages"
}
DEFAULT_BUILD_DIRS = {
    "dist", "build", "out", ".next", ".nuxt", ".output",
    "__pycache__", ".turbo", "coverage", ".gradle",
    ".pytest_cache", ".mypy_cache", ".ruff_cache", ".parcel-cache"
}
DEFAULT_IDE_DIRS = {".idea", ".vscode", ".vs", ".eclipse"}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".bmp", ".tiff",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp4", ".mov", ".avi", ".mp3", ".wav", ".flac", ".ogg",
    ".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".xz",
    ".pdf", ".exe", ".dll", ".so", ".dylib", ".bin", ".dmg", ".iso",
    ".lock", ".log", ".pyc", ".pyo", ".pyd", ".wasm", ".map"
}

# Contextual security scanning rules with severity classification
SUSPICIOUS_PATTERNS = [
    {
        "pattern": r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
        "type": "Unencrypted Private Key",
        "severity": "CRITICAL",
        "category": "credentials"
    },
    {
        "pattern": r"AKIA[0-9A-Z]{16}",
        "type": "AWS Access Key ID",
        "severity": "HIGH",
        "category": "credentials"
    },
    {
        "pattern": r"ghp_[0-9a-zA-Z]{36}",
        "type": "GitHub Personal Access Token",
        "severity": "HIGH",
        "category": "credentials"
    },
    {
        "pattern": r"AIza[0-9A-Za-z-_]{35}",
        "type": "Google API Key",
        "severity": "HIGH",
        "category": "credentials"
    },
    {
        "pattern": r"sk-[a-zA-Z0-9]{32,}",
        "type": "OpenAI API Key format",
        "severity": "HIGH",
        "category": "credentials"
    },
    {
        "pattern": r"(?:password|passwd|secret|api_key)\s*=\s*['\"][^'\"]{8,}['\"]",
        "type": "Hardcoded Credentials in Assignment",
        "severity": "MEDIUM",
        "category": "secret"
    },
]


def sanitize_matched_string(val: str) -> str:
    """Mask sensitive string content while keeping enough context to identify the pattern."""
    if not val:
        return ""
    val = val.strip()
    if len(val) <= 6:
        return "***"
    return val[:4] + "..." + val[-2:]


def get_git_metadata(repo_dir: Path) -> dict:
    """Extract Git commit SHA, branch, author, date, and origin info if repository exists."""
    git_dir = repo_dir / ".git"
    if not git_dir.exists():
        # Check if parent or current is git
        return {}

    try:
        def run_git(args):
            res = subprocess.run(
                ["git", "-C", str(repo_dir)] + args,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                check=True
            )
            return res.stdout.strip()

        commit_hash = run_git(["rev-parse", "HEAD"])
        short_hash = run_git(["rev-parse", "--short", "HEAD"])
        branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"])

        # Format: ISO date|Author|Subject
        log_info = run_git(["log", "-1", "--format=%ci|%an|%s"])
        parts = log_info.split("|", 2)
        commit_date = parts[0] if len(parts) > 0 else ""
        author = parts[1] if len(parts) > 1 else ""
        commit_message = parts[2] if len(parts) > 2 else ""

        # Remote URL (sanitize any embedded credentials)
        remote_url = ""
        try:
            raw_url = run_git(["config", "--get", "remote.origin.url"])
            remote_url = re.sub(r"://[^@]+@", "://", raw_url)
        except Exception:
            pass

        return {
            "commit_hash": commit_hash,
            "short_hash": short_hash,
            "branch": branch,
            "commit_date": commit_date,
            "author": author,
            "commit_message": commit_message,
            "remote_url": remote_url
        }
    except Exception:
        return {}


def is_rust_target_dir(dir_path: Path) -> bool:
    """Check if a directory named 'target' is a Rust build artifact directory."""
    if dir_path.name != "target":
        return False
    # Check if parent or ancestor contains Cargo.toml or CACHEDIR.TAG
    parent = dir_path.parent
    if (parent / "Cargo.toml").exists() or (dir_path / "CACHEDIR.TAG").exists():
        return True
    return False


def should_exclude_dir(dir_path: Path, custom_excludes: set = None) -> bool:
    """
    Determine if directory should be excluded.
    Distinguishes VCS metadata, dependencies, build artifacts, and project directories.
    """
    name = dir_path.name
    if custom_excludes and name in custom_excludes:
        return True

    if name in DEFAULT_VCS_DIRS or name.startswith(".git"):
        return True
    if name in DEFAULT_DEPENDENCY_DIRS:
        return True
    if name in DEFAULT_BUILD_DIRS:
        return True
    if name in DEFAULT_IDE_DIRS:
        return True

    # Check for Rust target artifact vs legitimate target directory name
    if is_rust_target_dir(dir_path):
        return True

    return False


def count_lines_detailed(filepath: Path, language: str, category: str):
    """
    Language-aware line counting.
    Distinguishes:
    - physical_lines: all lines
    - blank_lines: whitespace-only
    - comment_lines: single and multiline comments
    - code_lines: executable / declarative code
    - doc_lines: documentation content (if category == 'doc')
    - data_lines: data content (if category == 'data')
    """
    physical_lines = 0
    blank_lines = 0
    comment_lines = 0
    code_lines = 0
    doc_lines = 0
    data_lines = 0

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except Exception:
        return 0, 0, 0, 0, 0, 0

    physical_lines = len(lines)

    # Documentation files: blank vs doc content
    if category == "doc":
        for line in lines:
            if not line.strip():
                blank_lines += 1
            else:
                doc_lines += 1
        return physical_lines, blank_lines, comment_lines, code_lines, doc_lines, data_lines

    # Data files: blank vs data lines
    if category == "data":
        for line in lines:
            if not line.strip():
                blank_lines += 1
            else:
                data_lines += 1
        return physical_lines, blank_lines, comment_lines, code_lines, doc_lines, data_lines

    # Language comment rules
    in_block_comment = False
    block_comment_end = None
    python_block_quote = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            blank_lines += 1
            continue

        # Handle Python multiline strings/docstrings
        if language in ("Python",):
            if python_block_quote:
                comment_lines += 1
                if python_block_quote in stripped:
                    python_block_quote = None
                continue
            elif stripped.startswith('"""') or stripped.startswith("'''"):
                quote = stripped[:3]
                comment_lines += 1
                if stripped.count(quote) == 1:
                    python_block_quote = quote
                continue
            elif stripped.startswith("#"):
                comment_lines += 1
                continue
            else:
                code_lines += 1
                continue

        # Handle C-style /* ... */ and // comments
        if language in (
            "JavaScript", "TypeScript", "TypeScript (React)", "JavaScript (React)",
            "C", "C++", "C/C++ Header", "C++ Header", "C#", "Java", "Kotlin",
            "Rust", "Go", "Swift", "PHP", "CSS", "SCSS", "SASS", "LESS",
            "Solidity", "Protocol Buffers", "Dart", "Scala"
        ):
            if in_block_comment:
                comment_lines += 1
                if "*/" in stripped:
                    in_block_comment = False
                continue
            elif stripped.startswith("/*"):
                comment_lines += 1
                if "*/" not in stripped[2:]:
                    in_block_comment = True
                continue
            elif stripped.startswith("//"):
                comment_lines += 1
                continue
            else:
                code_lines += 1
                continue

        # Handle HTML/XML <!-- ... --> comments
        if language in ("HTML", "XML", "Vue", "Svelte"):
            if in_block_comment:
                comment_lines += 1
                if "-->" in stripped:
                    in_block_comment = False
                continue
            elif stripped.startswith("<!--"):
                comment_lines += 1
                if "-->" not in stripped[4:]:
                    in_block_comment = True
                continue
            else:
                code_lines += 1
                continue

        # Handle Hash '#' comments (Shell, YAML, TOML, Makefile, R, etc.)
        if language in ("Shell Script", "YAML", "TOML", "Makefile", "CMake", "Docker Compose", "R", "Config", "INI Config", "EditorConfig"):
            if stripped.startswith("#"):
                comment_lines += 1
            else:
                code_lines += 1
            continue

        # Handle SQL / Lua '--' comments
        if language in ("SQL", "Lua"):
            if in_block_comment:
                comment_lines += 1
                if "*/" in stripped:
                    in_block_comment = False
                continue
            elif stripped.startswith("/*"):
                comment_lines += 1
                if "*/" not in stripped[2:]:
                    in_block_comment = True
                continue
            elif stripped.startswith("--"):
                comment_lines += 1
            else:
                code_lines += 1
            continue

        # Default fallback
        code_lines += 1

    return physical_lines, blank_lines, comment_lines, code_lines, doc_lines, data_lines


def check_security_flaws(filepath: Path, target_root: Path):
    """Scan file for sensitive patterns, masking sensitive values and attributing severity."""
    findings = []
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        rel_path = os.path.relpath(filepath, target_root)

        for rule in SUSPICIOUS_PATTERNS:
            pattern = rule["pattern"]
            matches = list(re.finditer(pattern, content))
            for m in matches:
                matched_str = m.group(0)
                findings.append({
                    "file": rel_path,
                    "type": rule["type"],
                    "severity": rule["severity"],
                    "category": rule["category"],
                    "match": sanitize_matched_string(matched_str),
                    "confidence": 0.85,
                    "scanner": "heuristic_regex_preliminary"
                })
    except Exception:
        pass
    return findings


def get_tree(dir_path: Path, target_root: Path, max_depth=3, current_depth=1, custom_excludes=None):
    """Generate safe directory tree relative to target_root without leaking machine paths."""
    items = []
    try:
        for entry in sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name.lower())):
            entry_path = Path(entry.path)
            if entry.is_dir() and should_exclude_dir(entry_path, custom_excludes):
                continue
            if not entry.is_dir() and entry.name in {".gitkeep", "README.md"} and str(dir_path) == str(target_root) and str(target_root) == "target":
                continue

            item = {
                "name": entry.name,
                "is_dir": entry.is_dir()
            }
            if entry.is_dir() and current_depth < max_depth:
                item["children"] = get_tree(entry_path, target_root, max_depth, current_depth + 1, custom_excludes)
            items.append(item)
    except PermissionError:
        pass
    return items


def find_target_root(base_dir="target"):
    """Locate the target repository root within the target directory."""
    target_path = Path(base_dir)
    if not target_path.exists():
        print(f"Error: directory '{base_dir}' does not exist.")
        sys.exit(1)

    subdirs = [p for p in target_path.iterdir() if p.is_dir() and not should_exclude_dir(p) and not p.name.startswith(".")]
    files = [p for p in target_path.iterdir() if p.is_file() and p.name not in {".gitkeep", "README.md"}]

    if len(subdirs) == 1 and len(files) == 0:
        return subdirs[0]
    return target_path


def analyze_target(target_root: Path, custom_excludes=None):
    """Comprehensive target repository analysis."""
    # Ensure target_root is clean relative path if possible
    clean_target_path = str(target_root).replace(str(Path.cwd()) + "/", "")

    metrics = {
        "analyzer_version": ANALYZER_VERSION,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "target_path": clean_target_path,
        "git_info": get_git_metadata(target_root),
        "total_files": 0,
        "total_dirs": 0,
        "total_lines": 0,
        "code_lines": 0,
        "comment_lines": 0,
        "blank_lines": 0,
        "doc_lines": 0,
        "data_lines": 0,
        "languages": defaultdict(lambda: {
            "files": 0,
            "lines": 0,
            "code_lines": 0,
            "comment_lines": 0,
            "blank_lines": 0,
            "doc_lines": 0,
            "data_lines": 0,
            "category": "code"
        }),
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
        ".env.example", ".env", "composer.json", "settings.gradle"
    }

    for root, dirs, files in os.walk(target_root):
        root_path = Path(root)
        dirs[:] = [d for d in dirs if not should_exclude_dir(root_path / d, custom_excludes)]
        metrics["total_dirs"] += len(dirs)

        rel_root = os.path.relpath(root, target_root)

        for filename in files:
            filepath = root_path / filename
            ext = filepath.suffix.lower()

            # Skip target placeholder readme / gitkeep if inspecting raw target/
            if str(target_root) == "target" and rel_root == "." and filename in {".gitkeep", "README.md"}:
                continue

            if ext in IGNORED_EXTENSIONS or filename.endswith(".min.js") or filename.endswith(".min.css"):
                continue

            rel_file = os.path.relpath(filepath, target_root)
            metrics["total_files"] += 1

            # Detect language and category
            if filename in SPECIAL_FILENAMES:
                lang, category = SPECIAL_FILENAMES[filename]
            elif ext in LANGUAGE_INFO:
                lang, category = LANGUAGE_INFO[ext]
            else:
                lang, category = ("Other (" + ext + ")" if ext else "Plain Text", "doc" if ext in {".txt", ".rst"} else "code")

            phys, blank, comm, code, doc, data = count_lines_detailed(filepath, lang, category)

            metrics["total_lines"] += phys
            metrics["blank_lines"] += blank
            metrics["comment_lines"] += comm
            metrics["code_lines"] += code
            metrics["doc_lines"] += doc
            metrics["data_lines"] += data

            lang_stat = metrics["languages"][lang]
            lang_stat["files"] += 1
            lang_stat["lines"] += phys
            lang_stat["blank_lines"] += blank
            lang_stat["comment_lines"] += comm
            lang_stat["code_lines"] += code
            lang_stat["doc_lines"] += doc
            lang_stat["data_lines"] += data
            lang_stat["category"] = category

            # Key files categorization
            if filename in config_files or filename.startswith(".env"):
                metrics["key_files"]["configs"].append(rel_file)
                if filename == ".env":
                    metrics["security_flags"].append({
                        "file": rel_file,
                        "type": "Unencrypted .env file found in target repo",
                        "severity": "HIGH",
                        "category": "credentials",
                        "confidence": 0.95,
                        "scanner": "heuristic_regex_preliminary"
                    })

            if doc_patterns.match(filename) or "doc" in rel_root.lower():
                metrics["key_files"]["docs"].append(rel_file)

            if ".github" in rel_root or "jenkins" in filename.lower() or "ci" in filename.lower():
                metrics["key_files"]["ci_cd"].append(rel_file)

            if test_patterns.search(filename) or test_patterns.search(rel_root):
                metrics["key_files"]["tests"].append(rel_file)

            # Security sanity check
            flaws = check_security_flaws(filepath, target_root)
            metrics["security_flags"].extend(flaws)

    metrics["structure"] = get_tree(target_root, target_root, max_depth=3, custom_excludes=custom_excludes)
    return metrics


def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "target"
    print(f"\n🔍 Investigating repository in: {target_dir}")
    target_root = find_target_root(target_dir)

    metrics = analyze_target(target_root)

    # Sort languages by code lines, fallback to lines
    sorted_langs = sorted(
        [{"name": k, **v} for k, v in metrics["languages"].items()],
        key=lambda x: (x["code_lines"], x["lines"]),
        reverse=True
    )
    metrics["languages_sorted"] = sorted_langs
    metrics["languages"] = dict(metrics["languages"])

    # Pretty print summary
    print("\n" + "="*60)
    print(f"📊 REPOSITORY METRICS SUMMARY: {metrics['target_path']}")
    if metrics["git_info"]:
        git = metrics["git_info"]
        print(f"   Git Revision: {git.get('short_hash', '')} ({git.get('branch', 'unknown')}) | {git.get('commit_date', '')}")
    print("="*60)
    print(f"Total Files Analyzed : {metrics['total_files']:,}")
    print(f"Physical Lines       : {metrics['total_lines']:,}")
    print(f"  ├─ Code Lines      : {metrics['code_lines']:,}")
    print(f"  ├─ Comment Lines   : {metrics['comment_lines']:,}")
    print(f"  ├─ Blank Lines     : {metrics['blank_lines']:,}")
    print(f"  ├─ Doc Lines       : {metrics['doc_lines']:,}")
    print(f"  └─ Data Lines      : {metrics['data_lines']:,}")
    print(f"Total Directories    : {metrics['total_dirs']:,}")

    print("\nTop Languages by Code Lines:")
    for l in sorted_langs[:8]:
        pct = (l['code_lines'] / metrics['code_lines'] * 100) if metrics['code_lines'] > 0 else 0
        print(f"  - {l['name']:<22} {l['code_lines']:>8,} code lines ({pct:>5.1f}%) | {l['files']} files | {l['comment_lines']:,} comments")

    print(f"\nDocumentation Files Found ({len(metrics['key_files']['docs'])}):")
    for d in metrics['key_files']['docs'][:5]:
        print(f"  - {d}")

    print(f"\nConfiguration Files Found ({len(metrics['key_files']['configs'])}):")
    for c in metrics['key_files']['configs'][:5]:
        print(f"  - {c}")

    print(f"\nPreliminary Security Flags: {len(metrics['security_flags'])}")
    for s in metrics['security_flags']:
        print(f"  ⚠️ [{s.get('severity', 'WARN')}] {s['file']}: {s['type']}")

    print("="*60 + "\n")

    # Save to target-metrics.json
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
