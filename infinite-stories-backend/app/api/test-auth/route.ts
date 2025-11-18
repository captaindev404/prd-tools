import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  try {
    // Try with Bearer token
    const authHeader = request.headers.get("authorization");
    console.log("Auth header:", authHeader);

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("Token:", token);

      // Create headers with cookie
      const headers = new Headers(request.headers);
      headers.set("cookie", `infinite-stories.session_token=${token}`);

      console.log("Cookie header:", headers.get("cookie"));

      const session = await auth.api.getSession({
        headers: headers,
      });

      console.log("Session:", session);

      if (session?.user) {
        return NextResponse.json({
          success: true,
          user: session.user,
        });
      }
    }

    return NextResponse.json(
      { error: "No valid session" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
