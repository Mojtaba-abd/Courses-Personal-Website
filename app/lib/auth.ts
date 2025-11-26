import axios from "axios";

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      withCredentials: true,
    });
    return response.data.user;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  try {
    await axios.post(
      `${API_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "/login";
  }
}


