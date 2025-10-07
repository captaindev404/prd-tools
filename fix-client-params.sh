#!/bin/bash
# Script to fix client component params for Next.js 15.5

# List of client component files that need fixing
CLIENT_PAGES=(
  "src/app/(authenticated)/features/[id]/page.tsx"
  "src/app/(authenticated)/feedback/[id]/edit/page.tsx"
  "src/app/(authenticated)/feedback/[id]/page.tsx"
  "src/app/(authenticated)/research/panels/[id]/page.tsx"
  "src/app/(authenticated)/research/questionnaires/[id]/respond/page.tsx"
  "src/app/questionnaires/[id]/respond/page.tsx"
)

echo "Fixing client component params for Next.js 15.5..."

for file in "${CLIENT_PAGES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Add 'use' to import from 'react' if not already present
    if grep -q "import { useState, useEffect } from 'react'" "$file"; then
      sed -i '' "s/import { useState, useEffect } from 'react'/import { useState, useEffect, use } from 'react'/" "$file"
    elif grep -q "import React, { useState, useEffect } from 'react'" "$file"; then
      sed -i '' "s/import React, { useState, useEffect } from 'react'/import React, { useState, useEffect, use } from 'react'/" "$file"
    fi

    echo "  ✓ Added 'use' hook import"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Done! Please manually add: const { id } = use(params); at the start of each component function."
echo "And update params type to: { params: Promise<{ id: string }> }"
