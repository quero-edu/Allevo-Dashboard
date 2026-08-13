import React, { useEffect, useRef } from 'react';
import { Image, X, ExternalLink } from 'lucide-react';

interface LightboxModalProps {
  activeLightboxImage: {
    name: string;
    url: string;
    link?: string;
    stats?: any;
  } | null;
  setActiveLightboxImage: (val: any) => void;
  getCreativeThumbnail: (name: string, thumb?: string) => string;
  formatCurrency: (val: number) => string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  activeLightboxImage,
  setActiveLightboxImage,
  getCreativeThumbnail,
  formatCurrency
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!activeLightboxImage) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveLightboxImage(null);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [activeLightboxImage, setActiveLightboxImage]);

  if (!activeLightboxImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="creative-preview-title" className="bg-[#1C1C1C] border border-[#262626] rounded-[8px] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-white/[0.045] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Image size={18} className="text-[#00FFBB] shrink-0" />
            <h4 id="creative-preview-title" className="font-bold text-sm text-zinc-100 truncate font-sans">{activeLightboxImage.name}</h4>
          </div>
          <button 
            onClick={() => setActiveLightboxImage(null)}
            ref={closeButtonRef}
            aria-label="Fechar prévia do criativo"
            className="p-1.5 rounded-[8px] bg-[#1C1C1C] hover:bg-[#2E2E2E] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center gap-4">
          <div className="w-full aspect-video rounded-[8px] overflow-hidden border border-[#262626] bg-[#121212] shadow-inner relative group">
            <img 
              src={activeLightboxImage.url} 
              alt={activeLightboxImage.name}
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (activeLightboxImage.url && !target.src.includes('/api/proxy-image') && !target.src.includes('unsplash.com')) {
                  target.src = `/api/proxy-image?url=${encodeURIComponent(activeLightboxImage.url)}`;
                } else if (!target.src.includes('unsplash.com')) {
                  target.src = getCreativeThumbnail(activeLightboxImage.name);
                }
              }}
            />
          </div>

          {activeLightboxImage.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full bg-[#242424] p-3 rounded-[8px] border border-[#262626] text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Gasto</span>
                <span className="font-bold text-zinc-200">{formatCurrency(activeLightboxImage.stats.investimento)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Vendas</span>
                <span className="font-bold text-[#00FFBB]">{activeLightboxImage.stats.vendas}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">CPA</span>
                <span className="font-bold text-rose-400">{formatCurrency(activeLightboxImage.stats.cpa)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">ROAS</span>
                <span className="font-bold text-[#00FFBB]">{(activeLightboxImage.stats.roas || 0).toFixed(2)}x</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 w-full pt-1">
            {activeLightboxImage.link && (
              <a 
                href={activeLightboxImage.link} 
                target="_blank" 
                rel="noreferrer"
                style={{ backgroundColor: '#00FFBB', color: '#000000' }}
                className="btn-primary-green px-4 py-2 bg-[#00FFBB] hover:bg-[#00E5A7] text-black rounded-[8px] font-mono font-black text-xs flex items-center gap-2 shadow-md shadow-[#00FFBB]/20 transition-all cursor-pointer"
              >
                <ExternalLink size={14} color="#000000" stroke="#000000" strokeWidth={2.5} className="text-black stroke-black shrink-0" />
                <span style={{ color: '#000000' }} className="text-black font-black">Abrir Link Meta</span>
              </a>
            )}
            <button 
              onClick={() => setActiveLightboxImage(null)}
              className="px-4 py-2 bg-[#242424] hover:bg-[#2E2E2E] border border-[#262626] text-zinc-300 rounded-[8px] font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
