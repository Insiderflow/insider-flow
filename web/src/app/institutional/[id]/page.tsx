import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InstitutionalDetailPage() {
  // Temporarily redirect to politicians page until institutional data is properly set up
  redirect('/politicians');
}
