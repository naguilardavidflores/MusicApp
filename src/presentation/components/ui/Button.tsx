import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  style, 
  ...props 
}) => {
  const getStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      border: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: '13px',
      fontWeight: 700,
      padding: '12px 24px',
      borderRadius: '30px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
      outline: 'none',
    };

    switch (variant) {
      case 'primary': // Solid White
        return {
          ...baseStyle,
          background: '#fff',
          color: '#000',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          ...style
        };
      case 'accent': // Spotify Green
        return {
          ...baseStyle,
          background: 'hsl(var(--accent))',
          color: '#000',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          ...style
        };
      case 'secondary': // Dark Grey
      default:
        return {
          ...baseStyle,
          background: '#232323',
          color: '#fff',
          padding: '8px 16px', // tighter padding for tabs/small buttons
          fontSize: '11px',
          ...style
        };
    }
  };

  return (
    <button 
      className={className} 
      style={getStyle()} 
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.96)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};
