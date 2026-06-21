import { ChevronDown, HelpCircle, Sparkles, ArrowUpRight } from 'lucide-react';

interface TypeBreakdownData {
  label: string;
  val: number;
  color: string;
  text: string;
}

interface TypeBreakdownChartProps {
  data?: TypeBreakdownData[];
}

const defaultData: TypeBreakdownData[] = [
  { label: 'Screenshots', val: 74, color: 'bg-[var(--bg-hover)] border border-[var(--border-color)]', text: 'text-[var(--text-muted)]' },
  { label: 'Recordings', val: 26, color: 'bg-[var(--primary)]', text: 'text-[var(--primary)]' },
];

export default function TypeBreakdownChart({ data = defaultData }: TypeBreakdownChartProps) {
  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col h-full justify-between select-none">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">Revenue Breakdown</span>
            <HelpCircle size={14} className="text-[var(--text-dark)]" />
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 cursor-pointer">
            Jan 1 - Aug 30 <ChevronDown size={10} />
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-2xl font-black text-white">$20,320</span>
        </div>

        <div className="border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl p-3.5 flex items-center justify-between gap-3 mb-6 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles size={16} className="text-purple-400 group-hover:animate-pulse shrink-0" />
            <span className="text-[10px] font-bold text-purple-300 truncate">Get AI insight for better analysis</span>
          </div>
          <ArrowUpRight size={14} className="text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
        </div>
      </div>

      <div className="flex items-end justify-around h-32 px-4 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-2.5 rounded-full bg-[var(--bg-main)] h-28 relative overflow-hidden flex flex-col justify-end">
              <div
                className={`w-full ${index === 0 ? 'bg-[var(--bg-hover)]' : 'bg-[var(--primary)]'}`}
                style={{ height: `${item.val}%` }}
              ></div>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider ${item.text}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
