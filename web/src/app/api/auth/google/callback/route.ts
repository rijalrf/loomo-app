import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { setSessionCookie } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    logger.error('google-oauth-callback', `Error from Google: ${error}`);
    return NextResponse.redirect(new URL('/?error=oauth_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8999';

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      logger.error('google-oauth-callback', `Token exchange failed: ${errText}`);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Fetch user details from Google userinfo API
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userinfoResponse.ok) {
      logger.error('google-oauth-callback', 'Userinfo request failed');
      return NextResponse.redirect(new URL('/?error=userinfo_failed', request.url));
    }

    const userData = await userinfoResponse.json();
    const googleId = userData.sub;
    const email = userData.email;
    const displayName = userData.name || userData.given_name || 'Loomo User';
    const avatarUrl = userData.picture || '';

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // 3. Find or create User record
    let user = await prisma.user.findUnique({
      where: { googleId }
    });

    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : undefined;

    if (!user) {
      // Create user and their default Workspace
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            googleId,
            email,
            displayName,
            avatarUrl,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt
          }
        });

        const newWorkspace = await tx.workspace.create({
          data: {
            name: `${displayName}'s Workspace`,
            createdBy: newUser.id
          }
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: newWorkspace.id,
            userId: newUser.id,
            role: 'OWNER',
            acceptedAt: new Date()
          }
        });

        return newUser;
      });
    } else {
      // Update existing user tokens
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          displayName,
          avatarUrl,
          accessToken: encryptedAccessToken,
          ...(encryptedRefreshToken ? { refreshToken: encryptedRefreshToken } : {}),
          tokenExpiresAt
        }
      });
    }

    // 4. Set session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl
    });

    // 5. Redirect back to dashboard (root)
    return NextResponse.redirect(new URL('/', request.url));
  } catch (err: any) {
    logger.error('google-oauth-callback', `Unhandled error: ${err.message || String(err)}`);
    return NextResponse.redirect(new URL('/?error=callback_error', request.url));
  }
}
