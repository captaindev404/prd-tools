#!/bin/bash

# Prisma Setup Script for Odyssey Feedback
# This script should be run after Next.js initialization

set -e

echo "🚀 Setting up Prisma for Odyssey Feedback..."
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please initialize Next.js first."
  exit 1
fi

# Install Prisma dependencies
echo "📦 Installing Prisma dependencies..."
npm install -D prisma tsx ulid
npm install @prisma/client

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create migration
echo "🗄️  Creating initial migration..."
npx prisma migrate dev --name init

# Run seed
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "✅ Prisma setup complete!"
echo ""
echo "📊 Summary of seeded data:"
echo "   - Villages: 1 (La Rosière)"
echo "   - Users: 5 (1 Admin, 1 PM, 1 Researcher, 2 Regular users)"
echo "   - Features: 5"
echo "   - Feedback: 6 (including 1 duplicate)"
echo "   - Votes: 6"
echo "   - Roadmap Items: 2"
echo "   - Research Panels: 1"
echo "   - Questionnaires: 1"
echo "   - Research Sessions: 1"
echo ""
echo "🔍 To explore the database, run: npx prisma studio"
echo ""
