import React from 'react';
import { Monitor } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from '../../lib/utils';

interface FontesTabProps {
  metricsData: any;
  selectedSourceIndices: number[];
  setSelectedSourceIndices: React.Dispatch<React.SetStateAction<number[]>>;
  sortedPages: any[];
  pageSort: { column: string; direction: 'asc' | 'desc' };
  togglePageSort: (column: string) => void;
  formatCurrency: (val: number) => string;
  formatNumber: (val: number) => string;
  formatPercent: (val: number) => string;
}

export const FontesTab: React.FC<FontesTabProps> = ({
  metricsData,
  selectedSourceIndices,
  setSelectedSourceIndices,
  sortedPages,
  pageSort,
  togglePageSort,
  formatCurrency,
  formatNumber,
  formatPercent
}) => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Distribuição por Fonte */}
        <div className="lg:col-span-4 bg-[#1C1C1C] rounded-[8px] border border-[#262626] p-6 shadow-xl flex flex-col min-h-[600px] h-fit">
          <div className="mb-4">
            <h3 className="text-base font-mono font-bold tracking-tight text-[#00FFBB] uppercase">Distribuição por Fonte</h3>
            <p className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mt-1">Origem das Vendas Captadas</p>
          </div>
          
          <div className="w-full flex justify-center mt-2 mb-4" style={{ height: '300px' }}>
            {metricsData.sources.filter((s:any) => s.count > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={metricsData.sources.filter((s:any) => s.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                  >
                    {metricsData.sources.filter((s:any) => s.count > 0).map((entry: any) => {
                      const isSelected = selectedSourceIndices.includes(entry.originalIndex);
                      return (
                        <Cell 
                          key={`cell-${entry.originalIndex}`} 
                          fill={entry.hex} 
                          fillOpacity={selectedSourceIndices.length > 0 && !isSelected ? 0.3 : 1}
                          className="transition-all duration-300 outline-none"
                          style={{
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [`${value} vendas (${formatCurrency(props.payload.revenue)})`, name]}
                    contentStyle={{ 
                      backgroundColor: '#1C1C1C', 
                      borderColor: '#262626', 
                      borderRadius: '8px', 
                      color: '#EDEDED', 
                      fontWeight: 'bold', 
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-zinc-500 font-medium font-sans">Nenhum dado encontrado.</div>
            )}
          </div>
          
          <div className="mt-6 border-t border-[#262626] pt-6 animate-in fade-in duration-300">
            <h4 className="text-xs font-mono font-bold text-[#00FFBB] uppercase tracking-wider mb-4">Análise da Seleção</h4>
            {(() => {
              const selectedSources = metricsData.sources.filter((s:any) => selectedSourceIndices.includes(s.originalIndex));
              const totalSelectedVendas = selectedSources.reduce((acc: number, curr: any) => acc + curr.count, 0);
              const totalSelectedReceita = selectedSources.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
              const percVendas = metricsData.totalSalesWithSource > 0 ? totalSelectedVendas / metricsData.totalSalesWithSource : 0;

              return (
                <div className="flex flex-col gap-2.5 font-mono">
                  <div className="flex justify-between items-center bg-[#242424] p-3 rounded-[8px] border border-[#262626]">
                    <span className="text-xs font-bold text-[#00FFBB] uppercase">Vendas na Seleção</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#00FFBB]">{totalSelectedVendas} <span className="text-xs font-medium text-zinc-400">vendas</span></div>
                      <div className="text-xs text-zinc-300">{formatCurrency(totalSelectedReceita)}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-[#242424]/60 p-2.5 rounded-[8px] border border-[#262626]">
                    <span className="text-xs text-zinc-400 font-sans">% das {metricsData.totalSalesWithSource} Vendas Totais</span>
                    <span className="text-sm font-bold text-[#00FFBB]">{formatPercent(percVendas)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#242424]/60 p-2.5 rounded-[8px] border border-[#262626]">
                    <span className="text-xs text-zinc-400 font-sans">% da Receita Total</span>
                    <span className="text-sm font-bold text-[#00FFBB]">{formatPercent(metricsData.totalRevenueWithSource > 0 ? totalSelectedReceita / metricsData.totalRevenueWithSource : 0)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Ranking de Fontes */}
        <div className="lg:col-span-8 bg-[#1C1C1C] rounded-[8px] border border-[#262626] p-6 shadow-xl overflow-hidden flex flex-col max-h-[800px]">
          <div className="mb-6 flex-shrink-0">
            <h3 className="text-base font-mono font-bold tracking-tight text-[#00FFBB] uppercase">Ranking de Fontes</h3>
            <p className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mt-1">Performance por Canal de Aquisição</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-col gap-6">
              {[
                { title: "Tráfego Pago", items: metricsData.sources.filter((s:any) => s.category === "Tráfego Pago") },
                { title: "Tráfego Orgânico", items: metricsData.sources.filter((s:any) => s.category === "Orgânico") },
                { title: "Disparos", items: metricsData.sources.filter((s:any) => s.category === "Disparos") },
                { title: "Sem Origem", items: metricsData.sources.filter((s:any) => s.category === "Sem Origem") },
                { title: "Outros", items: metricsData.sources.filter((s:any) => s.category === "Outros") }
              ].filter(g => g.items.length > 0).map((group) => (
                <div key={group.title} className="flex flex-col gap-3">
                  <h4 className="flex items-center flex-wrap gap-2 font-mono font-bold text-zinc-200 uppercase tracking-tight ml-1 text-xs">
                    <span>{group.title}</span>
                    {group.items.length > 1 && (() => {
                      const gSales = group.items.reduce((acc: number, curr: any) => acc + curr.count, 0);
                      const gRev = group.items.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
                      const gPerc = metricsData.totalSalesWithSource > 0 ? gSales / metricsData.totalSalesWithSource : 0;
                      return (
                        <div className="flex items-center gap-2 mt-px font-mono">
                          <span className="text-[10px] pb-[2px] text-zinc-600">|</span>
                          <span className="text-[10px] text-zinc-400 font-bold">{gSales} vendas</span>
                          <span className="text-[10px] pb-[2px] text-zinc-600">|</span>
                          <span className="text-[10px] text-zinc-400 font-bold">{formatPercent(gPerc)} do total</span>
                          <span className="text-[10px] pb-[2px] text-zinc-600">|</span>
                          <span className="text-[10px] text-[#00FFBB] font-bold">{formatCurrency(gRev)}</span>
                        </div>
                      );
                    })()}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {group.items.map((source: any) => {
                      const percentage = metricsData.totalSalesWithSource > 0 
                        ? (source.count / metricsData.totalSalesWithSource) 
                        : 0;
                      const isSelected = selectedSourceIndices.includes(source.originalIndex);

                      return (
                        <div 
                          key={source.name} 
                          onClick={() => setSelectedSourceIndices(prev => 
                            prev.includes(source.originalIndex) 
                              ? prev.filter(i => i !== source.originalIndex)
                              : [...prev, source.originalIndex]
                          )}
                          className={cn("flex items-center justify-between p-3.5 rounded-[8px] border bg-[#242424] cursor-pointer transition-all group", 
                            isSelected ? "border-[#00FFBB] shadow-lg ring-2 ring-[#00FFBB]/20" : "border-[#262626] shadow-sm hover:shadow-md hover:border-[#383838]"
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={cn("w-9 h-9 rounded-full text-[#051C14] flex items-center justify-center font-mono font-bold text-sm shadow-md transition-transform", 
                              source.bg, isSelected && "scale-105"
                            )}>
                              {source.rank}
                            </div>
                            <div>
                              <h4 className="font-bold text-zinc-100 text-sm font-sans">{source.name}</h4>
                              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wide mt-0.5">{source.category}</p>
                            </div>
                          </div>
                          
                          <div className="text-right font-mono">
                            <div className="font-bold text-zinc-100 text-base">
                              {formatNumber(source.count)} <span className="text-[10px] font-medium text-zinc-500 uppercase">VENDAS</span>
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5 flex items-center justify-end gap-2">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold",
                                percentage >= 0.2 ? "bg-[#00FFBB]/15 text-[#00FFBB]" : "text-zinc-500 bg-[#1C1C1C]"
                              )}>
                                {formatPercent(percentage)} DO TOTAL
                              </span>
                              <span className="text-zinc-700">|</span>
                              <span className="text-[#00FFBB] font-bold">{formatCurrency(source.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {metricsData.sources.length === 0 && (
                <div className="py-12 text-center text-zinc-500 font-sans font-medium border border-dashed border-[#262626] rounded-[8px]">
                  Nenhum dado encontrado para este período.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Análise de Vendas por Página */}
      <div className="bg-[#151922] rounded-[8px] border border-white/10 shadow-[0_18px_52px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col mt-2">
        <div className="p-6 border-b border-[#262626]">
          <h3 className="text-base font-mono font-bold tracking-tight text-[#00FFBB] uppercase">Análise de Vendas por Página</h3>
          <p className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mt-1">Tráfego gerado x Vendas convertidas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.045] border-b border-white/10 text-[#00FFBB] font-mono font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('url')}>Página {pageSort.column === 'url' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('pageViews')}>Acessos {pageSort.column === 'pageViews' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('checkouts')}>Checkouts {pageSort.column === 'checkouts' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('taxIC')}>Taxa IC {pageSort.column === 'taxIC' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('salesMeta')}>Vendas (Tráfego) {pageSort.column === 'salesMeta' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('taxVenda')}>Tx. Venda {pageSort.column === 'taxVenda' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="px-6 py-4 text-right bg-[#242424] border-l border-[#262626] cursor-pointer hover:bg-[#2E2E2E]" onClick={() => togglePageSort('salesOther')}>Vendas (Orgânico/Outros) {pageSort.column === 'salesOther' && (pageSort.direction === 'asc' ? '↑' : '↓')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] text-zinc-300 font-mono text-xs">
              {sortedPages.map((page: any) => {
                 const taxIC = page.pageViews > 0 ? page.checkouts / page.pageViews : 0;
                 const taxVenda = page.checkouts > 0 ? page.salesMeta / page.checkouts : 0;
                 return (
                   <tr key={page.url} className="hover:bg-[#242424]/60 transition-colors">
                     <td className="px-6 py-4 font-sans">
                       <div className="font-bold text-zinc-100 flex items-center gap-2">
                         <Monitor size={14} className="text-zinc-500" />
                         <a href={page.url.startsWith('http') ? page.url : `https://${page.url}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#00FFBB] transition-colors">
                           {page.slug}
                         </a>
                       </div>
                       <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[200px] xl:max-w-xs">{page.url}</div>
                     </td>
                     <td className="px-6 py-4 text-right text-zinc-300">{formatNumber(page.pageViews)}</td>
                     <td className="px-6 py-4 text-right text-zinc-300">{formatNumber(page.checkouts)}</td>
                     <td className="px-6 py-4 text-right font-bold text-[#00FFBB] bg-[#00FFBB]/5">{formatPercent(taxIC)}</td>
                     <td className="px-6 py-4 text-right font-bold text-[#00FFBB]">{formatNumber(page.salesMeta)}</td>
                     <td className="px-6 py-4 text-right font-bold text-[#00FFBB] bg-[#00FFBB]/5">{formatPercent(taxVenda)}</td>
                     <td className="px-6 py-4 text-right text-zinc-400 border-l border-[#262626]">{formatNumber(page.salesOther)}</td>
                   </tr>
                 )
              })}
              {metricsData.pagesList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 italic font-sans">
                    Nenhuma página identificada no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
