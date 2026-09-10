import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = (pathname: string) =>
    pathname === '/' ||
    pathname === '/corpus' ||
    pathname.startsWith('/corpus/') ||
    pathname === '/research' ||
    pathname === '/propose' ||
    pathname.startsWith('/auth') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'

const publicRoutesWithoutSession = (pathname: string) =>
    pathname === '/' ||
    pathname === '/corpus' ||
    pathname.startsWith('/corpus/') ||
    pathname === '/research' ||
    pathname === '/propose' ||
    pathname.startsWith('/auth') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'

export async function updateSession(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-url', request.url)
    requestHeaders.set('x-pathname', request.nextUrl.pathname)

    const pathname = request.nextUrl.pathname
    const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } })

    // Public pages must remain available even when the auth provider is slow or unavailable.
    if (publicRoutesWithoutSession(pathname)) {
        return nextResponse()
    }

    let supabaseResponse = nextResponse()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user && !publicRoutes(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || []
        if (!user.email || !adminEmails.includes(user.email)) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    if (user && pathname.startsWith('/auth') && pathname !== '/auth/signout') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
