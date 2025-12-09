import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { WalletProvider } from '@/contexts/WalletContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </WalletProvider>
  );
}
