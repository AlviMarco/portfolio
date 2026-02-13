import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ActivityChartProps {
    stats: { label: string; income: number; expense: number }[];
    isPrivate: boolean;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ stats, isPrivate }) => {
    const maxVal = Math.max(...stats.map(s => Math.max(s.income, s.expense)), 100);

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-6 font-sans">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-500" /> Activity (7d)
                </h3>
                <div className="flex gap-3 text-[9px] font-black uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-400">Income</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-slate-400">Expense</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between h-40 gap-1.5 px-1">
                {stats.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="flex-1 w-full flex items-end justify-center gap-0.5 relative group">
                            {/* Income Bar */}
                            <div
                                style={{ height: `${(day.income / maxVal) * 100}%` }}
                                className="w-full max-w-[8px] bg-emerald-500/80 rounded-t-sm transition-all duration-500 hover:bg-emerald-500"
                            >
                                {!isPrivate && day.income > 0 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ৳{day.income.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            {/* Expense Bar */}
                            <div
                                style={{ height: `${(day.expense / maxVal) * 100}%` }}
                                className="w-full max-w-[8px] bg-rose-500/80 rounded-t-sm transition-all duration-500 hover:bg-rose-500"
                            >
                                {!isPrivate && day.expense > 0 && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ৳{day.expense.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 rotate-45 mt-1">{day.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityChart;
