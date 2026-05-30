---
name: animation-design
description: Motion design principles and micro-interactions for mobile apps. Covers Flutter animations (Implicit, Explicit, Hero), Rive integration, timing functions, and performance-conscious animation patterns.
allowed-tools: Read, Glob, Grep, Bash
---

# Animation & Motion Design

> **Philosophy:** Motion reveals relationships. Animation guides attention. Micro-interactions create delight.
> **Core Principle:** Every animation must have a PURPOSE. Gratuitous motion is distraction.

---

## 🔴 MANDATORY: Read Reference Files Before Working!

**⛔ DO NOT animate until you read the relevant files:**

### Universal (Always Read)

| File | Content | Status |
|------|---------|--------|
| **[motion-principles.md](motion-principles.md)** | **⚠️ Purpose, easing, duration, choreography** | **⬜ CRITICAL FIRST** |
| **[micro-interactions.md](micro-interactions.md)** | **Button states, loading, success/error feedback** | **⬜ CRITICAL** |
| **[flutter-animation-api.md](flutter-animation-api.md)** | **AnimatedContainer, AnimationController, Tween** | **⬜ CRITICAL** |
| [timing-curves.md](timing-curves.md) | Easing functions, natural motion, spring physics | ⬜ Read |
| [hero-transitions.md](hero-transitions.md) | Shared element transitions, route animations | ⬜ Read |
| [rive-integration.md](rive-integration.md) | Complex animations, state machines, interactivity | ⬜ Read |

> 🧠 **motion-principles.md is PRIORITY!** This prevents meaningless animation.

---

## ⚠️ CRITICAL: ANIMATION GOLDEN RULES

### The Three Laws of Motion Design

1. **Every animation has a PURPOSE** (guide attention, show causality, provide feedback)
2. **Respect the 60fps budget** (16.67ms/frame maximum)
3. **User control over motion** (reduced motion support ALWAYS)

### Duration Standards

| Animation Type | Duration | Reasoning |
|----------------|----------|-----------|
| **Micro-interaction** | 100-200ms | Instant feedback (button press, toggle) |
| **Property change** | 200-300ms | Comfortable transition (color, size) |
| **Navigation** | 300-400ms | Screen transitions, modals |
| **Complex choreography** | 400-600ms | Multi-element sequences |
| **Ambient/decorative** | 2-5s | Background motion (slow, subtle) |

> 🔴 **Never exceed 600ms** for user-initiated actions. Users perceive >600ms as "slow."

---

## 🚫 ANIMATION ANTI-PATTERNS (MANDATORY AVOID)

### Motion Design Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Animate without purpose** | Distracting, unprofessional | Ask "Why this motion?" |
| **Linear easing** | Robotic, unnatural | Ease-out for enter, ease-in for exit |
| **Skip reduced motion** | Vestibular disorders, motion sickness | MediaQuery.disableAnimations check |
| **Animate layout properties** | Forces expensive layout pass | Transform/opacity ONLY |
| **Block user during animation** | Frustrating, feels slow | Allow interruption |

### Flutter Animation Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Skip dispose() on controller** | Memory leak | ALWAYS dispose AnimationController |
| **Create controller in build()** | New controller every rebuild | initState() ONLY |
| **Animate child in setState** | Entire tree rebuilds | AnimatedBuilder |
| **Skip vsync: this** | Animation runs when screen off | Use TickerProviderStateMixin |

### Performance Sins

| ❌ NEVER DO | Why It's Wrong | ✅ ALWAYS DO |
|-------------|----------------|--------------|
| **Animate width/height** | CPU layout every frame | Transform.scale instead |
| **Animate top/left/margin** | CPU layout every frame | Transform.translate instead |
| **Heavy builder in AnimatedBuilder** | Rebuilds 60 times/sec | Minimal builder, const child |
| **Skip RepaintBoundary** | Repaints cascade | Isolate animated widgets |

---

## 🎨 Flutter Animation Types

### 1. Implicit Animations (Easiest)

```dart
// ✅ BEST for simple property changes
AnimatedContainer(
  duration: Duration(milliseconds: 300),
  curve: Curves.easeOut,
  color: _isActive ? Colors.blue : Colors.grey,
  width: _isActive ? 200 : 100,
  child: Text('Toggle me'),
)

// Other implicit animations:
AnimatedOpacity(opacity: _isVisible ? 1.0 : 0.0, ...)
AnimatedPadding(padding: _expanded ? EdgeInsets.all(20) : EdgeInsets.zero, ...)
AnimatedPositioned(top: _isUp ? 0 : 100, ...)
```

**When to use:** Simple property transitions, no complex choreography needed.

### 2. Explicit Animations (Full Control)

```dart
class MyAnimatedWidget extends StatefulWidget {
  @override
  _MyAnimatedWidgetState createState() => _MyAnimatedWidgetState();
}

class _MyAnimatedWidgetState extends State<MyAnimatedWidget>
    with SingleTickerProviderStateMixin { // ← vsync provider
  
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 300),
      vsync: this, // ← Stops when screen off
    );
    
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose(); // ← CRITICAL!
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child, // ← Doesn't rebuild
        );
      },
      child: const ExpensiveWidget(), // ← Const, reused
    );
  }
}
```

**When to use:** Complex timing, chained animations, fine-grained control.

### 3. Hero Transitions (Shared Elements)

```dart
// Screen A
Hero(
  tag: 'lesson-${lesson.id}', // ← Unique tag
  child: Image.network(lesson.thumbnail),
)

// Screen B (same tag)
Hero(
  tag: 'lesson-${lesson.id}', // ← Flutter morphs between
  child: Image.network(lesson.thumbnail),
)
```

**When to use:** Navigation between screens with shared visual elements.

---

## 🎯 Micro-Interaction Patterns

### Button Press Feedback

```dart
// ✅ CORRECT: Scale down on tap (haptic feel)
class TapScaleButton extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;

  const TapScaleButton({
    Key? key,
    required this.child,
    required this.onTap,
  }) : super(key: key);

  @override
  _TapScaleButtonState createState() => _TapScaleButtonState();
}

class _TapScaleButtonState extends State<TapScaleButton>
    with SingleTickerProviderStateMixin {
  
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 100),
      vsync: this,
    );
    _scale = Tween<double>(begin: 1.0, end: 0.95).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(_) => _controller.forward();
  void _handleTapUp(_) {
    _controller.reverse();
    widget.onTap();
  }
  void _handleTapCancel() => _controller.reverse();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedBuilder(
        animation: _scale,
        builder: (context, child) {
          return Transform.scale(
            scale: _scale.value,
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}

// Usage
TapScaleButton(
  onTap: _handleSubmit,
  child: Container(
    padding: EdgeInsets.all(16),
    color: Colors.blue,
    child: Text('Press me'),
  ),
)
```

### Loading States

```dart
// ✅ CORRECT: Smooth loading → success transition
class LoadingButton extends StatefulWidget {
  final Future<void> Function() onPressed;
  final String label;

  const LoadingButton({
    Key? key,
    required this.onPressed,
    required this.label,
  }) : super(key: key);

  @override
  _LoadingButtonState createState() => _LoadingButtonState();
}

class _LoadingButtonState extends State<LoadingButton> {
  bool _isLoading = false;
  bool _isSuccess = false;

  Future<void> _handlePress() async {
    setState(() => _isLoading = true);
    try {
      await widget.onPressed();
      setState(() {
        _isLoading = false;
        _isSuccess = true;
      });
      // Reset after showing success
      Future.delayed(Duration(seconds: 2), () {
        if (mounted) setState(() => _isSuccess = false);
      });
    } catch (e) {
      setState(() => _isLoading = false);
      // Show error state (not shown for brevity)
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: Duration(milliseconds: 300),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        color: _isSuccess ? Colors.green : Colors.blue,
        borderRadius: BorderRadius.circular(_isLoading ? 25 : 8),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isLoading ? null : _handlePress,
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 16, horizontal: 32),
            child: AnimatedSwitcher(
              duration: Duration(milliseconds: 300),
              child: _isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : _isSuccess
                  ? Icon(Icons.check, color: Colors.white)
                  : Text(widget.label, style: TextStyle(color: Colors.white)),
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## ⏱️ Timing & Easing

### Common Curves

| Curve | Use Case | Feel |
|-------|----------|------|
| **Curves.easeOut** | Entering screen/element | Fast start, gentle land |
| **Curves.easeIn** | Exiting screen/element | Gentle start, fast exit |
| **Curves.easeInOut** | Looping, reversing | Smooth both ends |
| **Curves.elasticOut** | Playful feedback | Bouncy, fun |
| **Curves.fastOutSlowIn** | Material Design standard | Natural, recommended |

### Custom Cubic Bezier

```dart
// Apple's spring curve (iOS-like feel)
const Curve customSpring = Cubic(0.25, 0.1, 0.25, 1.0);

AnimatedContainer(
  curve: customSpring,
  duration: Duration(milliseconds: 350),
  ...
)
```

---

## ♿ Reduced Motion Support

### Mandatory Accessibility

```dart
// ✅ CORRECT: Check reduced motion preference
class RespectfulAnimation extends StatelessWidget {
  const RespectfulAnimation({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final disableAnimations = MediaQuery.of(context).disableAnimations;

    return AnimatedContainer(
      duration: disableAnimations 
        ? Duration.zero // ← NO animation
        : Duration(milliseconds: 300),
      curve: Curves.easeOut,
      color: _isActive ? Colors.blue : Colors.grey,
      child: Text('Content'),
    );
  }
}
```

### System Integration

```dart
// Helper function for consistent motion handling
Duration getAnimationDuration(BuildContext context, Duration standard) {
  return MediaQuery.of(context).disableAnimations 
    ? Duration.zero 
    : standard;
}

// Usage
AnimatedOpacity(
  duration: getAnimationDuration(context, Duration(milliseconds: 300)),
  opacity: _isVisible ? 1.0 : 0.0,
)
```

---

## 🎬 Animation Choreography

### Staggered Animations

```dart
// ✅ CORRECT: Items appear in sequence
class StaggeredList extends StatefulWidget {
  final List<String> items;

  const StaggeredList({Key? key, required this.items}) : super(key: key);

  @override
  _StaggeredListState createState() => _StaggeredListState();
}

class _StaggeredListState extends State<StaggeredList>
    with SingleTickerProviderStateMixin {
  
  late AnimationController _controller;
  final List<Animation<double>> _itemAnimations = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 600),
      vsync: this,
    );

    for (int i = 0; i < widget.items.length; i++) {
      final start = i * 0.1; // Stagger by 100ms each
      final end = start + 0.3; // Each animation lasts 300ms
      
      _itemAnimations.add(
        Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(
            parent: _controller,
            curve: Interval(start, end, curve: Curves.easeOut),
          ),
        ),
      );
    }

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: widget.items.length,
      itemBuilder: (context, index) {
        return AnimatedBuilder(
          animation: _itemAnimations[index],
          builder: (context, child) {
            return Opacity(
              opacity: _itemAnimations[index].value,
              child: Transform.translate(
                offset: Offset(0, 20 * (1 - _itemAnimations[index].value)),
                child: child,
              ),
            );
          },
          child: ListTile(title: Text(widget.items[index])),
        );
      },
    );
  }
}
```

---

## 📝 CHECKPOINT (MANDATORY Before Animation Work)

```
🧠 ANIMATION CHECKPOINT:

Animation Purpose: [ Feedback / Transition / Delight / Guide ]
Duration:          [ ____ ms (follow standards) ]
Reduced Motion:    [ Handled / Not needed ]

3 Motion Principles I Will Apply:
1. _______________
2. _______________
3. _______________

Anti-Patterns I Will Avoid:
1. _______________
2. _______________
```

**Example:**
```
🧠 ANIMATION CHECKPOINT:

Animation Purpose: Feedback (button press confirmation)
Duration:          150ms (micro-interaction standard)
Reduced Motion:    Handled (check disableAnimations)

3 Motion Principles I Will Apply:
1. Scale down to 0.95 on tap (haptic feel)
2. Ease-out curve (natural landing)
3. AnimatedBuilder to avoid full rebuilds

Anti-Patterns I Will Avoid:
1. Linear motion → Curves.easeOut
2. >300ms for button → Keep under 200ms
3. Block user during animation → Allow interruption
```

---

## 🔧 Quick Animation Recipes

### Fade In on Mount

```dart
class FadeInWidget extends StatefulWidget {
  final Widget child;
  const FadeInWidget({Key? key, required this.child}) : super(key: key);

  @override
  _FadeInWidgetState createState() => _FadeInWidgetState();
}

class _FadeInWidgetState extends State<FadeInWidget> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 50), () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: _visible ? 1.0 : 0.0,
      duration: Duration(milliseconds: 300),
      curve: Curves.easeOut,
      child: widget.child,
    );
  }
}
```

### Slide In from Bottom

```dart
class SlideInWidget extends StatefulWidget {
  final Widget child;
  const SlideInWidget({Key? key, required this.child}) : super(key: key);

  @override
  _SlideInWidgetState createState() => _SlideInWidgetState();
}

class _SlideInWidgetState extends State<SlideInWidget>
    with SingleTickerProviderStateMixin {
  
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 400),
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: Offset(0, 0.2), // Start 20% below
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _controller,
        child: widget.child,
      ),
    );
  }
}
```

---

## 📚 Reference Files

| File | When to Use |
|------|-------------|
| [motion-principles.md](motion-principles.md) | **FIRST! Purpose, duration, easing** |
| [micro-interactions.md](micro-interactions.md) | Button states, loading, success/error |
| [flutter-animation-api.md](flutter-animation-api.md) | Implicit vs Explicit, AnimationController |
| [timing-curves.md](timing-curves.md) | Easing functions, spring physics |
| [hero-transitions.md](hero-transitions.md) | Shared element navigation |
| [rive-integration.md](rive-integration.md) | Complex animations, state machines |

---

> **Remember:** Animation is like salt in cooking. Too little = bland. Too much = overwhelming. The right amount = delicious. Every motion should guide attention or provide feedback. Decorative motion is distraction.
