import React from 'react';

interface StatCardProps {
    title: string;
    amount: number;
    icon: React.ReactNode;
    colorClass: string;
    isPrivate: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title, amount, icon, colorClass, isPrivate
}) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors text-left">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-xl ${colorClass}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        <div className="text-xl font-black text-slate-800 dark:text-white transition-colors">
            {isPrivate ? '৳ ••••' : `৳${(amount ?? 0).toLocaleString()}`}
        </div>
    </div>
);

export default StatCard;
