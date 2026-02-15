import React, { useState, useEffect } from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { ChatDrawer } from './components/ChatDrawer';
import { useLiveSession } from './hooks/useLiveSession';
import { HARDCODED_BOOK_CONTENT } from './constants';

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const {
    connect,
    reconnect,
    disconnect,
    isConnected,
    isSpeaking,
    isMuted,
    toggleMute,
    volume,
    messages,
    error,
    sendText,
    notifyNewContent
  } = useLiveSession();

  useEffect(() => {
    if (HARDCODED_BOOK_CONTENT && HARDCODED_BOOK_CONTENT.length > 50) {
      connect(HARDCODED_BOOK_CONTENT);
    }
  }, [connect]);

  const handleBookUpload = (content: string, filename: string) => {
    // تحديث المحتوى دون قطع الاتصال بالكامل إذا أمكن، أو إعادة الاتصال مع إشعار
    disconnect();
    setTimeout(() => {
        connect(content);
        // إبلاغ أليكسا بالمحتوى الجديد في الشات
        notifyNewContent(filename);
    }, 500);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <>
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden font-sans">
        <VoiceOrb 
            isConnected={isConnected} 
            isModelSpeaking={isSpeaking}
            isMuted={isMuted}
            toggleMute={toggleMute}
            userVolume={volume}
            onClick={() => setIsDrawerOpen(true)}
            isDarkMode={isDarkMode}
            error={error}
            onReconnect={reconnect}
        />

        <ChatDrawer 
            isOpen={isDrawerOpen} 
            onClose={() => setIsDrawerOpen(false)}
            messages={messages}
            onSendMessage={sendText}
            onFileUpload={handleBookUpload}
            isConnected={isConnected}
            isMuted={isMuted}
            toggleMute={toggleMute}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            error={error}
            onReconnect={reconnect}
        />
      </div>
    </>
  );
}