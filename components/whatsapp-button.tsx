'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
}

export function WhatsAppButton({
  phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+213XXXXXXXXX', // Default phone number from env or placeholder
  message = 'مرحباً، أريد الاستفسار عن الخدمات',
  className = '',
  variant = 'floating',
}: WhatsAppButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    // Format phone number (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/[+\s-]/g, '');
    // Encode message
    const encodedMessage = encodeURIComponent(message);
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (variant === 'floating') {
    return (
      <Button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all ${
          isHovered ? 'scale-110' : 'scale-100'
        } ${className}`}
        style={{ backgroundColor: '#25D366' }}
      >
        <MessageCircle className="h-6 w-6 text-white" />
        <span className="sr-only">تواصل معنا عبر WhatsApp</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      className={className}
      variant={variant}
      style={variant === 'default' ? { backgroundColor: '#25D366' } : undefined}
    >
      <MessageCircle className="h-4 w-4 ml-2" />
      تواصل عبر WhatsApp
    </Button>
  );
}

