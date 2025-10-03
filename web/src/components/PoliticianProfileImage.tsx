"use client";
import { useState } from 'react';
import Image from 'next/image';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';

interface PoliticianProfileImageProps {
  politicianId: string;
  politicianName: string;
  className?: string;
}

export default function PoliticianProfileImage({ 
  politicianId, 
  politicianName, 
  className = "w-full h-full object-cover" 
}: PoliticianProfileImageProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-700">
        <span className="text-white text-lg font-semibold">
          {politicianName.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
    );
  }

  return (
    <Image 
      src={getPoliticianImageSrc(politicianId, politicianName)}
      alt={`${politicianName} profile`}
      width={200}
      height={200}
      className={className}
      onError={handleImageError}
    />
  );
}
