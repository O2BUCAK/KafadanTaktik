import React, { useEffect, useState } from 'react';

interface AdSenseBannerProps {
  adSlot?: string; // İsteğe bağlı: Manuel reklam birimi kullanmak isterseniz Google'ın verdiği Slot ID'si
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Sadece adSlot tanımlıysa ve adsbygoogle kütüphanesi yüklendiyse push et
    if (adSlot) {
      try {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.warn('AdSense reklamı başlatılamadı:', err);
        setHasError(true);
      }
    }
  }, [adSlot]);

  // AdSense Client ID'yi çevresel değişkenlerden oku, yoksa varsayılan test ID'sini kullan
  const metaEnv = (import.meta as any).env || {};
  const adClientId = metaEnv.VITE_ADSENSE_CLIENT_ID || 'ca-pub-1046887903835726';

  // Eğer yerel geliştirme ortamındaysak veya varsayılan test ID'si duruyorsa, görsel düzeni bozmamak için şık bir yer tutucu kutu göster
  const isDev = metaEnv.DEV || adClientId === 'ca-pub-1046887903835726';

  if (isDev) {
    return (
      <div className={`border border-dashed border-indigo-200/40 bg-indigo-950/20 rounded-xl p-4 flex flex-col items-center justify-center text-center select-none py-6 ${className}`}>
        <div className="flex items-center gap-2 text-indigo-300 font-medium text-xs mb-1">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Google AdSense Reklam Alanı
        </div>
        <p className="text-[11px] text-indigo-400/60 max-w-xs">
          {adSlot 
            ? `Manuel Reklam Birimi (Slot: ${adSlot})` 
            : 'AdSense Otomatik Reklamlar aktif. Gerçek yayın durumunda reklamlar otomatik yerleştirilecektir.'}
        </p>
        <span className="text-[9px] mt-2 font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
          Yayıncı ID: {adClientId}
        </span>
      </div>
    );
  }

  // Sadece adSlot varsa manuel reklam elementini göster
  if (adSlot) {
    return (
      <div className={`adsense-ad-wrapper w-full overflow-hidden flex justify-center ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adClientId}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        />
      </div>
    );
  }

  // Otomatik reklamlar (Auto Ads) doğrudan sayfaya yerleştirildiği için ek bir ins etiketine ihtiyaç duymazlar.
  return null;
};
