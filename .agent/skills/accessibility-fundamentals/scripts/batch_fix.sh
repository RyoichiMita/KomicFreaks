#!/bin/bash
# Batch fix IconButton tooltips using sed
# This adds tooltips to common IconButton patterns

cd "/Users/zakariyayahiaoui/Development/projects/App 2/an_nakhlah_hub_v3"

# Function to add tooltip before the closing parenthesis of IconButton
fix_back_buttons() {
    find lib/presentation -name "*.dart" -type f -exec sed -i '' '/IconButton(/,/),/{
        /icon:.*Icons\.arrow_back/,/),/{
            /onPressed:/a\
              tooltip: '\''Go back'\'',
        }
    }' {} \;
}

# For now, let me do this programmatically in Python for better control
echo "Use Python script instead for precise control"
