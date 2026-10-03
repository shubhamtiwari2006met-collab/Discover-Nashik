import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function proxyAuth(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path ? resolvedParams.path.join("/") : "";
  const backendApiUrl = `${BACKEND_URL}/api/auth/${path}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("host", "localhost:5000");

  let body: any = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const backendRes = await fetch(backendApiUrl, {
      method: request.method,
      headers: requestHeaders,
      body: body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.append(key, value);
      }
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Auth Proxy Error] ${request.method} /api/auth/${path}:`, error?.message);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to Discover Nashik backend. Please ensure Node Express server is running on port 5000.",
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, context: any) {
  return proxyAuth(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return proxyAuth(request, context);
}

export async function PUT(request: NextRequest, context: any) {
  return proxyAuth(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
  return proxyAuth(request, context);
}
