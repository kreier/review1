#!/usr/bin/env python3
"""
Unit tests for scripts/analyze-target.py
Tests language-aware line counting, directory exclusion, path sanitization, and security rules.
"""

import unittest
import tempfile
import os
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import importlib
analyzer = importlib.import_module("analyze-target")


class TestAnalyzer(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_root = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_python_line_counting(self):
        py_file = self.test_root / "example.py"
        py_file.write_text(
            '# Header comment\n'
            'import os\n'
            '\n'
            '"""\n'
            'Docstring line 1\n'
            'Docstring line 2\n'
            '"""\n'
            'def hello():\n'
            '    # inline comment\n'
            '    print("hello world")\n'
            '\n'
        )

        phys, blank, comm, code, doc, data = analyzer.count_lines_detailed(py_file, "Python", "code")
        self.assertEqual(phys, 11)
        self.assertEqual(blank, 2)
        # 1 single comment + 4 docstring lines + 1 inline comment = 6 comment lines
        self.assertEqual(comm, 6)
        # import os, def hello():, print("hello world") = 3 code lines
        self.assertEqual(code, 3)
        self.assertEqual(doc, 0)
        self.assertEqual(data, 0)

    def test_typescript_line_counting(self):
        ts_file = self.test_root / "example.ts"
        ts_file.write_text(
            '// Single line comment\n'
            'export const x = 42;\n'
            '\n'
            '/*\n'
            ' * Multiline comment\n'
            ' */\n'
            'console.log(x);\n'
        )

        phys, blank, comm, code, doc, data = analyzer.count_lines_detailed(ts_file, "TypeScript", "code")
        self.assertEqual(phys, 7)
        self.assertEqual(blank, 1)
        self.assertEqual(comm, 4)
        self.assertEqual(code, 2)

    def test_documentation_file_counting(self):
        md_file = self.test_root / "README.md"
        md_file.write_text(
            '# Project Title\n'
            '\n'
            'This is documentation.\n'
            '\n'
            '## Section 2\n'
            'More text here.\n'
        )

        phys, blank, comm, code, doc, data = analyzer.count_lines_detailed(md_file, "Markdown", "doc")
        self.assertEqual(phys, 6)
        self.assertEqual(blank, 2)
        self.assertEqual(code, 0)
        self.assertEqual(doc, 4)
        self.assertEqual(data, 0)

    def test_data_file_counting(self):
        json_file = self.test_root / "data.json"
        json_file.write_text(
            '{\n'
            '  "name": "test",\n'
            '  "items": [1, 2, 3]\n'
            '}\n'
        )

        phys, blank, comm, code, doc, data = analyzer.count_lines_detailed(json_file, "JSON", "data")
        self.assertEqual(phys, 4)
        self.assertEqual(code, 0)
        self.assertEqual(data, 4)

    def test_directory_exclusion_logic(self):
        # VCS metadata
        self.assertTrue(analyzer.should_exclude_dir(Path(".git")))
        self.assertTrue(analyzer.should_exclude_dir(Path(".svn")))

        # Dependencies
        self.assertTrue(analyzer.should_exclude_dir(Path("node_modules")))
        self.assertTrue(analyzer.should_exclude_dir(Path("vendor")))
        self.assertTrue(analyzer.should_exclude_dir(Path(".venv")))

        # Build artifacts
        self.assertTrue(analyzer.should_exclude_dir(Path("dist")))
        self.assertTrue(analyzer.should_exclude_dir(Path("build")))
        self.assertTrue(analyzer.should_exclude_dir(Path("__pycache__")))

        # Regular project directory should NOT be excluded
        self.assertFalse(analyzer.should_exclude_dir(Path("app")))
        self.assertFalse(analyzer.should_exclude_dir(Path("src")))
        self.assertFalse(analyzer.should_exclude_dir(Path("tests")))

        # Target directory without Cargo.toml should NOT be treated as Rust build artifact
        standalone_target = self.test_root / "target"
        standalone_target.mkdir()
        self.assertFalse(analyzer.is_rust_target_dir(standalone_target))

        # Target directory with Cargo.toml in parent SHOULD be treated as Rust artifact
        (self.test_root / "Cargo.toml").write_text("[package]\nname='test'\n")
        self.assertTrue(analyzer.is_rust_target_dir(standalone_target))

    def test_secret_sanitization(self):
        masked = analyzer.sanitize_matched_string("AKIA1234567890ABCDEF")
        self.assertEqual(masked, "AKIA...EF")
        self.assertNotIn("1234567890", masked)

        short_masked = analyzer.sanitize_matched_string("secret")
        self.assertEqual(short_masked, "***")


if __name__ == "__main__":
    unittest.main()
