import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  let hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`;
  }
  
  const searchParams = req.nextUrl.searchParams.toString();
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;
  
  // rewrites for app pages
  if (hostname == `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    const session = await getToken({ req });
    // If there's no session and the path starts with '/verify', proceed without redirecting.
    if (path.startsWith('/verify')) {
      return NextResponse.rewrite(new URL(`/app/verify${url.search}`, url.origin));
    }
    // Redirect to login if no session is found and not already on the login page.
    if (!session && path !== "/login") {
      const error = searchParams.startsWith('error')
      if (error) {
        // error reported
        return NextResponse.rewrite(new URL(`/app/login${url.search}`, url.origin))
      }
      if (path.startsWith('/signup')){
        return NextResponse.rewrite(new URL('/app/signup', url.origin))
      }
      return NextResponse.redirect(new URL("/login", req.url));
    } 

    // If there's a session and the user is on the login page, redirect to the home page.
    else if (session && path == "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // If there's a session and the user is new then redirect to the sign up page
    else if (!session && path == '/signup') {
      return NextResponse.redirect(new URL('/app/signup', req.url))
    }
   
    // Rewrite for app pages
    return NextResponse.rewrite(
      new URL(`/app${path === "/" ? "" : path}`, req.url),
    );
  }

  

  // special case for `vercel.pub` domain
  if (hostname === "vercel.pub") {
    return NextResponse.redirect(
      "https://vercel.com/blog/platforms-starter-kit",
    );
  }

  // rewrite root application to `/home` folder
  if (
    hostname === "localhost:3000" ||
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ) {
    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url),
    );
  }

  // rewrite everything else to `/[domain]/[slug] dynamic route
  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
  }

