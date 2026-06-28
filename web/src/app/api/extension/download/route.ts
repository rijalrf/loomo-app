import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const searchParams = request.nextUrl.searchParams;
    const env = searchParams.get('env') || 'prod';
    
    let extFolder = 'ext-prod';
    if (env === 'local') extFolder = 'ext-local';
    else if (env === 'qa') extFolder = 'ext-qa';
    
    const extPath = path.join(process.cwd(), '..', extFolder);
    
    if (!fs.existsSync(extPath)) {
      return NextResponse.json({ error: 'Extension folder not found' }, { status: 404 });
    }
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    
    archive.on('data', (chunk) => chunks.push(chunk));
    
    await new Promise<void>((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
      
      archive.directory(extPath, false);
      archive.finalize();
    });
    
    const buffer = Buffer.concat(chunks);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="loomo-extension-${env}.zip"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error('[download-extension] Error:', error);
    return NextResponse.json({ error: 'Failed to generate extension package' }, { status: 500 });
  }
}
