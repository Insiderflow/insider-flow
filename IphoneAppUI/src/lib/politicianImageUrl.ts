import mapping from '@/data/politicianImageMapping.json';

export function getPoliticianImagePath(politicianId: string, politicianName: string): string {
  const id = politicianId.trim();
  const mapped = mapping[id as keyof typeof mapping];
  if (mapped) return `/images/politicians/${mapped}`;
  const cleanName = politicianName.replace(/[^a-zA-Z0-9]/g, '_');
  return `/images/politicians/${id}_${cleanName}.jpg`;
}
