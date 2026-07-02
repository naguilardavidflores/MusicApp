import React from 'react';

interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Title: React.FC<TypographyProps> = ({ children, className = '', style, ...props }) => (
  <h1 
    className={className} 
    style={{ color: '#fff', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, ...style }}
    {...props}
  >
    {children}
  </h1>
);

export const Subtitle: React.FC<TypographyProps> = ({ children, className = '', style, ...props }) => (
  <h2 
    className={className} 
    style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: 0, ...style }}
    {...props}
  >
    {children}
  </h2>
);

export const BodyText: React.FC<TypographyProps> = ({ children, className = '', style, ...props }) => (
  <p 
    className={className} 
    style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: 0, ...style }}
    {...props}
  >
    {children}
  </p>
);

export const MutedText: React.FC<TypographyProps> = ({ children, className = '', style, ...props }) => (
  <span 
    className={className} 
    style={{ color: 'hsl(var(--text-secondary))', fontSize: '12px', fontWeight: 400, ...style }}
    {...props}
  >
    {children}
  </span>
);
