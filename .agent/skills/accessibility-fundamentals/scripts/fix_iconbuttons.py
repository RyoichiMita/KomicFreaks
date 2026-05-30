#!/usr/bin/env python3
"""
Auto-fix accessibility issues by adding tooltips to IconButtons
Based on context heuristics
"""

import re
import sys
from pathlib import Path

# Mapping of icon types to tooltip text
ICON_TOOLTIPS = {
    'Icons.arrow_back': 'Go back',
    'Icons.arrow_back_ios': 'Go back',
    'Icons.arrow_back_ios_new': 'Go back',
    'Icons.close': 'Close',
    'Icons.delete': 'Delete',
    'Icons.edit': 'Edit',
    'Icons.add': 'Add',
    'Icons.search': 'Search',
    'Icons.settings': 'Settings',
    'Icons.more_vert': 'More options',
    'Icons.visibility': 'Show password',
    'Icons.visibility_off': 'Hide password',
    'Icons.favorite': 'Add to favorites',
    'Icons.favorite_border': 'Add to favorites',
    'Icons.share': 'Share',
    'Icons.download': 'Download',
    'Icons.upload': 'Upload',
    'Icons.refresh': 'Refresh',
    'Icons.logout': 'Sign out',
    'Icons.person': 'Profile',
    'Icons.help': 'Help',
    'Icons.info': 'Information',
    'Icons.clear': 'Clear',
    'Icons.check': 'Confirm',
    'Icons.cancel': 'Cancel',
    'Icons.save': 'Save',
    'Icons.replay_10': 'Rewind 10 seconds',
    'Icons.forward_10': 'Forward 10 seconds',
    'Icons.play_arrow': 'Play',
    'Icons.pause': 'Pause',
    'Icons.skip_next': 'Next',
    'Icons.skip_previous': 'Previous',
    'Icons.volume_up': 'Volume',
    'Icons.volume_off': 'Mute',
    'Icons.bookmark': 'Bookmark',
    'Icons.bookmark_border': 'Bookmark',
    'Icons.copy': 'Copy',
    'Icons.paste': 'Paste',
}

def find_icon_tooltip(icon_name: str, file_name: str) -> str:
    """Determine appropriate tooltip based on icon and context."""
    # Check direct mapping
    if icon_name in ICON_TOOLTIPS:
        return ICON_TOOLTIPS[icon_name]
    
    # Context-based heuristics
    if 'admin' in file_name.lower():
        if 'delete' in icon_name.lower():
            return 'Delete item'
        if 'edit' in icon_name.lower():
            return 'Edit item'
        if 'add' in icon_name.lower():
            return 'Add item'
    
    # Generic fallback
    icon_simple = icon_name.replace('Icons.', '').replace('_', ' ').title()
    return icon_simple

def fix_icon_button(content: str, file_path: Path) -> tuple[str, int]:
    """Add tooltips to IconButtons that don't have them."""
    lines = content.split('\n')
    modified = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check if this line contains IconButton(
        if 'IconButton(' in line:
            # Get the next 10 lines to analyze the button
            block_end = min(i + 15, len(lines))
            block = '\n'.join(lines[i:block_end])
            
            # Check if tooltip already exists
            if 'tooltip:' not in block:
                # Find the icon: line
                icon_match = re.search(r'icon:\s*(?:const\s+)?Icon\((Icons\.\w+)', block)
                
                if icon_match:
                    icon_name = icon_match.group(1)
                    tooltip_text = find_icon_tooltip(icon_name, file_path.name)
                    
                    # Find the closing of IconButton to insert tooltip before it
                    # Look for onPressed: or icon: line and insert tooltip after
                    for j in range(i, block_end):
                        if 'onPressed:' in lines[j]:
                            # Find the comma after onPressed closes
                            k = j
                            paren_count = 0
                            found_comma = False
                            
                            while k < block_end and not found_comma:
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
                                    tooltip_line = ' ' * indent + f"tooltip: '{tooltip_text}',"
                                    lines.insert(k + 1, tooltip_line)
                                    modified += 1
                                    break
                                k += 1
                            break
        
        i += 1
    
    return '\n'.join(lines), modified

def main():
    if len(sys.argv) < 2:
        print("Usage: python fix_iconbuttons.py <project_path>")
        sys.exit(1)
    
    project_path = Path(sys.argv[1])
    dart_files = list(project_path.rglob("lib/**/*.dart"))
    
    total_fixed = 0
    files_modified = 0
    
    print(f"🔧 Scanning {len(dart_files)} Dart files...\n")
    
    for file in dart_files:
        try:
            content = file.read_text()
            
            # Check if file has IconButtons
            if 'IconButton(' in content:
                new_content, count = fix_icon_button(content, file)
                
                if count > 0:
                    file.write_text(new_content)
                    total_fixed += count
                    files_modified += 1
                    print(f"✅ {file.name}: Added {count} tooltips")
        
        except Exception as e:
            print(f"⚠️  Error processing {file.name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✅ Fixed {total_fixed} IconButtons across {files_modified} files")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
