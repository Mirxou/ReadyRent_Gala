'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, MessageCircle, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  url,
  title = 'ReadyRent.Gala',
  description = 'اكتشفي أجمل فساتين المناسبات',
  image,
  className,
  variant = 'outline',
  size = 'default',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `${title} - ${description}`;

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    toast.success('تم فتح Facebook');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    toast.success('تم فتح Twitter');
    setIsOpen(false);
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('تم فتح WhatsApp');
    setIsOpen(false);
  };

  const shareToInstagram = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('تم نسخ الرابط! يمكنك مشاركته على Instagram');
    setIsOpen(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        toast.success('تمت المشاركة بنجاح');
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('تم نسخ الرابط إلى الحافظة');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="مشاركة"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="share-menu"
      >
        <Share2 className="h-4 w-4 ml-2" aria-hidden="true" />
        <span>مشاركة</span>
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            id="share-menu"
            role="menu"
            aria-label="خيارات المشاركة"
            className="absolute top-full right-0 mt-2 w-48 bg-background border border-gray-200 dark:border-white/20 rounded-lg shadow-lg z-50"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          >
            <div className="p-2" role="none">
              <button
                onClick={shareToFacebook}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-right focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="مشاركة على Facebook"
              >
                <Facebook className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>Facebook</span>
              </button>
              <button
                onClick={shareToTwitter}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-right focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="مشاركة على Twitter"
              >
                <Twitter className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>Twitter</span>
              </button>
              <button
                onClick={shareToWhatsApp}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-right focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="مشاركة على WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={shareToInstagram}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-right focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="نسخ الرابط للمشاركة على Instagram"
              >
                <Instagram className="h-4 w-4 text-pink-500" aria-hidden="true" />
                <span>Instagram</span>
              </button>
              <button
                onClick={shareNative}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-right focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="مشاركة أخرى"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span>مشاركة أخرى</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
