import React from 'react';
import { Activity, Check, History } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line
} from 'recharts';
import { cn } from '../../lib/utils';

interface DailyChartSectionProps {
  dailyMetrics: any[];
  selectedMetrics: string[];
  setSelectedMetrics: React.Dispatch<React.SetStateAction<string[]>>;
  showMovingAverage: boolean;
  setShowMovingAverage: React.Dispatch<React.SetStateAction<boolean>>;
  comparePrevious: boolean;
  setComparePrevious: React.Dispatch<React.SetStateAction<boolean>>;
  METRIC_CONFIG: Record<string, any>;
  formatCurrency: (val: number) => string;
  formatNumber: (val: number) => string;
}

export const DailyChartSection: React.FC<DailyChartSectionProps> = ({
  dailyMetrics,
  selectedMetrics,
  setSelectedMetrics,
  showMovingAverage,
  setShowMovingAverage,
  comparePrevious,
  setComparePrevious,
  METRIC_CONFIG,
  formatCurrency,
  formatNumber
}) => {
  return (
    <div className="bg-[#151922]/95 rounded-[8px] border border-white/10 p-5 sm:p-6 shadow-[0_18px_52px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-mono">Histórico diário</h3>
            <p className="mt-1 text-xs text-zinc-400 font-medium">Selecione até duas métricas acima para comparar.</p>
          </div>
          <button
            onClick={() => setSelectedMetrics([])}
            className="self-start sm:self-auto text-xs font-mono font-bold px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-[8px] transition-colors border border-white/10 cursor-pointer"
          >
            Limpar seleção
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mr-1">Análise</span>
          <button
            type="button"
            onClick={() => setComparePrevious(prev => !prev)}
            aria-pressed={comparePrevious}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border rounded-[8px] text-xs font-mono font-bold transition-colors",
              comparePrevious
                ? "bg-[#00FFBB]/12 border-[#00FFBB]/50 text-[#00FFBB]"
                : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
            )}
          >
            <History size={14} /> Comparar período
          </button>
          <button
            type="button"
            onClick={() => setShowMovingAverage(prev => !prev)}
            aria-pressed={showMovingAverage}
            className={cn(
              "flex items-center gap-2 cursor-pointer select-none text-xs font-mono font-bold px-3 py-2 rounded-[8px] border transition-colors",
              showMovingAverage
                ? "bg-[#38BDF8]/12 border-[#38BDF8]/50 text-[#A8D9FF]"
                : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
            )}
          >
            <div className={cn(
              "w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-all shrink-0",
              showMovingAverage 
                ? "bg-[#38BDF8] border-[#38BDF8] shadow-sm shadow-[#38BDF8]/30" 
                : "bg-[#1C1C1C] border-[#383838]"
            )}>
              {showMovingAverage && <Check size={10} color="#000000" stroke="#000000" strokeWidth={3} className="text-black stroke-black" />}
            </div>
            <span className="flex items-center gap-1.5">
              <Activity size={13} className="text-[#38BDF8]" /> Média Móvel (7D)
            </span>
          </button>
        </div>
      </div>

      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dailyMetrics}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
            <XAxis dataKey="date" tick={{ fill: '#A3A3A3', fontSize: 11, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: '#262626' }} dy={10} />
            
            {selectedMetrics.length > 0 && (
              <YAxis 
                yAxisId="left" 
                orientation="left"
                tick={{ fill: '#A3A3A3', fontSize: 11, fontFamily: 'monospace' }} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={METRIC_CONFIG[selectedMetrics[0]]?.type === 'currency' ? (val) => `R$ ${val}` : undefined} 
              />
            )}
            {selectedMetrics.length > 1 && (
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fill: '#A3A3A3', fontSize: 11, fontFamily: 'monospace' }} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={METRIC_CONFIG[selectedMetrics[1]]?.type === 'currency' ? (val) => `R$ ${val}` : undefined}
              />
            )}
            
            <Tooltip 
              formatter={(value: any, name: string) => {
                const isMM = typeof name === 'string' && name.startsWith('MM 7D');
                const cleanName = isMM ? name.replace(/^MM 7D \((.*)\)$/, '$1') : name;
                const metricKey = Object.keys(METRIC_CONFIG).find(k => METRIC_CONFIG[k].label === cleanName);
                let formattedVal = value;
                if (typeof value === 'number') {
                  if (metricKey && METRIC_CONFIG[metricKey].type === 'currency') {
                    formattedVal = formatCurrency(value);
                  } else {
                    formattedVal = formatNumber(value);
                  }
                }
                return [formattedVal, name];
              }}
              contentStyle={{ 
                backgroundColor: '#151922', 
                borderColor: 'rgba(148, 163, 184, 0.18)', 
                borderRadius: '8px', 
                color: '#EDEDED', 
                fontWeight: 'bold',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'monospace', fontSize: '11px' }} iconType="circle" />
            
            {selectedMetrics.map((key, index) => {
              const config = METRIC_CONFIG[key];
              if (!config) return null;
              const yAxisId = index === 0 ? 'left' : 'right';

              return (
                <React.Fragment key={key}>
                  {index === 0 ? (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      name={config.label} 
                      fill={config.color} 
                      radius={[4, 4, 0, 0]} 
                      yAxisId={yAxisId} 
                    />
                  ) : (
                    <Line 
                      key={key} 
                      type="monotone" 
                      dataKey={key} 
                      name={config.label} 
                      stroke={config.color} 
                      strokeWidth={2.5} 
                      dot={{ r: 3.5, strokeWidth: 1.5, fill: '#121212' }} 
                      activeDot={{ r: 5 }} 
                      yAxisId={yAxisId} 
                    />
                  )}

                  {showMovingAverage && (
                    <Line 
                      key={`${key}_mm7`}
                      type="monotone" 
                      dataKey={`${key}_mm7`} 
                      name={`MM 7D (${config.label})`} 
                      stroke={index === 0 ? '#38BDF8' : '#F59E0B'} 
                      strokeWidth={2} 
                      strokeDasharray="5 4" 
                      dot={false} 
                      activeDot={{ r: 4 }} 
                      yAxisId={yAxisId} 
                    />
                  )}
                </React.Fragment>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
