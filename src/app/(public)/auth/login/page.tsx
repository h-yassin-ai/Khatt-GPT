import Link from 'next/link'
import { login } from '../auth-actions'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    const error = searchParams?.error

    return (
        <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-heading font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground font-sans">
                    Enter your email and password to log in
                </p>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">
                    {error}
                </div>
            )}

            <form className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none text-foreground">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="scholar@university.edu"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium leading-none text-foreground">
                            Password
                        </label>
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <button
                    formAction={login}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2"
                >
                    Sign in
                </button>
            </form>
            <div className="text-center text-sm text-muted-foreground mt-4">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary transition-colors">
                    Sign up
                </Link>
            </div>
        </div>
    )
}
