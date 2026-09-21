import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkDB() {
  console.log('Querying Supabase products...');
  // Fetch in chunks of 1000
  let allProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, sku, slug, category_id, colors')
      .range(from, from + 999);
    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    allProducts.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Total fetched from Supabase: ${allProducts.length}`);

  // Check duplicate SKUs
  const skus = new Map();
  for (const p of allProducts) {
    if (!skus.has(p.sku)) skus.set(p.sku, []);
    skus.get(p.sku).push(p);
  }
  const dupeSkus = Array.from(skus.entries()).filter(([k, v]) => v.length > 1);
  console.log(`Duplicate SKUs: ${dupeSkus.length}`);

  // Check duplicate Titles
  const titles = new Map();
  for (const p of allProducts) {
    const norm = p.title.toLowerCase().trim();
    if (!titles.has(norm)) titles.set(norm, []);
    titles.get(norm).push(p);
  }
  const dupeTitles = Array.from(titles.entries()).filter(([k, v]) => v.length > 1);
  console.log(`Exact Duplicate Titles in DB: ${dupeTitles.length}`);
  dupeTitles.forEach(([k, v]) => {
    console.log(` - "${k}" (${v.length} times):`, v.map(x => x.sku).join(', '));
  });

  process.exit(0);
}

checkDB();
