'use client';
'use client';
import React, { useState, KeyboardEvent, useRef } from 'react';
import { X, ChevronDown as ChevronDownIcon, Clock, Paperclip, ArrowLeft, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, ListOrdered, List, IndentDecrease, IndentIncrease, Type, ChevronDown, Undo, Redo, Quote, FileCode, Link, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function ComposeModal({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [to, setTo] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [delayBetween, setDelayBetween] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('');
  const [alignIndex, setAlignIndex] = useState(0);
  const [headingIndex, setHeadingIndex] = useState(0);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isAttached, setIsAttached] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvCount, setCsvCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const emails = results.data
            .map((row: any) => row.email || row[0])
            .filter((email: string) => email && email.includes('@'));
          setTo([...to, ...emails]);
          setCsvCount(emails.length);
        },
        header: true
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsAttached(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim().replace(',', '');
      if (val && !to.includes(val)) {
        setTo([...to, val]);
        setInputValue('');
      }
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTo(to.filter((_, index) => index !== indexToRemove));
  };

  const handleSend = async () => {
    try {
      setIsScheduling(true);
      setError(null);
      
      let finalRecipients = [...to];
      const leftoverEmail = inputValue.trim().replace(',', '');
      if (leftoverEmail) {
        if (!finalRecipients.includes(leftoverEmail)) {
          finalRecipients.push(leftoverEmail);
        }
        setTo(finalRecipients);
        setInputValue('');
      }

      if (finalRecipients.length === 0) {
        setError('Please enter at least one recipient email address.');
        setIsScheduling(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      
      let finalBody = body;
      if (isAttached && imagePreview) {
        finalBody += `
          <div style="display: flex; gap: 16px; margin-top: 32px;">
            <a href="${imagePreview}" download="Attached_Image.png" style="text-decoration: none; display: block; width: 220px; border-radius: 12px; overflow: hidden; border: 1px solid #f3f4f6; font-family: sans-serif; background: #fafafa; cursor: pointer; transition: transform 0.2s;">
              <img src="${imagePreview}" style="width: 100%; height: 140px; object-fit: cover; border-bottom: 1px solid #f3f4f6;" />
              <div style="padding: 12px 16px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Attached_Image.png</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">1.2 MB</p>
              </div>
            </a>
          </div>
        `;
      }

      const res = await axios.post(`${backendUrl}/api/schedule`, {
        userEmail: session?.user?.email,
        subject,
        body: finalBody,
        recipients: finalRecipients,
        delayBetween: delayBetween ? parseInt(delayBetween) : 0,
        hourlyLimit: hourlyLimit ? parseInt(hourlyLimit) : 0,
        scheduledAt: scheduledAt?.toISOString()
      });
      onClose();
    } catch (error) {
      console.error(error);
      setError('Failed to schedule emails. Please check if backend is running.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-[950px] h-[90vh] max-h-[750px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        {error && <div className="bg-red-50 text-red-600 p-3 text-sm font-medium border-b border-red-100 flex justify-between items-center"><span>{error}</span><button onClick={() => setError(null)}><X size={16}/></button></div>}
        
        {/* Header */}
        <div className="flex justify-between items-center px-10 py-5 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h2 className="text-xl text-gray-800">Compose New Email</h2>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="text-[#0FA44A] hover:text-[#0d8f40] transition-colors mr-4 relative"
            >
              <Paperclip size={18} strokeWidth={1.5} />
              {isAttached && (
                <span className="absolute -bottom-1 -right-1 bg-gray-100 text-[#0FA44A] text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-medium border border-white">1</span>
              )}
            </button>
            <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageUpload} />
            <button className="text-[#0FA44A] hover:text-[#0d8f40] transition-colors mr-6" onClick={() => setShowDatePicker(!showDatePicker)}>
              <Clock size={18} strokeWidth={1.5} />
            </button>
            <button 
              onClick={handleSend}
              disabled={isScheduling}
              className="bg-white text-[#0FA44A] border border-[#0FA44A] px-5 py-1.5 text-sm rounded-full font-medium hover:bg-[#0FA44A] hover:text-white transition-colors"
            >
              <span>{isScheduling ? 'Sending...' : (scheduledAt ? 'Send Later' : 'Send')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-10 py-6 overflow-y-auto">
          <div className="space-y-6 max-w-[700px] mx-auto ml-16">
            
            <div className="flex items-center space-x-6 relative">
              <span className="text-gray-800 w-12 text-[15px]">From</span>
              <div className="bg-[#f8f9f9] px-4 py-2 rounded-lg text-sm text-gray-700 flex items-center space-x-2">
                <span>{session?.user?.email || 'oliver.brown@domain.io'}</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </div>
            </div>

            <div className="flex items-start space-x-6 relative border-b border-gray-100 pb-3">
              <span className="text-gray-800 w-12 text-[15px] mt-1.5">To</span>
              <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[36px]">
                {to.slice(0, 3).map((email, idx) => (
                  <span key={idx} className="border border-[#0FA44A] text-[#0FA44A] px-3 py-1 rounded-full text-sm flex items-center bg-white">
                    {email}
                    <button onClick={() => removeTag(idx)} className="ml-1 hover:text-green-800"><X size={12} /></button>
                  </span>
                ))}
                {to.length > 3 && (
                  <span className="border border-[#0FA44A] text-[#0FA44A] px-3 py-1 rounded-full text-sm flex items-center bg-white">
                    +{to.length - 3}
                  </span>
                )}
                
                <input 
                  type="text" 
                  className="outline-none py-1 text-sm flex-1 min-w-[120px] bg-transparent"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Upload List perfectly matching Figma */}
              <button onClick={() => fileInputRef.current?.click()} className="absolute right-0 top-2 text-[#0FA44A] flex items-center space-x-1.5 text-[15px] hover:text-[#0d8f40] transition-colors">
                <Upload size={16} />
                <span>Upload List</span>
              </button>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              {csvCount !== null && <div className="text-xs text-green-600 font-medium absolute right-0 top-8 mt-1">{csvCount} email addresses detected</div>}
            </div>

            <div className="flex items-center space-x-6 border-b border-gray-100 pb-4">
              <span className="text-gray-800 w-12 text-[15px]">Subject</span>
              <input 
                type="text" 
                placeholder="Subject" 
                className="outline-none py-1 text-[15px] flex-1 bg-transparent placeholder:text-gray-400"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-8 py-2">
              <div className="flex items-center space-x-4">
                <span className="text-[15px] text-gray-800">Delay between 2 emails (sec)</span>
                <input 
                  type="number" 
                  min="0"
                  className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#0FA44A]" 
                  placeholder="00" 
                  value={delayBetween}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= 0) setDelayBetween(e.target.value);
                  }}
                />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-[15px] text-gray-800">Hourly Limit</span>
                <input 
                  type="number" 
                  min="0"
                  className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#0FA44A]" 
                  placeholder="00" 
                  value={hourlyLimit}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= 0) setHourlyLimit(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 bg-[#f8f9f9] rounded-2xl flex flex-col border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-colors min-h-[320px] relative p-4">
               {/* Rich Text Toolbar perfectly matching Figma floating at top */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 text-gray-400 p-2.5 px-6 mb-4 w-full">
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }} className="hover:text-gray-600"><Undo size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo'); }} className="hover:text-gray-600"><Redo size={18} strokeWidth={1.5} /></button>
                 
                 <div className="w-px h-5 bg-gray-200 mx-1"></div>
                 
                 <button onMouseDown={(e) => { 
                   e.preventDefault(); 
                   const next = (headingIndex + 1) % 3; 
                   setHeadingIndex(next); 
                   document.execCommand('formatBlock', false, ['P', 'H1', 'H2'][next]); 
                 }} className="flex items-center hover:text-gray-600 space-x-1">
                    <Type size={18} strokeWidth={1.5} />
                    <span className="text-xs font-bold w-4">{['P', 'H1', 'H2'][headingIndex]}</span>
                    <ChevronDown size={14} />
                 </button>
                 
                 <div className="w-px h-5 bg-gray-200 mx-1"></div>
                 
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="hover:text-gray-800 text-[15px] font-bold font-serif text-gray-600">B</button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="hover:text-gray-800 text-[15px] italic font-serif text-gray-600">I</button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }} className="hover:text-gray-800 text-[15px] underline font-serif text-gray-600">U</button>
                 
                 <div className="w-px h-5 bg-gray-200 mx-1"></div>
                 
                 <button onMouseDown={(e) => { 
                   e.preventDefault(); 
                   const next = (alignIndex + 1) % 3; 
                   setAlignIndex(next); 
                   document.execCommand(['justifyLeft', 'justifyCenter', 'justifyRight'][next]); 
                 }} className="flex items-center hover:text-gray-600 space-x-1">
                    {alignIndex === 0 && <AlignLeft size={18} strokeWidth={1.5} />}
                    {alignIndex === 1 && <AlignCenter size={18} strokeWidth={1.5} />}
                    {alignIndex === 2 && <AlignRight size={18} strokeWidth={1.5} />}
                    <ChevronDown size={14} />
                 </button>
                 
                 <div className="w-px h-5 bg-gray-200 mx-1"></div>
                 
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }} className="hover:text-gray-600"><ListOrdered size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} className="hover:text-gray-600"><List size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('outdent'); }} className="hover:text-gray-600"><IndentDecrease size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('indent'); }} className="hover:text-gray-600"><IndentIncrease size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'BLOCKQUOTE'); }} className="hover:text-gray-600"><Quote size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'PRE'); }} className="hover:text-gray-600"><FileCode size={18} strokeWidth={1.5} /></button>
                 <button onMouseDown={(e) => { 
                   e.preventDefault(); 
                   const selection = window.getSelection();
                   if (!selection || selection.toString().trim().length === 0) {
                     alert("Please highlight the text you want to link first.");
                     return;
                   }
                   const url = prompt('Enter link URL:', 'https://'); 
                   if (url) document.execCommand('createLink', false, url); 
                 }} className="hover:text-gray-600"><Link size={18} strokeWidth={1.5} /></button>
               </div>
               
               <div 
                 contentEditable
                 className="w-full max-w-full flex-1 bg-transparent outline-none text-[15px] text-gray-800 px-2 min-h-[150px] overflow-y-auto overflow-x-hidden break-words whitespace-pre-wrap focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-2 [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-2 [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer" 
                 // @ts-ignore
                 data-placeholder="Type Your Reply..."
                 onInput={e => setBody(e.currentTarget.innerHTML)}
               />

               {/* Mock Attachment Image */}
               {isAttached && imagePreview && (
                 <div className="mt-4 max-w-[200px] rounded-lg overflow-hidden border border-gray-200">
                   <img src={imagePreview} alt="Attachment" className="w-full h-auto object-cover" />
                 </div>
               )}
            </div>
            
          </div>
        </div>

        {/* Date Picker Overlay */}
        {showDatePicker && (
          <div className="absolute top-20 right-8 w-[320px] bg-white border shadow-xl rounded-xl z-20 overflow-hidden flex flex-col">
            <div className="p-4 py-3">
              <h3 className="font-semibold text-gray-800 text-[15px]">Send Later</h3>
            </div>
            
            <div className="px-4 pb-4">
              <input 
                type="datetime-local" 
                className="w-full text-sm text-gray-500 outline-none placeholder-gray-400 border-b pb-2 mb-4 cursor-pointer"
                onChange={(e) => setScheduledAt(new Date(e.target.value))}
              />
              
              <div className="space-y-3.5">
                <button 
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 1); setScheduledAt(d);
                  }}
                  className="block text-[15px] font-medium text-gray-500 hover:text-gray-800 text-left w-full transition-colors"
                >
                  Tomorrow
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); setScheduledAt(d);
                  }}
                  className="block text-[15px] font-medium text-gray-500 hover:text-gray-800 text-left w-full transition-colors"
                >
                  Tomorrow, 10:00 AM
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(11, 0, 0, 0); setScheduledAt(d);
                  }}
                  className="block text-[15px] font-medium text-gray-500 hover:text-gray-800 text-left w-full transition-colors"
                >
                  Tomorrow, 11:00 AM
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(15, 0, 0, 0); setScheduledAt(d);
                  }}
                  className="block text-[15px] font-medium text-gray-500 hover:text-gray-800 text-left w-full transition-colors"
                >
                  Tomorrow, 3:00 PM
                </button>
              </div>
            </div>

            <div className="flex justify-end items-center space-x-4 p-4 py-3">
              <button onClick={() => { setShowDatePicker(false); setScheduledAt(null); }} className="text-[14px] font-bold text-gray-700 hover:text-gray-900">Cancel</button>
              <button 
                onClick={() => {
                  if (!scheduledAt) setScheduledAt(new Date(Date.now() + 86400000));
                  setShowDatePicker(false);
                }} 
                className="text-[14px] font-semibold text-[#0FA44A] border-2 border-[#0FA44A] rounded-full px-6 py-1.5 hover:bg-[#0FA44A] hover:text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
