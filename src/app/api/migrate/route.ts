import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This route checks if the database schema is ready
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if profiles table exists by trying to query it
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      // Table doesn't exist - provide instructions
      return NextResponse.json({
        success: false,
        message: 'Database tables need to be created in Supabase SQL Editor',
        sqlEditorUrl: `${supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/rmdckjnnoipgwvqpinpx/sql`,
        instructions: 'Copy the SQL from supabase/migrations/001_initial_schema.sql and run it in the SQL Editor',
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema is ready'
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database schema'
    }, { status: 500 });
  }
}
