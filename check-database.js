#!/usr/bin/env node

/**
 * ProAI Writer - Database Connection Checker
 * Run this to verify your Supabase database is set up correctly
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔍 ProAI Writer - Database Setup Checker\n')
console.log('='.repeat(60))

// Check environment variables
if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ ERROR: Missing Supabase credentials')
  console.log('\nPlease check your .env.local file contains:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('\n✅ Environment variables found')
console.log(`   Supabase URL: ${supabaseUrl}`)

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  const requiredTables = ['user_settings', 'projects', 'project_contents', 'usage_logs']
  let allTablesExist = true

  console.log('\n📊 Checking database tables...\n')

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.log(`   ❌ Table "${table}" - NOT FOUND`)
          allTablesExist = false
        } else {
          console.log(`   ⚠️  Table "${table}" - Error: ${error.message}`)
          allTablesExist = false
        }
      } else {
        console.log(`   ✅ Table "${table}" - OK`)
      }
    } catch (err) {
      console.log(`   ❌ Table "${table}" - Error: ${err.message}`)
      allTablesExist = false
    }
  }

  console.log('\n' + '='.repeat(60))

  if (allTablesExist) {
    console.log('\n🎉 SUCCESS! Your database is set up correctly.')
    console.log('\nYou can now:')
    console.log('  ✅ Create projects')
    console.log('  ✅ Generate content')
    console.log('  ✅ Save and organize your work')
    console.log('\n')
  } else {
    console.log('\n❌ DATABASE SETUP REQUIRED')
    console.log('\nSome tables are missing. Please follow these steps:')
    console.log('\n1. Go to your Supabase Dashboard')
    console.log('   → https://app.supabase.com')
    console.log('\n2. Select your project')
    console.log('\n3. Click "SQL Editor" in the left sidebar')
    console.log('\n4. Click "New Query"')
    console.log('\n5. Copy the contents of QUICK_DATABASE_SETUP.sql')
    console.log('\n6. Paste into the SQL Editor and click "Run"')
    console.log('\n7. Run this script again to verify')
    console.log('\nFor detailed instructions, see: SETUP_DATABASE_INSTRUCTIONS.md')
    console.log('\n')
    process.exit(1)
  }
}

checkDatabase().catch(error => {
  console.error('\n❌ Unexpected error:', error.message)
  process.exit(1)
})

