'use client';
import Link from 'next/link';
import { Send, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import ComposeModal from './ComposeModal';

function SidebarContent() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = pathname?.includes('/sent') ? 'sent' : 'scheduled';
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);

  useEffect(() => {
    if (searchParams.get('slack') === 'success') {
      setSlackConnected(true);
    } else if (session?.user?.email) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/users/${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data?.slackWebhook) {
            setSlackConnected(true);
          }
        })
        .catch(console.error);
    }
  }, [searchParams, session]);

  return (
    <div className="w-64 bg-white border-r h-screen p-6 flex flex-col">
      <div className="text-3xl font-black tracking-widest mb-6">ONB</div>
      
      {session?.user && (
        <div className="flex items-center space-x-3 mb-6 p-2 bg-[#f8f9f9] rounded-xl border border-gray-100">
          <img
            src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=random`}
            alt="Avatar"
            className="w-10 h-10 rounded-full bg-gray-200 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{session.user.name}</p>
            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsComposeOpen(true)}
        className="w-full bg-white border border-green-500 text-green-600 font-medium py-2 rounded-full mb-6 hover:bg-green-50 transition-colors"
      >
        Compose
      </button>

      <div className="text-xs text-gray-400 font-semibold mb-2">CORE</div>
      
      <nav className="flex-1 space-y-2">
        <Link href="/dashboard" className={`flex items-center justify-between p-2 rounded-lg ${currentTab === 'scheduled' ? 'bg-green-50 text-gray-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <div className="flex items-center space-x-3">
            <Clock size={18} className={currentTab === 'scheduled' ? 'text-green-600' : ''} />
            <span>Scheduled</span>
          </div>
        </Link>
        <Link href="/dashboard/sent" className={`flex items-center justify-between p-2 rounded-lg ${currentTab === 'sent' ? 'bg-green-50 text-gray-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <div className="flex items-center space-x-3">
            <Send size={18} className={currentTab === 'sent' ? 'text-green-600' : ''} />
            <span>Sent</span>
          </div>
        </Link>
      </nav>
      
      <div className="mt-auto space-y-4">
        {session?.user && (
          slackConnected ? (
            <button
              onClick={async () => {
                try {
                  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/slack/disconnect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: session.user?.email })
                  });
                  setSlackConnected(false);
                } catch (e) {
                  console.error('Failed to disconnect Slack', e);
                }
              }}
              title="Click to disconnect"
              className="flex items-center space-x-2 w-full p-2 text-sm font-medium rounded-lg transition-colors border justify-center bg-[#f6fcf8] text-[#0FA44A] border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group"
            >
              <CheckCircle2 size={16} className="group-hover:hidden" />
              <span className="group-hover:hidden">Slack Connected</span>
              <span className="hidden group-hover:inline">Disconnect Slack</span>
            </button>
          ) : (
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/slack/auth?email=${session.user.email}`}
              className="flex items-center space-x-2 w-full p-2 text-sm font-medium rounded-lg transition-colors border justify-center text-gray-700 hover:bg-gray-100 border-gray-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521h-6.313A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.313zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.52-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
              <span>Connect Slack</span>
            </a>
          )
        )}
        <button 
          onClick={() => signOut()}
          className="flex items-center space-x-3 w-full p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {isComposeOpen && <ComposeModal onClose={() => setIsComposeOpen(false)} />}
    </div>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-64 bg-white border-r flex flex-col h-screen"></div>}>
      <SidebarContent />
    </Suspense>
  );
}
