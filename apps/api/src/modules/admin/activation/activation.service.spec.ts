import { Test, TestingModule } from '@nestjs/testing';
import { ActivationEventsService, HAPPY_PATH_EVENTS } from './activation.service';
import { KNEX_ADMIN_CONNECTION } from '../../../config/database.module';

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const buildKnexChain = (overrides: Record<string, any> = {}) => {
  const chain: any = {};
  const methods = ['where', 'whereIn', 'whereNull', 'insert', 'select', 'first', 'returning',
    'orderBy', 'limit', 'count', 'countDistinct', 'groupBy'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  Object.assign(chain, overrides);

  const knexFn: any = jest.fn().mockReturnValue(chain);
  knexFn.raw = jest.fn();
  knexFn._chain = chain;
  return knexFn;
};

describe('ActivationEventsService', () => {
  let service: ActivationEventsService;
  let knex: ReturnType<typeof buildKnexChain>;

  beforeEach(async () => {
    knex = buildKnexChain();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivationEventsService,
        { provide: KNEX_ADMIN_CONNECTION, useValue: knex },
      ],
    }).compile();

    service = module.get<ActivationEventsService>(ActivationEventsService);
  });

  describe('record()', () => {
    it('inserts an activation event without throwing', async () => {
      knex._chain.first.mockResolvedValueOnce(null); // no tenant_activated yet
      knex._chain.first.mockResolvedValueOnce(null); // no tenant_created yet
      knex._chain.insert.mockResolvedValue([]);

      await expect(service.record(TENANT_ID, 'first_customer_created')).resolves.toBeUndefined();
      expect(knex).toHaveBeenCalledWith('activation_events');
    });

    it('swallows errors silently — tracking must not crash callers', async () => {
      knex._chain.insert.mockRejectedValue(new Error('DB error'));
      await expect(service.record(TENANT_ID, 'first_customer_created')).resolves.toBeUndefined();
    });

    it('emits tenant_activated when all happy-path events are present within 7 days', async () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      // first call: check existing tenant_activated → null
      knex._chain.first
        .mockResolvedValueOnce(null)
        // second call: tenant_created event
        .mockResolvedValueOnce({ occurred_at: createdAt });

      // happy path count check
      knex._chain.countDistinct.mockReturnValue(knex._chain);
      knex._chain.first.mockResolvedValueOnce({ count: String(HAPPY_PATH_EVENTS.length) });

      knex._chain.insert.mockResolvedValue([]);

      await service.record(TENANT_ID, 'first_financial_transaction_created');

      // insert called at least twice: once for the event, once for tenant_activated
      expect(knex._chain.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRate()', () => {
    it('returns correct activation rate', async () => {
      knex.raw.mockResolvedValue({ rows: [{ activated: '3', total: '10' }] });

      const result = await service.getRate(30);

      expect(result).toEqual({ activated: 3, total: 10, rate: 0.3 });
    });

    it('returns rate=0 when no tenants', async () => {
      knex.raw.mockResolvedValue({ rows: [{ activated: '0', total: '0' }] });

      const result = await service.getRate(30);
      expect(result.rate).toBe(0);
    });
  });

  describe('getFunnel()', () => {
    it('returns funnel steps with counts and rates', async () => {
      knex._chain.groupBy.mockResolvedValue([
        { event_type: 'tenant_created', count: '10' },
        { event_type: 'first_customer_created', count: '7' },
        { event_type: 'tenant_activated', count: '3' },
      ]);

      const funnel = await service.getFunnel(30);

      expect(funnel.length).toBeGreaterThan(0);
      const createdStep = funnel.find((s) => s.event_type === 'tenant_created');
      expect(createdStep?.count).toBe(10);
      const activatedStep = funnel.find((s) => s.event_type === 'tenant_activated');
      expect(activatedStep?.count).toBe(3);
      expect(activatedStep?.rate).toBeCloseTo(0.3);
    });
  });

  describe('getRecent()', () => {
    it('returns recent events ordered by occurred_at desc', async () => {
      const mockEvents = [
        { id: '1', tenant_id: TENANT_ID, event_type: 'first_customer_created', occurred_at: new Date() },
      ];
      knex._chain.limit.mockResolvedValue(mockEvents);

      const result = await service.getRecent(50);
      expect(result).toEqual(mockEvents);
    });
  });
});
