import { NextRequest, NextResponse } from 'next/server'

// TODO: Implementar upload com sharp (thumbnails)
export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Upload API semi-configurada' })
}
