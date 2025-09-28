import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import WatchlistButton from '@/components/WatchlistButton';

export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300">請先登入以查看觀察名單</div>
      </div>
    );
  }

  const items = await prisma.userWatchlist.findMany({
    where: { user_id: user.id },
    include: { Politician: true },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">我的觀察名單</h1>
        {items.length === 0 ? (
          <div className="text-gray-300">尚未加入任何政治家</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <div key={`${it.user_id}-${it.politician_id}`} className="border border-gray-600 bg-gray-800 rounded-lg p-4 shadow-md hover:bg-gray-700 transition-colors duration-200">
                <div className="flex items-center justify-between gap-3">
                    <a href={`/politicians/${it.politician_id}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <PoliticianProfileImage politician_id={it.politician_id} politicianName={it.Politician.name} />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{it.Politician.name}</div>
                      <div className="text-xs text-gray-400">{it.Politician.state} {it.Politician.party}</div>
                    </div>
                  </a>
                  <WatchlistButton politicianId={it.politician_id} initialInWatchlist={true} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


