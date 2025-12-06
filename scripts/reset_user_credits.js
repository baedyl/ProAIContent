// Script to reset all user credits to 0
// This script connects to Supabase and resets all user credits

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔄 Resetting User Credits to 0...\n');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env.local');
let url, serviceKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].replace(/"/g, '').trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceKey = line.split('=')[1].replace(/"/g, '').trim();
    }
  });
} catch (err) {
  console.error('❌ Error reading .env.local:', err.message);
  process.exit(1);
}

if (!url || !serviceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(url, serviceKey);

async function resetCredits() {
  try {
    console.log('📊 Fetching current user credits...');
    
    // Get all users with their current credit balances
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, credits_balance');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users found in the database.');
      return;
    }

    console.log(`📋 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email}: ${user.credits_balance} credits`);
    });

    // Reset credits to 0 for all users
    console.log('\n🔄 Resetting all credits to 0...');
    
    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update({ credits_balance: 0 })
      .neq('credits_balance', 0) // Only update users who don't have 0 credits
      .select('id, email, credits_balance');

    if (updateError) {
      console.error('❌ Error updating user credits:', updateError);
      process.exit(1);
    }

    console.log(`✅ Successfully reset credits for ${updatedUsers.length} users`);

    // Log the reset transactions
    if (updatedUsers.length > 0) {
      console.log('\n📝 Creating credit transaction logs...');
      
      const transactions = updatedUsers.map(user => ({
        user_id: user.id,
        amount: -user.credits_balance, // Negative amount to indicate reduction
        type: 'adjustment',
        description: 'System reset: credits set to 0',
        balance_before: user.credits_balance,
        balance_after: 0
      }));

      const { error: txnError } = await supabase
        .from('credit_transactions')
        .insert(transactions);

      if (txnError) {
        console.error('⚠️ Error creating transaction logs:', txnError);
      } else {
        console.log('✅ Transaction logs created successfully');
      }
    }

    console.log('\n🎉 Credit reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

resetCredits();