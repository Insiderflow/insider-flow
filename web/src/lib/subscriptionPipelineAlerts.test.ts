import { describe, expect, it } from 'vitest';
import { buildSubscriptionPipelineAlerts } from './subscriptionPipelineAlerts';

describe('subscriptionPipelineAlerts', () => {
  it('triggers warning/critical alerts when thresholds are breached', () => {
    const alerts = buildSubscriptionPipelineAlerts(
      {
        total_events: 200,
        due_now_count: 40,
        dead_lettered_count: 10,
        dead_letter_rate: 0.05,
        oldest_failed_at: '2026-04-26T00:00:00.000Z',
        latest_processed_at: '2026-04-26T00:00:00.000Z',
      },
      new Date('2026-04-27T04:00:00.000Z'),
    );

    expect(alerts.map((a) => a.key)).toContain('subscription_due_now_backlog');
    expect(alerts.map((a) => a.key)).toContain('subscription_dead_letter_rate');
    expect(alerts.map((a) => a.key)).toContain('subscription_oldest_failed_age');
    expect(alerts.map((a) => a.key)).toContain('subscription_latest_processed_stale');
  });

  it('returns no alerts when metrics are healthy', () => {
    const alerts = buildSubscriptionPipelineAlerts(
      {
        total_events: 50,
        due_now_count: 1,
        dead_lettered_count: 0,
        dead_letter_rate: 0,
        oldest_failed_at: null,
        latest_processed_at: new Date('2026-04-27T03:55:00.000Z').toISOString(),
      },
      new Date('2026-04-27T04:00:00.000Z'),
    );

    expect(alerts).toEqual([]);
  });
});
