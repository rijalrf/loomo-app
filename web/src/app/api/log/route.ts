import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { level, context, message } = await request.json();
    
    if (level && context && message) {
      // Determine prefix based on chrome-extension origin
      const origin = request.headers.get('origin') || '';
      const isExtension = origin.startsWith('chrome-extension://');
      const prefix = isExtension ? 'EXT' : 'WEB';
      
      const logContext = `${prefix}-${context}`;
      if (level === 'error') {
        logger.error(logContext, message);
      } else if (level === 'warn') {
        logger.warn(logContext, message);
      } else {
        logger.info(logContext, message);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
