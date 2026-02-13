import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Mic, MicOff, Moon, Sun, ExternalLink, FileText, Upload, Code, AlertCircle, RefreshCcw, Trash2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types';
import { arrayBufferToBase64 } from '../utils/audioUtils';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string, imageBase64?: string) => void;
  onFileUpload: (content: string, filename: string) => void;
  isConnected: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  error?: string | null;
  onReconnect?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ 
    isOpen, onClose, messages, onSendMessage, onFileUpload, isConnected, isMuted, toggleMute, isDarkMode, toggleTheme, error, onReconnect
}) => {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;
    
    onSendMessage(inputText, selectedImage || undefined);
    setInputText("");
    setSelectedImage(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const buffer = await file.arrayBuffer();
          const base64 = arrayBufferToBase64(buffer);
          setSelectedImage(base64);
      }
      e.target.value = "";
  };

  const handleBookSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      onFileUpload(text, file.name);
    }
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) {
        if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
             const text = await file.text();
             onFileUpload(text, file.name);
        } else if (file.type.startsWith('image/')) {
            const buffer = await file.arrayBuffer();
            const base64 = arrayBufferToBase64(buffer);
            setSelectedImage(base64);
        } else {
            alert("يرجى رفع ملف نصي (.txt أو .md) أو صورة.");
        }
    }
  };

  const theme = {
    container: isDarkMode ? 'bg-slate-900 border-l border-slate-700' : 'bg-white border-l border-slate-200',
    header: isDarkMode ? 'border-slate-800 bg-slate-900/95 text-slate-100' : 'border-slate-100 bg-white/95 text-slate-800',
    subheader: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    body: isDarkMode ? 'bg-slate-900' : 'bg-slate-50',
    inputArea: isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
    inputField: isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400',
    userBubble: 'bg-blue-600 text-white',
    modelBubble: isDarkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200 shadow-sm',
    iconButton: isDarkMode ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-400 hover:text-blue-600',
    sendButton: isDarkMode ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-blue-600 hover:bg-blue-500',
    dragOverlay: isDarkMode ? 'bg-slate-900/95 border-cyan-500 text-cyan-500' : 'bg-white/95 border-blue-500 text-blue-600'
  };

  return (
    <div className={`fixed pointer-events-auto top-0 right-0 h-full w-full md:w-[420px] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${theme.container} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      
      <div className={`px-6 py-5 border-b backdrop-blur flex justify-between items-center flex-shrink-0 ${theme.header}`}>
         <div>
            <h2 className="text-lg font-bold tracking-tight">ALEXA</h2>
            <div className="flex flex-col mt-1">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500 animate-pulse' : (error ? 'bg-red-500' : 'bg-slate-400')}`}></span>
                    <p className={`text-xs font-medium ${theme.subheader}`}>
                        {error ? 'Connection Error' : 'Bioinformatics Gate'}
                    </p>
                </div>
            </div>
         </div>
         <div className="flex items-center gap-1">
             <button onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'text-red-500 hover:bg-red-500/10' : theme.iconButton}`} title={isMuted ? "تفعيل المايك" : "كتم المايك"}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
             </button>
             <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme.iconButton}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme.iconButton}`}>
                <X size={24} />
             </button>
         </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
              <AlertCircle size={14} />
              <span>{error}</span>
           </div>
           <button onClick={onReconnect} className="p-1.5 hover:bg-red-500/20 rounded-md text-red-500 transition-colors">
              <RefreshCcw size={14} />
           </button>
        </div>
      )}

      <div className={`relative flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide ${theme.body}`}>
         {/* Hidden Drag Overlay - only shows during active drag */}
         {isDragging && (
             <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 ${theme.dragOverlay}`}>
                <div className="p-8 border-4 border-dashed rounded-3xl flex flex-col items-center gap-4 border-current">
                  <Upload size={64} className="animate-bounce" />
                  <h3 className="text-2xl font-bold">أفلت الملف هنا</h3>
                  <p className="text-sm opacity-80">سأبدأ في تحليل الكتاب فوراً يا دكتور</p>
                </div>
             </div>
         )}

         {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center space-y-6 text-center py-10">
                 <div className={`p-6 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} animate-float`}>
                    <BookOpen size={48} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
                 </div>
                 
                 <div className="space-y-2">
                   <p className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>مرحباً بك في دراستك اليوم</p>
                   <p className={`text-sm px-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     أنا أليكسا، رفيقتك لتعلم هذا الكتاب. ابدأ بسؤالي أو قم بسحب وإفلات ملف الكتاب (TXT/MD) في أي مكان هنا.
                   </p>
                 </div>
             </div>
         ) : (
             messages.map((msg) => (
                 <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                     <div className={`max-w-[95%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${msg.role === 'user' ? theme.userBubble : theme.modelBubble}`}>
                         <ReactMarkdown components={{
                                code({node, inline, className, children, ...props}: any) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                      <div className="my-3 rounded-xl overflow-hidden border border-slate-700/50 shadow-md">
                                          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                                              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">{match[1]}</span>
                                              <Code size={14} className="text-slate-400" />
                                          </div>
                                          <SyntaxHighlighter 
                                            style={vscDarkPlus} 
                                            language={match[1]} 
                                            PreTag="div" 
                                            customStyle={{ 
                                              margin: 0, 
                                              borderRadius: 0, 
                                              fontSize: '0.85rem',
                                              padding: '1rem',
                                              background: isDarkMode ? '#1e293b' : '#0f172a'
                                            }} 
                                            {...props}
                                          >
                                              {String(children).replace(/\n$/, '')}
                                          </SyntaxHighlighter>
                                      </div>
                                  ) : (
                                      <code className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${msg.role === 'user' ? 'bg-blue-700/50 text-white' : (isDarkMode ? 'bg-slate-700 text-cyan-200' : 'bg-slate-200 text-slate-800')}`} {...props}>{children}</code>
                                  )
                                },
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="pl-1">{children}</li>,
                                a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-90 hover:opacity-100 font-semibold">{children}</a>
                            }}>
                            {msg.text}
                         </ReactMarkdown>
                     </div>
                     {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                         <div className={`mt-2 max-w-[85%] flex flex-wrap gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.groundingChunks.map((chunk, idx) => (
                                <a key={idx} href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isDarkMode ? 'border-slate-700 bg-slate-800 text-cyan-400 hover:bg-slate-700' : 'border-slate-200 bg-white text-blue-600 hover:bg-slate-50 shadow-sm'}`}>
                                    <ExternalLink size={10} />
                                    <span className="truncate max-w-[150px]">{chunk.web?.title || "Source"}</span>
                                </a>
                            ))}
                         </div>
                     )}
                 </div>
             ))
         )}
         <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t flex-shrink-0 flex flex-col gap-3 ${theme.inputArea}`}>
         {selectedImage && (
             <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-cyan-500 shadow-lg group">
                <img src={`data:image/jpeg;base64,${selectedImage}`} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
             </div>
         )}

         <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <div className="flex gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-full transition-colors ${theme.iconButton}`} title="إرفاق صورة">
                    <ImageIcon size={18} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                
                <button type="button" onClick={() => bookInputRef.current?.click()} className={`p-2.5 rounded-full transition-colors ${theme.iconButton}`} title="رفع كتاب جديد">
                    <FileText size={18} />
                </button>
                <input type="file" ref={bookInputRef} className="hidden" accept=".txt,.md" onChange={handleBookSelect} />
            </div>
            
            <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              placeholder={selectedImage ? "اسألني عن الصورة.." : (isConnected ? "اكتب رسالتك يا دكتور.." : "مقطوع الاتصال")} 
              disabled={!isConnected} 
              className={`flex-1 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm ${theme.inputField}`} 
            />
            
            <button 
              type="submit" 
              disabled={!isConnected || (!inputText.trim() && !selectedImage)} 
              className={`p-3 rounded-full text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${theme.sendButton}`}
            >
                <Send size={18} />
            </button>
         </form>

         <div className="flex justify-center w-full">
            <p className={`text-[10px] opacity-60 font-medium ${theme.subheader}`}>Developed by Israa M Shamkh</p>
         </div>
      </div>
    </div>
  );
};