import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasPendingInviteFromAuth } from "@/lib/auth/pending-invite";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/auth/callback",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isLoginOnlyPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = isPublicPath(pathname);

  if (user) {
    const pendingInvite = hasPendingInviteFromAuth(user);
    const isAcceptInvitePath =
      pathname === "/accept-invite" || pathname.startsWith("/accept-invite/");

    if (pendingInvite && !isAcceptInvitePath && pathname !== "/auth/callback") {
      const url = request.nextUrl.clone();
      url.pathname = "/accept-invite";
      return NextResponse.redirect(url);
    }

    if (!pendingInvite && isAcceptInvitePath) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isLoginOnlyPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = pendingInvite ? "/accept-invite" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
