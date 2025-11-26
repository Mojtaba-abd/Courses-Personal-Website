import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthUser {
  userId: string;
  username: string;
  role: string;
}

export interface FullUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export async function auth(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("token")?.value;

    // If no token in Next.js cookies, try to extract from headers
    // This can happen in some edge cases with API routes
    if (!token) {
      // Try to get from request headers if available (not accessible in this context, but logging for debugging)
      console.log("Auth: No token found in cookies()");
      return null;
    }

    if (!token || token.trim() === "") {
      console.log("Auth: Token is empty");
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      
      // Validate decoded token has required fields
      if (!decoded || !decoded.userId) {
        console.error("Auth: Decoded token missing userId");
        return null;
      }
      
      console.log("Auth: Token verified successfully", { 
        userId: decoded.userId, 
        role: decoded.role,
        username: decoded.username 
      });
      return decoded;
    } catch (jwtError: any) {
      console.error("Auth: JWT verification failed", {
        error: jwtError.message,
        name: jwtError.name,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "no token"
      });
      
      // Check if it's an expiration error
      if (jwtError.name === "TokenExpiredError") {
        console.error("Auth: Token has expired");
      } else if (jwtError.name === "JsonWebTokenError") {
        console.error("Auth: Invalid token format or signature");
      }
      
      return null;
    }
  } catch (error: any) {
    console.error("Auth: Error in auth function", {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

export async function currentUser(): Promise<FullUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const response = await axios.get(
      `${process.env.BACK_END_URL || "http://localhost:8000"}/api/auth/me`,
      {
        headers: {
          Cookie: `token=${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data.user;
  } catch (error) {
    return null;
  }
}


