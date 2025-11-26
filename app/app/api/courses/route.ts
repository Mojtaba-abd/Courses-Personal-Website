import { auth } from "@/lib/auth-server";
import axios from "axios";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const user = await auth();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { title } = await req.json();

    // Get the token cookie to forward to backend
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const course = await axios.post(
      `${process.env.BACK_END_URL || "http://localhost:8000"}/api/courses`,
      { title },
      {
        headers: {
          Cookie: token ? `token=${token}` : "",
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(course.data, { status: 201 });
  } catch (error: any) {
    console.log("[courses]", error);
    return new NextResponse(
      error.response?.data?.error || "Internal Error",
      { status: error.response?.status || 500 }
    );
  }
}
