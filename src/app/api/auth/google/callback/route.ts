// src/app/api/auth/google/callback/route.ts - VERCEL COMPATIBLE
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

    // Validate OAuth state
    if (!code || !state || !cookieState || state !== cookieState) {
      console.error('OAuth state mismatch or missing code');
      return NextResponse.redirect(new URL('/login?error=oauth_state', request.url));
    }

    const redirectBase = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;

    // Exchange code for tokens
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

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    const profile = await profileRes.json();
    
    if (!profile.email_verified) {
      console.error('Email not verified');
      return NextResponse.redirect(new URL('/login?error=email_not_verified', request.url));
    }

    // Upsert user into DB
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

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name 
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    // Redirect to home page with token cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // CRITICAL: Set cookie with Vercel-compatible options
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true, // ALWAYS true on Vercel (even in preview)
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      domain: process.env.NODE_ENV === 'production' 
        ? '.vercel.app' // Allow all subdomains on Vercel
        : undefined
    });

    // Clear OAuth state cookie
    response.cookies.delete("oauth_state");

    console.log('OAuth successful, token cookie set, redirecting to home');
    
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL('/login?error=server', request.url));
  }
}