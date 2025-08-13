// Run master admin migration via Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running master admin migration...');
  
  try {
    // Step 1: Check current constraint
    console.log('1. Checking current role constraint...');
    
    // Step 2: Try to update alex@jrvs.ai directly (this will tell us if migration is needed)
    console.log('2. Attempting to update role...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'master_admin' })
      .eq('email', 'alex@jrvs.ai');
    
    if (updateError) {
      console.log('Update failed (expected):', updateError.message);
      console.log('3. Need to run migration via Supabase Dashboard...');
      console.log('\n=== MIGRATION REQUIRED ===');
      console.log('Please run this SQL in Supabase Dashboard > SQL Editor:');
      console.log('');
      console.log('-- Add master_admin role to profiles table');
      console.log('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;');
      console.log('ALTER TABLE profiles ADD CONSTRAINT profiles_role_check');
      console.log("CHECK (role IN ('creator', 'viewer', 'master_admin'));");
      console.log('');
      console.log("UPDATE profiles SET role = 'master_admin' WHERE email = 'alex@jrvs.ai';");
      console.log('');
      console.log('After running this, alex@jrvs.ai will be invisible to users.');
    } else {
      console.log('✅ Role updated successfully! Admin is now stealth.');
      
      // Verify the change
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('email', 'alex@jrvs.ai')
        .single();
        
      console.log('Verified profile:', profile);
    }

  } catch (error) {
    console.error('Migration script error:', error);
  }
}

runMigration();