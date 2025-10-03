#!/bin/bash

# Script to update all API routes with improved error handling
# This adds import for error handling utilities

ROUTES=(
  "src/app/api/feedback/[id]/merge/route.ts"
  "src/app/api/feedback/[id]/link-feature/route.ts"
  "src/app/api/feedback/[id]/duplicates/route.ts"
  "src/app/api/feedback/check-duplicates/route.ts"
  "src/app/api/features/[id]/route.ts"
  "src/app/api/moderation/[id]/approve/route.ts"
  "src/app/api/moderation/[id]/reject/route.ts"
  "src/app/api/user/consent/route.ts"
  "src/app/api/user/data-export/route.ts"
  "src/app/api/user/delete-account/route.ts"
  "src/app/api/roadmap/[id]/publish/route.ts"
  "src/app/api/panels/[id]/members/[userId]/route.ts"
  "src/app/api/panels/[id]/members/route.ts"
  "src/app/api/questionnaires/[id]/publish/route.ts"
  "src/app/api/questionnaires/[id]/responses/route.ts"
  "src/app/api/questionnaires/[id]/analytics/route.ts"
  "src/app/api/sessions/[id]/join/route.ts"
  "src/app/api/sessions/[id]/complete/route.ts"
  "src/app/api/sessions/[id]/participants/route.ts"
  "src/app/api/admin/users/[userId]/route.ts"
  "src/app/api/admin/users/[userId]/activity/route.ts"
  "src/app/api/notifications/[id]/route.ts"
  "src/app/api/notifications/mark-all-read/route.ts"
  "src/app/api/user/panels/[panelId]/accept/route.ts"
  "src/app/api/user/panels/[panelId]/decline/route.ts"
)

echo "Files to check for error handling updates:"
for route in "${ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo "  - $route"
  fi
done
