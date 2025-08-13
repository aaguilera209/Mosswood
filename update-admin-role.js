// Update alex@jrvs.ai role to master_admin for stealth mode
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAdminRole() {
  console.log('Updating alex@jrvs.ai to master_admin role for stealth mode...');
  
  try {
    // Update alex@jrvs.ai to master_admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'master_admin' })
      .eq('email', 'alex@jrvs.ai');
      
    if (updateError) {
      console.error('Failed to update role:', updateError);
    } else {
      console.log('✅ Successfully updated alex@jrvs.ai to master_admin!');
      console.log('Admin account is now invisible to regular users.');
      
      // Verify the change
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('email', 'alex@jrvs.ai')
        .single();
        
      console.log('Verified role:', profile);
    }

  } catch (error) {
    console.error('Role update failed:', error);
  }
}

updateAdminRole();