import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import WatchlistCard from '@/components/watchlist/WatchlistCard';
import WatchlistEmpty from '@/components/watchlist/WatchlistEmpty';
import BulkActionBar from '@/components/watchlist/BulkActionBar';
import { CheckSquare, Square } from 'lucide-react';

const TABS = [
  { key: 'politician', label: 'Politicians' },
  { key: 'company',    label: 'Companies' },
  { key: 'owner',      label: 'Owners' },
  { key: 'ticker',     label: 'Stocks' },
];

function WatchlistSkeleton() {
  return (
    <div className="space-y-2.5 px-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function Watchlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [removingIds, setRemovingIds] = useState(new Set());

  const removeItemById = async (id) => {
    const api = await import('@/lib/api');
    return api.removeFromWatchlist(id);
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => import('@/lib/api').then(m => m.getWatchlistItems()),
  });

  const tabKey = TABS[activeTab].key;
  const tabItems = useMemo(() => items.filter(i => i.type === tabKey), [items, tabKey]);

  /* ---- Single remove (optimistic) ---- */
  const removeMutation = useMutation({
    mutationFn: (id) => removeItemById(id),
    onMutate: async (id) => {
      setRemovingIds(prev => new Set(prev).add(id));
      await queryClient.cancelQueries({ queryKey: ['watchlist'] });
      const prev = queryClient.getQueryData(['watchlist']);
      queryClient.setQueryData(['watchlist'], old => (old || []).filter(i => i.id !== id));
      return { prev, id };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(['watchlist'], ctx.prev);
      toast({ title: 'Failed to remove item', description: 'It has been restored.', variant: 'destructive' });
    },
    onSettled: (_d, _e, id) => {
      setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  /* ---- Bulk remove ---- */
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    const ids = [...selected];
    const prev = queryClient.getQueryData(['watchlist']);

    // Optimistic
    queryClient.setQueryData(['watchlist'], old => (old || []).filter(i => !ids.includes(i.id)));
    setSelected(new Set());

    const results = await Promise.allSettled(ids.map(id => removeItemById(id)));
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      queryClient.setQueryData(['watchlist'], prev);
      toast({ title: `${failed} item(s) failed to remove`, description: 'Items restored. Try again.', variant: 'destructive' });
    } else {
      toast({ title: `${ids.length} item(s) removed` });
    }

    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    setBulkDeleting(false);
    setBulkMode(false);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleBulkModeToggle = () => {
    setBulkMode(v => !v);
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Watchlist" />

      {/* Tab bar */}
      <div className="sticky top-14 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50">
        <div className="flex px-4 gap-0 pt-2 pb-0">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(i); setSelected(new Set()); }}
              className={`relative flex-1 pb-2 text-xs font-semibold transition-colors ${
                activeTab === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === i && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-xs text-muted-foreground">
          {isLoading ? '—' : `${tabItems.length} tracked`}
        </p>
        {tabItems.length > 0 && (
          <button
            onClick={handleBulkModeToggle}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              bulkMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {bulkMode
              ? <><CheckSquare className="h-3.5 w-3.5" /> Done</>
              : <><Square className="h-3.5 w-3.5" /> Select</>
            }
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-1 space-y-2">
        {isLoading ? (
          <WatchlistSkeleton />
        ) : tabItems.length === 0 ? (
          <WatchlistEmpty tab={tabKey} />
        ) : (
          tabItems.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              bulkMode={bulkMode}
              selected={selected.has(item.id)}
              onSelect={toggleSelect}
              onRemove={(item) => removeMutation.mutate(item.id)}
              removing={removingIds.has(item.id)}
            />
          ))
        )}
      </div>

      {/* Bulk action bar */}
      {bulkMode && (
        <BulkActionBar
          count={selected.size}
          total={tabItems.length}
          onSelectAll={() => setSelected(new Set(tabItems.map(i => i.id)))}
          onClearAll={() => setSelected(new Set())}
          onDeleteSelected={handleBulkDelete}
          isDeleting={bulkDeleting}
        />
      )}
    </div>
  );
}