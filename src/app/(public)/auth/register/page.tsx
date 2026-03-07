import Link from 'next/link'
import { signup } from '../auth-actions'

export default async function RegisterPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    const error = searchParams?.error

    return (
        <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-heading font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground font-sans">
                    Join the community of transcribers
                </p>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">
                    {error}
                </div>
            )}

            <form className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <label htmlFor="username" className="text-sm font-medium leading-none text-foreground">
                        Public Username
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="ibn_khaldun_14"
                        required
                        minLength={3}
                        pattern="^[a-zA-Z0-9_]{3,20}$"
                        title="3-20 characters, alphanumeric or underscores only"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">This name will be visible on the leaderboard.</p>
                </div>

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
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                </div>

                <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none text-foreground">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                </div>

                <button
                    formAction={signup}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2"
                >
                    Sign up
                </button>
            </form>
            <div className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary transition-colors">
                    Sign in
                </Link>
            </div>
        </div>
    )
}
