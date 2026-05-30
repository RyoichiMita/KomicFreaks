---
name: platform-native-patterns
description: Platform-native design patterns for iOS and Android. Human Interface Guidelines (HIG) vs Material Design, platform-adaptive widgets, navigation conventions, and native integration best practices for authentic platform experiences.
allowed-tools: Read, Glob, Grep, Bash
---

# Platform-Native Patterns

> **Philosophy:** iOS should feel iOS. Android should feel Android. Cross-platform ≠ identical twins.
> **Core Principle:** Respect platform conventions. Users have muscle memory. Don't break it.

---

## 🔴 MANDATORY: Read Reference Files Before Working!

**⛔ DO NOT build cross-platform UI until you read:**

### Universal (Always Read)

| File | Content | Status |
|------|---------|--------|
| **[platform-philosophy.md](platform-philosophy.md)** | **⚠️ When to adapt vs unify, brand vs convention** | **⬜ CRITICAL FIRST** |
| **[ios-patterns.md](ios-patterns.md)** | **HIG, iOS navigation, SF Symbols, gestures** | **⬜ CRITICAL** |
| **[android-patterns.md](android-patterns.md)** | **Material Design 3, Android navigation, FAB** | **⬜ CRITICAL** |
| **[adaptive-widgets.md](adaptive-widgets.md)** | **Platform.isIOS checks, adaptive builders** | **⬜ CRITICAL** |
| [navigation-patterns.md](navigation-patterns.md) | Tab bar, drawer, back button handling | ⬜ Read |
| [typography-platforms.md](typography-platforms.md) | SF Pro vs Roboto, Dynamic Type | ⬜ Read |

> 🧠 **platform-philosophy.md is PRIORITY!** This teaches when to adapt and when to unify.

---

## ⚠️ CRITICAL: PLATFORM DIVERGENCE STRATEGY

### When to Unify vs When to Adapt

```
UNIFY (Same on both platforms)
├── Business logic (ALWAYS)
├── Data layer (ALWAYS)
├── Core features (ALWAYS)
├── Brand colors (usually)
└── Custom illustrations (usually)

ADAPT (Platform-specific)
├── Navigation patterns (ALWAYS)
├── Gestures (ALWAYS)
├── System icons (SF Symbols vs Material Symbols)
├── Date/time pickers (native)
├── Alerts/dialogs (platform conventions)
├── Bottom sheets vs action sheets
└── Back button handling
```

### The Golden Rule

> **Users don't care about your code.** They care whether the app feels "right" on their device.

| Platform | User Expectation | Breaking This = |
|----------|------------------|-----------------|
| **iOS** | Edge swipe to go back | Frustrating |
| **Android** | System back button works | Broken navigation |
| **iOS** | SF Symbols in tab bar | Looks foreign |
| **Android** | Material icons | Looks iOS-like (bad) |

---

## 🚫 PLATFORM ANTI-PATTERNS (MANDATORY AVOID)

### Design Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **iOS style on Android** | Users confused, feels wrong | Material Design on Android |
| **Android style on iOS** | Breaks muscle memory | Human Interface Guidelines on iOS |
| **Block system back button** | Breaks Android convention | Handle back properly |
| **Ignore edge swipe** | Breaks iOS convention | CupertinoPageRoute |
| **Identical UI across platforms** | Looks foreign on both | Platform-adaptive widgets |

### Navigation Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Tab bar on top (iOS)** | iOS tabs are ALWAYS bottom | Bottom nav on iOS |
| **Bottom nav on top (Android)** | Breaks Material spec | Top tabs or bottom nav on Android |
| **No back button handling (Android)** | Traps user in screen | WillPopScope / PopScope |
| **Break edge swipe (iOS)** | Users expect this gesture | Preserve gesture navigation |

### Icon Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Material icons on iOS** | Looks like Android app | SF Symbols or platform-adaptive |
| **SF Symbols on Android** | Unavailable, licensing issues | Material Symbols |
| **Same icons everywhere** | Ignores platform design language | Cupertino icons (iOS), Material (Android) |

---

## 🎨 Platform-Adaptive Widget Patterns

### Platform Detection

```dart
import 'dart:io' show Platform;

// ✅ CORRECT: Check platform at runtime
bool get isIOS => Platform.isIOS;
bool get isAndroid => Platform.isAndroid;

// In widgets
if (isIOS) {
  // iOS-specific code
} else {
  // Android-specific code
}
```

### Adaptive Navigation

```dart
// ✅ CORRECT: Platform-specific navigation
class AdaptiveScaffold extends StatelessWidget {
  final Widget body;
  final String title;

  const AdaptiveScaffold({
    Key? key,
    required this.body,
    required this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (Platform.isIOS) {
      return CupertinoPageScaffold(
        navigationBar: CupertinoNavigationBar(
          middle: Text(title),
        ),
        child: body,
      );
    } else {
      return Scaffold(
        appBar: AppBar(
          title: Text(title),
        ),
        body: body,
      );
    }
  }
}
```

### Adaptive Buttons

```dart
// ✅ CORRECT: Platform-appropriate button styles
class AdaptiveButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const AdaptiveButton({
    Key? key,
    required this.label,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (Platform.isIOS) {
      return CupertinoButton.filled(
        onPressed: onPressed,
        child: Text(label),
      );
    } else {
      return ElevatedButton(
        onPressed: onPressed,
        child: Text(label),
      );
    }
  }
}
```

### Adaptive Dialogs

```dart
// ✅ CORRECT: Platform-specific alerts
Future<void> showAdaptiveDialog({
  required BuildContext context,
  required String title,
  required String content,
  required String confirmText,
  VoidCallback? onConfirm,
}) async {
  if (Platform.isIOS) {
    return showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          CupertinoDialogAction(
            child: Text('Cancel'),
            onPressed: () => Navigator.pop(context),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () {
              Navigator.pop(context);
              onConfirm?.call();
            },
            child: Text(confirmText),
          ),
        ],
      ),
    );
  } else {
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            child: Text('CANCEL'),
            onPressed: () => Navigator.pop(context),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onConfirm?.call();
            },
            child: Text(confirmText.toUpperCase()),
          ),
        ],
      ),
    );
  }
}
```

---

## 📱 iOS Patterns (Human Interface Guidelines)

### Navigation

```dart
// ✅ iOS: CupertinoPageRoute for edge swipe
Navigator.push(
  context,
  CupertinoPageRoute(builder: (context) => DetailScreen()),
);

// Tab bar ALWAYS at bottom
CupertinoTabScaffold(
  tabBar: CupertinoTabBar(
    items: [
      BottomNavigationBarItem(icon: Icon(CupertinoIcons.home)),
      BottomNavigationBarItem(icon: Icon(CupertinoIcons.search)),
    ],
  ),
  tabBuilder: (context, index) => _buildTab(index),
)
```

### iOS Typography

```dart
// ✅ iOS: SF Pro (system default)
Text(
  'Title',
  style: CupertinoTheme.of(context).textTheme.navTitleTextStyle,
)

// Support Dynamic Type (accessibility)
Text(
  'Body text',
  style: TextStyle(fontSize: 17), // Scales with user preference
)
```

### iOS Icons

```dart
// ✅ iOS: Use SF Symbols via cupertino_icons
Icon(CupertinoIcons.heart)
Icon(CupertinoIcons.person)
Icon(CupertinoIcons.gear)
```

---

## 🤖 Android Patterns (Material Design 3)

### Navigation

```dart
// ✅ Android: MaterialPageRoute
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => DetailScreen()),
);

// Bottom navigation OR top tabs
Scaffold(
  bottomNavigationBar: NavigationBar(
    destinations: [
      NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
      NavigationDestination(icon: Icon(Icons.search), label: 'Search'),
    ],
  ),
)

// Handle system back button
PopScope(
  onPopInvoked: (didPop) {
    if (didPop) {
      // Clean up, save state, etc.
    }
  },
  child: Scaffold(...),
)
```

### Material Typography

```dart
// ✅ Android: Roboto (default) or custom
Text(
  'Headline',
  style: Theme.of(context).textTheme.headlineMedium,
)
```

### Material Icons

```dart
// ✅ Android: Material Symbols
Icon(Icons.favorite)
Icon(Icons.person)
Icon(Icons.settings)
```

### Floating Action Button

```dart
// ✅ Android: FAB for primary action
Scaffold(
  floatingActionButton: FloatingActionButton(
    onPressed: _addItem,
    child: Icon(Icons.add),
  ),
)

// iOS alternative: + button in nav bar
CupertinoNavigationBar(
  trailing: CupertinoButton(
    padding: EdgeInsets.zero,
    child: Icon(CupertinoIcons.plus),
    onPressed: _addItem,
  ),
)
```

---

## 🔄 Unified Navigation with Adaptation

### Adaptive Tab Navigation

```dart
// ✅ BEST: Unified logic, platform-specific UI
class AdaptiveTabScaffold extends StatefulWidget {
  final List<AdaptiveTabItem> tabs;

  const AdaptiveTabScaffold({Key? key, required this.tabs}) : super(key: key);

  @override
  _AdaptiveTabScaffoldState createState() => _AdaptiveTabScaffoldState();
}

class _AdaptiveTabScaffoldState extends State<AdaptiveTabScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (Platform.isIOS) {
      return CupertinoTabScaffold(
        tabBar: CupertinoTabBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: widget.tabs
              .map((tab) => BottomNavigationBarItem(
                    icon: Icon(tab.iosIcon),
                    label: tab.label,
                  ))
              .toList(),
        ),
        tabBuilder: (context, index) => widget.tabs[index].builder(context),
      );
    } else {
      return Scaffold(
        body: widget.tabs[_currentIndex].builder(context),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) => setState(() => _currentIndex = index),
          destinations: widget.tabs
              .map((tab) => NavigationDestination(
                    icon: Icon(tab.androidIcon),
                    label: tab.label,
                  ))
              .toList(),
        ),
      );
    }
  }
}

class AdaptiveTabItem {
  final String label;
  final IconData iosIcon;
  final IconData androidIcon;
  final WidgetBuilder builder;

  AdaptiveTabItem({
    required this.label,
    required this.iosIcon,
    required this.androidIcon,
    required this.builder,
  });
}

// Usage
AdaptiveTabScaffold(
  tabs: [
    AdaptiveTabItem(
      label: 'Home',
      iosIcon: CupertinoIcons.home,
      androidIcon: Icons.home,
      builder: (context) => HomeScreen(),
    ),
    AdaptiveTabItem(
      label: 'Search',
      iosIcon: CupertinoIcons.search,
      androidIcon: Icons.search,
      builder: (context) => SearchScreen(),
    ),
  ],
)
```

---

## 📝 CHECKPOINT (MANDATORY Before Platform UI Work)

```
🧠 PLATFORM CHECKPOINT:

Target Platforms: [ iOS / Android / Both ]
Navigation Style: [ Tabs / Drawer / Stack ]
Adaptation Level: [ Full native / Hybrid / Unified ]

3 Platform Principles I Will Apply:
1. _______________
2. _______________
3. _______________

Anti-Patterns I Will Avoid:
1. _______________
2. _______________
```

**Example:**
```
🧠 PLATFORM CHECKPOINT:

Target Platforms: iOS + Android (both)
Navigation Style: Bottom tabs (adaptive)
Adaptation Level: Hybrid (adapt navigation, unify content)

3 Platform Principles I Will Apply:
1. CupertinoPageRoute (iOS) + MaterialPageRoute (Android)
2. Platform-adaptive icons (SF Symbols vs Material)
3. Bottom tabs on iOS, NavigationBar on Android

Anti-Patterns I Will Avoid:
1. Same icons everywhere → Platform-adaptive icons
2. Block back button → Handle PopScope on Android
3. Identical UI → Respect platform conventions
```

---

## 🔧 Quick Platform Adaptation Patterns

### 1. Adaptive Page Route

```dart
PageRoute adaptiveRoute(Widget page) {
  if (Platform.isIOS) {
    return CupertinoPageRoute(builder: (_) => page);
  } else {
    return MaterialPageRoute(builder: (_) => page);
  }
}
```

### 2. Adaptive Loading Indicator

```dart
Widget adaptiveLoading() {
  if (Platform.isIOS) {
    return CupertinoActivityIndicator();
  } else {
    return CircularProgressIndicator();
  }
}
```

### 3. Adaptive Switch

```dart
Widget adaptiveSwitch({
  required bool value,
  required ValueChanged<bool> onChanged,
}) {
  if (Platform.isIOS) {
    return CupertinoSwitch(value: value, onChanged: onChanged);
  } else {
    return Switch(value: value, onChanged: onChanged);
  }
}
```

---

## 📚 Reference Files

| File | When to Use |
|------|-------------|
| [platform-philosophy.md](platform-philosophy.md) | **FIRST! When to adapt vs unify** |
| [ios-patterns.md](ios-patterns.md) | iOS-specific UI, HIG compliance |
| [android-patterns.md](android-patterns.md) | Material Design 3, Android conventions |
| [adaptive-widgets.md](adaptive-widgets.md) | Platform detection, adaptive builders |
| [navigation-patterns.md](navigation-patterns.md) | Tab bar, drawer, back handling |
| [typography-platforms.md](typography-platforms.md) | SF Pro vs Roboto, Dynamic Type |

---

> **Remember:** Cross-platform doesn't mean identical. iOS users expect iOS patterns. Android users expect Material Design. Respect their muscle memory, and your app will feel "right" on both platforms.
