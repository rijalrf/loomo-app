import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const flow = request.nextUrl.searchParams.get('flow') || 'login';
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  const options = {
    redirect_uri: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8999',
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    state: flow,
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' ')
  };

  const qs = new URLSearchParams(options).toString();
  
  return NextResponse.redirect(`${rootUrl}?${qs}`);
}
