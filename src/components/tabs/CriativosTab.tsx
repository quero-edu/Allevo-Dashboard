import React from 'react';
import { Search, ExternalLink, Maximize2 } from 'lucide-react';

interface CriativosTabProps {
  creativeFilter: string;
  setCreativeFilter: (val: string) => void;
  creativeSort: { column: string; direction: 'asc' | 'desc' };
  toggleCreativeSort: (column: string) => void;
  sortedCreatives: any[];
  getCreativeThumbnail: (name: string, thumb?: string) => string;
  setActiveLightboxImage: (img: any) => void;
  formatCurrency: (val: number) => string;
  formatNumber: (val: number) => string;
  formatPercent: (val: number) => string;
}

export const CriativosTab: React.FC<CriativosTabProps> = ({
  creativeFilter,
  setCreativeFilter,
  creativeSort,
  toggleCreativeSort,
  sortedCreatives,
  getCreativeThumbnail,
  setActiveLightboxImage,
  formatCurrency,
  formatNumber,
  formatPercent
}) => {
  return (
    <div className="bg-[#151922] rounded-[8px] border border-white/10 shadow-[0_18px_52px_rgba(0,0,0,0.22)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-base font-mono font-bold tracking-tight text-[#00FFBB] uppercase">Performance dos Criativos</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
          <input 
            type="text" 
            placeholder="Filtrar criativo..." 
            value={creativeFilter}
            onChange={e => setCreativeFilter(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#242424] border border-[#262626] rounded-[8px] text-xs font-sans text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00FFBB]/30 focus:border-[#00FFBB] transition-all w-64 shadow-inner"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap lg:whitespace-normal">
          <thead className="bg-white/[0.045] border-b border-white/10 text-[#00FFBB] font-mono font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-3 py-3.5 text-center">Prévia</th>
              <th className="px-4 py-3.5 cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('name')}>
                Criativo {creativeSort.column === 'name' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-center">Link Meta</th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('investimento')}>
                Gasto {creativeSort.column === 'investimento' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('impressoes')}>
                Impressões {creativeSort.column === 'impressoes' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('cliques')}>
                Cliques {creativeSort.column === 'cliques' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('ctr')}>
                CTR {creativeSort.column === 'ctr' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-center cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('vendas')}>
                Livros Vendidos {creativeSort.column === 'vendas' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('cpa')}>
                CPA {creativeSort.column === 'cpa' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('roas')}>
                ROAS {creativeSort.column === 'roas' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => toggleCreativeSort('conv')}>
                Conv. {creativeSort.column === 'conv' && (creativeSort.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626] text-zinc-300 font-mono text-xs">
            {sortedCreatives
              .filter((c: any) => c.name.toLowerCase().includes(creativeFilter.toLowerCase()))
              .map((c: any) => {
                const rawThumb = c.Thumb_Criativo || c.thumb || c.thumbnail || c.image;
                const thumbUrl = getCreativeThumbnail(c.name, rawThumb);
                return (
                  <tr key={c.name} className="hover:bg-white/[0.045] transition-colors">
                    <td className="px-3 py-3 text-center">
                      <button 
                        onClick={() => setActiveLightboxImage({ name: c.name, url: thumbUrl, link: c.link, stats: c })}
                        className="relative group/thumb block mx-auto focus:outline-none cursor-pointer"
                        title="Clique para ampliar prévia do criativo"
                      >
                        <div className="w-12 h-9 rounded-[6px] bg-[#242424] overflow-hidden border border-[#262626] group-hover/thumb:border-[#00FFBB] transition-all shadow-sm flex items-center justify-center relative">
                          <img 
                            src={thumbUrl} 
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (rawThumb && !target.src.includes('/api/proxy-image') && !target.src.includes('unsplash.com')) {
                                target.src = `/api/proxy-image?url=${encodeURIComponent(rawThumb)}`;
                              } else if (!target.src.includes('unsplash.com')) {
                                target.src = getCreativeThumbnail(c.name);
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={12} className="text-[#00FFBB]" />
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 font-sans font-bold text-zinc-100 max-w-[200px] xl:max-w-[300px]">
                      <span className="truncate block" title={c.name}>{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {c.link ? (
                        <a 
                          href={c.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#00FFBB]/10 text-[#00FFBB] border border-[#00FFBB]/20 font-bold text-[10px] hover:bg-[#00FFBB]/20 transition-colors"
                        >
                          <ExternalLink size={11} />
                          Ver Ad
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-zinc-200">{formatCurrency(c.investimento)}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-zinc-300">{formatNumber(c.impressoes)}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-zinc-300">{formatNumber(c.cliques)}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-zinc-300">{formatPercent(c.ctr)}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-[#00FFBB]">{c.vendas}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-rose-400">{formatCurrency(c.cpa)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#00FFBB]">{(c.roas || 0).toFixed(2)}x</td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#00FFBB]">{formatPercent(c.conv)}</td>
                  </tr>
                );
              })}
            {sortedCreatives.filter((c: any) => c.name.toLowerCase().includes(creativeFilter.toLowerCase())).length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-zinc-500 font-sans font-medium">
                  Nenhum criativo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
