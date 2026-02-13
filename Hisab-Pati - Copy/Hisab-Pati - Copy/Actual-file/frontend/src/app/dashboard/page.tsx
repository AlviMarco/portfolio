"use client";

import React from 'react';
import { useData } from '@/context/DataContext';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import Link from 'next/link';

export default function DashboardPage() {
    const {
        transactions,
        inventorySubLedgers,
        isLoading,
        error,
        activeCompany
    } = useData();

    if (isLoading && !activeCompany) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !activeCompany) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600 font-sans">
                <p className="font-bold">Failed to load dashboard data</p>
                <p className="text-sm">{error || 'Please check if the backend is running.'}</p>
            </div>
        );
    }

    if (!activeCompany) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 font-sans">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                    <Plus className="text-blue-600 dark:text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Company Selected</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                    Please create or select a company to view your dashboard and manage your accounts.
                </p>
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                    Select Company
                </button>
            </div>
        );
    }

    const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const lowStockItems = inventorySubLedgers.filter(item => (item.quantity ?? 0) < 10).slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in font-sans">
            {/* Business Hero Summary */}
            <DashboardSummary />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Recent Transactions */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Recent Transactions</h3>
                        <Link href="/transactions" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            Browse All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-slate-50 dark:border-slate-700/50 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500 text-xs">
                                            {tx.voucherType.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{tx.voucherType} Voucher</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                {new Date(tx.date).toLocaleDateString()} • {tx.description || 'No description'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${tx.voucherType === 'SALES' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                                            ৳{(tx.entries[0]?.debit || tx.entries[0]?.credit).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.voucherNo}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-sm text-slate-400 font-medium italic">No recent transactions recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Inventory Alerts */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Inventory Alerts</h3>
                        <Link href="/inventory" className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1">
                            Full Stock Report <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {lowStockItems.length > 0 ? (
                            lowStockItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border border-rose-50 dark:border-rose-900/10 bg-rose-50/30 dark:bg-rose-900/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{item.itemName}</p>
                                            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Only {item.quantity} units remaining</p>
                                        </div>
                                    </div>
                                    <Link href={`/inventory/restock/${item.id}`} className="rounded-xl bg-rose-100 dark:bg-rose-900/30 px-3 py-1.5 text-[10px] font-black text-rose-600 dark:text-rose-400 hover:bg-rose-200 transition-colors uppercase tracking-tight">
                                        Restock
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <p className="text-sm font-medium italic">All stock levels are healthy.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
