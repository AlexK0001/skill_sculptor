import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || req.nextUrl.origin;
  const baseUrl = appUrl?.endsWith('/') ? appUrl.slice(0, -1) : appUrl || '';
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (error) {
    return new NextResponse(`Error from Google: ${error}`, { status: 400 });
  }
  if (!code) {
    return new NextResponse('No authentication code provided', { status: 400 });
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', tokenData);
      return new NextResponse(`Google Error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }

    // 2. Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    
    if (!profileRes.ok || !profileData.email) {
      console.error('Google profile fetch failed:', profileData);
      return new NextResponse('Failed to fetch user profile', { status: 400 });
    }

    const email = profileData.email;
    const name = profileData.name || '';

    // 3. Find or Create User
    const usersCollection = await getUsersCollection();
    let user = await usersCollection.findOne({ email });

    if (!user) {
      // Create user without password for OAuth users
      const result = await usersCollection.insertOne({
        email,
        name,
        authProvider: 'google',
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email, name };
    }

    // 4. Generate custom JWT
    const userData = { id: user._id.toString(), email: user.email, name: user.name };
    const siteToken = jwt.sign({ userId: userData.id }, JWT_SECRET, { expiresIn: '7d' });

    // 5. Send postMessage to opener
    return new NextResponse(`
      <html>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS',
              payload: {
                token: "${siteToken}",
                user: ${JSON.stringify(userData)}
              }
            }, '*');
            window.close();
          } else {
            window.location.href = '/login?error=Popup_lost';
          }
        </script>
        <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
          <p>Authentication successful! This window should close automatically.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('OAuth callback error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
