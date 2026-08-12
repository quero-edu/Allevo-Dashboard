import React from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';

interface CampanhasTabProps {
  sortedCampaigns: any[];
  campaignSort: { column: string; direction: 'asc' | 'desc' };
  toggleCampaignSort: (column: string) => void;
  expandedCampaigns: Record<string, boolean>;
  toggleCampaign: (name: string) => void;
  campaignTotals: any;
  metricsCampaignsCount: number;
  formatCurrency: (val: number) => string;
  formatNumber: (val: number) => string;
  formatPercent: (val: number) => string;
}

export const CampanhasTab: React.FC<CampanhasTabProps> = ({
  sortedCampaigns,
  campaignSort,
  toggleCampaignSort,
  expandedCampaigns,
  toggleCampaign,
  campaignTotals,
  metricsCampaignsCount,
  formatCurrency,
  formatNumber,
  formatPercent
}) => {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-[#151922]/95 rounded-[8px] border border-white/10 shadow-[0_18px_52px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap lg:whitespace-normal">
            <thead className="bg-white/[0.045] border-b border-white/10 text-[#00FFBB] font-mono font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3.5 cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('name')}>
                  Campanha / Conjunto {campaignSort.column === 'name' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('investimento')}>
                  Gasto (+12%) {campaignSort.column === 'investimento' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('impressoes')}>
                  Impressões {campaignSort.column === 'impressoes' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('cpm')}>
                  CPM {campaignSort.column === 'cpm' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('cliques')}>
                  Cliques {campaignSort.column === 'cliques' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('cpc')}>
                  CPC {campaignSort.column === 'cpc' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('ctr')}>
                  CTR {campaignSort.column === 'ctr' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('comprasTrafego')}>
                  Livros Vendidos {campaignSort.column === 'comprasTrafego' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('cpa')}>
                  CPA {campaignSort.column === 'cpa' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3.5 py-3.5 text-right cursor-pointer hover:bg-[#2E2E2E] transition-colors" onClick={() => toggleCampaignSort('roas')}>
                  ROAS {campaignSort.column === 'roas' && (campaignSort.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] text-zinc-300 font-mono text-xs">
              {sortedCampaigns.map((camp: any) => (
                <React.Fragment key={camp.name}>
                  <tr 
                    className="hover:bg-white/[0.045] transition-colors cursor-pointer group bg-transparent"
                    onClick={() => toggleCampaign(camp.name)}
                  >
                    <td className="px-3.5 py-3 font-sans font-bold text-zinc-100 flex items-center gap-2 max-w-[220px] xl:max-w-[320px]">
                      {expandedCampaigns[camp.name] ? (
                        <ChevronDown size={14} className="text-[#00FFBB] shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#00FFBB] shrink-0" />
                      )}
                      <span className="truncate" title={camp.name}>{camp.name}</span>
                    </td>
                    <td className="px-3.5 py-3 text-right font-bold text-zinc-100">{formatCurrency(camp.investimento)}</td>
                    <td className="px-3.5 py-3 text-right text-zinc-300">{formatNumber(camp.impressoes)}</td>
                    <td className="px-3.5 py-3 text-right text-zinc-400">{formatCurrency(camp.cpm)}</td>
                    <td className="px-3.5 py-3 text-right text-zinc-200">{formatNumber(camp.cliques)}</td>
                    <td className="px-3.5 py-3 text-right text-zinc-400">{formatCurrency(camp.cpc)}</td>
                    <td className="px-3.5 py-3 text-right text-zinc-400">{formatPercent(camp.ctr)}</td>
                    <td className="px-3.5 py-3 text-right font-bold text-[#00FFBB] border-l border-[#262626]">{camp.comprasTrafego}</td>
                    <td className="px-3.5 py-3 text-right font-bold text-zinc-200">{formatCurrency(camp.cpa)}</td>
                    <td className="px-3.5 py-3 text-right font-black text-[#00FFBB]">{(camp.roas || 0).toFixed(2)}x</td>
                  </tr>
                  
                  {expandedCampaigns[camp.name] && camp.sets.map((set: any) => (
                    <tr key={`${camp.name}-${set.name}`} className="bg-black/10 hover:bg-white/[0.035] transition-colors">
                      <td className="px-3.5 py-2.5 pl-8 text-zinc-400 font-sans flex items-center gap-2 max-w-[220px] xl:max-w-[320px]">
                        <Layers size={13} className="text-zinc-500 shrink-0" />
                        <span className="truncate text-[11px]" title={set.name}>{set.name}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] text-zinc-300">{formatCurrency(set.investimento)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] text-zinc-400">{formatNumber(set.impressoes)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] text-zinc-500">{formatCurrency(set.cpm)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] text-zinc-300">{formatNumber(set.cliques)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] text-zinc-500">{formatCurrency(set.cpc)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] text-zinc-500">{formatPercent(set.ctr)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] font-bold text-[#00FFBB] border-l border-[#262626]">{set.comprasTrafego}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] font-bold text-zinc-300">{formatCurrency(set.cpa)}</td>
                      <td className="px-3.5 py-2.5 text-right text-[11px] font-bold text-[#00FFBB]">{(set.roas || 0).toFixed(2)}x</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {metricsCampaignsCount === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-zinc-500 font-sans font-medium">
                    Nenhum dado encontrado para este período/filtro.
                  </td>
                </tr>
              )}
            </tbody>
            {metricsCampaignsCount > 0 && (
              <tfoot className="bg-white/[0.045] border-t border-white/10 font-mono font-bold text-zinc-100">
                <tr>
                  <td className="px-3.5 py-4 text-[11px] uppercase tracking-wider text-[#00FFBB] font-mono">Total do Período</td>
                  <td className="px-3.5 py-4 text-right">{formatCurrency(campaignTotals.investimento)}</td>
                  <td className="px-3.5 py-4 text-right">{formatNumber(campaignTotals.impressoes)}</td>
                  <td className="px-3.5 py-4 text-right">{formatCurrency(campaignTotals.impressoes > 0 ? (campaignTotals.investimento / campaignTotals.impressoes) * 1000 : 0)}</td>
                  <td className="px-3.5 py-4 text-right">{formatNumber(campaignTotals.cliques)}</td>
                  <td className="px-3.5 py-4 text-right">{formatCurrency(campaignTotals.cliques > 0 ? campaignTotals.investimento / campaignTotals.cliques : 0)}</td>
                  <td className="px-3.5 py-4 text-right">{formatPercent(campaignTotals.impressoes > 0 ? campaignTotals.cliques / campaignTotals.impressoes : 0)}</td>
                  <td className="px-3.5 py-4 text-right text-[#00FFBB]">{campaignTotals.compras}</td>
                  <td className="px-3.5 py-4 text-right">{formatCurrency(campaignTotals.compras > 0 ? campaignTotals.investimento / campaignTotals.compras : 0)}</td>
                  <td className="px-3.5 py-4 text-right text-[#00FFBB]">{campaignTotals.investimento > 0 ? (campaignTotals.faturamento / campaignTotals.investimento).toFixed(2) : '0.00'}x</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
