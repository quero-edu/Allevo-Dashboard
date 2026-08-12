import React from 'react';
import { Eye, MousePointerClick, Monitor, ShoppingCart, Ticket, Plus, Equal, ChevronDown, ChevronRight, Layers } from 'lucide-react';

interface FunilTabProps {
  geral: any;
  metricsData: any;
  sortedCampaigns: any[];
  expandedCampaigns: Record<string, boolean>;
  toggleCampaign: (name: string) => void;
  campaignTotals: any;
  formatCurrency: (val: number) => string;
  formatNumber: (val: number) => string;
  formatPercent: (val: number) => string;
}

export const FunilTab: React.FC<FunilTabProps> = ({
  geral,
  metricsData,
  sortedCampaigns,
  expandedCampaigns,
  toggleCampaign,
  campaignTotals,
  formatCurrency,
  formatNumber,
  formatPercent
}) => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Visual Funnel Card */}
      <div className="bg-[#151922] rounded-[8px] border border-white/10 shadow-[0_18px_52px_rgba(0,0,0,0.22)] p-6 sm:p-10 flex flex-col items-center w-full min-h-[400px]">
        
        {/* Step 1: Impressões */}
        <div className="w-full max-w-3xl bg-[#242424] border border-[#262626] text-white rounded-[8px] py-4 flex flex-col items-center justify-center shadow-md">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-1">
            <Eye size={12} className="text-[#00FFBB]" /> 1. Impressões
          </div>
          <div className="font-mono font-bold text-3xl text-zinc-100">{formatNumber(geral.impressoesTotal)}</div>
        </div>

        {/* Connect 1-2 */}
        <div className="flex flex-col items-center my-1 relative h-12 w-full max-w-xs">
          <div className="w-px h-full bg-[#262626] absolute left-1/2 top-0 block"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1C1C1C] border border-[#262626] rounded-full px-4 py-1.5 shadow-md whitespace-nowrap z-10 flex flex-col items-center">
            <span className="text-[9px] font-mono font-medium text-zinc-400 uppercase tracking-wider">CTR (Cliques / Imp.)</span>
            <span className="text-xs font-mono font-bold text-[#00FFBB]">{formatPercent(geral.impressoesTotal > 0 ? geral.cliquesTotal / geral.impressoesTotal : 0)}</span>
          </div>
        </div>

        {/* Step 2: Cliques */}
        <div 
          style={{ backgroundColor: '#00FFBB', color: '#000000' }}
          className="w-full max-w-2xl bg-[#00FFBB] text-black rounded-[8px] py-4 flex flex-col items-center justify-center shadow-md"
        >
          <div style={{ color: '#000000' }} className="flex items-center gap-2 text-black text-[10px] font-mono font-black uppercase tracking-widest mb-1">
            <MousePointerClick size={12} color="#000000" stroke="#000000" className="text-black stroke-black shrink-0" /> 2. Cliques no Link
          </div>
          <div style={{ color: '#000000' }} className="font-mono font-black text-3xl text-black">{formatNumber(geral.cliquesTotal)}</div>
        </div>

        {/* Connect 2-3 */}
        <div className="flex flex-col items-center my-1 relative h-12 w-full max-w-xs">
          <div className="w-px h-full bg-[#262626] absolute left-1/2 top-0 block"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1C1C1C] border border-[#262626] rounded-full px-4 py-1.5 shadow-md whitespace-nowrap z-10 flex flex-col items-center">
            <span className="text-[9px] font-mono font-medium text-zinc-400 uppercase tracking-wider">Views Pag / Clique</span>
            <span className="text-xs font-mono font-bold text-[#00FFBB]">{formatPercent(geral.cliquesTotal > 0 ? geral.pageViewsTotal / geral.cliquesTotal : 0)}</span>
          </div>
        </div>

        {/* Step 3: Page Views */}
        <div 
          style={{ background: 'linear-gradient(to right, #00FFBB, #66BEFF)', color: '#000000' }}
          className="w-full max-w-xl bg-gradient-to-r from-[#00FFBB] to-[#66BEFF] text-black rounded-[8px] py-4 flex flex-col items-center justify-center shadow-md"
        >
          <div style={{ color: '#000000' }} className="flex items-center gap-2 text-black text-[10px] font-mono font-black uppercase tracking-widest mb-1">
            <Monitor className="rotate-90 text-black stroke-black shrink-0" size={12} color="#000000" stroke="#000000" /> 3. Page Views Destino
          </div>
          <div style={{ color: '#000000' }} className="font-mono font-black text-3xl text-black">{formatNumber(geral.pageViewsTotal)}</div>
        </div>

        {/* Connect 3-4 */}
        <div className="flex flex-col items-center my-1 relative h-12 w-full max-w-xs">
          <div className="w-px h-full bg-[#262626] absolute left-1/2 top-0 block"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1C1C1C] border border-[#262626] rounded-full px-4 py-1.5 shadow-md whitespace-nowrap z-10 flex flex-col items-center">
            <span className="text-[9px] font-mono font-medium text-zinc-400 uppercase tracking-wider">Checkout / View</span>
            <span className="text-xs font-mono font-bold text-[#00FFBB]">{formatPercent(geral.pageViewsTotal > 0 ? geral.checkoutsTotal / geral.pageViewsTotal : 0)}</span>
          </div>
        </div>

        {/* Step 4: Initiate Checkout */}
        <div 
          style={{ backgroundColor: '#66BEFF', color: '#000000' }}
          className="w-full max-w-lg bg-[#66BEFF] text-black rounded-[8px] py-4 flex flex-col items-center justify-center shadow-md"
        >
          <div style={{ color: '#000000' }} className="flex items-center gap-2 text-black text-[10px] font-mono font-black uppercase tracking-widest mb-1">
            <ShoppingCart size={12} color="#000000" stroke="#000000" className="text-black stroke-black shrink-0" /> 4. Initiate Checkout
          </div>
          <div style={{ color: '#000000' }} className="font-mono font-black text-3xl text-black">{formatNumber(geral.checkoutsTotal)}</div>
        </div>

        {/* Connect 4-5 */}
        <div className="flex flex-col items-center my-1 relative h-12 w-full max-w-xs">
          <div className="w-px h-full bg-[#262626] absolute left-1/2 top-0 block"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1C1C1C] border border-[#262626] rounded-full px-4 py-1.5 shadow-md whitespace-nowrap z-10 flex flex-col items-center">
            <span className="text-[9px] font-mono font-medium text-zinc-400 uppercase tracking-wider">Venda / Checkout</span>
            <span className="text-xs font-mono font-bold text-[#00FFBB]">{formatPercent(geral.checkoutsTotal > 0 ? geral.vendasTrafego / geral.checkoutsTotal : 0)}</span>
          </div>
        </div>

        {/* Step 5: Vendas */}
        <div className="flex flex-col items-center gap-1 w-full max-w-md">
          <div 
            style={{ backgroundColor: '#00FFBB', color: '#000000' }}
            className="w-full bg-[#00FFBB] text-black rounded-[8px] py-2.5 flex flex-col items-center justify-center shadow-md"
          >
            <div style={{ color: '#000000' }} className="flex items-center gap-2 text-black text-[10px] font-mono font-black uppercase tracking-widest mb-0.5">
              <Ticket size={12} color="#000000" stroke="#000000" className="text-black stroke-black shrink-0" /> 5. Vendas (Tráfego Meta)
            </div>
            <div style={{ color: '#000000' }} className="font-mono font-black text-3xl leading-none text-black">{formatNumber(geral.vendasTrafego)}</div>
          </div>
          
          <div className="text-zinc-600 font-bold"><Plus size={16} strokeWidth={3} /></div>

          <div className="w-full relative group bg-[#242424] border border-[#262626] text-zinc-200 rounded-[8px] py-2.5 flex flex-col items-center justify-center shadow-sm cursor-help hover:border-[#00FFBB]/50 transition-colors">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5 text-zinc-400">Vendas (Outras / Orgânicas)</span>
            <span className="font-mono font-bold text-3xl leading-none text-[#00FFBB]">{formatNumber(geral.vendasIngressos - geral.vendasTrafego)}</span>
            
            {/* Tooltip on hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#1C1C1C] border border-[#262626] text-white text-xs rounded-[8px] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-3 pointer-events-none font-mono">
              <div className="font-bold border-b border-[#262626] pb-2 mb-2 text-[#00FFBB] font-sans">Origens (Outras/Orgânicas)</div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {metricsData.sources.filter((s:any) => s.name !== 'META' && s.count > 0).map((s:any) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="truncate pr-2 font-medium text-zinc-300 font-sans">{s.name === 'SEM ORIGEM' ? 'Desconhecida' : s.name}</span>
                    <span className="font-bold text-[#00FFBB]">{s.count}</span>
                  </div>
                ))}
                {metricsData.sources.filter((s:any) => s.name !== 'META' && s.count > 0).length === 0 && (
                  <div className="text-zinc-500 italic font-sans">Nenhuma venda encontrada</div>
                )}
              </div>
            </div>
          </div>

          <div className="text-zinc-600 font-bold"><Equal size={16} strokeWidth={3} /></div>

          <div className="w-full bg-[#1C1C1C] border border-[#262626] text-zinc-100 rounded-[8px] py-2.5 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5 text-zinc-400">Vendas (Totais Globais)</span>
            <span className="font-mono font-bold text-3xl leading-none text-[#00FFBB]">{formatNumber(geral.vendasIngressos)}</span>
          </div>
        </div>
      </div>

      {/* Tabela de Campanhas - Funil */}
      <div className="flex flex-col gap-2 -mt-4">
        <div className="text-center flex flex-col items-center gap-2">
          <h3 className="text-xs font-mono font-bold tracking-wider text-[#00FFBB] uppercase">Funil Separado Por Campanhas</h3>
        </div>
        <div className="bg-[#151922] rounded-[8px] border border-white/10 shadow-[0_18px_52px_rgba(0,0,0,0.22)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap lg:whitespace-normal">
              <thead className="bg-white/[0.045] border-b border-white/10 text-[#00FFBB] font-mono font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-3.5">Campanha / Conjunto</th>
                  <th className="px-3.5 py-3.5 text-center">Impressões</th>
                  <th className="px-2 py-3.5 text-center text-zinc-500">&rarr;</th>
                  <th className="px-3.5 py-3.5 text-center">Cliques no Link</th>
                  <th className="px-2 py-3.5 text-center text-zinc-500">&rarr;</th>
                  <th className="px-3.5 py-3.5 text-center">Vz da Pag.<br/><span className="text-[10px] font-normal text-zinc-400 font-sans">Visualizações</span></th>
                  <th className="px-2 py-3.5 text-center text-zinc-500">&rarr;</th>
                  <th className="px-3.5 py-3.5 text-center">IC<br/><span className="text-[10px] font-normal text-zinc-400 font-sans">Initiate Checkout</span></th>
                  <th className="px-2 py-3.5 text-center text-zinc-500">&rarr;</th>
                  <th className="px-3.5 py-3.5 text-center">Livros Vendidos<br/><span className="text-[10px] font-normal text-zinc-400 font-sans">Tráfego Pago</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-zinc-300 font-mono text-xs">
                {sortedCampaigns.map((camp: any) => (
                  <React.Fragment key={camp.name}>
                    <tr 
                      className="hover:bg-white/[0.045] transition-colors cursor-pointer group bg-[#1C1C1C]"
                      onClick={() => toggleCampaign(camp.name)}
                    >
                      <td className="px-3.5 py-3 font-sans font-bold text-zinc-100 flex items-center gap-2 max-w-[220px] xl:max-w-[320px]">
                        {expandedCampaigns[camp.name] ? <ChevronDown size={14} className="text-[#00FFBB] shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#00FFBB] shrink-0" />}
                        <span className="truncate" title={camp.name}>{camp.name}</span>
                      </td>
                      <td className="px-3.5 py-3 text-center font-medium bg-[#242424]/50">{formatNumber(camp.impressoes)}</td>
                      <td className="px-2 py-3 text-center text-xs text-zinc-500">{formatPercent(camp.ctr)}</td>
                      <td className="px-3.5 py-3 text-center font-medium bg-[#00FFBB]/10 text-[#00FFBB]">{formatNumber(camp.cliques)}</td>
                      <td className="px-2 py-3 text-center text-xs text-zinc-500">{formatPercent(camp.cliques > 0 ? camp.landingPageViews / camp.cliques : 0)}</td>
                      <td className="px-3.5 py-3 text-center font-medium bg-[#00FFBB]/10 text-emerald-300">{formatNumber(camp.landingPageViews)}</td>
                      <td className="px-2 py-3 text-center text-xs text-zinc-500">{formatPercent(camp.landingPageViews > 0 ? camp.initiateCheckout / camp.landingPageViews : 0)}</td>
                      <td className="px-3.5 py-3 text-center font-bold bg-[#66BEFF]/10 text-[#66BEFF]">{formatNumber(camp.initiateCheckout)}</td>
                      <td className="px-2 py-3 text-center text-xs text-zinc-500">{formatPercent(camp.initiateCheckout > 0 ? camp.comprasTrafego / camp.initiateCheckout : 0)}</td>
                      <td className="px-3.5 py-3 text-center font-black bg-[#00FFBB]/20 text-[#00FFBB]">{formatNumber(camp.comprasTrafego)}</td>
                    </tr>
                    
                    {expandedCampaigns[camp.name] && camp.sets.map((set: any) => (
                      <tr key={`${camp.name}-${set.name}`} className="bg-black/10 hover:bg-white/[0.035] transition-colors">
                        <td className="px-3.5 py-2.5 pl-8 text-zinc-400 font-sans flex items-center gap-2 max-w-[220px] xl:max-w-[320px]">
                          <Layers size={13} className="text-zinc-500 shrink-0" />
                          <span className="truncate text-[11px]" title={set.name}>{set.name}</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-zinc-400">{formatNumber(set.impressoes)}</td>
                        <td className="px-2 py-2.5 text-center text-[10px] text-zinc-500">{formatPercent(set.ctr)}</td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-[#00FFBB] font-medium">{formatNumber(set.cliques)}</td>
                        <td className="px-2 py-2.5 text-center text-[10px] text-zinc-500">{formatPercent(set.cliques > 0 ? set.landingPageViews / set.cliques : 0)}</td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-emerald-300 font-medium">{formatNumber(set.landingPageViews)}</td>
                        <td className="px-2 py-2.5 text-center text-[10px] text-zinc-500">{formatPercent(set.landingPageViews > 0 ? set.initiateCheckout / set.landingPageViews : 0)}</td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-[#66BEFF] font-bold">{formatNumber(set.initiateCheckout)}</td>
                        <td className="px-2 py-2.5 text-center text-[10px] text-zinc-500">{formatPercent(set.initiateCheckout > 0 ? set.comprasTrafego / set.initiateCheckout : 0)}</td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-[#00FFBB] font-black">{formatNumber(set.comprasTrafego)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              {metricsData.campaigns.length > 0 && (
                <tfoot className="bg-white/[0.045] border-t border-white/10 font-mono font-bold text-zinc-100">
                  <tr>
                    <td className="px-3.5 py-4 text-[11px] uppercase tracking-wider text-[#00FFBB]">Total do Período</td>
                    <td className="px-3.5 py-4 text-center">{formatNumber(campaignTotals.impressoes)}</td>
                    <td className="px-2 py-4 text-center text-zinc-500">{formatPercent(campaignTotals.impressoes > 0 ? campaignTotals.cliques / campaignTotals.impressoes : 0)}</td>
                    <td className="px-3.5 py-4 text-center text-[#00FFBB]">{formatNumber(campaignTotals.cliques)}</td>
                    <td className="px-2 py-4 text-center text-zinc-500">{formatPercent(campaignTotals.cliques > 0 ? campaignTotals.landingPageViews / campaignTotals.cliques : 0)}</td>
                    <td className="px-3.5 py-4 text-center text-emerald-300">{formatNumber(campaignTotals.landingPageViews)}</td>
                    <td className="px-2 py-4 text-center text-zinc-500">{formatPercent(campaignTotals.landingPageViews > 0 ? campaignTotals.initiateCheckout / campaignTotals.landingPageViews : 0)}</td>
                    <td className="px-3.5 py-4 text-center text-[#66BEFF]">{formatNumber(campaignTotals.initiateCheckout)}</td>
                    <td className="px-2 py-4 text-center text-zinc-500">{formatPercent(campaignTotals.initiateCheckout > 0 ? campaignTotals.compras / campaignTotals.initiateCheckout : 0)}</td>
                    <td className="px-3.5 py-4 text-center text-[#00FFBB] font-black">{formatNumber(campaignTotals.compras)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
