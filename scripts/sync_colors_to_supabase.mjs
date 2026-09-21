import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMDIwNiwiZXhwIjoyMTA0NDk2MjA2fQ.7M3tSiIGGj2E0aG1JFm0bvHgWQ8024J5Pvuz2P58k8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const jsonPath = path.join(__dirname, '../src/data/dropshippingCatalog.json');
  const catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const withColors = catalog.filter((p) => Array.isArray(p.colors) && p.colors.length > 0);
  console.log(`Total products with colors in catalog: ${withColors.length}`);

  console.log('⚡ Updating Supabase colors with parallel workers...');
  const CONCURRENCY = 25;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < withColors.length; i += CONCURRENCY) {
    const chunk = withColors.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (p) => {
        const { error } = await supabase
          .from('products')
          .update({
            colors: p.colors,
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id);

        if (error) {
          console.error(`Error updating product ${p.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      })
    );
    if ((i + CONCURRENCY) % 100 === 0 || i + CONCURRENCY >= withColors.length) {
      console.log(`  Updated ${Math.min(i + CONCURRENCY, withColors.length)} / ${withColors.length}...`);
    }
  }

  console.log(`🎉 Supabase color sync finished! Success: ${successCount}, Errors: ${errorCount}`);
}

main().catch(console.error);
