import { supabase } from '@/lib/supabase';

export async function quickCheck() {
  console.log('🔍 Starting database connection check...');
  
  const settings = await supabase.from('settings').select('*');
  const vendors  = await supabase.from('vendor_public').select('*').limit(5);
  const products = await supabase.from('marketplace_products').select('*').limit(5);

  console.log('⚙️  Settings:', settings.data, settings.error);
  console.log('👥 Vendors:', vendors.data, vendors.error);
  console.log('📦 Products:', products.data, products.error);
  
  return {
    settings: { data: settings.data, error: settings.error },
    vendors: { data: vendors.data, error: vendors.error },
    products: { data: products.data, error: products.error }
  };
}
