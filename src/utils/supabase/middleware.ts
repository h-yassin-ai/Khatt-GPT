import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-url', request.url)
    requestHeaders.set('x-pathname', request.nextUrl.pathname)

    let supabaseResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public routes that don't need auth checking
    const isPublicRoute = 
        pathname === '/' || 
        pathname.startsWith('/auth') || 
        pathname === '/manifest.webmanifest' ||
        pathname === '/favicon.ico' ||
        pathname === '/sw.js'

    // Not logged in and trying to access protected route
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // Admin route protection
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
        if (!user.email || !adminEmails.includes(user.email)) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // Already logged in, trying to access auth pages (signout must be allowed through)
    if (user && pathname.startsWith('/auth') && pathname !== '/auth/signout') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
