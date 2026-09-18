'use client';
import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { EmailJob } from '@/types';

function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SentList() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('query') || '';
  const sort = searchParams.get('sort') || 'desc';
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }
    const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/emails`);
    url.searchParams.append('userId', session.user.email);
    // Don't pass status param so we get all, then filter below
    if (query) url.searchParams.append('query', query);
    if (sort) url.searchParams.append('sort', sort);

    axios.get(url.toString())
      .then(res => {
        // Filter only Sent or Failed
        const pastEmails = res.data.filter((e: EmailJob) => e.status === 'SENT' || e.status === 'FAILED');
        setEmails(pastEmails);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [session, status, query, sort]);

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all sent and failed emails?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/emails?userId=${session?.user?.email}&status=SENT`);
      setEmails([]);
    } catch (err) {
      console.error(err);
      alert('Failed to clear emails');
    }
  };

  return (
    <div className="p-2">
      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-400">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-400 text-lg">No sent emails yet.</div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <span className="text-gray-500 text-sm">{emails.length} sent email{emails.length !== 1 ? 's' : ''}</span>
            <button 
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
          {emails.map((email: EmailJob) => (
            <div 
              key={email.id} 
              onClick={() => router.push(`/email/${email.id}`)}
              className="flex items-center p-4 bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="w-[300px] font-semibold text-gray-800 truncate">To: {email.recipient}</div>
              <div className="w-[200px] flex items-center space-x-2 text-sm">
                {email.status === 'FAILED' ? (
                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <XCircle size={14} />
                    <span>Failed</span>
                  </span>
                ) : (
                  <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <CheckCircle size={14} />
                    <span>Sent</span>
                  </span>
                )}
                <span className="text-gray-400">{format(new Date(email.updatedAt), 'MMM d, h:mm a')}</span>
              </div>
              <div className="flex-1 text-sm text-gray-500 truncate pl-4">
                <span className="font-semibold text-gray-800 mr-2">
                  <HighlightText text={email.subject} highlight={query} /> - {email.status === 'FAILED' ? 'Failed' : 'Sent'}
                </span>
                <HighlightText text={email.body.replace(/<[^>]+>/g, ' ')} highlight={query} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SentEmails() {
  return (
    <Suspense fallback={<div className="p-2 text-gray-400">Loading...</div>}>
      <SentList />
    </Suspense>
  );
}
