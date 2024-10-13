import { PARTNER_SUBDOMAIN } from '@/constants/partners';
import getSubdomains from '@/lib/utils/getSubdomains';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // for vercel deployment, skip the middleware
  if (request.nextUrl.host.includes('vercel.app')) {
    return NextResponse.next();
  }

  const subdomain = getSubdomains(request.nextUrl.href);

  // If there are no subdomains, continue to the next middleware
  if (!subdomain) {
    return NextResponse.next();
  }

  // If the subdomain is poc, continue to the next middleware
  if (subdomain === 'poc') {
    return NextResponse.next();
  }

  // If the subdomain is explorer.routerintents.com, redirect to paths starting with `/tx`
  if (subdomain === 'explorer') {
    // If the path starts with `/tx`, continue to the next middleware
    if (request.nextUrl.pathname.startsWith('/tx')) {
      return NextResponse.next();
    }

    // Redirect to `/tx`
    return NextResponse.redirect(new URL('/tx', 'https://explorer.routerintents.com'));
  }

  // If the subdomain is in the PARTNER_SUBDOMAIN object, redirect to the correct path
  // https://partner.routerintents.com/ => https://partner.routerintents.com/app/partner
  // for all paths except /app/partner and /tx, redirect to /app/partner
  if (PARTNER_SUBDOMAIN[subdomain]) {
    const partner = PARTNER_SUBDOMAIN[subdomain];

    if (request.nextUrl.pathname !== `/apps/${partner}` && !request.nextUrl.pathname.startsWith('/tx')) {
      return NextResponse.redirect(new URL(`/apps/${partner}`, request.nextUrl.href));
    }
    return NextResponse.next();
  }

  // If the subdomain is not in the PARTNER_SUBDOMAIN object
  // https://not-partner.routerintents.com/ => https://poc.routerintents.com
  return NextResponse.redirect(new URL('/', 'https://poc.routerintents.com'));
}

export const config = {
  matcher: [
    '/',
    '/apps/:path*',
    '/tx/:path*',
    '/all',
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // {
    //   source: '/((?!api|_next/static|_next/image|favicon.ico|images|mainfest.webmanifest).*)',
    //   missing: [
    //     { type: 'header', key: 'next-router-prefetch' },
    //     { type: 'header', key: 'purpose', value: 'prefetch' },
    //   ],
    // },
  ],
};
