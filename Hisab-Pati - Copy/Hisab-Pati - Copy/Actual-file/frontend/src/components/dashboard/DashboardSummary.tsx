"use client";

import React from 'react';
import {
    TrendingUp, TrendingDown, Wallet, ArrowUpRight,
    Sparkles, RefreshCcw, Activity
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import StatCard from './StatCard';
import ActivityChart from './ActivityChart';

const DashboardSummary: React.FC = () => {
    const {
        financialSummary,
        dashboardStats,
        aiInsight,
        isAiLoading,
        networkOnline,
        fetchAiAdvice
    } = useData();

    const isPrivate = false; // Could be a user preference later

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Summary</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Your business at a glance</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Cash & Bank"
                    amount={financialSummary.cashBalance}
                    icon={<Wallet size={18} className="text-blue-600 dark:text-blue-400" />}
                    colorClass="bg-blue-50 dark:bg-blue-900/20"
                    isPrivate={isPrivate}
                />
                <StatCard
                    title="Revenue"
                    amount={financialSummary.netIncome > 0 ? financialSummary.netIncome : 0}
                    icon={<TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />}
                    colorClass="bg-emerald-50 dark:bg-emerald-900/20"
                    isPrivate={isPrivate}
                />
                <StatCard
                    title="Receivables"
                    amount={financialSummary.receivables}
                    icon={<ArrowUpRight size={18} className="text-orange-600 dark:text-orange-400" />}
                    colorClass="bg-orange-50 dark:bg-orange-900/20"
                    isPrivate={isPrivate}
                />
                <StatCard
                    title="Payables"
                    amount={financialSummary.payables}
                    icon={<TrendingDown size={18} className="text-rose-600 dark:text-rose-400" />}
                    colorClass="bg-rose-50 dark:bg-rose-900/20"
                    isPrivate={isPrivate}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ActivityChart stats={dashboardStats} isPrivate={isPrivate} />
                </div>

                {/* AI Insights Card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500" /> AI Insights
                        </h3>
                        <button
                            onClick={fetchAiAdvice}
                            disabled={isAiLoading || !networkOnline}
                            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all ${isAiLoading ? 'animate-spin' : ''}`}
                            title={!networkOnline ? 'Connect to internet for AI insights' : 'Refresh insights'}
                        >
                            <RefreshCcw size={14} className={!networkOnline ? 'text-slate-300' : 'text-slate-500'} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                        {aiInsight ? (
                            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-left animate-in fade-in slide-in-from-bottom-2 duration-700">
                                {aiInsight.split('\n').map((line, i) => (
                                    <p key={i} className={line.trim() ? "mb-2" : ""}>{line}</p>
                                ))}
                            </div>
                        ) : isAiLoading ? (
                            <div className="space-y-3 w-full">
                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-full animate-pulse"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-5/6 animate-pulse"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-4/6 animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="py-8">
                                <Activity size={32} className="text-slate-200 dark:text-slate-700 mb-3 mx-auto" />
                                <p className="text-xs text-slate-400 font-medium">
                                    {networkOnline
                                        ? "Click refresh to get AI-powered financial advice."
                                        : "Connect to the internet for smart insights."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSummary;
