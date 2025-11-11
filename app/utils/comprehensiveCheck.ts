import { supabase } from '@/lib/supabase';

export interface DiagnosticResult {
  section: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export async function runComprehensiveCheck(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  console.log('🔍 Starting Comprehensive System Check...\n');

  // ============================================================================
  // 1. Check Supabase Connection
  // ============================================================================
  try {
    const { error: connectionError } = await supabase
      .from('customers')
      .select('count')
      .limit(0);
    
    if (connectionError) {
      results.push({
        section: '1. Supabase Connection',
        status: 'error',
        message: 'Failed to connect to Supabase',
        details: connectionError
      });
    } else {
      results.push({
        section: '1. Supabase Connection',
        status: 'success',
        message: 'Successfully connected to Supabase'
      });
    }
  } catch (error) {
    results.push({
      section: '1. Supabase Connection',
      status: 'error',
      message: 'Exception connecting to Supabase',
      details: error
    });
  }

  // ============================================================================
  // 2. Check Required Tables Exist
  // ============================================================================
  const requiredTables = [
    'customers',
    'admin_users',
    'vendors',
    'products',
    'customer_carts',
    'customer_favorites'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(0);
      
      if (error) {
        if (error.code === 'PGRST205') {
          results.push({
            section: `2. Table Check: ${table}`,
            status: 'error',
            message: `Table '${table}' does NOT exist`,
            details: error
          });
        } else {
          results.push({
            section: `2. Table Check: ${table}`,
            status: 'warning',
            message: `Table '${table}' exists but has errors`,
            details: error
          });
        }
      } else {
        results.push({
          section: `2. Table Check: ${table}`,
          status: 'success',
          message: `Table '${table}' exists and is accessible`
        });
      }
    } catch (error) {
      results.push({
        section: `2. Table Check: ${table}`,
        status: 'error',
        message: `Exception checking table '${table}'`,
        details: error
      });
    }
  }

  // ============================================================================
  // 3. Check Auth Session
  // ============================================================================
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      results.push({
        section: '3. Auth Session',
        status: 'error',
        message: 'Error getting auth session',
        details: sessionError
      });
    } else if (sessionData.session) {
      results.push({
        section: '3. Auth Session',
        status: 'success',
        message: `Active session found for: ${sessionData.session.user.email}`,
        details: {
          userId: sessionData.session.user.id,
          userType: sessionData.session.user.user_metadata?.user_type || 'unknown'
        }
      });
    } else {
      results.push({
        section: '3. Auth Session',
        status: 'warning',
        message: 'No active auth session'
      });
    }
  } catch (error) {
    results.push({
      section: '3. Auth Session',
      status: 'error',
      message: 'Exception checking auth session',
      details: error
    });
  }

  // ============================================================================
  // 4. Check Customer Profile Access
  // ============================================================================
  try {
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customerError) {
      results.push({
        section: '4. Customer Profile Access',
        status: 'error',
        message: 'Cannot access customers table',
        details: customerError
      });
    } else {
      results.push({
        section: '4. Customer Profile Access',
        status: 'success',
        message: `Customers table accessible (${customerData?.length || 0} profiles found)`,
        details: { count: customerData?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      section: '4. Customer Profile Access',
      status: 'error',
      message: 'Exception accessing customers table',
      details: error
    });
  }

  // ============================================================================
  // 5. Check Admin Users Table
  // ============================================================================
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (adminError) {
      if (adminError.code === '42P17') {
        results.push({
          section: '5. Admin Users Access',
          status: 'error',
          message: 'Infinite recursion in admin_users policies - NEEDS FIX',
          details: adminError
        });
      } else {
        results.push({
          section: '5. Admin Users Access',
          status: 'error',
          message: 'Cannot access admin_users table',
          details: adminError
        });
      }
    } else {
      results.push({
        section: '5. Admin Users Access',
        status: 'success',
        message: `Admin users table accessible (${adminData?.length || 0} admins found)`,
        details: { count: adminData?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      section: '5. Admin Users Access',
      status: 'error',
      message: 'Exception accessing admin_users table',
      details: error
    });
  }

  // ============================================================================
  // 6. Check Vendors Table
  // ============================================================================
  try {
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .limit(1);
    
    if (vendorError) {
      results.push({
        section: '6. Vendors Table Access',
        status: 'error',
        message: 'Cannot access vendors table',
        details: vendorError
      });
    } else {
      results.push({
        section: '6. Vendors Table Access',
        status: 'success',
        message: `Vendors table accessible (${vendorData?.length || 0} vendors found)`,
        details: { count: vendorData?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      section: '6. Vendors Table Access',
      status: 'error',
      message: 'Exception accessing vendors table',
      details: error
    });
  }

  // ============================================================================
  // 7. Check Products Table
  // ============================================================================
  try {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productError) {
      results.push({
        section: '7. Products Table Access',
        status: 'error',
        message: 'Cannot access products table',
        details: productError
      });
    } else {
      results.push({
        section: '7. Products Table Access',
        status: 'success',
        message: `Products table accessible (${productData?.length || 0} products found)`,
        details: { count: productData?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      section: '7. Products Table Access',
      status: 'error',
      message: 'Exception accessing products table',
      details: error
    });
  }

  // ============================================================================
  // 8. Check Customer Carts Table
  // ============================================================================
  try {
    const { data: cartData, error: cartError } = await supabase
      .from('customer_carts')
      .select('*')
      .limit(1);
    
    if (cartError) {
      if (cartError.code === 'PGRST205') {
        results.push({
          section: '8. Customer Carts Table',
          status: 'error',
          message: 'customer_carts table DOES NOT EXIST - NEEDS CREATION',
          details: cartError
        });
      } else {
        results.push({
          section: '8. Customer Carts Table',
          status: 'error',
          message: 'Cannot access customer_carts table',
          details: cartError
        });
      }
    } else {
      results.push({
        section: '8. Customer Carts Table',
        status: 'success',
        message: `Customer carts table accessible (${cartData?.length || 0} carts found)`,
        details: { count: cartData?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      section: '8. Customer Carts Table',
      status: 'error',
      message: 'Exception accessing customer_carts table',
      details: error
    });
  }

  // ============================================================================
  // 9. Check Customer Favorites Table
  // ============================================================================
  try {
    const { data: favData, error: favError } = await supabase
      .from('customer_favorites')
      .select('*')
      .limit(1);
    
    if (favError) {
      if (favError.code === 'PGRST205') {
        results.push({
          section: '9. Customer Favorites Table',
          status: 'error',
          message: 'customer_favorites table DOES NOT EXIST - NEEDS CREATION',
          details: favError
        });
      } else {
        results.push({
          section: '9. Customer Favorites Table',
          status: 'error',
          message: 'Cannot access customer_favorites table',
          details: favError
        });
      }
    } else {
      results.push({
        section: '9. Customer Favorites Table',
        status: 'success',
        message: `Customer favorites table accessible (${favData?.length || 0} favorites found)`,
        details: { count: favData?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      section: '9. Customer Favorites Table',
      status: 'error',
      message: 'Exception accessing customer_favorites table',
      details: error
    });
  }

  // ============================================================================
  // 10. Test Customer Sign Up Process
  // ============================================================================
  results.push({
    section: '10. Customer Sign Up Test',
    status: 'warning',
    message: 'Manual testing required - Cannot auto-test without creating real users'
  });

  // ============================================================================
  // 11. Test Vendor Sign Up Process
  // ============================================================================
  results.push({
    section: '11. Vendor Sign Up Test',
    status: 'warning',
    message: 'Manual testing required - Cannot auto-test without creating real users'
  });

  // ============================================================================
  // 12. Test Admin Login Process
  // ============================================================================
  results.push({
    section: '12. Admin Login Test',
    status: 'warning',
    message: 'Manual testing required - Cannot auto-test without admin credentials'
  });

  // ============================================================================
  // Print Summary
  // ============================================================================
  console.log('\n📊 COMPREHENSIVE CHECK RESULTS:\n');
  console.log('='.repeat(80));
  
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const successCount = results.filter(r => r.status === 'success').length;
  
  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.section}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log(`\n📈 Summary: ${successCount} passed, ${warningCount} warnings, ${errorCount} errors\n`);
  
  if (errorCount > 0) {
    console.log('🚨 CRITICAL ISSUES FOUND - Please review errors above');
  } else if (warningCount > 0) {
    console.log('⚠️  Some warnings found - System mostly functional');
  } else {
    console.log('✅ ALL CHECKS PASSED - System is healthy!');
  }
  
  return results;
}

export function generateFixScript(results: DiagnosticResult[]): string {
  const errors = results.filter(r => r.status === 'error');
  
  if (errors.length === 0) {
    return '// No fixes needed - all checks passed!';
  }
  
  let script = '-- AUTOMATIC FIX SCRIPT GENERATED FROM DIAGNOSTIC RESULTS\n';
  script += '-- Run this in your Supabase SQL Editor\n\n';
  
  const missingTables = errors.filter(e => 
    e.message.includes('DOES NOT EXIST') || 
    e.details?.code === 'PGRST205'
  );
  
  const policyErrors = errors.filter(e => 
    e.message.includes('recursion') || 
    e.details?.code === '42P17'
  );
  
  if (missingTables.length > 0) {
    script += '-- FIX: Create missing tables\n';
    script += '-- Please run the complete SQL from app/utils/FINAL_COMPREHENSIVE_FIX.sql\n\n';
  }
  
  if (policyErrors.length > 0) {
    script += '-- FIX: Fix infinite recursion in policies\n';
    script += '-- Please run the complete SQL from app/utils/FINAL_COMPREHENSIVE_FIX.sql\n\n';
  }
  
  return script;
}
