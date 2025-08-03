import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // 本番環境でのみ実行を許可
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'Migration only allowed in production' },
        { status: 403 }
      )
    }

    // データベース接続確認
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      )
    }

    console.log('Starting database migration...')
    
    // Prisma db push を実行
    const { stdout, stderr } = await execAsync('npx prisma db push --force-reset')
    
    console.log('Migration stdout:', stdout)
    if (stderr) {
      console.log('Migration stderr:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      output: stdout,
      warnings: stderr || null
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error.message,
        output: error.stdout || null,
        stderr: error.stderr || null
      },
      { status: 500 }
    )
  }
}