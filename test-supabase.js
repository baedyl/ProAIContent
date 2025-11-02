// Quick test script to verify Supabase connection
const fs = require('fs')
const path = require('path')

console.log('\n🔍 Checking Supabase Configuration...\n')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
let url, anonKey, serviceKey

try {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].replace(/"/g, '').trim()
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      anonKey = line.split('=')[1].replace(/"/g, '').trim()
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceKey = line.split('=')[1].replace(/"/g, '').trim()
    }
  })
} catch (err) {
  console.error('❌ Error reading .env.local:', err.message)
  process.exit(1)
}

console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', url ? 'Set ✓' : '❌ MISSING')
console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? 'Set ✓' : '❌ MISSING')
console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? 'Set ✓' : '❌ MISSING')

if (url) console.log('   URL:', url)
if (anonKey) console.log('   Anon key (first 20 chars):', anonKey.substring(0, 20) + '...')
if (serviceKey) console.log('   Service key (first 20 chars):', serviceKey.substring(0, 20) + '...')

console.log('\n📊 Summary:')
if (!url || !anonKey || !serviceKey) {
  console.log('❌ Missing environment variables!')
  console.log('\nAdd them to .env.local and restart the server')
} else {
  console.log('✅ All Supabase environment variables are set!')
  
  // Test if keys look valid
  if (!anonKey.startsWith('eyJ')) {
    console.log('⚠️  Warning: Anon key doesn\'t look like a JWT token')
  }
  if (!serviceKey.startsWith('eyJ')) {
    console.log('⚠️  Warning: Service key doesn\'t look like a JWT token')
  }
  
  if (anonKey === serviceKey) {
    console.log('⚠️  WARNING: Anon key and service key are the same!')
    console.log('   Make sure you copied the SERVICE_ROLE key, not the ANON key again')
  }
}

console.log('\n')

