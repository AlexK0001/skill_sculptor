import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUsersCollection } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = request.cookies.get("oauth_state")?.value;

    if (!code || !state || !cookieState || state !== cookieState) {
      console.error('OAuth Error: Значення State не збігається або відсутній Code');
      return NextResponse.redirect(new URL('/login?error=oauth_state', request.url));
    }

    const redirectBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') 
                         || `${url.protocol}//${url.host}`;
    
    // Обмін коду на токен доступу Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${redirectBase}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = await tokenRes.json();
    
    if (!tokenJson.access_token) {
      console.error("Token exchange failed:", tokenJson);
      return NextResponse.redirect(new URL('/login?error=token_exchange', request.url));
    }

    // Запит інформації профілю
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    const profile = await profileRes.json();
    
    if (!profile.email) {
      console.error('Email not returned by Google');
      return NextResponse.redirect(new URL('/login?error=email_not_verified', request.url));
    }

    const users = await getUsersCollection();
    const now = new Date();
    
    // Створення або оновлення юзера
    const rawResult = await users.findOneAndUpdate(
      { email: profile.email },
      {
        $set: {
          name: profile.name,
          picture: profile.picture,
          oauthProvider: "google",
          oauthId: profile.sub,
          updatedAt: now,
        },
        $setOnInsert: {
          email: profile.email,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // У MongoDB Node.js Driver v5 `findOneAndUpdate` повертає { value: {...} }, у v6 - одразу документ
    // @ts-ignore - ігноруємо помилки типізації MongoDB
    const userDoc = rawResult?.value ? rawResult.value : rawResult; 
    
    if (!userDoc || !userDoc._id) {
      console.error("Failed to persist user in DB. Result:", rawResult);
      return NextResponse.redirect(new URL('/login?error=user_creation', request.url));
    }

    // Безпечне вилучення даних
    const userId = userDoc._id.toString();
    const userEmail = userDoc.email || profile.email;
    const userName = (userDoc.name || profile.name || '').replace(/'/g, "\\'");

    // Генеруємо фірмовий JWT токен застосунку
    const token = jwt.sign(
      { userId, email: userEmail, name: userName },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );
    
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head><title>Авторизація...</title></head>
        <body>
          <script>
            try {
              localStorage.setItem('token', '${token}');
              localStorage.setItem('user', JSON.stringify({ 
                id: '${userId}',
                name: '${userName}',
                email: '${userEmail}' 
              }));
              window.location.href = '/';
            } catch (e) {
              console.error('Local storage error:', e);
              window.location.href = '/?error=storage';
            }
          </script>
          <p>Якщо вас не перенаправлено автоматично, <a href="/">натисніть тут</a>.</p>
        </body>
      </html>
    `;

    const response = new NextResponse(htmlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    
    response.cookies.delete("oauth_state");
    return response;

  } catch (err: any) {
    console.error("Google OAuth callback CRITICAL error:", err.message, err.stack);
    return NextResponse.redirect(new URL('/login?error=server', request.url));
  }
}