'use client';

import Image from "next/image";
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import { useState } from 'react';

interface HomePoliticianImageProps {
  politicianId: string;
  politicianName: string;
}

export default function HomePoliticianImage({ politicianId, politicianName }: HomePoliticianImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {politicianName.charAt(0)}
      </div>
    );
  }

  return (
    <Image
      src={getPoliticianImageSrc(politicianId, politicianName)}
      alt={politicianName}
      width={48}
      height={48}
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  );
}
