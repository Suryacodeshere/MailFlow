import Sidebar from '@/components/Sidebar';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import SearchBar from '@/components/SearchBar';
import HeaderActions from '@/components/HeaderActions';
import { Suspense } from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-white text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b flex items-center px-8 bg-white">
          <div className="flex items-center space-x-2">
            <Suspense fallback={<div className="w-[800px] h-10 bg-gray-50 rounded-xl"></div>}>
              <SearchBar />
            </Suspense>
            <HeaderActions />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
