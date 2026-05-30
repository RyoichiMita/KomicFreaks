#!/usr/bin/env python3
"""
Complete IconButton tooltip fixer - handles all edge cases
"""

import re
from pathlib import Path

def add_tooltip_smart(file_path: Path) -> int:
    """Smartly add tooltips to IconButtons in a file"""
    content = file_path.read_text()
    lines = content.split('\n')
    modified_lines = []
    modifications = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        modified_lines.append(line)
        
        # Check if this line starts an IconButton
        if 'IconButton(' in line:
            # Collect the full IconButton block
            block_start = i
            paren_count = line.count('(') - line.count(')')
            block_lines = [line]
            j = i + 1
            
            while j < len(lines) and paren_count > 0:
                block_lines.append(lines[j])
                paren_count += lines[j].count('(') - lines[j].count(')')
                j += 1
            
            block_text = '\n'.join(block_lines)
            
            # Check if tooltip already exists
            if 'tooltip:' not in block_text:
                # Extract icon type
                icon_match = re.search(r'icon:\s*(?:const\s+)?Icon\((Icons\.\w+)', block_text)
                
                if icon_match:
                    icon = icon_match.group(1)
                    tooltip = get_tooltip(icon, file_path.name)
                    
                    if tooltip:
                        # Find where to insert - after onPressed or icon
                        added = False
                        for k in range(len(block_lines)):
                            # Look for onPressed: line
                            if 'onPressed:' in block_lines[k] and not added:
                                # Find the comma after onPressed value
                                m = k
                                temp_paren = 0
                                while m < len(block_lines):
                                    for char in block_lines[m]:
                                        if char in '([{':
                                            temp_paren += 1
                                        elif char in ')]}':
                                            temp_paren -= 1
                                        elif char == ',' and temp_paren == 0:
                                            # Found the comma, insert tooltip
                                            indent = len(block_lines[m]) - len(block_lines[m].lstrip())
                                            tooltip_line = ' ' * indent + f"tooltip: '{tooltip}',"
                                            modified_lines.append(tooltip_line)
                                            modifications += 1
                                            added = True
                                            break
                                    if added:
                                        break
                                    m += 1
                                    if m < len(block_lines):
                                        modified_lines.append(block_lines[m])
                                break
                        
                        # Add remaining block lines if we inserted tooltip
                        if added:
                            for k in range(m + 1 if m < len(block_lines) else k + 1, len(block_lines)):
                                modified_lines.append(block_lines[k])
                            i = j
                            continue
        
        i += 1
    
    if modifications > 0:
        file_path.write_text('\n'.join(modified_lines))
    
    return modifications

def get_tooltip(icon: str, filename: str) -> str:
    """Get tooltip based on icon and context"""
    tooltip_map = {
        'Icons.arrow_back': 'Go back',
        'Icons.arrow_back_ios': 'Go back',
        'Icons.arrow_back_ios_new': 'Go back',
'Icons.arrow_back_ios_new_rounded': 'Go back',
        'Icons.close': 'Close',
        'Icons.delete': 'Delete',
        'Icons.delete_outline': 'Delete',
        'Icons.edit': 'Edit',
        'Icons.edit_outlined': 'Edit',
        'Icons.add': 'Add',
        'Icons.add_circle_outline': 'Add',
        'Icons.save': 'Save',
        'Icons.check': 'Confirm',
        'Icons.clear': 'Clear',
        'Icons.search': 'Search',
        'Icons.visibility_outlined': 'Show password',
        'Icons.visibility_off_outlined': 'Hide password',
        'Icons.visibility': 'Show password',
        'Icons.visibility_off': 'Hide password',
        'Icons.more_vert': 'More options',
        'Icons.settings': 'Settings',
        'Icons.settings_outlined': 'Settings',
        'Icons.bookmark': 'Bookmark',
        'Icons.bookmark_border': 'Bookmark',
        'Icons.bookmark_border_outlined': 'Bookmark',
        'Icons.share': 'Share',
        'Icons.copy': 'Copy',
        'Icons.download': 'Download',
        'Icons.refresh': 'Refresh',
        'Icons.play_arrow': 'Play',
        'Icons.pause': 'Pause',
        'Icons.replay_10': 'Rewind 10 seconds',
        'Icons.forward_10': 'Forward 10 seconds',
    }
    
    return tooltip_map.get(icon, '')

def main():
    project = Path('/Users/zakariyayahiaoui/Development/projects/App 2/an_nakhlah_hub_v3')
    
    # Target specific files that still need fixes
    problem_files = [
        'lib/presentation/screens/offline/offline_settings_screen.dart',
        'lib/presentation/screens/achievements/achievements_screen.dart',
        'lib/presentation/screens/auth/register_screen.dart',
        'lib/presentation/screens/auth/login_screen.dart',
        'lib/presentation/screens/admin/**/admin_*.dart',
        'lib/presentation/screens/quiz/lesson_quizzes_screen.dart',
        'lib/presentation/screens/books/pdf_viewer_screen.dart',
        'lib/presentation/screens/search/search_screen.dart',
        'lib/presentation/screens/lessons/**/*_tab.dart',
        'lib/presentation/screens/analytics/analytics_dashboard_screen.dart',
        'lib/presentation/widgets/transcript_search_bar.dart',
        'lib/presentation/widgets/arabic_flashcard.dart',
        'lib/presentation/widgets/lesson_bookmark.dart',
        'lib/presentation/widgets/audio_player_widget.dart',
    ]
    
    # Get all dart files
    all_files = list(project.rglob('lib/**/*.dart'))
    
    total = 0
    for file in all_files:
        if 'IconButton(' in file.read_text():
            count = add_tooltip_smart(file)
            if count > 0:
                print(f"✅ {file.name}: +{count}")
                total += count
    
    print(f"\n✅ Total: {total} tooltips added")

if __name__ == '__main__':
    main()
