// src/app/api/auth/google/callback/route.ts - FIXED REDIRECTS
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUsersCollection } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = request.cookies.get("oauth_state")?.value;

    if (!code || !state || !cookieState || state !== cookieState) {
      return NextResponse.redirect(new URL('/?error=oauth_state', request.url));
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
      console.error("token exchange failed", tokenJson);
      return NextResponse.redirect(new URL('/?error=token_exchange', request.url));
    }

    const accessToken = tokenJson.access_token;

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    if (!profile.email_verified) {
      return NextResponse.redirect(new URL('/?error=email_not_verified', request.url));
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
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    const userDoc = result?.value || result;
    if (!userDoc || !userDoc._id) {
      console.error("failed to find/create user", profile);
      return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url));
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: userDoc._id.toString() },
      process.env.JWT_SECRET || "no-secret",
      { expiresIn: "7d" }
    );

    const res = NextResponse.redirect(new URL('/', request.url));
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Clear OAuth state cookie
    res.cookies.delete("oauth_state");

    return res;
  } catch (err) {
    console.error("google oauth callback error", err);
    return NextResponse.redirect(new URL('/?error=server', request.url));
  }
}