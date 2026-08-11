import { RegisterForm } from './RegisterForm'

export default async function RegisterPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    return <RegisterForm error={searchParams?.error} />
}
