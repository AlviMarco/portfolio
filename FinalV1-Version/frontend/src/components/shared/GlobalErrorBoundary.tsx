import * as React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { APP_CONFIG } from '../../../../shared/constants';

export class GlobalErrorBoundary extends (React.Component as any) {
    public state: any;
    public props: any;

    constructor(props: any) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    public static getDerivedStateFromError(error: Error): any {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: any) {
        console.error('🔥 Global UI Error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if ((this.state as any).hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                            <AlertCircle size={40} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Something went wrong</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                The application encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-left border dark:border-slate-700 overflow-auto max-h-40">
                                <code className="text-[10px] text-rose-500 font-mono break-all font-bold">
                                    {(this.state as any).error?.toString()}
                                </code>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={this.handleReload}
                                className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Reload Application
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="w-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
                            >
                                <Home size={18} /> Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (this.props as any).children;
    }
}
