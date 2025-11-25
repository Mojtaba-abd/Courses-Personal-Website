import { auth } from "@/lib/auth-server";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await auth();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { title } = await req.json();

    const course = await axios.post(`${process.env.BACK_END_URL}/api/courses`, {
      userId: user.userId,
      title,
    });

    return NextResponse.json(course.data);
  } catch (error) {
    console.log("[courses]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
