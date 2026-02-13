"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Folder
} from 'lucide-react';
import api from '@/lib/api';

const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

export default function AccountsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeType, setActiveType] = useState('ALL');

    // Fetch accounts (mock company ID for now)
    const { data: accounts, isLoading } = useQuery({
        queryKey: ['accounts', activeType],
        queryFn: async () => {
            try {
                const res = await api.get('/accounts/chart/default-company-id');
                return res.data;
            } catch (e) {
                return [];
            }
        },
        initialData: [
            { id: '1', code: '1000', name: 'Fixed Assets', type: 'ASSET', balance: 0 },
            { id: '2', code: '1100', name: 'Current Assets', type: 'ASSET', balance: 45200 },
            { id: '3', code: '2000', name: 'Liability', type: 'LIABILITY', balance: 12000 },
            { id: '4', code: '3000', name: 'Equity', type: 'EQUITY', balance: 100000 },
            { id: '5', code: '4000', name: 'Operating Income', type: 'INCOME', balance: 124500 },
        ]
    });

    const filteredAccounts = accounts?.filter((acc: any) => {
        const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.code.includes(searchTerm);
        const matchesType = activeType === 'ALL' || acc.type === activeType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            {/* Search & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search accounts by name or code..."
                        className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
                        <Plus size={18} />
                        New Account
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
                {['ALL', ...accountTypes].map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeType === type ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {type}
                        {activeType === type && (
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Accounts List */}
            <div className="premium-card !p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">Account Code</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Balance</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredAccounts?.map((acc: any) => (
                            <tr key={acc.id} className="group hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                        {acc.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Folder size={18} className="text-secondary opacity-60" />
                                        <span className="font-semibold text-foreground">{acc.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary`}>
                                        {acc.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-mono font-bold ${acc.balance >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
                                        PKR {Math.abs(acc.balance).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
