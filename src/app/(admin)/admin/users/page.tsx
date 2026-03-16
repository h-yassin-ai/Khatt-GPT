import { getUsers } from './actions'
import UsersPageClient from './UsersPageClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    const users = await getUsers()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">User Management</h1>
                    <p className="text-muted-foreground">Monitor activity and manage contributor access.</p>
                </div>
            </div>

            <UsersPageClient initialUsers={users} />
        </div>
    )
}
