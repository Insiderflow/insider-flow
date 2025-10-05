import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface InstitutionalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstitutionalDetailPage({ 
  params, 
  searchParams 
}: InstitutionalDetailPageProps & { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  // Temporarily redirect to politicians page until institutional data is properly set up
  redirect('/politicians');
}
