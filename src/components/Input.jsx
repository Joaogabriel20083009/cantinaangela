import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  className = '',
  icon: Icon,
  trailingIcon: TrailingIcon,
  onTrailingIconClick,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-neutral-400 pointer-events-none">
            <Icon size={20} />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full px-4 py-3.5 bg-white border ${
            error ? 'border-rose-500 focus:ring-rose-500/10' : 'border-neutral-250 focus:ring-amber-500/10'
          } ${
            Icon ? 'pl-12' : ''
          } ${
            TrailingIcon ? 'pr-12' : ''
          } text-neutral-800 placeholder-neutral-400 rounded-2xl transition-all duration-200 focus:outline-none focus:border-amber-500 focus:ring-4 text-base`}
          {...props}
        />
        {TrailingIcon && (
          <button
            type="button"
            onClick={onTrailingIconClick}
            className="absolute right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <TrailingIcon size={20} />
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs font-semibold text-rose-600 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
