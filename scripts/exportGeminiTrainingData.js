import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function exportData() {
  const { data, error } = await supabase
    .from('gemini_training_data')
    .select('prompt,completion')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch training data:', error);
    process.exit(1);
  }

  fs.writeFileSync('gemini_training_data.json', JSON.stringify(data, null, 2));
  console.log(`Exported ${data.length} samples to gemini_training_data.json`);
}

exportData();
