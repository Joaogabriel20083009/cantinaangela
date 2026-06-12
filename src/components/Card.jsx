import React from 'react';

const Card = ({
  children,
  onClick,
  className = '',
  hoverable = false,
  glass = false,
  ...props
}) => {
  const isClickable = typeof onClick === 'function';
  
  const baseStyles = 'rounded-3xl border border-neutral-200/80 p-5 bg-white overflow-hidden transition-all duration-250 shadow-sm shadow-neutral-100/50';
  
  const glassStyles = glass 
    ? 'backdrop-blur-md bg-white/85 border-neutral-200/50'
    : '';

  const hoverStyles = (hoverable || isClickable)
    ? 'hover:border-amber-450 hover:shadow-md hover:bg-neutral-50/20 active:scale-[0.98] cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
