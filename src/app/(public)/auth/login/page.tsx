import { LoginForm } from './LoginForm'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    return <LoginForm error={searchParams?.error} />
}
