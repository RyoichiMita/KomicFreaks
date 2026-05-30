---
name: accessibility-fundamentals
description: Mobile accessibility best practices for Flutter, React Native, and native apps. WCAG compliance, screen readers, Semantics widgets, color contrast, touch targets, and testing strategies.
allowed-tools: Read, Glob, Grep, Bash
---

# Accessibility Fundamentals

> **Philosophy:** Accessibility is NOT optional. It's design quality, legal compliance, and market reach.
> **Core Principle:** Every user deserves equal access. Design for the edges, benefit the center.

---

## 🔧 Runtime Scripts

**Execute these for validation (don't read, just run):**

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/accessibility_audit.py` | Comprehensive a11y audit | `python scripts/accessibility_audit.py <project_path>` |

---

## 🔴 MANDATORY: Read Reference Files Before Working!

**⛔ DO NOT start development until you read the relevant files:**

### Universal (Always Read)

| File | Content | Status |
|------|---------|--------|
| **[wcag-essentials.md](wcag-essentials.md)** | **⚠️ WCAG 2.1 AA compliance, legal requirements** | **⬜ CRITICAL FIRST** |
| **[screen-readers.md](screen-readers.md)** | **VoiceOver, TalkBack, semantic labels** | **⬜ CRITICAL** |
| **[visual-accessibility.md](visual-accessibility.md)** | **Color contrast, text scaling, focus indicators** | **⬜ CRITICAL** |
| **[motor-accessibility.md](motor-accessibility.md)** | **Touch targets, gesture alternatives, timing** | **⬜ CRITICAL** |
| [cognitive-accessibility.md](cognitive-accessibility.md) | Simple language, clear navigation, error prevention | ⬜ Read |
| [testing-strategies.md](testing-strategies.md) | Automated + manual testing, real user validation | ⬜ Read |

> 🧠 **wcag-essentials.md is PRIORITY!** This ensures legal compliance and quality standards.

### Framework-Specific (Read Based on Tech)

| Framework | File | Content | When to Read |
|-----------|------|---------|--------------|
| **Flutter** | [flutter-semantics.md](flutter-semantics.md) | Semantics widget, MergeSemantics, ExcludeSemantics | Building Flutter apps |
| **React Native** | [rn-accessibility.md](rn-accessibility.md) | accessibilityLabel, accessibilityRole, screen readers | Building RN apps |
| **Native iOS** | [ios-accessibility.md](ios-accessibility.md) | UIAccessibility, Dynamic Type, VoiceOver | Building native iOS |
| **Native Android** | [android-accessibility.md](android-accessibility.md) | ContentDescription, TalkBack, Switch Access | Building native Android |

---

## ⚠️ CRITICAL: ACCESSIBILITY IS NOT OPTIONAL

### Legal Requirements

| Region | Law | Penalty |
|--------|-----|---------|
| **USA** | ADA Title III | Lawsuits, damages, compliance costs |
| **EU** | European Accessibility Act (2025) | Fines up to 4% revenue |
| **UK** | Equality Act 2010 | Legal action, reputational damage |
| **Canada** | AODA | Fines up to $100k CAD/day |

> 🔴 **WCAG 2.1 Level AA is the global baseline.** Meeting it is both legal protection and design excellence.

---

## 🚫 ACCESSIBILITY ANTI-PATTERNS (MANDATORY AVOID)

> **These are common mistakes that MUST be prevented!**

### Visual Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Text contrast < 4.5:1** | Illegible for low vision users, fails WCAG | Minimum 4.5:1 (normal), 7:1 (better) |
| **Rely on color ONLY** | Color blind users miss information | Use icon + text + color |
| **Images without alt text** | Screen readers say "image" with no context | Descriptive alt text or mark decorative |
| **Fixed font sizes** | Low vision users can't read | Support Dynamic Type / text scaling |
| **Focus indicators removed** | Keyboard users lost | Visible focus states ALWAYS |

### Motor/Touch Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Touch targets < 44px** | Motor impaired users miss taps | Minimum 44pt (iOS) / 48dp (Android) |
| **Gesture-only actions** | Switch control users excluded | Button alternative ALWAYS |
| **Time-limited actions** | Users with disabilities can't complete | No time limits OR adjustable |
| **Swipe-only navigation** | Single-switch users stuck | Button-based navigation alternative |

### Screen Reader Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Missing labels** | Screen reader says "button, unlabeled" | Every interactive element labeled |
| **Icon-only buttons** | No context for blind users | `accessibilityLabel` OR visible text |
| **Non-semantic structure** | Users can't navigate efficiently | Use headers, landmarks, lists |
| **Images as text** | Text in images not readable | Real text OR comprehensive alt |
| **`isSemanticBoundary` abuse** | Breaks navigation hierarchy | Use sparingly, test with VoiceOver |

### Flutter-Specific Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Ignore Semantics widget** | Flutter defaults often insufficient | Explicit Semantics for complex widgets |
| **ExcludeSemantics on content** | Screen readers skip important info | Only exclude decorative elements |
| **Custom gestures without alternatives** | Switch control users can't access | Provide button-based alternative |
| **Skip `Localizations.localeOf`** | Screen readers use wrong language | Match app locale for TTS |

---

## 📋 WCAG 2.1 AA Quick Checklist

### Perceivable

- [ ] **All images have alt text** (or marked `excludeFromSemantics`)
- [ ] **Text contrast ≥ 4.5:1** (3:1 for large text ≥18pt)
- [ ] **Color is NOT the only indicator** (use icons, text, patterns)
- [ ] **UI components have 3:1 contrast** (borders, focus indicators)
- [ ] **Text can scale to 200% without loss of content**
- [ ] **Content isn't locked to orientation** (unless essential)

### Operable

- [ ] **All functionality available via keyboard/switch**
- [ ] **Touch targets ≥ 44×44pt (iOS) / 48×48dp (Android)**
- [ ] **No content flashes > 3 times per second** (seizure risk)
- [ ] **Focus order is logical** (matches visual order)
- [ ] **Skip links available** (bypass nav blocks)
- [ ] **Timeouts can be disabled/extended** (or none exist)

### Understandable

- [ ] **Language of page/app declared** (`MaterialApp.locale`)
- [ ] **Focus doesn't cause unexpected context change**
- [ ] **Error messages are clear and helpful**
- [ ] **Labels and instructions provided** for inputs
- [ ] **Consistent navigation** across screens

### Robust

- [ ] **Valid semantic structure** (headers, lists, landmarks)
- [ ] **No accessibility API errors** (TalkBack/VoiceOver work correctly)
- [ ] **Dynamic content updates announced** to screen readers
- [ ] **Custom widgets have proper semantics**

---

## 🧠 Flutter Semantics API (Quick Reference)

### Basic Semantics Widget

```dart
// ✅ CORRECT: Explicit label for icon-only button
Semantics(
  label: 'Add to favorites',
  button: true,
  child: IconButton(
    icon: Icon(Icons.favorite_border),
    onPressed: _addToFavorites,
  ),
)

// ✅ CORRECT: Hint explains what will happen
Semantics(
  label: 'Email address',
  hint: 'Enter your email to receive updates',
  child: TextField(),
)

// ✅ CORRECT: Exclude decorative elements
ExcludeSemantics(
  child: Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(...), // Purely decorative
    ),
  ),
)
```

### Complex Widget Merging

```dart
// ❌ WRONG: Screen reader announces each child separately
Row(
  children: [
    Icon(Icons.star),
    Text('4.5'),
    Text('(123 reviews)'),
  ],
)
// Screen reader: "Star icon, 4.5, 123 reviews" (fragmented)

// ✅ CORRECT: Merge into single announcement
Semantics(
  label: '4.5 stars, 123 reviews',
  child: ExcludeSemantics(
    child: Row(
      children: [
        Icon(Icons.star),
        Text('4.5'),
        Text('(123 reviews)'),
      ],
    ),
  ),
)
// Screen reader: "4.5 stars, 123 reviews" (clear)
```

### State Changes

```dart
// ✅ CORRECT: Announces state changes
Semantics(
  label: _isPlaying ? 'Pause audio' : 'Play audio',
  button: true,
  child: IconButton(
    icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
    onPressed: _togglePlayback,
  ),
)

// ✅ CORRECT: Live region for dynamic content
Semantics(
  liveRegion: true, // Announces changes immediately
  child: Text('$_unreadMessages unread messages'),
)
```

---

## 🎨 Color Contrast Guide

### Minimum Ratios (WCAG 2.1 AA)

| Content Type | Minimum Ratio | Better Target |
|--------------|---------------|---------------|
| **Normal text** (<18pt) | 4.5:1 | 7:1 (AAA) |
| **Large text** (≥18pt or ≥14pt bold) | 3:1 | 4.5:1 (AAA) |
| **UI components** (borders, icons) | 3:1 | 4.5:1 |
| **Disabled elements** | No requirement | But still visible |

### Common Mistakes

```dart
// ❌ WRONG: Insufficient contrast (2.1:1)
Text(
  'Error message',
  style: TextStyle(color: Color(0xFFFF6B6B)), // Light red on white
)

// ✅ CORRECT: Sufficient contrast (4.8:1)
Text(
  'Error message',
  style: TextStyle(color: Color(0xFFD32F2F)), // Darker red on white
)

// ❌ WRONG: Color-only indicator
Container(
  decoration: BoxDecoration(
    border: Border.all(color: Colors.red), // Color-blind users miss this
  ),
)

// ✅ CORRECT: Icon + color
Row(
  children: [
    Icon(Icons.error, color: Colors.red, semanticLabel: 'Error'),
    Text('Invalid email format'),
  ],
)
```

### Testing Tools

| Tool | Purpose |
|------|---------|
| **WebAIM Contrast Checker** | Quick ratio calculation |
| **Color Oracle** | Color blindness simulator |
| **Who Can Use** | Real-world readability stats |
| **Flutter DevTools** | Guideline overlay |

---

## 🎯 Touch Target Guidelines

### Minimum Sizes

| Platform | Minimum | Ideal | Spacing |
|----------|---------|-------|---------|
| **iOS** | 44×44pt | 48×48pt | 8pt gap |
| **Android** | 48×48dp | 56×56dp | 8dp gap |
| **Web (mobile)** | 44×44px | 48×48px | 8px gap |

### Implementation

```dart
// ❌ WRONG: Touch target too small (24×24)
IconButton(
  iconSize: 24,
  icon: Icon(Icons.close),
  onPressed: _close,
)

// ✅ CORRECT: Expanded touch area (48×48)
IconButton(
  iconSize: 24,
  padding: EdgeInsets.all(12), // 24 + 12*2 = 48
  constraints: BoxConstraints(minWidth: 48, minHeight: 48),
  icon: Icon(Icons.close),
  onPressed: _close,
)

// ✅ BETTER: Use standard IconButton (defaults to 48×48)
IconButton(
  icon: Icon(Icons.close),
  onPressed: _close,
  tooltip: 'Close', // Bonus: accessibility + long-press hint
)
```

---

## 📱 Screen Reader Testing Protocol

### VoiceOver (iOS)

```
Enable: Settings > Accessibility > VoiceOver
Gestures:
- Swipe right: Next item
- Swipe left: Previous item
- Double tap: Activate
- Two-finger swipe: Scroll
- Rotor: Adjust reading mode (headings, links, etc.)
```

### TalkBack (Android)

```
Enable: Settings > Accessibility > TalkBack
Gestures:
- Swipe right: Next item
- Swipe left: Previous item
- Double tap: Activate
- Swipe down then up: Read from top
```

### Test Checklist

- [ ] **Every screen element reachable** via swipe navigation
- [ ] **Labels are clear and descriptive** (not "button 1", "image 2")
- [ ] **Reading order is logical** (matches visual flow)
- [ ] **State changes announced** (loading, errors, success)
- [ ] **Modals announced properly** (focus trapped, dismissible)
- [ ] **Images described** (alt text conveys meaning)
- [ ] **Forms navigable** (labels associated with inputs)

---

## 📝 CHECKPOINT (MANDATORY Before Accessibility Work)

> **Before writing ANY accessible code, you MUST complete this checkpoint:**

```
🧠 A11Y CHECKPOINT:

Target Platform: [ iOS / Android / Both / Web ]
Framework:       [ Flutter / React Native / Native ]
WCAG Level:      [ A / AA / AAA ]

3 Accessibility Principles I Will Apply:
1. _______________
2. _______________
3. _______________

Anti-Patterns I Will Avoid:
1. _______________
2. _______________
```

**Example:**
```
🧠 A11Y CHECKPOINT:

Target Platform: iOS + Android
Framework:       Flutter
WCAG Level:      AA (legal minimum)

3 Accessibility Principles I Will Apply:
1. All touch targets ≥ 48px with Semantics labels
2. Text contrast ≥ 4.5:1, support Dynamic Type
3. MergeSemantics for complex widgets, test with VoiceOver/TalkBack

Anti-Patterns I Will Avoid:
1. Icon-only buttons without labels → Add Semantics(label:)
2. Color-only error states → Add icon + text
3. Skip screen reader testing → Test EVERY screen with VoiceOver
```

---

## 🔧 Quick Fixes for Common Issues

### Issue: Icon Button Not Announced

```dart
// ❌ Problem
IconButton(icon: Icon(Icons.favorite), onPressed: _like)
// VoiceOver: "Button, unlabeled" ❌

// ✅ Fix #1: Use Semantics
Semantics(
  label: 'Add to favorites',
  button: true,
  child: IconButton(icon: Icon(Icons.favorite), onPressed: _like),
)

// ✅ Fix #2: Use tooltip (bonus: long-press hint for sighted users)
IconButton(
  icon: Icon(Icons.favorite),
  onPressed: _like,
  tooltip: 'Add to favorites',
)
```

### Issue: Form Field Unclear

```dart
// ❌ Problem
TextField(
  decoration: InputDecoration(hintText: 'Enter email'),
)
// VoiceOver: "Text field" (no context)

// ✅ Fix
TextField(
  decoration: InputDecoration(
    labelText: 'Email address', // Persistent label
    hintText: 'e.g., user@example.com',
  ),
)
```

### Issue: Loading State Not Announced

```dart
// ❌ Problem
if (_isLoading) CircularProgressIndicator()
// Screen reader: Silent (user thinks app froze)

// ✅ Fix
if (_isLoading)
  Semantics(
    label: 'Loading lessons',
    liveRegion: true,
    child: CircularProgressIndicator(),
  )
```

---

## 📚 Reference Files

For deeper guidance on specific areas:

| File | When to Use |
|------|-------------|
| [wcag-essentials.md](wcag-essentials.md) | **FIRST! Legal requirements, compliance levels** |
| [screen-readers.md](screen-readers.md) | Understanding VoiceOver/TalkBack, semantic labels |
| [visual-accessibility.md](visual-accessibility.md) | Color contrast, text scaling, focus indicators |
| [motor-accessibility.md](motor-accessibility.md) | Touch targets, gestures, timing |
| [cognitive-accessibility.md](cognitive-accessibility.md) | Simple language, navigation, error prevention |
| [flutter-semantics.md](flutter-semantics.md) | Flutter Semantics API, complex widgets |
| [testing-strategies.md](testing-strategies.md) | Automated + manual testing, real users |

---

> **Remember:** Accessibility is NOT a feature you add at the end. It's a quality standard you build in from day one. Every user deserves equal access to your app's value.
