import { NextRequest, NextResponse } from 'next/server'

// TODO: Implementar streaming SSE + OpenAI Tools
export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Chat API semi-configurada' })
}
