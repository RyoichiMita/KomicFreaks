#!/usr/bin/env python3
"""
Accessibility Audit Script for Flutter Projects
Checks for common accessibility issues and WCAG compliance.
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple

class AccessibilityAuditor:
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.issues = []
        self.warnings = []
        self.passes = []
        
    def audit(self):
        """Run all accessibility checks."""
        print("🔍 Starting Accessibility Audit...\n")
        
        self.check_semantics_usage()
        self.check_icon_buttons()
        self.check_image_descriptions()
        self.check_contrast_values()
        self.check_touch_targets()
        self.check_reduced_motion()
        
        self.print_report()
        return len(self.issues) == 0
    
    def check_semantics_usage(self):
        """Check if Semantics widgets are used."""
        dart_files = list(self.project_path.rglob("lib/**/*.dart"))
        files_with_semantics = 0
        files_with_widgets = 0
        
        for file in dart_files:
            content = file.read_text()
            if 'Widget build' in content or 'class' in content and 'Widget' in content:
                files_with_widgets += 1
                if 'Semantics(' in content:
                    files_with_semantics += 1
        
        if files_with_widgets > 0:
            ratio = files_with_semantics / files_with_widgets
            if ratio < 0.3:
                self.warnings.append(
                    f"⚠️  Low Semantics usage: {files_with_semantics}/{files_with_widgets} widget files ({ratio*100:.1f}%)"
                )
            else:
                self.passes.append(
                    f"✅ Good Semantics usage: {files_with_semantics}/{files_with_widgets} files ({ratio*100:.1f}%)"
                )
    
    def check_icon_buttons(self):
        """Check if IconButtons have accessibility labels."""
        dart_files = list(self.project_path.rglob("lib/**/*.dart"))
        unlabeled_count = 0
        
        for file in dart_files:
            content = file.read_text()
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                if 'IconButton(' in line:
                    # Check next 10 lines for tooltip or Semantics
                    block = '\n'.join(lines[i:min(i+10, len(lines))])
                    
                    if 'tooltip:' not in block and 'Semantics(' not in block:
                        unlabeled_count += 1
                        self.issues.append(
                            f"❌ Unlabeled IconButton in {file.name}:{i+1}"
                        )
        
        if unlabeled_count == 0:
            self.passes.append("✅ All IconButtons have labels or tooltips")
    
    def check_image_descriptions(self):
        """Check if images have semantic descriptions."""
        dart_files = list(self.project_path.rglob("lib/**/*.dart"))
        unlabeled_images = 0
        
        for file in dart_files:
            content = file.read_text()
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                if 'Image.' in line or 'Image(' in line:
                    # Check if wrapped in ExcludeSemantics or has Semantics
                    block_start = max(0, i-5)
                    block_end = min(i+5, len(lines))
                    block = '\n'.join(lines[block_start:block_end])
                    
                    if 'ExcludeSemantics' not in block and 'Semantics(' not in block and 'semanticLabel:' not in block:
                        unlabeled_images += 1
                        self.warnings.append(
                            f"⚠️  Image without semantic label in {file.name}:{i+1}"
                        )
        
        if unlabeled_images == 0:
            self.passes.append("✅ All images have semantic labels or are excluded")
    
    def check_contrast_values(self):
        """Check for potential low contrast color usage."""
        dart_files = list(self.project_path.rglob("lib/**/*.dart"))
        potential_issues = 0
        
        # Common low-contrast patterns
        low_contrast_patterns = [
            r'0xFF[A-F0-9]{2}[A-F0-9]{2}[A-F0-9]{2}',  # Light colors
            r'Colors\.grey\[200\]',
            r'Colors\.grey\[300\]',
        ]
        
        for file in dart_files:
            content = file.read_text()
            for pattern in low_contrast_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    potential_issues += 1
        
        if potential_issues > 10:
            self.warnings.append(
                f"⚠️  {potential_issues} potential low-contrast color uses found - verify 4.5:1 ratio"
            )
        else:
            self.passes.append("✅ No obvious low-contrast color issues")
    
    def check_touch_targets(self):
        """Check for minimum touch target sizes."""
        dart_files = list(self.project_path.rglob("lib/**/*.dart"))
        small_targets = 0
        
        # Look for hardcoded small sizes
        size_pattern = r'(width|height|size):\s*(\d+)'
        
        for file in dart_files:
            content = file.read_text()
            matches = re.finditer(size_pattern, content)
            
            for match in matches:
                size = int(match.group(2))
                if size < 44 and size > 10:  # Ignore very small decorative elements
                    small_targets += 1
        
        if small_targets > 20:
            self.warnings.append(
                f"⚠️  {small_targets} potentially small touch targets (<44px) - verify interactivity"
            )
        else:
            self.passes.append("✅ No obvious small touch target issues")
    
    def check_reduced_motion(self):
        """Check if reduced motion is handled."""
        dart_files = list(self.project_path.rglob("lib/**/*.dart"))
        animations_found = 0
        reduced_motion_handled = 0
        
        for file in dart_files:
            content = file.read_text()
            
            if 'AnimatedContainer' in content or 'AnimationController' in content:
                animations_found += 1
                
                if 'disableAnimations' in content or 'MediaQuery' in content:
                    reduced_motion_handled += 1
        
        if animations_found > 0:
            ratio = reduced_motion_handled / animations_found
            if ratio < 0.5:
                self.issues.append(
                    f"❌ Reduced motion support: {reduced_motion_handled}/{animations_found} animated widgets check MediaQuery.disableAnimations"
                )
            else:
                self.passes.append(
                    f"✅ Good reduced motion support: {reduced_motion_handled}/{animations_found} widgets"
                )
    
    def print_report(self):
        """Print audit report."""
        print("\n" + "="*60)
        print("📊 ACCESSIBILITY AUDIT REPORT")
        print("="*60 + "\n")
        
        if self.passes:
            print("✅ PASSES:")
            for p in self.passes:
                print(f"   {p}")
            print()
        
        if self.warnings:
            print("⚠️  WARNINGS:")
            for w in self.warnings:
                print(f"   {w}")
            print()
        
        if self.issues:
            print("❌ ISSUES (MUST FIX):")
            for i in self.issues:
                print(f"   {i}")
            print()
        
        print("="*60)
        total = len(self.passes) + len(self.warnings) + len(self.issues)
        print(f"Summary: {len(self.passes)} passes, {len(self.warnings)} warnings, {len(self.issues)} issues")
        print("="*60 + "\n")
        
        if self.issues:
            print("❌ Audit FAILED - Fix issues above")
            return False
        elif self.warnings:
            print("⚠️  Audit PASSED with warnings - Review warnings")
            return True
        else:
            print("✅ Audit PASSED - Excellent accessibility!")
            return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python accessibility_audit.py <project_path>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"Error: Path '{project_path}' does not exist")
        sys.exit(1)
    
    auditor = AccessibilityAuditor(project_path)
    success = auditor.audit()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
