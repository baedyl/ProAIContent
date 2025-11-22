#!/usr/bin/env python3
"""
Add 'export const dynamic = "force-dynamic"' to all API routes that use getServerSession
"""

import os
import re
from pathlib import Path

# API routes to update
API_ROUTES = [
    "app/api/credits/usage/route.ts",
    "app/api/credits/transactions/route.ts",
    "app/api/settings/route.ts",
    "app/api/purchases/route.ts",
    "app/api/projects/route.ts",
    "app/api/projects/[id]/route.ts",
    "app/api/personas/route.ts",
    "app/api/personas/[id]/route.ts",
    "app/api/personas/test-style/route.ts",
    "app/api/personas/enrich-style/route.ts",
    "app/api/contents/[id]/route.ts",
    "app/api/stripe/create-session/route.ts",
    "app/api/stripe/confirm/route.ts",
    "app/api/stripe/manual-complete/route.ts",
    "app/api/generate-advanced/route.ts",
]

DYNAMIC_EXPORT = "\n// Force dynamic rendering (required for NextAuth session)\nexport const dynamic = 'force-dynamic'\n"

def add_dynamic_export(file_path):
    """Add dynamic export to API route if it doesn't already have it"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already has dynamic export
        if "export const dynamic" in content:
            print(f"  ○ {file_path} - already has dynamic export")
            return False
        
        # Check if it uses getServerSession
        if "getServerSession" not in content:
            print(f"  ○ {file_path} - doesn't use getServerSession, skipping")
            return False
        
        # Find the last import statement
        import_pattern = r'(import\s+.*?\n)(\n*)(export\s+(async\s+)?function|export\s+const)'
        match = re.search(import_pattern, content, re.DOTALL)
        
        if match:
            # Insert dynamic export after imports, before first export
            new_content = content[:match.end(1)] + DYNAMIC_EXPORT + content[match.end(1):]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"  ✓ {file_path} - added dynamic export")
            return True
        else:
            print(f"  ✗ {file_path} - couldn't find insertion point")
            return False
            
    except FileNotFoundError:
        print(f"  ✗ {file_path} - file not found")
        return False
    except Exception as e:
        print(f"  ✗ {file_path} - error: {e}")
        return False

def main():
    print("Adding dynamic export to API routes...\n")
    
    updated_count = 0
    for route in API_ROUTES:
        if add_dynamic_export(route):
            updated_count += 1
    
    print(f"\nDone! Updated {updated_count} files.")

if __name__ == "__main__":
    main()

