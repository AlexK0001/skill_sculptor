// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/mongodb";
import { userDocumentToUser, type UserDocument } from "@/lib/types";
import { JWT_SECRET } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookie = request.cookies.get("token");
      if (cookie?.value) token = cookie.value;
    }

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = payload?.userId || payload?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const users = await getUsersCollection();
    const userDoc = (await users.findOne({ _id: new ObjectId(userId) })) as UserDocument | null;

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const user = userDocumentToUser(userDoc);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}