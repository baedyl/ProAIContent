#!/usr/bin/env node

/**
 * Seed Test Accounts Script
 * Creates test accounts with predefined credits for development and testing
 * 
 * Usage:
 *   node scripts/seedTestAccounts.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   - Run from project root directory
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test accounts to create
const testAccounts = [
  {
    email: 'test@contentwriter.com',
    password: 'Test@123456',
    name: 'Test User',
    credits: 100000,
    description: 'Main test account with plenty of credits'
  },
  {
    email: 'lowcredits@test.com',
    password: 'Test@123456',
    name: 'Low Credits User',
    credits: 500,
    description: 'Test account with low credits (for testing low balance scenarios)'
  },
  {
    email: 'nocredits@test.com',
    password: 'Test@123456',
    name: 'No Credits User',
    credits: 0,
    description: 'Test account with zero credits (for testing credit exhaustion)'
  },
  {
    email: 'demo@proaiwriter.com',
    password: 'Demo@123456',
    name: 'Demo Account',
    credits: 50000,
    description: 'Demo account for presentations and showcases'
  }
]

async function createTestAccount(account) {
  try {
    console.log(`\n📝 Creating account: ${account.email}`)
    console.log(`   Description: ${account.description}`)

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(account.email)
    
    if (existingUser?.user) {
      console.log(`   ⚠️  User already exists, updating credits...`)
      
      // Update credits using the adjust_user_credits function
      const { error: creditError } = await supabase.rpc('adjust_user_credits', {
        p_user_id: existingUser.user.id,
        p_amount: account.credits,
        p_transaction_type: 'admin_adjustment',
        p_description: 'Test account seed - credits reset'
      })

      if (creditError) {
        console.error(`   ❌ Error updating credits: ${creditError.message}`)
        return false
      }

      console.log(`   ✅ Credits updated to ${account.credits.toLocaleString()}`)
      return true
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        name: account.name
      }
    })

    if (createError) {
      console.error(`   ❌ Error creating user: ${createError.message}`)
      return false
    }

    if (!newUser.user) {
      console.error(`   ❌ User creation failed - no user returned`)
      return false
    }

    console.log(`   ✅ User created: ${newUser.user.id}`)

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: newUser.user.id,
        email: account.email,
        name: account.name,
        credits_balance: account.credits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error(`   ❌ Error creating profile: ${profileError.message}`)
      return false
    }

    console.log(`   ✅ Profile created with ${account.credits.toLocaleString()} credits`)

    // Record initial credit transaction
    if (account.credits > 0) {
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: newUser.user.id,
          amount: account.credits,
          transaction_type: 'admin_adjustment',
          description: 'Test account seed - initial credits',
          balance_after: account.credits,
          created_at: new Date().toISOString()
        })

      if (txError) {
        console.error(`   ⚠️  Warning: Could not record transaction: ${txError.message}`)
      } else {
        console.log(`   ✅ Transaction recorded`)
      }
    }

    return true
  } catch (error) {
    console.error(`   ❌ Unexpected error: ${error.message}`)
    return false
  }
}

async function seedTestAccounts() {
  console.log('🌱 ProAI Writer - Test Account Seeder')
  console.log('=====================================\n')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log(`📊 Accounts to create: ${testAccounts.length}\n`)

  let successCount = 0
  let failCount = 0

  for (const account of testAccounts) {
    const success = await createTestAccount(account)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n=====================================')
  console.log('📊 Seeding Summary:')
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log('=====================================\n')

  if (successCount > 0) {
    console.log('🎉 Test accounts ready!')
    console.log('\n📋 Login Credentials:')
    console.log('─────────────────────────────────────')
    testAccounts.forEach(account => {
      console.log(`\n   Email:    ${account.email}`)
      console.log(`   Password: ${account.password}`)
      console.log(`   Credits:  ${account.credits.toLocaleString()}`)
    })
    console.log('\n─────────────────────────────────────')
  }

  process.exit(failCount > 0 ? 1 : 0)
}

// Run the seeder
seedTestAccounts().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

