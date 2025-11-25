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
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
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


