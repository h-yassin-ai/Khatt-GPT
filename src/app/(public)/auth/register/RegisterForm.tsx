'use client'

import Link from 'next/link'
import { signup } from '../auth-actions'
import { useLanguage } from '@/lib/language-context'

export function RegisterForm({ error }: { error?: string }) {
    const { lang } = useLanguage()
    const copy = {
        en: { title: 'Create an account', desc: 'Join the community of transcribers', username: 'Public username', hint: 'This name will be visible on the leaderboard.', email: 'Email', password: 'Password', submit: 'Sign up', question: 'Already have an account?', link: 'Sign in', errorUsername: 'This username is already taken.', errorSpam: 'Sign-up could not be completed.', errorDatabase: 'The platform is not fully configured yet. Please contact the administrator.', generic: 'Unable to create the account. Check your details and try again.', placeholder: 'scholar@university.edu', titleHint: '3–20 characters, letters, numbers or underscores only' },
        fr: { title: 'Créer un compte', desc: 'Rejoignez la communauté des transcripteurs', username: 'Nom d’utilisateur public', hint: 'Ce nom sera visible dans le classement.', email: 'E-mail', password: 'Mot de passe', submit: 'Créer mon compte', question: 'Vous avez déjà un compte ?', link: 'Se connecter', errorUsername: 'Ce nom d’utilisateur est déjà utilisé.', errorSpam: 'La création du compte n’a pas pu aboutir.', errorDatabase: 'La plateforme n’est pas encore totalement configurée. Contactez l’administrateur.', generic: 'Création impossible. Vérifiez vos informations et réessayez.', placeholder: 'chercheur@universite.edu', titleHint: '3 à 20 caractères : lettres, chiffres ou underscores uniquement' },
        ar: { title: 'إنشاء حساب', desc: 'انضم إلى مجتمع الناسخين', username: 'اسم المستخدم العام', hint: 'سيظهر هذا الاسم في قائمة المتصدرين.', email: 'البريد الإلكتروني', password: 'كلمة المرور', submit: 'إنشاء الحساب', question: 'لديك حساب بالفعل؟', link: 'تسجيل الدخول', errorUsername: 'اسم المستخدم هذا مستخدم بالفعل.', errorSpam: 'تعذر إنشاء الحساب.', errorDatabase: 'لم تكتمل تهيئة المنصة بعد. يرجى التواصل مع المشرف.', generic: 'تعذر إنشاء الحساب. تحقق من بياناتك وحاول مرة أخرى.', placeholder: 'scholar@university.edu', titleHint: 'من 3 إلى 20 حرفاً: حروف أو أرقام أو شرطات سفلية فقط' },
    }[lang]
    const errorMessage = error === 'username_taken' ? copy.errorUsername : error === 'auth_spam' ? copy.errorSpam : error === 'auth_database' ? copy.errorDatabase : error ? copy.generic : null

    return (
        <div className="flex flex-col gap-6 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-heading font-semibold tracking-tight">{copy.title}</h1>
                <p className="text-sm text-muted-foreground font-sans">{copy.desc}</p>
            </div>

            {errorMessage && <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">{errorMessage}</div>}

            <form className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <label htmlFor="username" className="text-sm font-medium leading-none text-foreground">{copy.username}</label>
                    <input id="username" name="username" type="text" placeholder="ibn_khaldun_14" required minLength={3} maxLength={20} pattern="^[a-zA-Z0-9_]{3,20}$" title={copy.titleHint} autoComplete="username" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50" />
                    <p className="text-xs text-muted-foreground">{copy.hint}</p>
                </div>
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none text-foreground">{copy.email}</label>
                    <input id="email" name="email" type="email" placeholder={copy.placeholder} required autoComplete="email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50" />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none text-foreground">{copy.password}</label>
                    <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50" />
                </div>
                <div className="hidden" aria-hidden="true"><input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></div>
                <button formAction={signup} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2">{copy.submit}</button>
            </form>
            <div className="text-center text-sm text-muted-foreground mt-4">
                {copy.question}{' '}
                <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary transition-colors">{copy.link}</Link>
            </div>
        </div>
    )
}
