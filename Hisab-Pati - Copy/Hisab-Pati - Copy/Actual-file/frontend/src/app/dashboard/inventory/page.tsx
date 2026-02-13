"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Package,
    AlertTriangle,
    MoreVertical,
    ArrowUpRight,
    History
} from 'lucide-react';
import api from '@/lib/api';

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Inventory items
    const { data: items, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            try {
                const res = await api.get('/inventory/default-company-id');
                return res.data;
            } catch (e) {
                return [];
            }
        },
        initialData: [
            { id: '1', sku: 'OIL-001', name: 'Engine Oil 10W-40', category: 'Lubricants', quantity: 24, unit: 'Liters', rate: 1200 },
            { id: '2', sku: 'BP-001', name: 'Brake Pads Front', category: 'Braking', quantity: 4, unit: 'Sets', rate: 3500 },
            { id: '3', sku: 'AF-001', name: 'Air Filter Standard', category: 'Filters', quantity: 12, unit: 'Pieces', rate: 850 },
            { id: '4', sku: 'SP-001', name: 'Spark Plug Platinum', category: 'Ignition', quantity: 2, unit: 'Pieces', rate: 600 },
        ]
    });

    const filteredItems = items?.filter((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search items by name or SKU..."
                        className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
                        <History size={18} />
                        Stock History
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
                        <Plus size={18} />
                        Add New Item
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="premium-card !p-4 flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                        <p className="text-xl font-bold">{items?.length || 0}</p>
                    </div>
                </div>
                <div className="premium-card !p-4 flex items-center gap-4 border-rose-100 dark:border-rose-950/30">
                    <div className="rounded-lg bg-rose-500/10 p-3 text-rose-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                        <p className="text-xl font-bold text-rose-500">{items?.filter((i: any) => i.quantity <= 5).length || 0}</p>
                    </div>
                </div>
                <div className="premium-card !p-4 flex items-center gap-4">
                    <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                        <p className="text-xl font-bold text-emerald-500">
                            PKR {items?.reduce((sum: number, i: any) => sum + (i.quantity * i.rate), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="premium-card !p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">SKU / Item Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Stock Level</th>
                            <th className="px-6 py-4 text-right">Avg Rate</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredItems?.map((item: any) => (
                            <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.sku}</span>
                                        <span className="font-semibold text-foreground">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-muted-foreground">{item.category}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${item.quantity <= 5 ? 'text-rose-500' : 'text-foreground'}`}>
                                            {item.quantity}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                                        {item.quantity <= 5 && (
                                            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
                                                Low
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono text-sm font-medium">PKR {item.rate.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono text-sm font-bold text-primary">
                                        PKR {(item.quantity * item.rate).toLocaleString()}
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
