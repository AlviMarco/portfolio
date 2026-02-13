"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';
import {
    Company, Account, Transaction, InventorySubLedger, InventoryMovement,
    AccountWithTotals, FinancialSummary, ReportRange, CashFlowData
} from '@/core/types';
import { calculateBalances, getFinancialSummary, getCashFlowData, getDashboardStats } from '@/core/engine/accounting.engine';
import { calculateSubLedgerBalance } from '@/core/engine/inventory.engine';
import { getFinancialAdvice } from '@/services/gemini';
import { isOnline } from '@/utils/networkService';

interface DataContextType {
    companies: Company[];
    activeCompany: Company | null;
    accounts: Account[];
    transactions: Transaction[];
    inventorySubLedgers: InventorySubLedger[];
    inventoryMovements: InventoryMovement[];
    reportRange: ReportRange;
    planType: 'BASIC' | 'MODERATE';

    // Derived Data
    accountsWithBalances: AccountWithTotals[];
    financialSummary: FinancialSummary;
    cashFlowData: CashFlowData;
    dashboardStats: { label: string; income: number; expense: number }[];
    aiInsight: string | null;
    isAiLoading: boolean;
    networkOnline: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setActiveCompany: (company: Company | null) => void;
    setReportRange: React.Dispatch<React.SetStateAction<ReportRange>>;
    setPlanType: (plan: 'BASIC' | 'MODERATE') => void;
    refreshData: () => Promise<void>;
    fetchAiAdvice: () => Promise<void>;

    // Mutations
    addTransaction: (tx: Partial<Transaction>) => Promise<void>;
    updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addAccount: (acc: Partial<Account>) => Promise<void>;
    addInventoryItem: (item: Partial<InventorySubLedger>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [inventorySubLedgers, setInventorySubLedgers] = useState<InventorySubLedger[]>([]);
    const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [planType, setPlanType] = useState<'BASIC' | 'MODERATE'>('MODERATE');
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [networkOnline, setNetworkOnline] = useState(true);

    useEffect(() => {
        const handleStatus = () => setNetworkOnline(isOnline());
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        setNetworkOnline(isOnline());
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const [reportRange, setReportRange] = useState<ReportRange>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        return { start, end };
    });

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const companiesRes = await api.get('/companies');
            setCompanies(companiesRes.data);

            let currentCompany = activeCompany;
            if (!currentCompany && companiesRes.data.length > 0) {
                currentCompany = companiesRes.data[0];
                setActiveCompanyState(currentCompany);
            }

            if (currentCompany) {
                const [accRes, txRes, invRes, movRes] = await Promise.all([
                    api.get(`/accounts/${currentCompany.id}`),
                    api.get(`/transactions/${currentCompany.id}`),
                    api.get(`/inventory/${currentCompany.id}`),
                    api.get(`/inventory/${currentCompany.id}/movements`)
                ]);
                setAccounts(accRes.data);
                setTransactions(txRes.data);
                setInventorySubLedgers(invRes.data);
                setInventoryMovements(movRes.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const refreshData = async () => {
        await fetchData();
    };

    const setActiveCompany = (company: Company | null) => {
        setActiveCompanyState(company);
        fetchData(); // Refetch for the new company
    };

    // Derived calculations using the ported engines
    const accountsWithBalances = useMemo(() => {
        return calculateBalances(accounts, transactions, reportRange.start, reportRange.end);
    }, [accounts, transactions, reportRange]);

    const financialSummary = useMemo(() => {
        return getFinancialSummary(accountsWithBalances);
    }, [accountsWithBalances]);

    const cashFlowData = useMemo(() => {
        return getCashFlowData(accountsWithBalances, transactions, reportRange.start, reportRange.end);
    }, [accountsWithBalances, transactions, reportRange]);

    const dashboardStats = useMemo(() => {
        return getDashboardStats(accounts, transactions);
    }, [accounts, transactions]);

    const fetchAiAdvice = async () => {
        if (isAiLoading) return;
        setIsAiLoading(true);
        try {
            const advice = await getFinancialAdvice(accountsWithBalances, transactions);
            setAiInsight(advice);
        } catch (err) {
            console.error('AI Insight Error:', err);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Mutation Mockup (To be connected to real API endpoints)
    const addTransaction = async (tx: Partial<Transaction>) => {
        if (!activeCompany) return;
        await api.post(`/transactions/${activeCompany.id}`, tx);
        await refreshData();
    };

    const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
        // TODO: Implement update in backend
        await refreshData();
    };

    const deleteTransaction = async (id: string) => {
        await api.delete(`/transactions/${id}`);
        await refreshData();
    };

    const addAccount = async (acc: Partial<Account>) => {
        if (!activeCompany) return;
        await api.post(`/accounts/${activeCompany.id}`, acc);
        await refreshData();
    }

    const addInventoryItem = async (item: Partial<InventorySubLedger>) => {
        if (!activeCompany) return;
        await api.post(`/inventory/${activeCompany.id}`, item);
        await refreshData();
    }

    return (
        <DataContext.Provider value={{
            companies, activeCompany, accounts, transactions, inventorySubLedgers, inventoryMovements,
            reportRange, planType, accountsWithBalances, financialSummary, cashFlowData, dashboardStats,
            aiInsight, isAiLoading, networkOnline,
            isLoading, error, setActiveCompany, setReportRange, setPlanType, refreshData, fetchAiAdvice,
            addTransaction, updateTransaction, deleteTransaction, addAccount, addInventoryItem
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
