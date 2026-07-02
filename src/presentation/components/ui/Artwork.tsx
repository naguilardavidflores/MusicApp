import React from 'react';
import { Disc } from 'lucide-react';

interface ArtworkProps {
  coverUrl?: string;
  size?: number;
  borderRadius?: string;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const Artwork: React.FC<ArtworkProps> = ({ 
  coverUrl, 
  size = 48, 
  borderRadius = '4px',
  className = '',
  iconSize = 24,
  style
}) => {
  return (
    <div 
      className={className} 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        overflow: 'hidden',
        background: '#282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        ...style
      }}
    >
      {coverUrl ? (
        <img 
          src={coverUrl} 
          alt="Cover" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => {
            // If the local resource URL fails to load, trigger fallback
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const svg = parent.querySelector('svg');
              if (svg) svg.style.display = 'block';
            }
          }}
        />
      ) : null}
      
      {/* Fallback disc icon, hidden if coverUrl loaded correctly */}
      <Disc 
        size={iconSize} 
        style={{ 
          color: 'hsl(var(--text-secondary))', 
          display: coverUrl ? 'none' : 'block' 
        }} 
      />
    </div>
  );
};
