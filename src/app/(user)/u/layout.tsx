import Header from "@/components/header";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header />

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}