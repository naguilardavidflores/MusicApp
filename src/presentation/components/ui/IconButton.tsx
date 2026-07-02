import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'flat' | 'main';
  className?: string;
  style?: React.CSSProperties;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  children, 
  variant = 'flat', 
  className = '', 
  style, 
  ...props 
}) => {
  const getStyle = (): React.CSSProperties => {
    if (variant === 'main') {
      // Solid circular Spotify play/pause button
      return {
        background: '#fff',
        border: 'none',
        color: '#000',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        outline: 'none',
        flexShrink: 0,
        ...style
      };
    } else {
      // Transparent icon button
      return {
        background: 'transparent',
        border: 'none',
        color: '#b3b3b3',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, color 0.15s ease',
        outline: 'none',
        flexShrink: 0,
        ...style
      };
    }
  };

  return (
    <button 
      className={className} 
      style={getStyle()} 
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.93)';
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
