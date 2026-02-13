"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    Plus,
    Trash2,
    Save,
    X,
    PlusCircle,
    AlertCircle
} from 'lucide-react';
import api from '@/lib/api';

interface Entry {
    accountId: string;
    debit: number;
    credit: number;
}

export default function TransactionsPage() {
    const [entries, setEntries] = useState<Entry[]>([
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 },
    ]);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch Accounts for dropdown
    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/accounts/chart/default-company-id');
            return res.data;
        },
        initialData: []
    });

    const addEntry = () => {
        setEntries([...entries, { accountId: '', debit: 0, credit: 0 }]);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: keyof Entry, value: string | number) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">New Journal Entry</h2>
                    <p className="text-sm text-muted-foreground">Record a manual accounting transaction.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                        Cancel
                    </button>
                    <button
                        disabled={!isBalanced}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity ${isBalanced ? 'bg-primary' : 'bg-muted-foreground/30 cursor-not-allowed'
                            }`}
                    >
                        <Save size={18} />
                        Post Transaction
                    </button>
                </div>
            </div>

            <div className="premium-card grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">Transaction Date</label>
                    <input
                        type="date"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Reference / Voucher No</label>
                    <input
                        type="text"
                        placeholder="Optional reference..."
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2">Description</label>
                    <textarea
                        rows={2}
                        placeholder="What is this transaction for?"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:ring-2 focus:ring-primary/20"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            <div className="premium-card !p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Account</th>
                            <th className="px-6 py-4 w-40">Debit</th>
                            <th className="px-6 py-4 w-40">Credit</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {entries.map((entry, index) => (
                            <tr key={index} className="group">
                                <td className="px-6 py-4">
                                    <select
                                        className="w-full rounded-lg border border-border bg-transparent px-3 py-1.5 focus:ring-2 focus:ring-primary/20"
                                        value={entry.accountId}
                                        onChange={(e) => updateEntry(index, 'accountId', e.target.value)}
                                    >
                                        <option value="">Select Account...</option>
                                        {accounts?.map((acc: any) => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full rounded-lg border border-border bg-transparent px-3 py-1.5 text-right font-mono focus:ring-2 focus:ring-primary/20"
                                        value={entry.debit || ''}
                                        onChange={(e) => updateEntry(index, 'debit', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full rounded-lg border border-border bg-transparent px-3 py-1.5 text-right font-mono focus:ring-2 focus:ring-primary/20"
                                        value={entry.credit || ''}
                                        onChange={(e) => updateEntry(index, 'credit', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => removeEntry(index)}
                                        className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                        <tr className="font-bold">
                            <td className="px-6 py-4 italic text-muted-foreground font-medium">Totals</td>
                            <td className="px-6 py-4 text-right font-mono text-primary">PKR {totalDebit.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono text-secondary">PKR {totalCredit.toLocaleString()}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>

                <div className="p-4 bg-muted/10 border-t border-border flex items-center justify-between">
                    <button
                        onClick={addEntry}
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                        <PlusCircle size={18} />
                        Add Another Line
                    </button>

                    {!isBalanced && totalDebit > 0 && (
                        <div className="flex items-center gap-2 text-sm font-medium text-rose-500">
                            <AlertCircle size={18} />
                            Difference: PKR {Math.abs(totalDebit - totalCredit).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
