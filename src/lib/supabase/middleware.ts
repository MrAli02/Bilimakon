import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Always allow
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/activate" ||
    pathname === "/admin-login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|map)$/.test(pathname);

  if (isPublic) return supabaseResponse;

  // Not logged in → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Get profile (minimal)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_blocked, access_key_id")
    .eq("id", user.id)
    .single();

  // Blocked → logout + redirect
  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("blocked", "1");
    return NextResponse.redirect(url);
  }

  // Admin routes → only admin
  if (pathname.startsWith("/admin")) {
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protected dashboard routes → need access_key
  const needsKey =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/tests") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/ai-mentor") ||
    pathname.startsWith("/profile");

  if (needsKey && profile?.role !== "admin" && !profile?.access_key_id) {
    const url = request.nextUrl.clone();
    url.pathname = "/activate";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
