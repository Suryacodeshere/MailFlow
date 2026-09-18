'use client';
import { Filter, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function HeaderActions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSort = (order: 'desc' | 'asc') => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', order);
    router.replace(`${pathname}?${params.toString()}`);
    setShowFilter(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center space-x-1 text-gray-400 relative" ref={filterRef}>
      <button 
        onClick={() => setShowFilter(!showFilter)} 
        className={`hover:text-gray-600 transition-colors p-2 ${showFilter ? 'text-gray-600 bg-gray-100 rounded-md' : ''}`}
      >
        <Filter size={18} strokeWidth={1.5} />
      </button>
      
      {showFilter && (
        <div className="absolute top-10 right-10 bg-white border shadow-lg rounded-xl w-40 z-50 overflow-hidden text-sm text-gray-700">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border-b">Sort By Date</div>
          <button onClick={() => handleSort('desc')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50">Newest first</button>
          <button onClick={() => handleSort('asc')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-t">Oldest first</button>
        </div>
      )}

      <button onClick={handleRefresh} className="hover:text-gray-600 transition-colors p-2"><RefreshCw size={18} strokeWidth={1.5} /></button>
    </div>
  );
}
