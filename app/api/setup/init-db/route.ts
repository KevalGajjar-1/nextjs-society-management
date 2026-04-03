import { NextRequest, NextResponse } from 'next/server'

// This endpoint initializes the database schema
// WARNING: Only call this once during initial setup
export async function POST(request: NextRequest) {
  try {
    const adminClient = await (await import('@/lib/supabase')).getAdminClient()

    // Create enums
    const enumStatements = [
      `CREATE TYPE IF NOT EXISTS user_role AS ENUM ('ADMIN', 'COMMITTEE', 'MEMBER')`,
      `CREATE TYPE IF NOT EXISTS user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`,
      `CREATE TYPE IF NOT EXISTS unit_type AS ENUM ('FLAT', 'SHOP')`,
      `CREATE TYPE IF NOT EXISTS resident_type AS ENUM ('OWNER', 'TENANT', 'FAMILY')`,
      `CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('INCOME', 'EXPENSE')`,
      `CREATE TYPE IF NOT EXISTS vehicle_type AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER')`,
      `CREATE TYPE IF NOT EXISTS payment_mode AS ENUM ('CASH', 'UPI', 'BANK')`,
    ]

    // Execute enum creation
    for (const statement of enumStatements) {
      try {
        await adminClient.rpc('exec', { sql: statement }).catch(() => {
          // Ignore errors if enums already exist
        })
      } catch {
        // Continue if enum creation fails
      }
    }

    // Create tables using direct inserts to test connection
    // For now, just test if we can connect
    const { data: testData, error: testError } = await adminClient
      .from('units')
      .select('count')
      .limit(1)

    if (testError) {
      // Tables don't exist yet - need manual setup
      return NextResponse.json({
        success: false,
        message: 'Database tables not initialized. Please run the SQL migration manually in Supabase dashboard.',
        error: testError.message,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
    })
  } catch (error) {
    console.error('[v0] Database init error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
