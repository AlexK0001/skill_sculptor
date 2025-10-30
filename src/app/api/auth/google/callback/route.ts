// src/app/api/auth/google/callback/route.ts - FINAL FIX
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
      console.error('OAuth state mismatch or missing code');
      return NextResponse.redirect(new URL('/login?error=oauth_state', request.url));
    }

    const redirectBase = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;

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

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    const profile = await profileRes.json();
    
    if (!profile.email_verified) {
      console.error('Email not verified');
      return NextResponse.redirect(new URL('/login?error=email_not_verified', request.url));
    }

    const users = await getUsersCollection();
    const now = new Date();
    
    const result = await users.findOneAndUpdate(
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

    const userDoc = result;
    
    if (!userDoc || !userDoc._id) {
      console.error("Failed to create/find user:", profile);
      return NextResponse.redirect(new URL('/login?error=user_creation', request.url));
    }

    const token = jwt.sign(
      { 
        userId: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name 
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    const response = NextResponse.redirect(new URL('/', request.url));
    
    // CRITICAL FIX: Always secure=true on Vercel (even preview deploys use HTTPS)
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isProduction, // true on Vercel
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.delete("oauth_state");

    console.log('[OAuth] Success! Token cookie set. Secure:', isProduction);
    
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL('/login?error=server', request.url));
  }
}