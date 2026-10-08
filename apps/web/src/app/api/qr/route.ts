import { NextResponse } from 'next/server'
import { generateQrSvg } from '../../../../../../apps/api/src/modules/downloads/qr'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')

  if (!data) {
    return new NextResponse('Missing data parameter', { status: 400 })
  }

  const size = Math.min(1024, Math.max(64, Number(searchParams.get('size')) || 200))

  try {
    const svg = generateQrSvg(data, {
      size,
      darkColor: '#06070A',
      lightColor: '#FFFFFF',
      margin: 2,
    })

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return new NextResponse('Failed to generate QR', { status: 500 })
  }
}
