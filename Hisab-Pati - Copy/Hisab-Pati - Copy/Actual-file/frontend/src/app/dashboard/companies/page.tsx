"use client";

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ArrowRight, Home } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CompaniesPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Fetch companies for user
    const { data: companies, isLoading } = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            try {
                const res = await api.get('/companies/active');
                return res.data;
            } catch (e) {
                return [];
            }
        },
        initialData: [
            { id: '1', name: 'Alvi Auto Store', industry: 'Automotive', address: 'Lahore, Pakistan' },
            { id: '2', name: 'Marco Tech Solutions', industry: 'Software', address: 'London, UK' },
        ]
    });

    const selectCompany = (id: string) => {
        // In a real app, this would set the active company in context/localstorage
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-white shadow-xl mb-4">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">Select your Company</h1>
                    <p className="text-lg text-slate-500 max-w-lg mx-auto">
                        Choose a business entity to manage its accounts, inventory, and financial statements.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies?.map((company: any) => (
                        <button
                            key={company.id}
                            onClick={() => selectCompany(company.id)}
                            className="group premium-card !p-8 flex flex-col items-start gap-6 text-left hover:border-primary/50 hover:shadow-xl active:scale-[0.98]"
                        >
                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Home size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">{company.name}</h3>
                                <p className="text-sm text-slate-500 font-medium">{company.industry}</p>
                                <p className="text-xs text-slate-400">{company.address}</p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Enter Dashboard <ArrowRight size={16} />
                            </div>
                        </button>
                    ))}

                    {/* New Company Card */}
                    <button className="premium-card !p-8 flex flex-col items-center justify-center gap-4 text-center border-dashed border-2 hover:bg-slate-100 transition-colors">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Plus size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900">Add New Company</h3>
                            <p className="text-xs text-slate-500">Create a new business profile</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
