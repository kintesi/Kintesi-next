import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  const displayName = name || 'Customer';
  const initial = displayName.charAt(0).toUpperCase();

  // If valid avatar URL provided and hasn't errored
  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-700 bg-gray-800 shrink-0 shadow-sm ${className}`}
      />
    );
  }

  // High-quality UI initials avatar fallback
  const fallbackApiUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=e11d48&color=ffffff&bold=true`;

  return (
    <img
      src={fallbackApiUrl}
      alt={displayName}
      className={`${sizeClasses[size]} rounded-full object-cover border border-rose-500/30 bg-rose-950 shrink-0 shadow-sm ${className}`}
    />
  );
};
