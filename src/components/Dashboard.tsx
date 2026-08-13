import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Calendar, RotateCcw, LayoutDashboard, Layers, Disc, MousePointer2, Package, 
  DollarSign, TrendingUp, TrendingDown, Zap, Ticket, ShoppingCart, Target, Megaphone, ChevronDown, ChevronRight, PieChart, Eye, MousePointerClick, Monitor, Plus, Equal, Image, ExternalLink, Search, Bell, AlertTriangle, Check, X,
  ShieldCheck, LogOut, UserCheck, Shield, Maximize2
} from 'lucide-react';
import { fetchSpreadsheetData } from '../services/api';
import { cn } from '../lib/utils';
import { filterByDate, buildDateFilter, buildPreviousDateFilter, getPreviousPeriodLabel, calculateComparison, parseValue, formatCurrency, formatPercent, formatNumber, parseUtcToUtcMinus3 } from '../lib/metrics';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Area, Bar, Line } from 'recharts';
import { AuthUser } from './AuthGate';
import { DailyChartSection } from './tabs/DailyChartSection';
import { CampanhasTab } from './tabs/CampanhasTab';
import { FunilTab } from './tabs/FunilTab';
import { CriativosTab } from './tabs/CriativosTab';
import { FontesTab } from './tabs/FontesTab';
import { LightboxModal } from './tabs/LightboxModal';

const ALLEVO_ACTION_INK = '#1A1A1A';
const ALLEVO_ACTION_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #00D99F, #00FFBB)',
  borderColor: '#00FFBB',
  color: ALLEVO_ACTION_INK,
  WebkitTextFillColor: ALLEVO_ACTION_INK
};
const ALLEVO_ACTION_TEXT_STYLE: React.CSSProperties = {
  color: ALLEVO_ACTION_INK,
  WebkitTextFillColor: ALLEVO_ACTION_INK
};
const ALLEVO_ACTION_ICON_STYLE: React.CSSProperties = {
  color: ALLEVO_ACTION_INK,
  stroke: ALLEVO_ACTION_INK
};

function getCreativeThumbnail(creativeName: string, customImage?: string) {
  if (customImage && typeof customImage === 'string' && customImage.trim() !== '') {
    let trimmed = customImage.trim();
    // Normalizar links de visualização do Google Drive para links de imagem direta
    if (trimmed.includes('drive.google.com/file/d/')) {
      const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `/api/proxy-image?url=${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${match[1]}`)}`;
      }
    } else if (trimmed.includes('drive.google.com/open?id=')) {
      const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `/api/proxy-image?url=${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${match[1]}`)}`;
      }
    } else if (trimmed.includes('drive.google.com/uc?')) {
      return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
    } else if (trimmed.includes('fbcdn.net') || trimmed.includes('cdninstagram.com') || trimmed.includes('facebook.com') || trimmed.includes('instagram.com')) {
      return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
    } else if (trimmed.startsWith('http')) {
      return trimmed;
    }
    return trimmed;
  }
  const mockImages = [
    "https://images.unsplash.com/photo-1542744094-3a31b272c490?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
  ];
  let hash = 0;
  for (let i = 0; i < (creativeName || '').length; i++) {
    hash = creativeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return mockImages[Math.abs(hash) % mockImages.length];
}

const METRIC_CONFIG: Record<string, { label: string, color: string, type: 'currency' | 'number', renderType: 'bar' | 'line' }> = {
  investimentoTotal: { label: 'Investimento Total', color: '#66BEFF', type: 'currency', renderType: 'bar' },
  faturamentoTotal: { label: 'Faturamento Total', color: '#00FFBB', type: 'currency', renderType: 'line' },
  lucroTotal: { label: 'Lucro Total', color: '#00FFBB', type: 'currency', renderType: 'line' },
  ticketMedio: { label: 'Ticket Médio', color: '#A855F7', type: 'currency', renderType: 'line' },
  vendasIngressos: { label: 'Livros Vendidos (Geral)', color: '#00FFBB', type: 'number', renderType: 'bar' },
  vendasTrafego: { label: 'Livros via Tráfego', color: '#66BEFF', type: 'number', renderType: 'line' },
  cpaTrafego: { label: 'CPA (Tráfego)', color: '#F43F5E', type: 'currency', renderType: 'line' },
  cpaTotal: { label: 'CPA (Total)', color: '#38BDF8', type: 'currency', renderType: 'line' },
  roas: { label: 'ROAS', color: '#00FFBB', type: 'number', renderType: 'line' }
};

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  className?: string;
  selected?: boolean;
  isHero?: boolean;
  heroTag?: string;
  comparison?: {
    percent: number;
    diff: number;
    isGood: boolean;
    formatted: string;
    prevValue?: number;
    prevFormatted?: string;
  } | null;
  comparisonLabel?: string;
  onClick?: () => void;
}

function MetricCard({ 
  id, title, value, subtext, icon, valueColor, className, selected, isHero, heroTag,
  comparison, comparisonLabel, onClick
}: MetricCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      aria-label={`${title}: ${value}. ${selected ? 'Remover do gráfico' : 'Adicionar ao gráfico'}`}
      className={cn(
        "metric-card rounded-[8px] border p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden text-left w-full",
        isHero 
          ? "ring-1 ring-[#00FFBB]/15 hover:border-[#00FFBB]/50" 
          : "hover:border-slate-500/40",
        onClick && "cursor-pointer",
        selected && "ring-2 ring-[#00FFBB]/80 border-[#00FFBB]/70 bg-[#1C2230]",
        className
      )}
    >
      {isHero && (
        <div 
          data-active-green="true"
          data-action-ink="true"
          style={ALLEVO_ACTION_STYLE}
          className="allevo-action badge-primary-green absolute top-0 right-0 px-2.5 py-0.5 bg-[#00FFBB] !text-[#1A1A1A] text-[9px] font-mono font-black uppercase tracking-widest rounded-bl-[8px] shadow-sm flex items-center gap-1 z-10"
        >
          <Zap size={10} color={ALLEVO_ACTION_INK} fill={ALLEVO_ACTION_INK} stroke={ALLEVO_ACTION_INK} strokeWidth={2.5} style={{ ...ALLEVO_ACTION_ICON_STYLE, fill: ALLEVO_ACTION_INK }} className="shrink-0 !text-[#1A1A1A] stroke-[#1A1A1A]" />
          <span style={{ ...ALLEVO_ACTION_TEXT_STYLE, fontWeight: 900 }} className="!text-[#1A1A1A] font-black">{heroTag || "Destaque"}</span>
        </div>
      )}

      {/* TOP SECTION: ICON + TITLE */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div 
            data-active-green={selected ? "true" : undefined}
            data-action-ink={selected ? "true" : undefined}
            style={selected ? ALLEVO_ACTION_STYLE : undefined}
            className={cn("p-2 rounded-[8px] transition-colors border flex items-center justify-center", selected ? "allevo-action bg-[#00FFBB] !text-[#1A1A1A] border-[#00FFBB] font-black" : "bg-[#00FFBB]/10 text-[#00FFBB] border-[#00FFBB]/20")}
          >
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, {
              color: selected ? ALLEVO_ACTION_INK : '#00FFBB',
              stroke: selected ? ALLEVO_ACTION_INK : '#00FFBB',
              strokeWidth: selected ? 2.5 : 2,
              style: selected ? ALLEVO_ACTION_ICON_STYLE : { color: '#00FFBB', stroke: '#00FFBB' },
              className: selected ? '!text-[#1A1A1A] stroke-[#1A1A1A]' : 'text-[#00FFBB]'
            }) : icon}
          </div>
          <span data-metric-title className={cn("font-sans uppercase", isHero ? "text-zinc-200" : "text-zinc-400")}>{title}</span>
        </div>
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FFBB] shadow-sm shadow-[#00FFBB]"></div>
        )}
      </div>

      {/* MIDDLE SECTION: BIG VALUE + SUBTEXT */}
      <div className="mb-1">
        <h3 data-metric-value className={cn("font-sans tabular-nums mb-1 transition-colors", valueColor || (isHero ? "text-white" : "text-white"))}>{value}</h3>
        <p data-metric-subtext className="text-zinc-400 font-normal">{subtext}</p>
      </div>

      {/* COMPARISON BADGE */}
      {comparison && (
        <div data-metric-comparison className="mt-3 pt-2.5 border-t border-[#262626] flex items-center justify-between gap-2">
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] font-sans font-bold text-xs tracking-wide shrink-0",
            comparison.isGood 
              ? "bg-[#00FFBB]/10 text-[#00FFBB] border border-[#00FFBB]/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          )}>
            {comparison.percent > 0 ? (
              <TrendingUp size={11} className={comparison.isGood ? "text-[#00FFBB]" : "text-rose-400"} />
            ) : comparison.percent < 0 ? (
              <TrendingDown size={11} className={comparison.isGood ? "text-[#00FFBB]" : "text-rose-400"} />
            ) : (
              <Equal size={11} className="text-zinc-400" />
            )}
            <span>{comparison.formatted}</span>
          </div>

          <div 
            className="font-sans text-xs text-zinc-400 font-medium truncate text-right flex items-center gap-1 justify-end min-w-0"
            title={comparison.prevFormatted ? `Valor no período anterior: ${comparison.prevFormatted}` : undefined}
          >
            <span className="truncate">{comparisonLabel || 'vs. anterior'}</span>
            {comparison.prevFormatted && (
              <span className="text-zinc-200 font-bold bg-[#242424] px-1.5 py-0.5 rounded-[4px] border border-[#262626] shrink-0 text-xs">
                ({comparison.prevFormatted})
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function getLabelForDateRange(range: string, custom: { start: string; end: string }) {
  if (range.startsWith('CUSTOM:')) {
    const parts = range.split(':')[1]?.split('|');
    if (parts && parts.length === 2 && parts[0] && parts[1]) {
      const formatD = (s: string) => s.split('-').reverse().join('/');
      return `${formatD(parts[0])} - ${formatD(parts[1])}`;
    }
    return 'Personalizado';
  }
  const labels: Record<string, string> = {
    'HOJE': 'Hoje',
    'ONTEM': 'Ontem',
    'ONTEM+HOJE': 'Ontem + Hoje',
    '3D': 'Últimos 3 dias',
    '7D': 'Últimos 7 dias',
    '14D': 'Últimos 14 dias',
    '30D': 'Últimos 30 dias',
    'MES_ATUAL': 'Mês Atual',
    'MÁXIMO': 'Período Total'
  };
  return labels[range] || range;
}

const COLORS = ['#00FFBB', '#66BEFF', '#F59E0B', '#A855F7', '#F43F5E', '#38BDF8', '#10B981'];

interface DashboardProps {
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenSecuritySettings?: () => void;
}

export default function Dashboard({ authUser, onLogout, onOpenSecuritySettings }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState('Geral');
  const [dateRange, setDateRange] = useState('7D');
  const [comparePrevious, setComparePrevious] = useState(true);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [optimizationHistory, setOptimizationHistory] = useState<any[]>([]);
  const [previewAlertId, setPreviewAlertId] = useState<string | null>(null);
  const [pageSort, setPageSort] = useState<{column: string, direction: 'asc' | 'desc'}>({column: 'salesMeta', direction: 'desc'});
  const [creativeSort, setCreativeSort] = useState<{column: string, direction: 'asc' | 'desc'}>({column: 'investimento', direction: 'desc'});
  const [campaignSort, setCampaignSort] = useState<{column: string, direction: 'asc' | 'desc'}>({column: 'investimento', direction: 'desc'});
  const [fgpSort, setFgpSort] = useState<{column: string, direction: 'asc' | 'desc'}>({column: 'data', direction: 'desc'});
  const [creativeFilter, setCreativeFilter] = useState('');
  const [fgpFilter, setFgpFilter] = useState('');
  
  // Expanded Campaign rows
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [selectedSourceIndices, setSelectedSourceIndices] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['investimentoTotal', 'vendasTrafego']);
  const [selectedProject, setSelectedProject] = useState<'1' | '2' | 'all'>('1');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Profile dropdown menu state, Date picker popover state, & Mobile Nav Tab Dropdown
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  const [isFunnelMenuOpen, setIsFunnelMenuOpen] = useState(false);
  const funnelMenuRef = useRef<HTMLDivElement>(null);

  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const tabMenuRef = useRef<HTMLDivElement>(null);

  // Lightbox Zoom State
  const [activeLightboxImage, setActiveLightboxImage] = useState<{ name: string; url: string; link?: string; stats?: any } | null>(null);
  const activeLoadId = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setIsDateMenuOpen(false);
      }
      if (funnelMenuRef.current && !funnelMenuRef.current.contains(event.target as Node)) {
        setIsFunnelMenuOpen(false);
      }
      if (tabMenuRef.current && !tabMenuRef.current.contains(event.target as Node)) {
        setIsTabMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async (proj?: '1' | '2' | 'all') => {
    const targetProj = proj || selectedProject;
    const loadId = activeLoadId.current + 1;
    activeLoadId.current = loadId;
    setLoading(true);
    setFetchError(null);
    try {
      const result = await fetchSpreadsheetData(targetProj);
      if (loadId !== activeLoadId.current) return;
      setData(result);
      setLastUpdated(new Date());
    } catch (error: any) {
      if (loadId !== activeLoadId.current) return;
      console.error(error);
      setFetchError(error.message || "Erro ao carregar os dados da planilha");
    } finally {
      if (loadId === activeLoadId.current) setLoading(false);
    }
  };

  const handleSelectProject = (proj: '1' | '2' | 'all') => {
    setSelectedProject(proj);
  };

  const selectedFunnels = {
    strategy: selectedProject !== '2',
    management: selectedProject !== '1'
  };

  const toggleFunnel = (funnel: 'strategy' | 'management') => {
    const next = {
      ...selectedFunnels,
      [funnel]: !selectedFunnels[funnel]
    };

    if (!next.strategy && !next.management) return;

    handleSelectProject(next.strategy && next.management ? 'all' : next.strategy ? '1' : '2');
  };

  useEffect(() => {
    loadData(selectedProject);
    
    // Auto-refresh da página a cada 5 minutos
    const intervalId = setInterval(() => {
      loadData(selectedProject);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [selectedProject]);

  const tabs = [
    { name: 'Geral', icon: LayoutDashboard },
    { name: 'Fontes das Vendas', icon: PieChart },
    { name: 'Funil', icon: Layers },
    { name: 'Campanhas', icon: Megaphone },
    { name: 'Criativos', icon: Image }
  ];

  const dateOptions = ['HOJE', 'ONTEM', 'ONTEM+HOJE', '3D', '7D', '14D', '30D', 'MES_ATUAL', 'MÁXIMO'];

  const metricsData = useMemo(() => {
    const defaultMetrics = {
      geral: {
        investimentoTotal: 0,
        faturamentoTotal: 0,
        lucroTotal: 0,
        ticketMedio: 0,
        vendasIngressos: 0,
        vendasTrafego: 0,
        cpaTrafego: 0,
        cpaTotal: 0, roas: 0,
        impressoesTotal: 0,
        cliquesTotal: 0,
        pageViewsTotal: 0,
        checkoutsTotal: 0,
      },
      campaigns: [] as any[],
      creatives: [] as any[],
      sources: [] as any[],
      totalSalesWithSource: 0,
      totalRevenueWithSource: 0,
      pagesList: [] as any[],
      dailyMetrics: [] as any[],
      fgpBuyers: [] as any[],
      fgpResume: { totalVendas: 0, faturamentoFgp: 0, ticketMedioFgp: 0 }
    };

    if (!data || !data.data) return defaultMetrics;

    const rawMetaData = data.data["Dados da Meta"] || [];
    const rawBuyersData = data.data["Dados dos Compradores"] || [];
    const rawFgpBuyers = data.data["Dados dos Compradores - FGP"] || [];

    const dateFilterPredicate = buildDateFilter(dateRange);

    // Filter by date
    const metaData = rawMetaData.filter((row: any) => {
      const date = row['Data'];
      return dateFilterPredicate(date);
    });

    const buyersByDate = rawBuyersData.filter((row: any) => {
      // Assuming 'Data' or similar exists for buyers, else fallback to max / true if missing
      const date = row['Data'] || row['Data da Compra'] || row['Criado em'];
      if (!date) return true; // If no date column found, keep it
      return dateFilterPredicate(date);
    });

    const fgpBuyersByDate = rawFgpBuyers.filter((row: any) => {
      const date = row['Data'] || row['Data da Compra'] || row['Criado em'];
      if (!date) return true;
      return dateFilterPredicate(date);
    });

    let faturamentoFgp = 0;
    let vendasFgpConfirmadas = 0;
    const fgpPlataformasMap: Record<string, any> = {};
    const fgpOrigensMap: Record<string, any> = {};
    const fgpDailyMap: Record<string, any> = {};

    let faturamentoReembolsado = 0;
    const fgpReembolsosList: any[] = [];

    fgpBuyersByDate.forEach((row: any) => {
      const valStr = row['Valor'] || row['Valor Bruto'] || row['Preço'] || row['Faturamento'] || row['Valor Pago'] || '0';
      const valor = parseValue(valStr);

      const obs = String(row['Obs'] || row['obs'] || '').toLowerCase().trim();
      const isReembolso = obs.includes('reembolso') || obs.includes('reembolsado');
      const email = row['E-mail'] || row['Email'] || row['Comprador'] || (Object.values(row)[1] as string) || 'Email Não Identificado';

      // Extract day
      const dataStr = row['Data'] || row['Data da Compra'] || row['Criado em'] || '';
      let dateKey = 'Sem Data';
      if (dataStr) {
        const { dateStr: utcMinus3Date } = parseUtcToUtcMinus3(dataStr);
        dateKey = utcMinus3Date || dataStr.split(' ')[0];
      }
      if (!fgpDailyMap[dateKey]) {
        fgpDailyMap[dateKey] = { date: dateKey, Vendas: 0, Faturamento: 0, Reembolsadas: 0, ValorReembolsado: 0 };
      }

      if (isReembolso) {
        faturamentoReembolsado += valor;
        fgpReembolsosList.push({ email, valor, date: dateKey });
        fgpDailyMap[dateKey].Reembolsadas += 1;
        fgpDailyMap[dateKey].ValorReembolsado += valor;
      } else {
        faturamentoFgp += valor;
        vendasFgpConfirmadas += 1;
        fgpDailyMap[dateKey].Vendas += 1;
        fgpDailyMap[dateKey].Faturamento += valor;

        // Plataforma
        const plat = row['Plataforma'] || row['plataforma'] || row['Platform'] || 'Sem Identificação';
        if (!fgpPlataformasMap[plat]) fgpPlataformasMap[plat] = { name: plat, value: 0, faturamento: 0 };
        fgpPlataformasMap[plat].value += 1;
        fgpPlataformasMap[plat].faturamento += valor;

        // Origem
        const orig = row['utm_source'] || row['Origem'] || row['Source'] || row['src'] || 'Sem Identificação';
        if (!fgpOrigensMap[orig]) fgpOrigensMap[orig] = { name: orig, value: 0, faturamento: 0 };
        fgpOrigensMap[orig].value += 1;
        fgpOrigensMap[orig].faturamento += valor;
      }
    });

    const totalVendasFgp = vendasFgpConfirmadas;
    const fgpResume = {
      totalVendas: totalVendasFgp,
      faturamentoFgp,
      faturamentoReembolsado,
      totalReembolsos: fgpReembolsosList.length,
      reembolsosList: fgpReembolsosList,
      ticketMedioFgp: totalVendasFgp > 0 ? faturamentoFgp / totalVendasFgp : 0,
      plataformas: Object.values(fgpPlataformasMap).sort((a,b) => b.value - a.value),
      origens: Object.values(fgpOrigensMap).sort((a,b) => b.value - a.value),
      daily: Object.values(fgpDailyMap).sort((a: any, b: any) => {
        const parseD = (d: string) => {
          if (d === 'Sem Data') return 0;
          const parts = d.split('/');
          if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).getTime();
          return new Date(d).getTime();
        };
        return parseD(a.date) - parseD(b.date);
      })
    };

    const filteredBuyers = buyersByDate;

    // 2. Geral - Investimento
    const investimentoCru = metaData.reduce((acc: number, row: any) => acc + parseValue(row['Gasto']), 0);
    const investimentoTotal = investimentoCru * 1.1215;

    // 3. Geral - Faturamento
    const faturamentoTotal = filteredBuyers.reduce((acc: number, row: any) => {
      const valStr = row['Valor'] || row['Valor Bruto'] || row['Preço'] || row['Faturamento'] || row['Valor Pago'] || '0';
      return acc + parseValue(valStr);
    }, 0);

    // 4. Geral - Lucro e Ticket Médio
    const lucroTotal = faturamentoTotal - investimentoTotal;
    const vendasIngressos = filteredBuyers.length;
    const ticketMedio = vendasIngressos > 0 ? faturamentoTotal / vendasIngressos : 0;

    // Funnel Meta Totals
    const impressoesTotal = metaData.reduce((acc: number, row: any) => acc + parseValue(row['Impressões']), 0);
    const cliquesTotal = metaData.reduce((acc: number, row: any) => acc + parseValue(row['Cliques no Link']), 0);
    const pageViewsTotal = metaData.reduce((acc: number, row: any) => acc + parseValue(row['Visualizações da Página de Destino']), 0);
    const checkoutsTotal = metaData.reduce((acc: number, row: any) => acc + parseValue(row['Iniciate Checkout']), 0);

    // --- NORMALIZATION & MATCHING HELPERS ---
    const normalizeStr = (s: any) => {
      if (!s) return '';
      let str = String(s);
      try { str = decodeURIComponent(str.replace(/\+/g, ' ')); } catch (e) { str = str.replace(/\+/g, ' '); }
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    };

    const extractAdId = (s: any) => {
      if (!s) return null;
      const str = normalizeStr(s);
      const m = str.match(/\bad\s*0*(\d+)\b/) || str.match(/\[ad\s*0*(\d+)\]/);
      return m ? parseInt(m[1], 10) : null;
    };

    const extractAdRange = (s: any) => {
      if (!s) return [];
      const text = normalizeStr(s);
      const m = text.match(/ad\s*0*(\d+)\s*(?:a|-)\s*ad?\s*0*(\d+)/i) || text.match(/ad0*(\d+)-0*(\d+)/i);
      if (m) {
        const start = parseInt(m[1], 10);
        const end = parseInt(m[2], 10);
        const res: number[] = [];
        for (let i = start; i <= end; i++) res.push(i);
        return res;
      }
      return [];
    };

    const isFuzzyMatch = (str1: string, str2: string) => {
      if (!str1 || !str2) return false;
      const n1 = normalizeStr(str1);
      const n2 = normalizeStr(str2);
      const s1 = n1.replace(/[^a-z0-9]/g, '');
      const s2 = n2.replace(/[^a-z0-9]/g, '');
      if (!s1 || !s2) return false;
      if (s1 === s2) return true;
      if (s1.includes(s2) || s2.includes(s1)) return true;
      if (s1.length > 8 && s2.length > 8 && (s1.startsWith(s2.slice(0, 10)) || s2.startsWith(s1.slice(0, 10)))) return true;
      return false;
    };

    const isAdMatch = (metaAdName: string, buyerUtm: string) => {
      if (!metaAdName || !buyerUtm) return false;
      const nMeta = normalizeStr(metaAdName);
      const nUtm = normalizeStr(buyerUtm);
      const cMeta = nMeta.replace(/[^a-z0-9]/g, '');
      const cUtm = nUtm.replace(/[^a-z0-9]/g, '');

      if (cMeta === cUtm) return true;

      const metaId = extractAdId(metaAdName);
      const utmId = extractAdId(buyerUtm);
      if (metaId !== null && utmId !== null) {
        return metaId === utmId;
      }

      return cMeta.length > 6 && cUtm.length > 6 && (cMeta.includes(cUtm) || cUtm.includes(cMeta));
    };

    const isSetMatch = (metaSetName: string, buyerMed: string, buyerCont: string, buyerTerm: string) => {
      if (!metaSetName) return false;
      const nMeta = normalizeStr(metaSetName);
      const cMeta = nMeta.replace(/[^a-z0-9]/g, '');
      const metaRange = extractAdRange(metaSetName);

      for (const utm of [buyerMed, buyerCont, buyerTerm]) {
        if (!utm) continue;
        const nUtm = normalizeStr(utm);
        const cUtm = nUtm.replace(/[^a-z0-9]/g, '');

        if (cMeta === cUtm) return true;

        const utmRange = extractAdRange(utm);
        if (metaRange.length > 0 && utmRange.length > 0) {
          if (metaRange[0] === utmRange[0] && metaRange[metaRange.length - 1] === utmRange[utmRange.length - 1]) {
            return true;
          }
        }

        const singleAd = extractAdId(utm);
        if (singleAd !== null && metaRange.length > 0) {
          if (metaRange.includes(singleAd)) {
            const metaIsDynamic = nMeta.includes('dinamico') || nMeta.includes('dinamica');
            const utmIsDynamic = nUtm.includes('dinamico') || nUtm.includes('dinamica');
            if (metaIsDynamic === utmIsDynamic) {
              return true;
            }
          }
        }

        if (cMeta.length > 8 && cUtm.length > 8 && (cMeta.includes(cUtm) || cUtm.includes(cMeta))) {
          return true;
        }
      }
      return false;
    };

    // 5. TRÁFEGO origin check
    const isTrafficSale = (b: any) => {
      const src = (b['utm_source'] || b['Source'] || b['Origem'] || b['Origem / utm_source'] || '').toString().trim().toLowerCase();
      const camp = (b['utm_campaign'] || b['Campanha'] || b['UTM Campaign'] || '').toString().trim().toLowerCase();
      const med = (b['utm_medium'] || b['Medium'] || b['utm_medium (D)'] || '').toString().trim().toLowerCase();
      const cont = (b['utm_content'] || '').toString().trim().toLowerCase();
      const term = (b['utm_term'] || '').toString().trim().toLowerCase();

      // Desconsidera disparos/email/orgânico quando explicitamente marcados sem utm de tráfego
      if (src === 'eduzz_rvp_email' || src.includes('sendflow') || src === 'ig_linkbio' || src === 'ig_stories') {
        return false;
      }

      if (src === 'meta' || src === 'trafego' || src === 'tráfego' || src === 'paid' || src === 'facebook' || src === 'instagram' || src === 'ads') {
        return true;
      }

      if (med === 'paid' || med.includes('conv') || med.includes('adv') || /ad\d+/i.test(med)) {
        return true;
      }

      if (camp.includes('mario') || camp.includes('perpetuo') || camp.includes('perpétuo') || camp.includes('gpcomia') || camp.includes('pmo') || camp.includes('testeads') || camp.includes('livro')) {
        return true;
      }

      if (/\[ad\d+\]|ad\s*\d+/i.test(cont) || /\[ad\d+\]|ad\s*\d+/i.test(term) || /\[ad\d+\]|ad\s*\d+/i.test(med)) {
        return true;
      }

      return false;
    };

    const vendasTrafego = filteredBuyers.filter(isTrafficSale).length;
    const cpaTrafego = vendasTrafego > 0 ? investimentoTotal / vendasTrafego : 0;
    const cpaTotal = vendasIngressos > 0 ? investimentoTotal / vendasIngressos : 0;
    const roas = investimentoTotal > 0 ? faturamentoTotal / investimentoTotal : 0;

    // --- CÁLCULO DE COMPARAÇÃO COM PERÍODO ANTERIOR ---
    let prevGeral: any = null;
    let comparison: Record<string, any> = {};

    if (comparePrevious && dateRange !== 'MÁXIMO') {
      const prevDateFilterPredicate = buildPreviousDateFilter(dateRange);

      const prevMetaData = rawMetaData.filter((row: any) => prevDateFilterPredicate(row['Data']));
      const prevBuyersByDate = rawBuyersData.filter((row: any) => {
        const date = row['Data'] || row['Data da Compra'] || row['Criado em'];
        if (!date) return false;
        return prevDateFilterPredicate(date);
      });

      const prevInvestimentoCru = prevMetaData.reduce((acc: number, row: any) => acc + parseValue(row['Gasto']), 0);
      const prevInvestimentoTotal = prevInvestimentoCru * 1.1215;

      const prevFaturamentoTotal = prevBuyersByDate.reduce((acc: number, row: any) => {
        const valStr = row['Valor'] || row['Valor Bruto'] || row['Preço'] || row['Faturamento'] || row['Valor Pago'] || '0';
        return acc + parseValue(valStr);
      }, 0);

      const prevLucroTotal = prevFaturamentoTotal - prevInvestimentoTotal;
      const prevVendasIngressos = prevBuyersByDate.length;
      const prevTicketMedio = prevVendasIngressos > 0 ? prevFaturamentoTotal / prevVendasIngressos : 0;

      const prevImpressoesTotal = prevMetaData.reduce((acc: number, row: any) => acc + parseValue(row['Impressões']), 0);
      const prevCliquesTotal = prevMetaData.reduce((acc: number, row: any) => acc + parseValue(row['Cliques no Link']), 0);
      const prevPageViewsTotal = prevMetaData.reduce((acc: number, row: any) => acc + parseValue(row['Visualizações da Página de Destino']), 0);
      const prevCheckoutsTotal = prevMetaData.reduce((acc: number, row: any) => acc + parseValue(row['Iniciate Checkout']), 0);

      const prevVendasTrafego = prevBuyersByDate.filter(isTrafficSale).length;
      const prevCpaTrafego = prevVendasTrafego > 0 ? prevInvestimentoTotal / prevVendasTrafego : 0;
      const prevCpaTotal = prevVendasIngressos > 0 ? prevInvestimentoTotal / prevVendasIngressos : 0;
      const prevRoas = prevInvestimentoTotal > 0 ? prevFaturamentoTotal / prevInvestimentoTotal : 0;

      prevGeral = {
        investimentoTotal: prevInvestimentoTotal,
        faturamentoTotal: prevFaturamentoTotal,
        lucroTotal: prevLucroTotal,
        ticketMedio: prevTicketMedio,
        vendasIngressos: prevVendasIngressos,
        vendasTrafego: prevVendasTrafego,
        cpaTrafego: prevCpaTrafego,
        cpaTotal: prevCpaTotal,
        roas: prevRoas,
        impressoesTotal: prevImpressoesTotal,
        cliquesTotal: prevCliquesTotal,
        pageViewsTotal: prevPageViewsTotal,
        checkoutsTotal: prevCheckoutsTotal,
      };

      comparison = {
        investimentoTotal: calculateComparison(investimentoTotal, prevInvestimentoTotal, false, 'currency'),
        faturamentoTotal: calculateComparison(faturamentoTotal, prevFaturamentoTotal, false, 'currency'),
        lucroTotal: calculateComparison(lucroTotal, prevLucroTotal, false, 'currency'),
        ticketMedio: calculateComparison(ticketMedio, prevTicketMedio, false, 'currency'),
        vendasIngressos: calculateComparison(vendasIngressos, prevVendasIngressos, false, 'number'),
        vendasTrafego: calculateComparison(vendasTrafego, prevVendasTrafego, false, 'number'),
        cpaTrafego: calculateComparison(cpaTrafego, prevCpaTrafego, true, 'currency'),
        cpaTotal: calculateComparison(cpaTotal, prevCpaTotal, true, 'currency'),
        roas: calculateComparison(roas, prevRoas, false, 'roas'),
        impressoesTotal: calculateComparison(impressoesTotal, prevImpressoesTotal, false, 'number'),
        cliquesTotal: calculateComparison(cliquesTotal, prevCliquesTotal, false, 'number'),
        pageViewsTotal: calculateComparison(pageViewsTotal, prevPageViewsTotal, false, 'number'),
        checkoutsTotal: calculateComparison(checkoutsTotal, prevCheckoutsTotal, false, 'number'),
      };
    }


    // --- AGRUPAMENTO DE CAMPANHAS E CONJUNTOS ---
    const campaignsMap: Record<string, any> = {};

    metaData.forEach((row: any) => {
      const campName = row['Nome da Campanha'] || 'Desconhecida';
      const setName = row['Nome do Conjunto'] || 'Desconhecido';
      
      if (!campaignsMap[campName]) {
        campaignsMap[campName] = {
          name: campName,
          gastoBruto: 0,
          impressoes: 0,
          cliques: 0,
          landingPageViews: 0,
          initiateCheckout: 0,
          comprasTrafego: 0, // Vendas atreladas à campanha
          faturamentoTrafego: 0,
          setsMap: {} as Record<string, any>
        };
      }

      const camp = campaignsMap[campName];
      if (!camp.setsMap[setName]) {
        camp.setsMap[setName] = {
          name: setName,
          gastoBruto: 0,
          impressoes: 0,
          cliques: 0,
          landingPageViews: 0,
          initiateCheckout: 0,
        };
      }

      const cs = camp.setsMap[setName];
      const g = parseValue(row['Gasto']);
      const imp = parseValue(row['Impressões']);
      const clq = parseValue(row['Cliques no Link']);
      const lpv = parseValue(row['Visualizações da Página de Destino']);
      const ic = parseValue(row['Iniciate Checkout']);

      // Sum for Camp
      camp.gastoBruto += g;
      camp.impressoes += imp;
      camp.cliques += clq;
      camp.landingPageViews += lpv;
      camp.initiateCheckout += ic;

      // Sum for Set
      cs.gastoBruto += g;
      cs.impressoes += imp;
      cs.cliques += clq;
      cs.landingPageViews += lpv;
      cs.initiateCheckout += ic;
    });

    
    // Mapeamento de vendas por campanha e conjunto
    filteredBuyers.filter(isTrafficSale).forEach((b: any) => {
      const campUtm = (b['utm_campaign'] || b['Campanha'] || b['UTM Campaign'] || '').toString();
      const medUtm = (b['utm_medium'] || '').toString();
      const contUtm = (b['utm_content'] || '').toString();
      const termUtm = (b['utm_term'] || '').toString();
      
      const valStr = b['Valor'] || b['Valor Bruto'] || b['Preço'] || b['Faturamento'] || b['Valor Pago'] || '0';
      const valNum = parseValue(valStr);

      let matchedCampKey = Object.keys(campaignsMap).find(k => isFuzzyMatch(k, campUtm));
      if (!matchedCampKey && Object.keys(campaignsMap).length === 1) {
        matchedCampKey = Object.keys(campaignsMap)[0];
      }

      if (matchedCampKey) {
        campaignsMap[matchedCampKey].comprasTrafego += 1;
        campaignsMap[matchedCampKey].faturamentoTrafego += valNum;

        const setsKeys = Object.keys(campaignsMap[matchedCampKey].setsMap);
        const matchedSetKey = setsKeys.find(k => isSetMatch(k, medUtm, contUtm, termUtm));

        if (matchedSetKey) {
           if (!campaignsMap[matchedCampKey].setsMap[matchedSetKey].comprasTrafego) campaignsMap[matchedCampKey].setsMap[matchedSetKey].comprasTrafego = 0;
           if (!campaignsMap[matchedCampKey].setsMap[matchedSetKey].faturamentoTrafego) campaignsMap[matchedCampKey].setsMap[matchedSetKey].faturamentoTrafego = 0;
           
           campaignsMap[matchedCampKey].setsMap[matchedSetKey].comprasTrafego += 1;
           campaignsMap[matchedCampKey].setsMap[matchedSetKey].faturamentoTrafego += valNum;
        }
      }
    });

    // Convert map to array
    const campaigns = Object.values(campaignsMap).map((c: any) => {
      const cInvestimento = c.gastoBruto * 1.1215;
      return {
        ...c,
        investimento: cInvestimento,
        cpm: c.impressoes > 0 ? (cInvestimento / c.impressoes) * 1000 : 0,
        cpc: c.cliques > 0 ? cInvestimento / c.cliques : 0,
        ctr: c.impressoes > 0 ? c.cliques / c.impressoes : 0,
        cpa: c.comprasTrafego > 0 ? cInvestimento / c.comprasTrafego : 0,
        roas: cInvestimento > 0 ? c.faturamentoTrafego / cInvestimento : 0,
        sets: Object.values(c.setsMap).map((s: any) => {
          const sInvestimento = s.gastoBruto * 1.1215;
          const comprasTrafego = s.comprasTrafego || 0;
          const faturamentoTrafego = s.faturamentoTrafego || 0;
          return {
            ...s,
            investimento: sInvestimento,
            cpm: s.impressoes > 0 ? (sInvestimento / s.impressoes) * 1000 : 0,
            cpc: s.cliques > 0 ? sInvestimento / s.cliques : 0,
            ctr: s.impressoes > 0 ? s.cliques / s.impressoes : 0,
            comprasTrafego,
            cpa: comprasTrafego > 0 ? sInvestimento / comprasTrafego : 0,
            faturamentoTrafego,
            roas: sInvestimento > 0 ? faturamentoTrafego / sInvestimento : 0,
          };
        }).sort((a: any, b: any) => b.investimento - a.investimento)
      };
    }).sort((a: any, b: any) => b.investimento - a.investimento);

    // --- AGRUPAMENTO DE FONTES DE VENDAS ---
    const sourcesMap: Record<string, any> = {
      'META': { name: 'META', category: 'Tráfego Pago', count: 0, revenue: 0 },
      'IG_STORIES': { name: 'IG_STORIES', category: 'Orgânico', count: 0, revenue: 0 },
      'IG_LINKBIO': { name: 'IG_LINKBIO', category: 'Orgânico', count: 0, revenue: 0 },
      'SENDFLOW': { name: 'SENDFLOW', category: 'Disparos', count: 0, revenue: 0 },
      'SENDFLOWMBA': { name: 'SENDFLOWMBA', category: 'Disparos', count: 0, revenue: 0 },
      'SEM ORIGEM IDENTIFICADA': { name: 'SEM ORIGEM IDENTIFICADA', category: 'Sem Origem', count: 0, revenue: 0 }
    };
    let totalSalesWithSource = 0;
    let totalRevenueWithSource = 0;

    const fillSourceMap = (row: any, increment: boolean) => {
      const colDStr = (row['utm_medium'] || row['Medium'] || row['utm_medium (D)'] || '').toString().toLowerCase().trim();
      const colFOrig = (row['utm_source'] || row['Source'] || row['Origem'] || row['Origem / utm_source'] || '').toString().trim();
      
      let sourceName = colFOrig || "Sem Origem Identificada";
      let category = "Indefinida";
      
      if (!colFOrig || sourceName.toUpperCase() === 'SEM ORIGEM IDENTIFICADA') {
        sourceName = "Sem Origem Identificada";
        category = "Sem Origem";
      } else if (isTrafficSale(row)) {
        const rawUpper = colFOrig.toUpperCase();
        sourceName = (rawUpper === 'TRAFEGO' || rawUpper === 'TRÁFEGO' || rawUpper === 'META') ? 'META' : rawUpper;
        category = "Tráfego Pago";
      } else if (!colDStr) {
        sourceName = colFOrig;
        category = "Outros"; 
      } else {
        sourceName = colFOrig;
        if (colDStr.includes('conv')) {
          category = "Tráfego Pago";
        } else if (colDStr.includes('organic') || sourceName.toUpperCase().includes('IG_') || sourceName.toUpperCase().includes('INSTAGRAM')) {
          category = "Orgânico";
        } else if (colDStr.includes('disparos') || sourceName.toUpperCase().includes('SENDFLOW') || sourceName.toUpperCase().includes('EMAIL')) {
          category = "Disparos";
        } else {
          category = "Outros";
        }
      }

      const key = `${sourceName.toUpperCase()}`;
      if (!sourcesMap[key]) {
        sourcesMap[key] = {
          name: sourceName.toUpperCase(),
          category,
          count: 0,
          revenue: 0
        };
      }
      
      if (increment) {
        sourcesMap[key].count += 1;
        const valStr = row['Valor'] || row['Valor Bruto'] || row['Preço'] || row['Faturamento'] || row['Valor Pago'] || '0';
        const rawValor = parseValue(valStr);
        sourcesMap[key].revenue += rawValor;
        totalSalesWithSource += 1;
        totalRevenueWithSource += rawValor;
      }
    };

    // Primeiro cadastra todas as chaves (inclusive de dias que podem não estar no filtro atual)
    rawBuyersData.forEach((row: any) => fillSourceMap(row, false));
    
    // Depois incementa apenas os dados do filtro de data atual
    buyersByDate.forEach((row: any) => fillSourceMap(row, true));

    const sourcesRaw = Object.values(sourcesMap).sort((a: any, b: any) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name); // Desempate por nome para manter ordem
    });
    const COLOR_HEX = ['#00FFBB', '#66BEFF', '#A855F7', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1', '#94A3B8', '#38BDF8'];
    const COLOR_BG = ['bg-[#00FFBB]', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-amber-400', 'bg-rose-400', 'bg-teal-400', 'bg-indigo-400', 'bg-slate-400', 'bg-sky-400'];

    const sources = sourcesRaw.map((s: any, i: number) => ({
      ...s,
      rank: i + 1,
      originalIndex: i,
      hex: COLOR_HEX[i % COLOR_HEX.length],
      bg: COLOR_BG[i % COLOR_BG.length]
    }));

    // --- ANALISE DE PAGINAS ---
    const pagesMap: Record<string, { url: string, slug: string, pageViews: number, checkouts: number, salesMeta: number, salesOther: number }> = {};
    
    const getSlug = (url: string) => {
      try {
        const urlStr = url.startsWith('http') ? url : 'https://' + url;
        const u = new URL(urlStr);
        const path = u.pathname.replace(/\/$/, "");
        return path.substring(path.lastIndexOf('/') + 1) || u.hostname;
      } catch(e) {
        let parts = url.split('/').filter(Boolean);
        return parts[parts.length - 1] || url;
      }
    };

    const adToUrl: Record<string, string> = {};
    rawBuyersData.forEach((row: any) => {
      if (row.utm_content) {
        try {
          const parsed = JSON.parse(row.utm_content);
          if (parsed.co && parsed.url) {
             const cleanUrl = parsed.url.trim();
             adToUrl[parsed.co] = cleanUrl;
             if (!pagesMap[cleanUrl]) {
               pagesMap[cleanUrl] = { url: cleanUrl, slug: getSlug(cleanUrl), pageViews: 0, checkouts: 0, salesMeta: 0, salesOther: 0 };
             }
          }
        } catch(e) {}
      }
    });

    metaData.forEach((row: any) => {
      const adName = row['Nome do Anúncio'];
      if (adName && adToUrl[adName]) {
         const url = adToUrl[adName];
         pagesMap[url].pageViews += parseValue(row['Visualizações da Página de Destino']);
         pagesMap[url].checkouts += parseValue(row['Iniciate Checkout']);
      }
    });

    buyersByDate.forEach((row: any) => {
      if (row.utm_content) {
        try {
          const parsed = JSON.parse(row.utm_content);
          if (parsed.url) {
            const cleanUrl = parsed.url.trim();
            if (!pagesMap[cleanUrl]) {
               pagesMap[cleanUrl] = { url: cleanUrl, slug: getSlug(cleanUrl), pageViews: 0, checkouts: 0, salesMeta: 0, salesOther: 0 };
            }
            if (isTrafficSale(row)) {
               pagesMap[cleanUrl].salesMeta += 1;
            } else {
               pagesMap[cleanUrl].salesOther += 1;
            }
          }
        } catch(e) {}
      }
    });

    // --- AGRUPAMENTO DE CRIATIVOS ---
    const creativesMap: Record<string, any> = {};
    const rawCreativesLinks = data.data["Link dos criativos"] || [];
    const creativeLinks: Record<string, string> = {};
    const creativeThumbs: Record<string, string> = {};

    rawCreativesLinks.forEach((row: any) => {
       const adName = (row['Criativos'] || row['Criativo'] || row['Nome do Anúncio'] || row['Nome'] || '').toString().trim().toUpperCase();
       const link = row['Link'] || row['Link dos criativos'] || row['Link Criativo'] || '';
       const thumb = row['Thumb_Criativo'] || row['Thumb Criativo'] || row['thumb_criativo'] || row['Thumb'] || row['Thumbnail'] || row['Imagem'] || row['Preview'] || row['Prévia'] || '';
       if (adName) {
           if (link) creativeLinks[adName] = link;
           if (thumb) creativeThumbs[adName] = thumb;
       }
    });

    metaData.forEach((row: any) => {
      const adName = (row['Nome do Anúncio'] || 'Desconhecido').toString().trim();
      const key = adName.toUpperCase();
      const metaThumb = row['Thumb_Criativo'] || row['Thumb Criativo'] || row['thumb_criativo'] || row['Thumb'] || row['Thumbnail'] || '';
      
      if (!creativesMap[key]) {
        let foundLink = creativeLinks[key] || '';
        let foundThumb = creativeThumbs[key] || metaThumb || '';

        if (!foundLink || !foundThumb) {
          const matchedLinkKey = Object.keys(creativeLinks).find(k => isFuzzyMatch(k, key));
          if (matchedLinkKey && !foundLink) foundLink = creativeLinks[matchedLinkKey];
          const matchedThumbKey = Object.keys(creativeThumbs).find(k => isFuzzyMatch(k, key));
          if (matchedThumbKey && !foundThumb) foundThumb = creativeThumbs[matchedThumbKey];
        }

        creativesMap[key] = {
           name: adName,
           link: foundLink,
           thumb: foundThumb,
           Thumb_Criativo: foundThumb,
           gastoBruto: 0,
           impressoes: 0,
           cliques: 0,
           vendas: 0,
           faturamento: 0,
        };
      } else if (!creativesMap[key].thumb && (creativeThumbs[key] || metaThumb)) {
        const t = creativeThumbs[key] || metaThumb;
        creativesMap[key].thumb = t;
        creativesMap[key].Thumb_Criativo = t;
      }
      
      creativesMap[key].gastoBruto += parseValue(row['Gasto']);
      creativesMap[key].impressoes += parseValue(row['Impressões']);
      creativesMap[key].cliques += parseValue(row['Cliques no Link']);
    });

    
    filteredBuyers.filter(isTrafficSale).forEach((b: any) => {
      const termUtm = (b['utm_term'] || '').toString().trim();
      const contUtm = (b['utm_content'] || '').toString().trim();
      const medUtm = (b['utm_medium'] || '').toString().trim();
      const valStr = b['Valor'] || b['Valor Bruto'] || b['Preço'] || b['Faturamento'] || b['Valor Pago'] || '0';
      const valNum = parseValue(valStr);

      const creativeKeys = Object.keys(creativesMap);
      let matchedCreativeKey = creativeKeys.find(k => (
        isAdMatch(k, contUtm) ||
        isAdMatch(k, termUtm) ||
        isAdMatch(k, medUtm)
      ));

      if (!matchedCreativeKey && b.utm_content && b.utm_content.startsWith('{')) {
        try {
          const parsed = JSON.parse(b.utm_content);
          if (parsed.co) {
            matchedCreativeKey = creativeKeys.find(k => isAdMatch(k, parsed.co));
          }
        } catch (e) {}
      }

      if (matchedCreativeKey) {
        creativesMap[matchedCreativeKey].vendas += 1;
        creativesMap[matchedCreativeKey].faturamento += valNum;
      }
    });

    const creatives = Object.values(creativesMap).map((c: any) => {
      const cInvestimento = c.gastoBruto * 1.1215;
      return {
        ...c,
        investimento: cInvestimento,
        ctr: c.impressoes > 0 ? c.cliques / c.impressoes : 0,
        cpa: c.vendas > 0 ? cInvestimento / c.vendas : 0,
        conv: c.cliques > 0 ? c.vendas / c.cliques : 0,
        roas: cInvestimento > 0 ? c.faturamento / cInvestimento : 0
      };
    }).sort((a: any, b: any) => b.investimento - a.investimento);

    // --- DAILY DATA ---
    const allDailyMap: Record<string, any> = {};

    const processDaily = (dateStr: string) => {
      let dayKey = '';
      try {
        const { dateStr: utcMinus3Date } = parseUtcToUtcMinus3(dateStr);
        const parts = utcMinus3Date.split('-');
        if (parts.length === 3) {
          dayKey = `${parts[2]}/${parts[1]}`;
        }
      } catch (e) {}

      // Ignora dados com datas inválidas ou textos que vieram da planilha como "Nwe"
      if (!/^\d{2}\/\d{2}$/.test(dayKey)) return null;

      if (!allDailyMap[dayKey]) {
        allDailyMap[dayKey] = {
          date: dayKey,
          rawDate: dateStr,
          investimentoTotal: 0,
          faturamentoTotal: 0,
          vendasIngressos: 0,
          vendasTrafego: 0,
          impressoesTotal: 0,
          cliquesTotal: 0,
          pageViewsTotal: 0,
          checkoutsTotal: 0,
        };
      }
      return allDailyMap[dayKey];
    };

    rawMetaData.forEach((row: any) => {
      const d = row['Data'];
      if (!d) return;
      const dayData = processDaily(String(d));
      if (!dayData) return;
      
      const gasto = parseValue(row['Gasto']);
      dayData.investimentoTotal += gasto * 1.1215;
      
      dayData.impressoesTotal += parseValue(row['Impressões']);
      dayData.cliquesTotal += parseValue(row['Cliques no Link']);
      dayData.pageViewsTotal += parseValue(row['Visualizações da Página de Destino']);
      dayData.checkoutsTotal += parseValue(row['Iniciate Checkout']);
    });

    rawBuyersData.forEach((row: any) => {
      const d = row['Data'] || row['Data da Compra'] || row['Criado em'];
      if (!d) return;
      const dayData = processDaily(String(d));
      if (!dayData) return;

      const valStr = row['Valor'] || row['Valor Bruto'] || row['Preço'] || row['Faturamento'] || row['Valor Pago'] || '0';
      dayData.faturamentoTotal += parseValue(valStr);
      dayData.vendasIngressos += 1;
      
      if (isTrafficSale(row)) {
        dayData.vendasTrafego += 1;
      }
    });

    // Compute derived single-day values
    let allDailyList = Object.values(allDailyMap).map((d: any) => {
      d.lucroTotal = d.faturamentoTotal - d.investimentoTotal;
      d.ticketMedio = d.vendasIngressos > 0 ? d.faturamentoTotal / d.vendasIngressos : 0;
      d.cpaTrafego = d.vendasTrafego > 0 ? d.investimentoTotal / d.vendasTrafego : 0;
      d.cpaTotal = d.vendasIngressos > 0 ? d.investimentoTotal / d.vendasIngressos : 0;
      d.roas = d.investimentoTotal > 0 ? d.faturamentoTotal / d.investimentoTotal : 0;
      return d;
    });

    // Sort by chronological order
    allDailyList.sort((a: any, b: any) => {
      const aVal = a.date.split('/').reverse().join('');
      const bVal = b.date.split('/').reverse().join('');
      return aVal.localeCompare(bVal);
    });

    // Compute 7-day Moving Average across full history
    allDailyList.forEach((day: any, idx: number) => {
      const windowStart = Math.max(0, idx - 6);
      const windowDays = allDailyList.slice(windowStart, idx + 1);
      const windowLen = windowDays.length;

      const sumInvestimento = windowDays.reduce((acc, d) => acc + d.investimentoTotal, 0);
      const sumFaturamento = windowDays.reduce((acc, d) => acc + d.faturamentoTotal, 0);
      const sumVendasIngressos = windowDays.reduce((acc, d) => acc + d.vendasIngressos, 0);
      const sumVendasTrafego = windowDays.reduce((acc, d) => acc + d.vendasTrafego, 0);
      const sumImpressoes = windowDays.reduce((acc, d) => acc + d.impressoesTotal, 0);
      const sumCliques = windowDays.reduce((acc, d) => acc + d.cliquesTotal, 0);
      const sumPageViews = windowDays.reduce((acc, d) => acc + d.pageViewsTotal, 0);
      const sumCheckouts = windowDays.reduce((acc, d) => acc + d.checkoutsTotal, 0);

      // Volume totals (average per day in 7-day window)
      day.investimentoTotal_mm7 = windowLen > 0 ? sumInvestimento / windowLen : 0;
      day.faturamentoTotal_mm7 = windowLen > 0 ? sumFaturamento / windowLen : 0;
      day.lucroTotal_mm7 = windowLen > 0 ? (sumFaturamento - sumInvestimento) / windowLen : 0;
      day.vendasIngressos_mm7 = windowLen > 0 ? sumVendasIngressos / windowLen : 0;
      day.vendasTrafego_mm7 = windowLen > 0 ? sumVendasTrafego / windowLen : 0;
      day.impressoesTotal_mm7 = windowLen > 0 ? sumImpressoes / windowLen : 0;
      day.cliquesTotal_mm7 = windowLen > 0 ? sumCliques / windowLen : 0;
      day.pageViewsTotal_mm7 = windowLen > 0 ? sumPageViews / windowLen : 0;
      day.checkoutsTotal_mm7 = windowLen > 0 ? sumCheckouts / windowLen : 0;

      // Ratio metrics (weighted 7-day totals ratio)
      day.cpaTotal_mm7 = sumVendasIngressos > 0 ? sumInvestimento / sumVendasIngressos : 0;
      day.cpaTrafego_mm7 = sumVendasTrafego > 0 ? sumInvestimento / sumVendasTrafego : 0;
      day.roas_mm7 = sumInvestimento > 0 ? sumFaturamento / sumInvestimento : 0;
      day.ticketMedio_mm7 = sumVendasIngressos > 0 ? sumFaturamento / sumVendasIngressos : 0;
    });

    // Filter daily metrics for selected date range
    const dailyMetricsList = allDailyList.filter((d: any) => dateFilterPredicate(d.rawDate));

    const pagesList = Object.values(pagesMap)
      .sort((a, b) => b.salesMeta - a.salesMeta);

    return {
      geral: {
        investimentoTotal, faturamentoTotal, lucroTotal, ticketMedio, vendasIngressos, vendasTrafego, cpaTrafego, cpaTotal, roas, impressoesTotal, cliquesTotal, pageViewsTotal, checkoutsTotal
      },
      prevGeral,
      comparison,
      campaigns,
      creatives,
      sources,
      totalSalesWithSource,
      totalRevenueWithSource,
      pagesList,
      dailyMetrics: dailyMetricsList,
      fgpBuyers: fgpBuyersByDate,
      fgpResume
    };
  }, [data, dateRange, comparePrevious]);

  const alertsData = useMemo(() => {
    const alerts: any[] = [];
    if (!metricsData.campaigns) return alerts;

    metricsData.campaigns.forEach((campaign: any) => {
      const campCPA = campaign.cpa;
      
      if (campCPA > 0 && campaign.sets) {
        campaign.sets.forEach((set: any) => {
          if (set.cpa > campCPA && set.comprasTrafego > 0) {
            let action = '';
            const severity = set.cpa > campCPA * 1.5 ? 'high' : 'medium';
            if (set.cpa > campCPA * 1.5) {
              action = 'Pausar';
            } else if (set.cpa > campCPA * 1.25) {
              action = 'Reduzir Orçamento';
            } else {
              action = 'Revisar';
            }

            alerts.push({
              id: `${campaign.name}-${set.name}-cpa`,
              type: 'cpa_alto',
              severity: severity,
              action: action,
              campaignName: campaign.name,
              setName: set.name,
              setCpa: set.cpa,
              campCpa: campCPA,
              setSpend: set.investimento,
              setPurchases: set.comprasTrafego
            });
          } else if (set.comprasTrafego === 0 && set.investimento > campCPA && campCPA > 0) {
            alerts.push({
              id: `${campaign.name}-${set.name}-gasto`,
              type: 'gasto_sem_vendas',
              severity: set.investimento > campCPA * 1.5 ? 'high' : 'medium',
              action: 'Pausar',
              campaignName: campaign.name,
              setName: set.name,
              setCpa: 0,
              campCpa: campCPA,
              setSpend: set.investimento,
              setPurchases: 0
            });
          }
        });
      }
    });

    alerts.sort((a,b) => b.setSpend - a.setSpend);

    return alerts;
  }, [metricsData.campaigns]);

  const activeAlerts = useMemo(() => {
    return alertsData.filter(a => !optimizationHistory.find(h => h.id === a.id));
  }, [alertsData, optimizationHistory]);

  const handleAlertAction = (alert: any, status: 'applied' | 'declined') => {
    const mockResults = [
      "Redução de 15% no CPA da campanha",
      "Economia de R$ 120,00 reais em gastos ineficientes",
      "Aumento de 5% no ROAS geral",
      "Orçamento otimizado para conjuntos de melhor performance",
      "Sem impacto significativo até o momento",
      "Melhora de 10% na taxa de conversão",
    ];
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    setOptimizationHistory(prev => [{
      id: alert.id,
      alert: alert,
      status: status,
      date: new Date().toLocaleDateString('pt-BR'),
      mockedResult: status === 'applied' ? randomResult : 'Ação recusada, aguardando nova análise',
    }, ...prev]);
  };

  const { geral } = metricsData;

  const toggleCampaign = (campName: string) => {
    setExpandedCampaigns(prev => ({ ...prev, [campName]: !prev[campName] }));
  };

  const togglePageSort = (column: string) => {
    if (pageSort.column === column) {
      setPageSort(prev => ({ column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setPageSort({ column, direction: 'desc' });
    }
  };

  const toggleCreativeSort = (column: string) => {
    if (creativeSort.column === column) {
      setCreativeSort(prev => ({ column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setCreativeSort({ column, direction: 'desc' });
    }
  };

  const toggleCampaignSort = (column: string) => {
    if (campaignSort.column === column) {
      setCampaignSort(prev => ({ column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setCampaignSort({ column, direction: 'desc' });
    }
  };

  const toggleFgpSort = (column: string) => {
    if (fgpSort.column === column) {
      setFgpSort(prev => ({ column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setFgpSort({ column, direction: 'desc' });
    }
  };

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(id)) {
        return prev.filter(m => m !== id);
      }
      return [...prev.slice(-1), id];
    });
  };

  const sortedCreatives = useMemo(() => {
    return [...metricsData.creatives].sort((a: any, b: any) => {
      let valA = a[creativeSort.column] || 0;
      let valB = b[creativeSort.column] || 0;
      
      if (creativeSort.column === 'name') {
        return creativeSort.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      
      return creativeSort.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [metricsData.creatives, creativeSort]);

  const sortedCampaigns = useMemo(() => {
    return [...metricsData.campaigns]
      .map((camp: any) => ({
        ...camp,
        sets: [...camp.sets].sort((a: any, b: any) => {
          let valA = a[campaignSort.column] || 0;
          let valB = b[campaignSort.column] || 0;
          
          if (campaignSort.column === 'name') {
            return campaignSort.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          }
          
          return campaignSort.direction === 'asc' ? valA - valB : valB - valA;
        })
      }))
      .sort((a: any, b: any) => {
      let valA = a[campaignSort.column] || 0;
      let valB = b[campaignSort.column] || 0;
      
      if (campaignSort.column === 'name') {
        return campaignSort.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      
      return campaignSort.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [metricsData.campaigns, campaignSort]);

  const sortedPages = useMemo(() => {
    return [...metricsData.pagesList].sort((a: any, b: any) => {
      let valA = a[pageSort.column] || 0;
      let valB = b[pageSort.column] || 0;
      
      if (pageSort.column === 'taxIC') {
        valA = a.pageViews > 0 ? a.checkouts / a.pageViews : 0;
        valB = b.pageViews > 0 ? b.checkouts / b.pageViews : 0;
      } else if (pageSort.column === 'taxVenda') {
        valA = a.checkouts > 0 ? a.salesMeta / a.checkouts : 0;
        valB = b.checkouts > 0 ? b.salesMeta / b.checkouts : 0;
      } else if (pageSort.column === 'url') {
        return pageSort.direction === 'asc' ? a.slug.localeCompare(b.slug) : b.slug.localeCompare(a.slug);
      }
      
      return pageSort.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [metricsData.pagesList, pageSort]);

  const sortedFgpBuyers = useMemo(() => {
    return [...metricsData.fgpBuyers].sort((a: any, b: any) => {
      const getVal = (row: any, col: string) => {
         if (col === 'valor') return parseValue(row['Valor'] || row['Valor Bruto'] || row['Preço'] || row['Faturamento'] || '0');
         if (col === 'data') return new Date(row['Data'] || row['Data da Compra'] || row['Criado em'] || 0).getTime();
         return (row[col] || '').toString().toLowerCase();
      };

      const valA = getVal(a, fgpSort.column);
      const valB = getVal(b, fgpSort.column);
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return fgpSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      return fgpSort.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [metricsData.fgpBuyers, fgpSort]);

  const campaignTotals = useMemo(() => {
    return metricsData.campaigns.reduce((acc, c: any) => {
      acc.investimento += c.investimento || 0;
      acc.impressoes += c.impressoes || 0;
      acc.cliques += c.cliques || 0;
      acc.compras += c.comprasTrafego || 0;
      acc.faturamento += c.faturamentoTrafego || 0;
      acc.landingPageViews += c.landingPageViews || 0;
      acc.initiateCheckout += c.initiateCheckout || 0;
      return acc;
    }, { investimento: 0, impressoes: 0, cliques: 0, compras: 0, faturamento: 0, landingPageViews: 0, initiateCheckout: 0 });
  }, [metricsData.campaigns]);

  const comparisonLabel = getPreviousPeriodLabel(dateRange, customDates);
  const comp = metricsData.comparison || {};

  const selectedProjectLabel = selectedProject === '1'
    ? 'Livro Estratégia em Ação'
    : selectedProject === '2'
      ? 'Livro Gestão de Projetos com IA'
      : 'Consolidado dos dois funis';

  return (
    <div className="dashboard-shell min-h-screen bg-[#0F1115] text-zinc-100 font-sans pb-24 selection:bg-[#00FFBB]/30 selection:text-[#00FFBB]">
      {/* HEADER */}
      <header className="bg-[#10141B]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sticky top-0 z-20 shadow-[0_12px_40px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between xl:justify-start gap-3 w-full xl:w-auto">
          {/* Top Brand Logo & Profile Badge Row */}
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            {/* Horizontal Brand Logo Image */}
            <div className="flex items-center cursor-pointer shrink-0 select-none">
              <img 
                src="/allevotech-logo.webp"
                alt="AllevoTech" 
                className="h-9 sm:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
              />
            </div>

            {/* Corporate Profile & Access Menu (Positioned beside AllevoTech Logo) */}
            {authUser && (
              <div className="relative shrink-0" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 px-2.5 py-1.5 sm:py-2 bg-white/[0.045] hover:bg-white/[0.075] border border-white/10 hover:border-white/20 rounded-[8px] transition-all text-xs focus:outline-none shadow-sm group"
                  title="Sua Conta & Permissões Corporativas"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-[6px] bg-[#00FFBB]/15 text-[#00FFBB] border border-[#00FFBB]/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {authUser.email.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex flex-col text-left max-w-[110px] sm:max-w-[140px]">
                    <span className="font-bold text-zinc-200 text-[10px] sm:text-[11px] leading-tight truncate">
                      {authUser.email.split('@')[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#00FFBB] font-mono font-bold flex items-center gap-0.5 sm:gap-1">
                      <ShieldCheck size={10} />
                      Verificado
                    </span>
                  </div>

                  <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-200 ml-0.5", isProfileMenuOpen && "rotate-180 text-[#00FFBB]")} />
                </button>

                {/* Collapsed Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 md:left-0 md:right-auto top-full mt-2 w-72 bg-[#151922] border border-white/10 rounded-[8px] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Account Header */}
                    <div className="p-3 bg-[#242424] border border-[#262626] rounded-[8px] flex items-center gap-3 mb-1">
                      <div className="w-9 h-9 rounded-[8px] bg-[#00FFBB]/15 text-[#00FFBB] border border-[#00FFBB]/30 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                        {authUser.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-white text-xs truncate">
                          {authUser.name || authUser.email.split('@')[0]}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono truncate">
                          {authUser.email}
                        </span>
                        <span className="text-[9px] text-[#00FFBB] font-mono font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <ShieldCheck size={10} /> {authUser.provider === 'google' ? 'Google Workspace SSO' : 'E-mail Verificado'}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-[#262626] my-2" />

                    {/* Actions */}
                    <div className="space-y-1">
                      {onOpenSecuritySettings && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenSecuritySettings();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-[#242424] text-zinc-200 hover:text-[#00FFBB] text-xs font-bold transition-colors text-left"
                        >
                          <Shield size={15} className="text-[#00FFBB]" />
                          <div className="flex flex-col">
                            <span>Gerenciar Acessos</span>
                            <span className="text-[10px] text-zinc-400 font-normal">Domínios & Permissões Corporativas</span>
                          </div>
                        </button>
                      )}

                      {onLogout && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors text-left mt-1"
                        >
                          <LogOut size={15} className="text-rose-400" />
                          <span>Sair da Conta</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative shrink-0" ref={funnelMenuRef}>
            <button
              onClick={() => setIsFunnelMenuOpen(prev => !prev)}
              aria-expanded={isFunnelMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.045] hover:bg-white/[0.075] border border-white/10 hover:border-white/20 rounded-[8px] transition-all text-sm font-semibold focus:outline-none shadow-sm"
            >
              <Layers size={16} className="text-[#00FFBB]" />
              <span className="text-zinc-400">Funis</span>
              <span className="text-zinc-100 hidden sm:inline">{selectedProject === 'all' ? 'Todos' : selectedProject === '1' ? 'Estratégia em Ação' : 'Gestão de Projetos'}</span>
              <ChevronDown size={15} className={cn("text-zinc-400 transition-transform", isFunnelMenuOpen && "rotate-180 text-[#00FFBB]")} />
            </button>

            {isFunnelMenuOpen && (
              <div role="menu" className="absolute left-0 top-full mt-2 w-80 bg-[#151922] border border-white/10 rounded-[8px] shadow-2xl p-2 z-50">
                <p className="px-2.5 py-2 text-xs text-zinc-400">Selecione os funis para consolidar a análise.</p>
                <button
                  role="menuitemcheckbox"
                  aria-checked={selectedFunnels.strategy}
                  onClick={() => toggleFunnel('strategy')}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[6px] hover:bg-white/[0.06] text-left transition-colors"
                >
                  <span className={cn("w-4 h-4 border rounded-[4px] flex items-center justify-center shrink-0", selectedFunnels.strategy ? "bg-[#00FFBB] border-[#00FFBB] text-[#1A1A1A]" : "border-zinc-500")}>{selectedFunnels.strategy && <Check size={12} strokeWidth={3} />}</span>
                  <span className="w-2 h-2 rounded-full bg-[#00FFBB] shrink-0" />
                  <span className="text-sm font-medium text-zinc-100">Livro Estratégia em Ação</span>
                </button>
                <button
                  role="menuitemcheckbox"
                  aria-checked={selectedFunnels.management}
                  onClick={() => toggleFunnel('management')}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[6px] hover:bg-white/[0.06] text-left transition-colors"
                >
                  <span className={cn("w-4 h-4 border rounded-[4px] flex items-center justify-center shrink-0", selectedFunnels.management ? "bg-[#00FFBB] border-[#00FFBB] text-[#1A1A1A]" : "border-zinc-500")}>{selectedFunnels.management && <Check size={12} strokeWidth={3} />}</span>
                  <span className="w-2 h-2 rounded-full bg-[#66BEFF] shrink-0" />
                  <span className="text-sm font-medium text-zinc-100">Livro Gestão de Projetos com IA</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full xl:w-auto">
          {/* Compact Popover Date Range Selector */}
          <div className="relative shrink-0" ref={dateMenuRef}>
            <button
              onClick={() => setIsDateMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.045] hover:bg-white/[0.075] border border-white/10 hover:border-white/20 rounded-[8px] transition-all text-xs font-bold focus:outline-none shadow-sm group"
              title="Filtrar Período de Análise"
            >
              <Calendar size={14} className="text-[#00FFBB]" />
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-medium text-[11px]">Período:</span>
                <span className="text-[#00FFBB] font-mono font-bold">{getLabelForDateRange(dateRange, customDates)}</span>
              </div>
              <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-200 ml-0.5", isDateMenuOpen && "rotate-180 text-[#00FFBB]")} />
            </button>

            {/* Popover Dropdown */}
            {isDateMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#1C1C1C] border border-[#262626] rounded-[8px] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#262626]">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#00FFBB]" /> Selecionar Período
                  </span>
                  <button 
                    onClick={() => setIsDateMenuOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Preset Options Grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {dateOptions.map(opt => {
                    const isSelected = dateRange === opt;
                    return (
                      <button 
                        key={opt}
                        data-action-ink={isSelected ? "true" : undefined}
                        onClick={() => {
                          setDateRange(opt);
                          setCustomDates({ start: '', end: '' });
                          setIsDateMenuOpen(false);
                        }}
                        style={isSelected ? ALLEVO_ACTION_STYLE : undefined}
                        className={cn(
                          "px-3 py-2 text-xs font-mono font-bold rounded-[8px] transition-all text-left flex items-center justify-between",
                          isSelected 
                            ? "allevo-action btn-primary-green bg-[#00FFBB] !text-[#1A1A1A] shadow-sm shadow-[#00FFBB]/20 font-black"
                            : "bg-[#242424] text-zinc-300 hover:text-white hover:bg-[#2E2E2E] border border-[#262626]"
                        )}
                      >
                        <span style={isSelected ? ALLEVO_ACTION_TEXT_STYLE : undefined} className={isSelected ? "!text-[#1A1A1A] font-black" : ""}>{getLabelForDateRange(opt, { start: '', end: '' })}</span>
                        {isSelected && <Check size={14} color={ALLEVO_ACTION_INK} stroke={ALLEVO_ACTION_INK} strokeWidth={3} style={ALLEVO_ACTION_ICON_STYLE} className="!text-[#1A1A1A] stroke-[#1A1A1A] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Range Picker */}
                <div className="pt-3 border-t border-[#262626] space-y-2 mb-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Datas Personalizadas</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="dashboard-start-date" className="text-[10px] text-zinc-300 block mb-1 font-mono font-bold">Data Inicial</label>
                      <div className="relative flex items-center">
                        <input 
                          id="dashboard-start-date"
                          type="date" 
                          value={customDates.start}
                          onClick={(e) => {
                            if ('showPicker' in e.currentTarget) {
                              try { (e.currentTarget as any).showPicker(); } catch {}
                            }
                          }}
                          onChange={(e) => {
                            const start = e.target.value;
                            setCustomDates(prev => ({...prev, start}));
                            if (start && customDates.end) {
                              setDateRange(`CUSTOM:${start}|${customDates.end}`);
                              setIsDateMenuOpen(false);
                            }
                          }}
                          className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-[8px] border border-[#383838] bg-[#242424] text-white hover:bg-[#2E2E2E] hover:border-[#00FFBB] focus:outline-none focus:ring-2 focus:ring-[#00FFBB] cursor-pointer shadow-inner [color-scheme:dark]" 
                        />
                        <Calendar size={14} className="absolute right-3 text-[#00FFBB] pointer-events-none shrink-0 stroke-[2.5]" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="dashboard-end-date" className="text-[10px] text-zinc-300 block mb-1 font-mono font-bold">Data Final</label>
                      <div className="relative flex items-center">
                        <input 
                          id="dashboard-end-date"
                          type="date" 
                          value={customDates.end}
                          onClick={(e) => {
                            if ('showPicker' in e.currentTarget) {
                              try { (e.currentTarget as any).showPicker(); } catch {}
                            }
                          }}
                          onChange={(e) => {
                            const end = e.target.value;
                            setCustomDates(prev => ({...prev, end}));
                            if (customDates.start && end) {
                              setDateRange(`CUSTOM:${customDates.start}|${end}`);
                              setIsDateMenuOpen(false);
                            }
                          }}
                          className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold rounded-[8px] border border-[#383838] bg-[#242424] text-white hover:bg-[#2E2E2E] hover:border-[#00FFBB] focus:outline-none focus:ring-2 focus:ring-[#00FFBB] cursor-pointer shadow-inner [color-scheme:dark]" 
                        />
                        <Calendar size={14} className="absolute right-3 text-[#00FFBB] pointer-events-none shrink-0 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Sync Button & Last Updated Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            {lastUpdated && (
              <span className="text-[11px] text-zinc-400 font-mono font-medium hidden lg:inline-block pr-1">
                Última sinc. às <strong className="text-zinc-200 font-bold">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}h</strong>
              </span>
            )}
            <button 
              onClick={() => loadData(selectedProject)}
              disabled={loading}
              data-action-ink="true"
              title={lastUpdated ? `Última sincronização às ${lastUpdated.toLocaleTimeString()}` : "Sincronizar planilha"}
              style={ALLEVO_ACTION_STYLE}
              className="allevo-action btn-primary-green px-3.5 py-2 bg-[#00FFBB] !text-[#1A1A1A] rounded-[8px] transition-all disabled:opacity-50 shadow-md shadow-[#00FFBB]/20 inline-flex items-center gap-1.5 font-mono font-black text-xs whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
            >
              <RotateCcw size={14} color={ALLEVO_ACTION_INK} stroke={ALLEVO_ACTION_INK} strokeWidth={2.5} style={ALLEVO_ACTION_ICON_STYLE} className={cn("!text-[#1A1A1A] stroke-[#1A1A1A] shrink-0", loading && "animate-spin")} />
              <span style={ALLEVO_ACTION_TEXT_STYLE} className="!text-[#1A1A1A] font-black">Sync</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
        <section className="executive-panel rounded-[8px] p-5 sm:p-6 lg:p-7 mb-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-[6px] bg-[#00FFBB]/12 border border-[#00FFBB]/20 text-[#00FFBB] text-[10px] font-mono font-black uppercase tracking-widest">
                Tráfego Pago
              </span>
              <span className="px-2.5 py-1 rounded-[6px] bg-[#66BEFF]/10 border border-[#66BEFF]/20 text-[#A8D9FF] text-[10px] font-mono font-bold uppercase tracking-widest">
                {getLabelForDateRange(dateRange, customDates)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-normal text-white">
              Dashboard de performance
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              {selectedProjectLabel}
            </p>
          </div>
        </section>
        {fetchError && (
          <div className="mb-8 p-6 bg-[#1C1C1C] border border-[#00FFBB]/50 rounded-[8px] shadow-lg text-zinc-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#00FFBB]/15 text-[#00FFBB] border border-[#00FFBB]/30 rounded-[8px] shrink-0">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#00FFBB] mb-1">
                  Atenção: Permissão de Acesso Necessária na Planilha
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl mb-2">
                  {fetchError}
                </p>
                {(selectedProject === '2' || selectedProject === 'all') && (
                  <div className="mt-3 text-xs bg-[#242424] p-3.5 rounded-[8px] border border-[#262626]">
                    <p className="font-mono font-bold text-[#00FFBB] mb-1">Como resolver no Google Sheets (15 segundos):</p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                      {selectedProject === '2' ? (
                        <li>Acesse a planilha do Projeto 2: <a href="https://docs.google.com/spreadsheets/d/1qzE3zNFvUQwi_yIDcOrRy00wHxkhMTLzMeb9aCTRAbA/edit" target="_blank" rel="noreferrer" className="underline font-bold text-[#00FFBB] hover:text-[#00E5A7]">Abrir Planilha do Livro Gestão com IA</a></li>
                      ) : selectedProject === '1' ? (
                        <li>Acesse a planilha do Projeto 1: <a href="https://docs.google.com/spreadsheets/d/1fYoNt2OgXNFRsGg8-5xG8BkZHQJvKpUrHZA8nyeN6W8/edit" target="_blank" rel="noreferrer" className="underline font-bold text-[#00FFBB] hover:text-[#00E5A7]">Abrir Planilha do Livro Estratégia em Ação</a></li>
                      ) : (
                        <>
                          <li>Acesse a planilha do Projeto 1: <a href="https://docs.google.com/spreadsheets/d/1fYoNt2OgXNFRsGg8-5xG8BkZHQJvKpUrHZA8nyeN6W8/edit" target="_blank" rel="noreferrer" className="underline font-bold text-[#00FFBB] hover:text-[#00E5A7]">Abrir Planilha Estratégia em Ação</a></li>
                          <li>Acesse a planilha do Projeto 2: <a href="https://docs.google.com/spreadsheets/d/1qzE3zNFvUQwi_yIDcOrRy00wHxkhMTLzMeb9aCTRAbA/edit" target="_blank" rel="noreferrer" className="underline font-bold text-[#00FFBB] hover:text-[#00E5A7]">Abrir Planilha Gestão com IA</a></li>
                        </>
                      )}
                      <li>Clique no botão <strong>Compartilhar</strong> (canto superior direito).</li>
                      <li>Em <em>Acesso geral</em>, mude de <strong>Restrito</strong> para <strong>Qualquer pessoa com o link</strong> (como Leitor).</li>
                      <li>Clique em <strong>Concluído</strong> e depois no botão ao lado para recarregar os dados.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => loadData(selectedProject)}
              disabled={loading}
              data-action-ink="true"
              style={ALLEVO_ACTION_STYLE}
              className="allevo-action btn-primary-green px-5 py-3 bg-[#00FFBB] !text-[#1A1A1A] font-mono font-black rounded-[8px] text-sm shadow-md transition-colors shrink-0 flex items-center gap-2 self-stretch md:self-auto justify-center cursor-pointer"
            >
              <RotateCcw size={16} color={ALLEVO_ACTION_INK} stroke={ALLEVO_ACTION_INK} style={ALLEVO_ACTION_ICON_STYLE} className={cn("!text-[#1A1A1A] stroke-[#1A1A1A] shrink-0", loading && "animate-spin")} />
              <span style={ALLEVO_ACTION_TEXT_STYLE} className="!text-[#1A1A1A] font-black">Tentar Novamente</span>
            </button>
          </div>
        )}
        
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8">
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Mobile View Navigation Dropdown (< md) */}
            <div className="md:hidden w-full relative" ref={tabMenuRef}>
              <button
                onClick={() => setIsTabMenuOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#1C1C1C] border border-[#262626] hover:border-[#383838] rounded-[8px] text-white font-bold text-sm shadow-lg focus:outline-none transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-[8px] bg-[#00FFBB]/10 text-[#00FFBB] border border-[#00FFBB]/20">
                    {(() => {
                      const CurrentTabIcon = tabs.find(t => t.name === activeTab)?.icon || LayoutDashboard;
                      return <CurrentTabIcon size={18} className="text-[#00FFBB]" />;
                    })()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-widest leading-none">Navegação</span>
                    <span className="text-sm font-mono font-bold text-[#00FFBB] leading-tight">{activeTab}</span>
                  </div>
                </div>
                <ChevronDown size={18} className={cn("text-zinc-400 transition-transform duration-200", isTabMenuOpen && "rotate-180 text-[#00FFBB]")} />
              </button>

              {isTabMenuOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#151922] border border-white/10 rounded-[8px] shadow-2xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.name;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.name}
                        data-active-tab={isActive ? "true" : undefined}
                        data-active-green={isActive ? "true" : undefined}
                        data-action-ink={isActive ? "true" : undefined}
                        onClick={() => {
                          setActiveTab(tab.name);
                          setIsTabMenuOpen(false);
                        }}
                        style={isActive ? ALLEVO_ACTION_STYLE : undefined}
                        className={cn(
                          "w-full flex items-center justify-between px-3.5 py-3 rounded-[8px] font-mono font-bold text-xs transition-all text-left",
                          isActive
                            ? "allevo-action btn-primary-green bg-[#00FFBB] !text-[#1A1A1A] shadow-md shadow-[#00FFBB]/20 font-black"
                            : "text-zinc-300 hover:bg-[#242424] hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <TabIcon 
                            size={18} 
                            color={isActive ? ALLEVO_ACTION_INK : undefined}
                            stroke={isActive ? ALLEVO_ACTION_INK : "currentColor"}
                            strokeWidth={isActive ? 2.5 : 2}
                            style={isActive ? ALLEVO_ACTION_ICON_STYLE : undefined}
                            className={cn("shrink-0", isActive ? "!text-[#1A1A1A] stroke-[#1A1A1A]" : "")}
                          />
                          <span style={isActive ? ALLEVO_ACTION_TEXT_STYLE : undefined} className={isActive ? "!text-[#1A1A1A] font-black" : ""}>{tab.name}</span>
                        </div>
                        {isActive && <Check size={16} color={ALLEVO_ACTION_INK} stroke={ALLEVO_ACTION_INK} strokeWidth={3} style={ALLEVO_ACTION_ICON_STYLE} className="!text-[#1A1A1A] stroke-[#1A1A1A]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop View Navigation Tabs (>= md) */}
            <div className="hidden md:flex flex-wrap bg-[#151922] p-1 rounded-[8px] border border-white/10 shadow-[0_12px_34px_rgba(0,0,0,0.18)] gap-1.5 w-fit items-center">
              {tabs.map(tab => {
                const isActive = activeTab === tab.name;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.name}
                    data-active-tab={isActive ? "true" : undefined}
                    data-active-green={isActive ? "true" : undefined}
                    data-action-ink={isActive ? "true" : undefined}
                    onClick={() => setActiveTab(tab.name)}
                    style={isActive ? ALLEVO_ACTION_STYLE : undefined}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer",
                      isActive 
                        ? "allevo-action btn-primary-green bg-[#00FFBB] !text-[#1A1A1A] shadow-md shadow-[#00FFBB]/20 font-black"
                        : "text-zinc-400 hover:bg-[#242424] hover:text-zinc-100"
                    )}
                  >
                    <TabIcon 
                      size={18} 
                      color={isActive ? ALLEVO_ACTION_INK : undefined}
                      stroke={isActive ? ALLEVO_ACTION_INK : "currentColor"}
                      strokeWidth={isActive ? 2.5 : 2}
                      style={isActive ? ALLEVO_ACTION_ICON_STYLE : undefined}
                      className={cn("shrink-0", isActive ? "!text-[#1A1A1A] stroke-[#1A1A1A]" : "")}
                    />
                    <span style={isActive ? ALLEVO_ACTION_TEXT_STYLE : undefined} className={isActive ? "!text-[#1A1A1A] font-black" : ""}>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex flex-col justify-center items-center h-64 text-zinc-400 gap-4">
            <RotateCcw size={32} className="animate-spin text-[#00FFBB]" />
            <span className="font-bold tracking-wide">Puxando dados da Planilha...</span>
          </div>
        ) : (
          <>
            {activeTab === 'Geral' && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* TOP ROW: HERO METRICS HIGHLIGHTED */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold uppercase tracking-[0.08em] text-[#00FFBB] flex items-center gap-1.5">
                      <Zap size={14} className="fill-[#00FFBB]" /> Métricas Chave (Top Performance)
                    </span>
                    <span className="text-sm text-zinc-400 font-medium hidden sm:inline">Clique em uma métrica para destacar no gráfico</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <MetricCard 
                      id="investimentoTotal"
                      title="Investimento Total"
                      value={formatCurrency(geral.investimentoTotal)}
                      subtext="Gasto * 1.1215 (Com impostos)"
                      icon={<DollarSign size={20} />}
                      isHero={true}
                      heroTag="Gasto Ad"
                      selected={selectedMetrics.includes('investimentoTotal')}
                      onClick={() => toggleMetric('investimentoTotal')}
                      comparison={comp.investimentoTotal}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="faturamentoTotal"
                      title="Faturamento Total"
                      value={formatCurrency(geral.faturamentoTotal)}
                      subtext="Valor Bruto Total"
                      icon={<TrendingUp size={20} />}
                      isHero={true}
                      heroTag="Receita Bruta"
                      selected={selectedMetrics.includes('faturamentoTotal')}
                      onClick={() => toggleMetric('faturamentoTotal')}
                      comparison={comp.faturamentoTotal}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="cpaTotal"
                      title="CPA (Total)"
                      value={formatCurrency(geral.cpaTotal)}
                      subtext="Investimento / Total Vendas"
                      icon={<Layers size={20} />}
                      isHero={true}
                      heroTag="Custo / Venda"
                      selected={selectedMetrics.includes('cpaTotal')}
                      onClick={() => toggleMetric('cpaTotal')}
                      comparison={comp.cpaTotal}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="ticketMedio"
                      title="Ticket Médio"
                      value={formatCurrency(geral.ticketMedio)}
                      subtext={`Para ${geral.vendasIngressos} vendas`}
                      icon={<Ticket size={20} />}
                      isHero={true}
                      heroTag="Valor Médio"
                      selected={selectedMetrics.includes('ticketMedio')}
                      onClick={() => toggleMetric('ticketMedio')}
                      comparison={comp.ticketMedio}
                      comparisonLabel={comparisonLabel}
                    />
                  </div>
                </div>

                {/* SECOND ROW: SECONDARY METRICS */}
                <div>
                  <span className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-400 mb-3 block">
                    Outras Métricas Operacionais
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard 
                      id="lucroTotal"
                      title="Lucro Total"
                      value={formatCurrency(geral.lucroTotal)}
                      subtext="Faturamento - Investimento"
                      valueColor={geral.lucroTotal >= 0 ? "text-[#00FFBB]" : "text-rose-400"}
                      icon={<Zap size={20} />}
                      selected={selectedMetrics.includes('lucroTotal')}
                      onClick={() => toggleMetric('lucroTotal')}
                      comparison={comp.lucroTotal}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="vendasIngressos"
                      title="Vendas (Todas)"
                      value={geral.vendasIngressos}
                      subtext="Planilha / Checkout"
                      icon={<ShoppingCart size={20} />}
                      selected={selectedMetrics.includes('vendasIngressos')}
                      onClick={() => toggleMetric('vendasIngressos')}
                      comparison={comp.vendasIngressos}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="vendasTrafego"
                      title="Vendas (Tráfego)"
                      value={geral.vendasTrafego}
                      subtext="Origem Meta Ads"
                      icon={<Target size={20} />}
                      selected={selectedMetrics.includes('vendasTrafego')}
                      onClick={() => toggleMetric('vendasTrafego')}
                      comparison={comp.vendasTrafego}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="cpaTrafego"
                      title="CPA (Tráfego)"
                      value={formatCurrency(geral.cpaTrafego)}
                      subtext="Investimento / Vendas Meta"
                      icon={<Disc size={20} />}
                      selected={selectedMetrics.includes('cpaTrafego')}
                      onClick={() => toggleMetric('cpaTrafego')}
                      comparison={comp.cpaTrafego}
                      comparisonLabel={comparisonLabel}
                    />
                    <MetricCard 
                      id="roas"
                      title="ROAS"
                      value={`${(geral.roas || 0).toFixed(2)}x`}
                      subtext="Retorno s/ Investimento"
                      icon={<TrendingUp size={20} />}
                      selected={selectedMetrics.includes('roas')}
                      onClick={() => toggleMetric('roas')}
                      comparison={comp.roas}
                      comparisonLabel={comparisonLabel}
                    />
                  </div>
                </div>

                <DailyChartSection
                  dailyMetrics={metricsData.dailyMetrics}
                  selectedMetrics={selectedMetrics}
                  setSelectedMetrics={setSelectedMetrics}
                  showMovingAverage={showMovingAverage}
                  setShowMovingAverage={setShowMovingAverage}
                  comparePrevious={comparePrevious}
                  setComparePrevious={setComparePrevious}
                  METRIC_CONFIG={METRIC_CONFIG}
                  formatCurrency={formatCurrency}
                  formatNumber={formatNumber}
                />
              </div>
            )}

            {activeTab === 'Campanhas' && (
              <CampanhasTab
                sortedCampaigns={sortedCampaigns}
                campaignSort={campaignSort}
                toggleCampaignSort={toggleCampaignSort}
                expandedCampaigns={expandedCampaigns}
                toggleCampaign={toggleCampaign}
                campaignTotals={campaignTotals}
                metricsCampaignsCount={metricsData.campaigns.length}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
              />
            )}

            {activeTab === 'Funil' && (
              <FunilTab
                geral={geral}
                metricsData={metricsData}
                sortedCampaigns={sortedCampaigns}
                expandedCampaigns={expandedCampaigns}
                toggleCampaign={toggleCampaign}
                campaignTotals={campaignTotals}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
              />
            )}

            {activeTab === 'Criativos' && (
              <CriativosTab
                creativeFilter={creativeFilter}
                setCreativeFilter={setCreativeFilter}
                creativeSort={creativeSort}
                toggleCreativeSort={toggleCreativeSort}
                sortedCreatives={sortedCreatives}
                getCreativeThumbnail={getCreativeThumbnail}
                setActiveLightboxImage={setActiveLightboxImage}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
              />
            )}

            {activeTab === 'Fontes das Vendas' && (
              <FontesTab
                metricsData={metricsData}
                selectedSourceIndices={selectedSourceIndices}
                setSelectedSourceIndices={setSelectedSourceIndices}
                sortedPages={sortedPages}
                pageSort={pageSort}
                togglePageSort={togglePageSort}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
              />
            )}
          </>
        )}
        
        <div className="mt-16 mb-8 flex flex-col items-center justify-center gap-2 text-center">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-[#00FFBB] animate-pulse"></span>
              Sincronizado via Google Sheets às {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </main>

      <LightboxModal
        activeLightboxImage={activeLightboxImage}
        setActiveLightboxImage={setActiveLightboxImage}
        getCreativeThumbnail={getCreativeThumbnail}
        formatCurrency={formatCurrency}
      />

    </div>
  );
}
