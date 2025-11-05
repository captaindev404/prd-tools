#!/bin/bash

# Test tiktoken functionality in the backend
# Make sure the dev server is running first: npm run dev

BACKEND_URL="http://localhost:3000"

echo "🧪 Testing tiktoken functionality with Turbopack"
echo "================================================"
echo ""

# Create a sample story request
PAYLOAD='{
  "storyContent": "Once upon a time, in a magical forest far away, there lived a brave little hero named Luna. She had the power to glow in the dark, lighting up the entire forest with her warm, gentle light. Every night, Luna would explore the enchanted woods, making friends with all the magical creatures.",
  "storyDuration": 60,
  "hero": {
    "name": "Luna",
    "primaryTrait": "Brave",
    "secondaryTrait": "Kind",
    "appearance": "A friendly glowing character",
    "specialAbility": "Glows in the dark"
  },
  "eventContext": "bedtime"
}'

echo "📝 Testing /api/stories/extract-scenes endpoint..."
echo "Request payload: Story with ~50 words"
echo ""

# Make the request
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/stories/extract-scenes" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Check if successful
if echo "$RESPONSE" | grep -q "scenes"; then
  echo "✅ SUCCESS: Tiktoken is working!"
  echo ""
  echo "Response (first 500 chars):"
  echo "$RESPONSE" | head -c 500
  echo ""
  echo ""
  echo "🎯 Tiktoken WASM loaded successfully with Turbopack!"
else
  echo "❌ FAILED: Tiktoken error detected"
  echo ""
  echo "Full response:"
  echo "$RESPONSE"
  echo ""
  echo "⚠️  Check if dev server is running: npm run dev"
fi

echo ""
echo "================================================"
