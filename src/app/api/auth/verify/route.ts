// src/app/api/auth/verify/route.ts - SECURED VERSION
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/mongodb";
import { userDocumentToUser, type UserDocument } from "@/lib/types";
import { JWT_SECRET } from "@/lib/constants";
import { withErrorHandler, APIError, ErrorCode } from "@/lib/error-handler";
import { withRequestValidation, createErrorResponse, createSuccessResponse, isValidObjectId } from "@/lib/validation-utils";

export const GET = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  // Extract token from multiple sources
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    const cookie = request.cookies.get("token");
    if (cookie?.value) token = cookie.value;
  }

  if (!token) {
    throw new APIError(
      ErrorCode.AUTHENTICATION_ERROR,
      "Authorization token required",
      401
    );
  }

  // Verify JWT token
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET!);
  } catch (error) {
    throw new APIError(
      ErrorCode.AUTHENTICATION_ERROR,
      "Invalid or expired token",
      401
    );
  }

  const userId = payload?.userId || payload?.id;
  if (!userId || !isValidObjectId(userId)) {
    throw new APIError(
      ErrorCode.AUTHENTICATION_ERROR,
      "Invalid token payload",
      401
    );
  }

  // Get user from database
  const users = await getUsersCollection();
  const userDoc = (await users.findOne({ 
    _id: new ObjectId(userId) 
  })) as UserDocument | null;

  if (!userDoc) {
    throw new APIError(
      ErrorCode.AUTHENTICATION_ERROR,
      "User not found",
      401
    );
  }

  const user = userDocumentToUser(userDoc);
  return createSuccessResponse({ user });
}));