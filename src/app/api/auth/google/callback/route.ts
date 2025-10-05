// src/app/api/auth/google/callback/route.ts
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "/"}?error=oauth_state`);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      console.error("token exchange failed", tokenJson);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "/"}?error=token_exchange`);
    }
    const accessToken = tokenJson.access_token;

    // get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    if (!profile.email_verified) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=email_not_verified`);
    }

    // upsert user into DB
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

    const userDoc = result?.value;
    if (!userDoc) {
        return NextResponse.redirect(new URL('/login?error=UserNotFound', request.url));
    }
    if (!userDoc) {
      console.error("failed to find/create user", profile);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "/"}?error=user`);
    }

    // create token (same format as login/register)
    const token = jwt.sign({ userId: userDoc._id.toString() }, process.env.JWT_SECRET || "no-secret", {
      expiresIn: "7d",
    });

    const res = NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || "/");
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    // clear the oauth_state cookie
    res.cookies.delete("oauth_state");

    return res;
  } catch (err) {
    console.error("google oauth callback error", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "/"}?error=server`);
  }
}
