# Quick Accessibility Fixes Guide

## What We've Fixed So Far ✅

Fixed **12 IconButtons** across 5 critical files:

1. ✅ `islamic_app_bar.dart` - Back button
2. ✅ `settings_screen.dart` - Back button
3. ✅ `audio_player_widget.dart` - Play/Pause, Rewind, Forward (3 buttons)
4. ✅ `profile_screen.dart` - Back button, Settings button  
5. ✅ `login_screen.dart` - Password visibility toggle
6. ✅ `register_screen.dart` - Back button,2 password visibility toggles


## Remaining Work 🔧

**45 IconButtons** still need tooltips in:

### Admin Screens (29 buttons)
- admin_dashboard_screen.dart
- admin_lessons_screen.dart
- admin_lesson_form_screen.dart
- admin_books_screen.dart
- admin_book_form_screen.dart
- admin_quiz_*.dart screens
- admin_transcript_editor_screen.dart
- admin_question_form_screen.dart
- admin_user_list_screen.dart

### Lesson Widgets (10 buttons)
- lesson_quizzes_screen.dart
- quiz_taking_screen.dart
- ai_quiz_tab.dart
- notes_tab.dart
- ask_ustadh_tab.dart
- definitions_tab.dart
- transcript_search_bar.dart (3 buttons)

### Other Screens (6 buttons)
- books_screen.dart (2 buttons)
- pdf_viewer_screen.dart (2 buttons)
- search_screen.dart (2 buttons)
- analytics_dashboard_screen.dart
- offline_settings_screen.dart
- achievements_screen.dart
- prayer_times_screen.dart

## How to Fix the Remaining IconButtons

### Pattern to Follow

```dart
// ❌ BEFORE
IconButton(
  icon: Icon(Icons.edit),
  onPressed: _handleEdit,
)

// ✅ AFTER  
IconButton(
  icon: Icon(Icons.edit),
  onPressed: _handleEdit,
  tooltip: 'Edit',  // ← Add this!
)
```

### Common Tooltips by Icon

| Icon | Tooltip |
|------|---------|
| `Icons.edit` | 'Edit' |
| `Icons.delete` | 'Delete' |
| `Icons.add` | 'Add' |
| `Icons.close` | 'Close' |
| `Icons.search` | 'Search' |
| `Icons.clear` | 'Clear' |
| `Icons.save` | 'Save' |
| `Icons.more_vert` | 'More options' |
| `Icons.arrow_back*` | 'Go back' |
| `Icons.visibility*` | 'Show/Hide password' |

### Quick Fix Command

You can ask me to fix specific files:
```
"Fix IconButtons in admin_dashboard_screen.dart"
```

Or fix by category:
```
"Fix all admin screen IconButtons"
"Fix all lesson widget IconButtons"
```

## Other Accessibility Items

Beyond IconButtons, also address:

1. ⚠️ **Semantics Usage (0%)** - Add Semantics to complex widgets
2. ⚠️ **Image Labels** - 5 images need semantic labels
3. ⚠️ **Reduced Motion** - Only 1/9 animations check `MediaQuery.disableAnimations`
4. ⚠️ **Contrast** - 93 potential low-contrast colors to verify
5. ⚠️ **Touch Targets** - 344 potentially small targets to verify

## Next Steps

1. ✅ Run audit: `python3 .agent/skills/accessibility-fundamentals/scripts/accessibility_audit.py .`
2. ✅ Fix remaining IconButtons (follow pattern above)
3. ✅ Add Semantics to complex widgets
4. ✅ Add image semantic labels
5. ✅ Support reduced motion in animations
6. ✅ Run audit again to verify

**Goal**: Get from 59 issues → 0 issues! 🎯
