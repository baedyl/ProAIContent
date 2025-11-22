#!/bin/bash

# Script to add dynamic export to all API routes that use getServerSession

API_ROUTES=(
  "app/api/credits/summary/route.ts"
  "app/api/credits/transactions/route.ts"
  "app/api/credits/usage/route.ts"
  "app/api/stripe/create-session/route.ts"
  "app/api/stripe/confirm/route.ts"
  "app/api/stripe/manual-complete/route.ts"
  "app/api/personas/route.ts"
  "app/api/personas/[id]/route.ts"
  "app/api/personas/enrich-style/route.ts"
  "app/api/personas/test-style/route.ts"
  "app/api/projects/route.ts"
  "app/api/projects/[id]/route.ts"
  "app/api/contents/route.ts"
  "app/api/contents/[id]/route.ts"
  "app/api/settings/route.ts"
  "app/api/purchases/route.ts"
  "app/api/generate/route.ts"
)

DYNAMIC_CONFIG="// Force dynamic rendering (required for NextAuth session)\nexport const dynamic = 'force-dynamic'\n"

for route in "${API_ROUTES[@]}"; do
  if [ -f "$route" ]; then
    # Check if dynamic export already exists
    if ! grep -q "export const dynamic" "$route"; then
      echo "Processing $route..."
      # Add dynamic export after imports, before first export function
      sed -i.bak '/^export async function/i\
// Force dynamic rendering (required for NextAuth session)\
export const dynamic = '"'"'force-dynamic'"'"'\
' "$route"
      rm "${route}.bak"
      echo "✓ Added dynamic export to $route"
    else
      echo "○ $route already has dynamic export"
    fi
  else
    echo "✗ File not found: $route"
  fi
done

echo ""
echo "Done! All API routes updated."

