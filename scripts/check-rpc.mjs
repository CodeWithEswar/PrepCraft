import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tkfqomwymkgcnjakppon.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_4hAG2ksKJ7GOTB7mFH2Nqw_Q-9X0zLh';

const supabase = createClient(url, key);

async function check() {
  console.log('Testing connection to Supabase:', url);
  try {
    const { data, error } = await supabase.rpc('learning_catalog', {
      p_slug: 'preview',
      p_subject: 'aptitude',
      p_topic: null,
      p_search: '',
      p_after: '',
      p_bookmarked: false
    });
    console.log('RPC result:', { hasData: Boolean(data), error });
  } catch (err) {
    console.error('Exception calling RPC:', err);
  }
}

check();
