import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}> = ({ onClick, disabled, variant = 'primary', children, className = '', type = 'button' }) => {
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus:ring-brand-500 shadow-md hover:shadow-lg",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const Alert: React.FC<{ type: 'error' | 'info'; message: string }> = ({ type, message }) => {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-brand-700 border-brand-200"
  };
  
  return (
    <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${styles[type]}`}>
      <span className="mt-0.5 text-lg">
        {type === 'error' ? '⚠️' : 'ℹ️'}
      </span>
      {message}
    </div>
  );
};