import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

export default function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/40">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {modal}
    </div>
  );
}