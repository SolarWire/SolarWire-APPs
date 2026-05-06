import os
import re
import sys

swc_backup_dir = r'c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\swc-backup'

try:
    # Walk through all .swc files
    for root, dirs, files in os.walk(swc_backup_dir):
        for file in files:
            if file.endswith('.swc'):
                file_path = os.path.join(root, file)
                print(f"Processing: {file_path}")
                
                try:
                    # Read file content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace (()) with () using regex
                    original_content = content
                    content = re.sub(r'\(\(\(([^)]+)\)\)\)', r'(\1)', content)
                    
                    # Write back if changed
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  Updated: {file_path}")
                    else:
                        print(f"  No changes needed: {file_path}")
                except Exception as e:
                    print(f"  Error processing {file_path}: {e}", file=sys.stderr)

    print("Done!")
except Exception as e:
    print(f"Fatal error: {e}", file=sys.stderr)
    sys.exit(1)
