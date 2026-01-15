import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  // Auth pages that don't require authentication
  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  // API routes that handle their own auth (e.g., OAuth callback)
  const authApiPaths = ["/auth/callback"];

  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isAuthApiPath = authApiPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isOnboardingPath = request.nextUrl.pathname.startsWith("/onboarding");

  if (!user && !isAuthPath && !isAuthApiPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPath) {
    // Check if user needs onboarding
    const onboardingCompleted =
      user.user_metadata?.onboarding_completed === true;
    const onboardingSkipped = user.user_metadata?.onboarding_skipped === true;

    if (!onboardingCompleted && !onboardingSkipped) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // Onboarding routing logic for authenticated users
  if (user) {
    const onboardingCompleted =
      user.user_metadata?.onboarding_completed === true;
    const onboardingSkipped = user.user_metadata?.onboarding_skipped === true;

    // User hasn't completed onboarding and is trying to access /projects
    if (
      !onboardingCompleted &&
      !onboardingSkipped &&
      request.nextUrl.pathname === "/projects"
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // User completed/skipped onboarding and is trying to access /onboarding
    if ((onboardingCompleted || onboardingSkipped) && isOnboardingPath) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
