import { NextRequest, NextResponse } from 'next/server'

// TODO: Implementar CRUD de ensaios
export async function GET(req: NextRequest) {
  return NextResponse.json({ ensaios: [] })
}
