import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    console.log('API Session result:', session)
    
    return NextResponse.json({
      session,
      hasSession: !!session,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({
      session: null,
      hasSession: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}