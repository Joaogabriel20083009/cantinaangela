import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-neutral-950 focus:ring-amber-300 shadow-lg shadow-amber-500/10',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 focus:ring-neutral-200 shadow-sm border border-neutral-200/50',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-300 shadow-lg shadow-emerald-500/10',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-300 shadow-lg shadow-rose-500/10',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800 focus:ring-neutral-200',
    outline: 'border border-neutral-250 bg-transparent hover:bg-neutral-50 text-neutral-700 focus:ring-neutral-200'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg' // Big touch target for mobile
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
