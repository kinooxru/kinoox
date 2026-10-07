import os
import re

base_dir = r'D:\KINOOX\apps\api\src'

# Regex pattern to match relative imports without .js extension
pattern = re.compile(r'''from\s+['"](\.\.?/[^'"]+?)['"]''')

modified_files = []
unchanged_files = []
total_changes = 0

for root, dirs, files in os.walk(base_dir):
    for filename in files:
        if filename.endswith('.ts') or filename.endswith('.tsx'):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                def replace_import(match):
                    nonlocal total_changes
                    import_path = match.group(1)
                    if not import_path.endswith('.js'):
                        total_changes += 1
                        return f"from '{import_path}.js'"
                    return match.group(0)
                
                content = pattern.sub(replace_import, content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    modified_files.append(filepath)
                else:
                    unchanged_files.append(filepath)
                    
            except Exception as e:
                print(f'Error processing {filepath}: {e}')

print('=' * 60)
print('SUMMARY')
print('=' * 60)
print(f'Total .ts files scanned: {len(modified_files) + len(unchanged_files)}')
print(f'Files modified: {len(modified_files)}')
print(f'Total import replacements made: {total_changes}')
print()
if modified_files:
    print('Modified files:')
    for f in modified_files:
        print(f'  {f}')
