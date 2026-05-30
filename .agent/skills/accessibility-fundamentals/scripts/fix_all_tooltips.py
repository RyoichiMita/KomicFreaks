#!/usr/bin/env python3
"""
Comprehensive IconButton tooltip fixer
Intelligently adds tooltips based on icon type and context
"""

import re
from pathlib import Path
from typing import Tuple, Optional

# Icon to tooltip mapping
TOOLTIP_MAP = {
    'Icons.arrow_back': 'Go back',
    'Icons.arrow_back_ios': 'Go back',
    'Icons.arrow_back_ios_new': 'Go back',
    'Icons.close': 'Close',
    'Icons.delete': 'Delete',
    'Icons.delete_outline': 'Delete',
    'Icons.edit': 'Edit',
    'Icons.edit_outlined': 'Edit',
    'Icons.add': 'Add',
    'Icons.add_circle_outline': 'Add',
    'Icons.save': 'Save',
    'Icons.check': 'Confirm',
    'Icons.cancel': 'Cancel',
    'Icons.search': 'Search',
    'Icons.clear': 'Clear',
    'Icons.refresh': 'Refresh',
    'Icons.more_vert': 'More options',
    'Icons.settings': 'Settings',
    'Icons.visibility': 'Show password',
    'Icons.visibility_off': 'Hide password',
    'Icons.replay_10': 'Rewind 10 seconds',
    'Icons.forward_10': 'Forward 10 seconds',
    'Icons.play_arrow': 'Play',
    'Icons.pause': 'Pause',
    'Icons.bookmark': 'Bookmark',
    'Icons.bookmark_border': 'Bookmark',
    'Icons.share': 'Share',
    'Icons.download': 'Download',
    'Icons.copy': 'Copy',
}

def find_icon_in_block(lines: list[str], start_idx: int) -> Optional[str]:
    """Find the icon type in an IconButton block"""
    # Look ahead up to 10 lines for icon: declaration
    for i in range(start_idx, min(start_idx + 10, len(lines))):
        line = lines[i]
        # Match: icon: Icon(Icons.something) or icon: const Icon(Icons.something)
        match = re.search(r'icon:\s*(?:const\s+)?Icon\((Icons\.\w+)', line)
        if match:
            return match.group(1)
    return None

def has_tooltip(lines: list[str], start_idx: int, end_idx: int) -> bool:
    """Check if tooltip already exists in the IconButton block"""
    for i in range(start_idx, min(end_idx, len(lines))):
        if 'tooltip:' in lines[i]:
            return True
    return False

def find_iconbutton_end(lines: list[str], start_idx: int) -> int:
    """Find the closing parenthesis of IconButton"""
    paren_count = 0
    in_iconbutton = False
    
    for i in range(start_idx, len(lines)):
        line = lines[i]
        
        if 'IconButton(' in line:
            in_iconbutton = True
            # Count opening paren from IconButton(
            paren_count += line.count('(')
            paren_count -= line.count(')')
        elif in_iconbutton:
            paren_count += line.count('(')
            paren_count -= line.count(')')
            
            if paren_count == 0:
                return i
    return start_idx + 10  # Fallback

def add_tooltip_to_iconbutton(content: str) -> Tuple[str, int]:
    """Add tooltips to all IconButtons missing them"""
    lines = content.split('\n')
    modifications = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        if 'IconButton(' in line:
            end_idx = find_iconbutton_end(lines, i)
            
            # Check if tooltip already exists
            if not has_tooltip(lines, i, end_idx + 1):
                # Find the icon type
                icon_type = find_icon_in_block(lines, i)
                
                if icon_type and icon_type in TOOLTIP_MAP:
                    tooltip = TOOLTIP_MAP[icon_type]
                    
                    # Find the line with onPressed to insert tooltip after it
                    for j in range(i, min(end_idx + 1, len(lines))):
                        if 'onPressed:' in lines[j]:
                            # Find where this onPressed ends (could be multiline)
                            k = j
                            found_comma = False
                            paren_count = 0
                            
                            while k <= end_idx and not found_comma:
                                for char in lines[k]:
                                    if char == '(':
                                        paren_count += 1
                                    elif char == ')':
                                        paren_count -= 1
                                    elif char == ',' and paren_count == 0:
                                        found_comma = True
                                        break
                                
                                if found_comma:
                                    # Insert tooltip on next line
                                    indent = len(lines[k]) - len(lines[k].lstrip())
                                    tooltip_line = ' ' * indent + f"tooltip: '{tooltip}',"
                                    lines.insert(k + 1, tooltip_line)
                                    modifications += 1
                                    break
                                k += 1
                            break
        
        i += 1
    
    return '\n'.join(lines), modifications

def main():
    project_root = Path('/Users/zakariyayahiaoui/Development/projects/App 2/an_nakhlah_hub_v3')
    dart_files = list(project_root.rglob('lib/**/*.dart'))
    
    total_fixed = 0
    files_modified = []
    
    print(f"🔍 Scanning {len(dart_files)} Dart files...\n")
    
    for file_path in dart_files:
        try:
            content = file_path.read_text()
            
            if 'IconButton(' in content and 'tooltip:' not in content:
                new_content, count = add_tooltip_to_iconbutton(content)
                
                if count > 0:
                    file_path.write_text(new_content)
                    total_fixed += count
                    files_modified.append((file_path.name, count))
                    print(f"✅ {file_path.name}: Added {count} tooltip(s)")
        
        except Exception as e:
            print(f"⚠️  Error processing {file_path.name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✅ Fixed {total_fixed} IconButtons across {len(files_modified)} files")
    print(f"{'='*60}\n")
    
    if files_modified:
        print("Modified files:")
        for filename, count in files_modified:
            print(f"  • {filename} ({count} tooltips)")

if __name__ == '__main__':
    main()
