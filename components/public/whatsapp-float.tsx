'use client';

import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WhatsAppFloatProps {
  whatsappLink?: string | null;
  phone?: string | null;
}

export function WhatsAppFloat({ whatsappLink, phone }: WhatsAppFloatProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!whatsappLink && !phone) {
    return null;
  }

  const getWhatsAppUrl = () => {
    if (whatsappLink) {
      return whatsappLink.startsWith('http') ? whatsappLink : `https://wa.me/${whatsappLink.replace(/[^0-9]/g, '')}`;
    }
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}`;
    }
    return '#';
  };

  if (!isVisible) return null;

  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      aria-label="Chat on WhatsApp"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
        <MessageCircle className="h-6 w-6" />
      </div>
      <div className="hidden sm:block">
        <div className="text-xs font-medium opacity-90">Chat with us</div>
        <div className="text-sm font-semibold">WhatsApp</div>
      </div>
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}

