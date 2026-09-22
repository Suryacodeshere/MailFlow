'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Star, Archive, Trash2, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ViewEmail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/emails/${params.id}`)
        .then(res => {
          setEmail(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [params?.id]);

  if (loading) {
    return <div className="p-8 text-gray-400">Loading email...</div>;
  }

  if (!email) {
    return <div className="p-8 text-gray-400">Email not found.</div>;
  }

  // Parse time
  const timeToShow = email.status === 'SENT' ? email.updatedAt : email.scheduledAt;
  const formattedDate = format(new Date(timeToShow), 'MMM d, h:mm a');

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/emails/${params.id}`);
      router.back();
    } catch (err) {
      console.error(err);
      alert('Failed to delete email');
      setLoading(false);
    }
  };

  const handleToggle = async (field: 'starred' | 'archived') => {
    try {
      const newValue = !email[field];
      setEmail({ ...email, [field]: newValue });
      await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/emails/${params.id}`, {
        [field]: newValue
      });
    } catch (err) {
      console.error(`Failed to toggle ${field}:`, err);
      // Revert optimistic update
      setEmail({ ...email, [field]: email[field] });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 transition-colors mt-0.5">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-[22px] text-gray-800 font-normal truncate max-w-[700px]">
            {email.subject}
          </h1>
        </div>
        <div className="flex items-center space-x-6 text-gray-400">
          <button onClick={() => handleToggle('starred')} className={`transition-colors ${email.starred ? 'text-yellow-400 hover:text-yellow-500' : 'hover:text-gray-600'}`}>
            <Star size={20} strokeWidth={1.5} fill={email.starred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => handleToggle('archived')} className={`transition-colors ${email.archived ? 'text-blue-500 hover:text-blue-600' : 'hover:text-gray-600'}`}>
            <Archive size={20} strokeWidth={1.5} fill={email.archived ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleDelete} className="hover:text-red-600 transition-colors"><Trash2 size={20} strokeWidth={1.5} /></button>
          <div className="w-px h-6 bg-gray-200 mx-2"></div>
          {session?.user && (
            <img 
              src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=random`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full bg-gray-200 object-cover"
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto px-8 py-10 flex">
          
          {/* Avatar Column (Hanging to the left) */}
          <div className="mr-5 mt-1">
            <div className="w-11 h-11 rounded-full bg-[#0FA44A] text-white flex items-center justify-center font-medium text-lg">
              {session?.user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>

          {/* Content Column */}
          <div className="flex-1">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 text-[15px]">{session?.user?.name || 'Amanda Clark'}</span>
                  <span className="text-gray-400 text-[14px]">&lt;{session?.user?.email || 'sender@example.com'}&gt;</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500 text-[13px] mt-0.5">
                  <span>to me</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>
              
              <div className="text-gray-400 text-[13px]">
                {formattedDate}
              </div>
            </div>

            {/* Email Body */}
            <div 
              className="text-gray-800 text-[15px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-yellow-400 [&_blockquote]:bg-yellow-50 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:py-3 [&_blockquote]:my-4 [&_blockquote]:rounded-r-lg [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-2 [&_a]:text-blue-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
