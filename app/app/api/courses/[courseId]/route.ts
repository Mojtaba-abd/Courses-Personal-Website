import Mux from "@mux/mux-node"
import { auth } from "@/lib/auth-server"
import { cookies } from "next/headers"
import axios from "axios"
import { NextResponse } from "next/server"

// Helper function to get Mux Video client (only when needed)
function getMuxVideo() {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error("Mux credentials not configured");
  }
  const { Video } = new Mux(
    process.env.MUX_TOKEN_ID,
    process.env.MUX_TOKEN_SECRET
  );
  return Video;
}

export async function DELETE(req: Request, { params }: { params: { courseId: string}}){
    try {
        const user = await auth()
        if(!user){
            return NextResponse.json({ error: "Unauthorized access denied!" }, { status: 401})
        }

        const backendUrl = process.env.BACK_END_URL || process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";
        const courseChapters: {_id: string, assetId: string}[] = await (await axios.get(`${backendUrl}/api/chapters/${params.courseId}`)).data
        if(!courseChapters){
            return NextResponse.json({ error: "Not found" }, { status: 404})
        }

        // Only initialize Mux if tokens are available and we have assetIds to delete
        const hasAssets = courseChapters.some(ch => ch.assetId);
        if (hasAssets) {
            try {
                const Video = getMuxVideo();
                for(const chapter of courseChapters){
                    if(chapter.assetId){
                        try {
                            await Video.Assets.del(chapter.assetId)
                        } catch (muxError) {
                            console.error("Error deleting Mux asset:", muxError);
                            // Continue even if Mux deletion fails
                        }
                    }
                }
            } catch (muxInitError) {
                console.error("Mux initialization failed (may not be configured):", muxInitError);
                // Continue with chapter deletion even if Mux fails
            }
        }

        for(const chapter of courseChapters){
            await axios.delete(`${backendUrl}/api/chapters/${chapter._id}/course/${params.courseId}`)
        }



        await axios.delete(`${backendUrl}/api/courses/${params.courseId}`)

        return NextResponse.json({ message: "Course successfully deleted" })
    } catch (error: any) {
        console.error("Error deleting course:", error)
        return NextResponse.json(
            { error: error.response?.data?.error || "Internal server error deleting course" },
            { status: error.response?.status || 500 }
        )
    }
}

export async function PATCH(
    req : Request,
    {params} : {params : {courseId : string}}
    ) {
    try {
        // Try to get token from cookies
        const cookieStore = await cookies();
        let token = cookieStore.get("token")?.value;
        
        // If no token in cookies, try to get it from request headers (for client-side requests)
        if (!token) {
            const cookieHeader = req.headers.get("cookie");
            if (cookieHeader) {
                const tokenMatch = cookieHeader.match(/token=([^;]+)/);
                token = tokenMatch ? tokenMatch[1] : undefined;
            }
        }
        
        // Check if token exists - if not, return error
        // Don't verify JWT here - let backend handle authentication to avoid JWT_SECRET mismatch issues
        if (!token) {
            console.error("PATCH request - No token found");
            return NextResponse.json({ error: "Unauthorized - No authentication token found" }, {status : 401})
        }

        const {courseId} = params
        const values = await req.json()

        // Forward the request to backend with authentication
        // Backend will verify the JWT token
        const backendUrl = process.env.BACK_END_URL || process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";
        
        console.log("Forwarding PATCH request to backend:", {
            url: `${backendUrl}/api/courses/${courseId}`,
            hasToken: !!token,
            bodyKeys: Object.keys(values),
            enrolledUsersCount: values.enrolledUsers ? (Array.isArray(values.enrolledUsers) ? values.enrolledUsers.length : "not array") : "undefined"
        });

        const course = await axios.patch(
            `${backendUrl}/api/courses/${courseId}`,
            values, // Don't add userId here, let backend handle it from auth
            {
                headers: {
                    Cookie: token ? `token=${token}` : "",
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            }
        )

        return NextResponse.json(course.data)

       
    } catch (error: any) {
        console.error("Error at api course courseId PATCH:", {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
            }
        });
        
        // Return detailed error information
        const errorMessage = error.response?.data?.error || error.message || "Internal error at course Id";
        const errorStatus = error.response?.status || 500;
        
        return NextResponse.json(
            { error: errorMessage, details: error.response?.data },
            { status: errorStatus }
        )
    }
}