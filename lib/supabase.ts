import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants');
    if (Constants.default?.expoConfig?.extra?.[key]) {
      return Constants.default.expoConfig.extra[key];
    }
  } catch {
    // expo-constants not available (e.g., in backend context)
  }
  
  return undefined;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL') || 'https://jxwriolkvvixoqgozzmu.supabase.co';
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4d3Jpb2xrdnZpeG9xZ296em11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjA3MzMsImV4cCI6MjA3NzQ5NjczM30.8eP2UrnPRDJBz9s3DWQD4THebLSkDq6JjO1J6MspBWY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables missing!');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  console.error('\n💡 Solution: Restart your dev server (bun expo start)');
  throw new Error('Missing Supabase environment variables. Please restart your dev server.');
}

console.log('✅ Supabase client initialized successfully');
console.log('🔗 Connected to:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
