#!/usr/bin/env python3
"""
Final batch fix for ALL remaining IconButtons
Uses simple line-by-line pattern matching
"""

import re
from pathlib import Path

def fix_file_tooltips(file_path: Path) -> int:
    """Add tooltips to all IconButtons in a file"""
    content = file_path.read_text()
    original = content
    
    # Pattern 1: Back buttons without tooltip
    content = re.sub(
        r'(leading: IconButton\(\s*icon: const Icon\(Icons\.arrow_back[^)]*\),\s*color: AppTheme\.primary,\s*onPressed: [^,]+,)\s*\),',
        r'\1\n          tooltip: \'Go back\',\n        ),',
        content,
        flags=re.MULTILINE
    )
    
    # Pattern 2: IconButton with onPressed but no tooltip (more general)
    lines = content.split('\n')
    result_lines = []
    i = 0
    count = 0
    
    while i < len(lines):
        line = lines[i]
        result_lines.append(line)
        
        # If we find IconButton( without tooltip nearby
        if 'IconButton(' in line:
            # Check next 15 lines for tooltip
            has_tooltip = False
            closing_paren_idx = None
            paren_count = line.count('(') - line.count(')')
            
            for j in range(i + 1, min(i + 15, len(lines))):
                if 'tooltip:' in lines[j]:
                    has_tooltip = True
                    break
                paren_count += lines[j].count('(') - lines[j].count(')')
                if paren_count == 0:
                    closing_paren_idx = j
                    break
            
            # If no tooltip and we found the closing paren
            if not has_tooltip and closing_paren_idx:
                # Extract icon type from block
                block = '\n'.join(lines[i:closing_paren_idx+1])
                icon_match = re.search(r'Icons\.(\w+)', block)
                
                if icon_match:
                    icon_name = icon_match.group(1)
                    tooltip = get_tooltip_for_icon(icon_name)
                    
                    if tooltip:
                        # Find line with onPressed
                        for k in range(i + 1, closing_paren_idx + 1):
                            if 'onPressed:' in lines[k]:
                                # Find comma after onPressed
                                temp_idx = k
                                temp_paren = 0
                                                                while temp_idx <= closing_paren_idx:
                                    for char in lines[temp_idx]:
                                        if char in '([{':
                                            temp_paren += 1
                                        elif char in ')]}':
                                            temp_paren -= 1
                                        elif char == ',' and temp_paren == 0:
                                            # Insert tooltip after this line
                                            indent = len(lines[temp_idx]) - len(lines[temp_idx].lstrip())
                                            tooltip_line = ' ' * indent + f"tooltip: '{tooltip}',"
                                            lines.insert(temp_idx + 1, tooltip_line)
                                            count += 1
                                            closing_paren_idx += 1  # Adjust for inserted line
                                            break
                                    if count > 0:
                                        break
                                    temp_idx += 1
                                break
        
        i += 1
    
    if count == 0:
        # Use simpler regex patterns
        new_content = content
        patterns = [
            # Simple back button pattern
            (r"(onPressed: \(\) => Navigator\.pop\(context\),)\s*(\))", r"\1\n          tooltip: 'Go back',\n        \2", 'Go back'),
        ]
        
        for pattern, replacement, desc in patterns:
            before = new_content
            new_content = re.sub(pattern, replacement, new_content, flags=re.MULTILINE)
            if before != new_content:
                count += (new_content.count('tooltip:') - before.count('tooltip:'))
    
    # Write if changed
    if content != original or count > 0:
        final_content = '\n'.join(result_lines) if count > 0 else new_content if new_content != content else content
        if final_content != original:
            file_path.write_text(final_content)
            return max(count, 1)
    
    return 0

def get_tooltip_for_icon(icon_name: str) -> str:
    """Get appropriate tooltip for icon"""
    tooltips = {
        'arrow_back': 'Go back',
        'arrow_back_ios': 'Go back',
        'arrow_back_ios_new': 'Go back',
        'arrow_back_ios_new_rounded': 'Go back',
        'close': 'Close',
        'delete': 'Delete',
        'delete_outline': 'Delete',
        'edit': 'Edit',
        'edit_outlined': 'Edit',
        'visibility_outlined': 'Show password',
        'visibility_off_outlined': 'Hide password',
        'add': 'Add',
        'bookmark_border_outlined': 'Bookmark',
        'more_vert': 'More options',
    }
    
    for key, value in tooltips.items():
        if key in icon_name.lower():
            return value
    return ''

def main():
    project = Path('/Users/zakariyayahiaoui/Development/projects/App 2/an_nakhlah_hub_v3')
    
    # Target the remaining problematic files
    target_patterns = [
        'lib/presentation/screens/admin/**/*.dart',
        'lib/presentation/screens/achievements/*.dart',
        'lib/presentation/screens/settings/*.dart',
        'lib/presentation/screens/quiz/*.dart',
        'lib/presentation/screens/analytics/*.dart',
        'lib/presentation/screens/lessons/*_tab.dart',
        'lib/presentation/widgets/lesson_bookmark.dart',
        'lib/presentation/widgets/arabic_flashcard.dart',
    ]
    
    total = 0
    fixed_files = []
    
    for pattern in target_patterns:
        for file in project.glob(pattern):
            if file.is_file() and 'IconButton(' in file.read_text():
                count = fix_file_tooltips(file)
                if count > 0:
                    total += count
                    fixed_files.append((file.name, count))
                    print(f"✅ {file.name}: +{count}")
    
    print(f"\n✅ Total: {total} tooltips added across {len(fixed_files)} files")

if __name__ == '__main__':
    main()
