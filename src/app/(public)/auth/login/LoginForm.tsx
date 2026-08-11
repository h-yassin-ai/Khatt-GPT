'use client'

import Link from 'next/link'
import { login } from '../auth-actions'
import { useLanguage } from '@/lib/language-context'

export function LoginForm({ error }: { error?: string }) {
    const { lang } = useLanguage()
    const copy = {
        en: { title: 'Welcome back', desc: 'Enter your email and password to log in', email: 'Email', password: 'Password', submit: 'Sign in', question: 'Don’t have an account?', link: 'Sign up', generic: 'Unable to authenticate. Check your details and try again.', placeholder: 'scholar@university.edu' },
        fr: { title: 'Bienvenue', desc: 'Saisissez votre adresse e-mail et votre mot de passe pour vous connecter', email: 'E-mail', password: 'Mot de passe', submit: 'Se connecter', question: 'Vous n’avez pas encore de compte ?', link: 'Créer un compte', generic: 'Connexion impossible. Vérifiez vos identifiants et réessayez.', placeholder: 'chercheur@universite.edu' },
        ar: { title: 'مرحباً بعودتك', desc: 'أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول', email: 'البريد الإلكتروني', password: 'كلمة المرور', submit: 'تسجيل الدخول', question: 'ليس لديك حساب؟', link: 'إنشاء حساب', generic: 'تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.', placeholder: 'scholar@university.edu' },
    }[lang]

    return (
        <div className="flex flex-col gap-6 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-heading font-semibold tracking-tight">{copy.title}</h1>
                <p className="text-sm text-muted-foreground font-sans">{copy.desc}</p>
            </div>

            {error && <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">{copy.generic}</div>}

            <form className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none text-foreground">{copy.email}</label>
                    <input id="email" name="email" type="email" placeholder={copy.placeholder} required autoComplete="email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none text-foreground">{copy.password}</label>
                    <input id="password" name="password" type="password" required autoComplete="current-password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                </div>
                <button formAction={login} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2">{copy.submit}</button>
            </form>
            <div className="text-center text-sm text-muted-foreground mt-4">
                {copy.question}{' '}
                <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary transition-colors">{copy.link}</Link>
            </div>
        </div>
    )
}
