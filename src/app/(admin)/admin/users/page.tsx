import { getUsers } from './actions'
import UsersPageClient from './UsersPageClient'
import { getServerLanguage, translateServer } from '@/lib/server-i18n'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    const users = await getUsers()
    const language = await getServerLanguage()
    const tx = (key: string) => translateServer(key, language)

    return (
        <div className="flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">{tx('admin.users_title')}</h1>
                    <p className="text-muted-foreground">{tx('admin.users_desc')}</p>
                </div>
            </div>

            <UsersPageClient initialUsers={users} />
        </div>
    )
}
