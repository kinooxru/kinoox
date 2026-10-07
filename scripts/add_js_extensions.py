#!/usr/bin/env python3
"""Add .js extension to all relative imports in apps/api/src"""

import os
import re
from pathlib import Path

src_dir = Path("D:/KINOOX/apps/api/src")

def fix_imports(content: str) -> str:
    def replace_import(match):
        prefix = match.group(1)
        path = match.group(2)
        suffix = match.group(3)
        
        # Skip if already has extension
        if re.search(r'\.(js|ts|mjs|json)$', path):
            return match.group(0)
        
        return f"{prefix}{path}.js{suffix}"
    
    # Match: from './path' or from '../path'
    return re.sub(
        r"(from\s+['\"])(\.[^'\"]+)(['\"])",
        replace_import,
        content
    )

count = 0
for ts_file in src_dir.rglob("*.ts"):
    content = ts_file.read_text(encoding="utf-8")
    fixed = fix_imports(content)
    
    if fixed != content:
        ts_file.write_text(fixed, encoding="utf-8")
        count += 1
        print(f"Updated: {ts_file.relative_to(src_dir.parent.parent)}")

print(f"\nDone! Updated {count} files.")
