export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex justify-center items-center py-24 min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8 relative overflow-hidden">
                {/* Subtle decorative elements for the auth card */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <div className="absolute opacity-5 pointer-events-none inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] mix-blend-multiply"></div>
                {children}
            </div>
        </div>
    )
}
