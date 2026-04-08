import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = (this as any).state;
    const { children } = (this as any).props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Algo salió mal</h1>
              <p className="text-white/40 text-sm leading-relaxed">
                Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la aplicación.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-all active:scale-95"
            >
              Recargar aplicación
            </button>
            {import.meta.env.DEV && error && (
              <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 text-left overflow-auto max-h-40">
                <code className="text-[10px] text-rose-400 font-mono">
                  {error.toString()}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
