import { Knex } from 'knex';
import { v7 as uuidv7 } from 'uuid';

const generateId = () => uuidv7();

const SCHEMA_NAME_RE =
  /^tenant_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/;

export async function seedAcmeDemoData(
  knex: Knex,
  tenantId: string,
  schemaName: string,
): Promise<void> {
  if (!SCHEMA_NAME_RE.test(schemaName)) {
    throw new Error(
      `Invalid schema name "${schemaName}". Must match tenant_<uuid> pattern.`,
    );
  }

  const t = (tableName: string) => knex.withSchema(schemaName).table(tableName);

  // ── Guard: skip if demo data already present (check estimates as completion signal) ──
  const existingEstimates = await t('estimates').count('id as n').first();
  if (existingEstimates && Number(existingEstimates.n) > 0) {
    console.log('Demo data already present (estimates found) -- skipping seedAcmeDemoData.');
    return;
  }

  console.log('Seeding Acme demo data…');

  // ── Insurance Companies ───────────────────────────────────────────────────
  const insId1 = generateId();
  const insId2 = generateId();
  await t('insurance_companies')
    .insert([
      {
        id: insId1,
        tenant_id: tenantId,
        name: 'State Farm Insurance',
        code: 'SF',
        phone: '1-800-732-5246',
        email: 'claims@statefarm-demo.test',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: insId2,
        tenant_id: tenantId,
        name: 'Geico Insurance',
        code: 'GEICO',
        phone: '1-800-207-7847',
        email: 'claims@geico-demo.test',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .onConflict('id')
    .ignore();

  // ── Customers (15) ────────────────────────────────────────────────────────
  const customers = [
    { first: 'Alice', last: 'Brown', email: 'alice.brown@demo.test', phone: '314-555-0101' },
    { first: 'Bob', last: 'Williams', email: 'bob.williams@demo.test', phone: '314-555-0102' },
    { first: 'Carol', last: 'Davis', email: 'carol.davis@demo.test', phone: '314-555-0103' },
    { first: 'Dan', last: 'Miller', email: 'dan.miller@demo.test', phone: '314-555-0104' },
    { first: 'Eva', last: 'Wilson', email: 'eva.wilson@demo.test', phone: '314-555-0105' },
    { first: 'Frank', last: 'Moore', email: 'frank.moore@demo.test', phone: '314-555-0106' },
    { first: 'Grace', last: 'Taylor', email: 'grace.taylor@demo.test', phone: '314-555-0107' },
    { first: 'Hank', last: 'Anderson', email: 'hank.anderson@demo.test', phone: '314-555-0108' },
    { first: 'Iris', last: 'Thomas', email: 'iris.thomas@demo.test', phone: '314-555-0109' },
    { first: 'Jack', last: 'Jackson', email: 'jack.jackson@demo.test', phone: '314-555-0110' },
    { first: 'Kim', last: 'White', email: 'kim.white@demo.test', phone: '314-555-0111' },
    { first: 'Leo', last: 'Harris', email: 'leo.harris@demo.test', phone: '314-555-0112' },
    { first: 'Mia', last: 'Martin', email: 'mia.martin@demo.test', phone: '314-555-0113' },
    { first: 'Ned', last: 'Garcia', email: 'ned.garcia@demo.test', phone: '314-555-0114' },
    { first: 'Ora', last: 'Martinez', email: 'ora.martinez@demo.test', phone: '314-555-0115' },
  ];

  const customerIds: string[] = [];
  for (const c of customers) {
    const id = generateId();
    customerIds.push(id);
    await t('customers')
      .insert({
        id,
        tenant_id: tenantId,
        first_name: c.first,
        last_name: c.last,
        email: c.email,
        phone: c.phone,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();
  }

  // ── Vehicles (18) ─────────────────────────────────────────────────────────
  const vehicleSpecs = [
    { make: 'Toyota', model: 'Camry', year: 2021, vin: 'DEMO1VIN00001', color: 'Silver' },
    { make: 'Honda', model: 'Civic', year: 2020, vin: 'DEMO1VIN00002', color: 'Blue' },
    { make: 'Ford', model: 'F-150', year: 2022, vin: 'DEMO1VIN00003', color: 'White' },
    { make: 'Chevrolet', model: 'Silverado', year: 2021, vin: 'DEMO1VIN00004', color: 'Black' },
    { make: 'Toyota', model: 'RAV4', year: 2023, vin: 'DEMO1VIN00005', color: 'Red' },
    { make: 'Honda', model: 'CR-V', year: 2022, vin: 'DEMO1VIN00006', color: 'Gray' },
    { make: 'Nissan', model: 'Altima', year: 2020, vin: 'DEMO1VIN00007', color: 'White' },
    { make: 'Ford', model: 'Escape', year: 2021, vin: 'DEMO1VIN00008', color: 'Blue' },
    { make: 'Jeep', model: 'Grand Cherokee', year: 2022, vin: 'DEMO1VIN00009', color: 'Black' },
    { make: 'BMW', model: '3 Series', year: 2021, vin: 'DEMO1VIN00010', color: 'Silver' },
    { make: 'Mercedes', model: 'C-Class', year: 2022, vin: 'DEMO1VIN00011', color: 'White' },
    { make: 'Chevrolet', model: 'Malibu', year: 2020, vin: 'DEMO1VIN00012', color: 'Red' },
    { make: 'Toyota', model: 'Tacoma', year: 2023, vin: 'DEMO1VIN00013', color: 'Gray' },
    { make: 'Honda', model: 'Accord', year: 2021, vin: 'DEMO1VIN00014', color: 'Blue' },
    { make: 'Ford', model: 'Mustang', year: 2022, vin: 'DEMO1VIN00015', color: 'Black' },
    { make: 'Dodge', model: 'Ram 1500', year: 2021, vin: 'DEMO1VIN00016', color: 'Silver' },
    { make: 'Subaru', model: 'Outback', year: 2020, vin: 'DEMO1VIN00017', color: 'Green' },
    { make: 'Kia', model: 'Telluride', year: 2023, vin: 'DEMO1VIN00018', color: 'White' },
  ];

  const vehicleIds: string[] = [];
  for (let i = 0; i < vehicleSpecs.length; i++) {
    const v = vehicleSpecs[i];
    const id = generateId();
    vehicleIds.push(id);
    await t('vehicles')
      .insert({
        id,
        tenant_id: tenantId,
        customer_id: customerIds[i % customerIds.length],
        make: v.make,
        model: v.model,
        year: v.year,
        vin: v.vin,
        color: v.color,
        license_plate: `DEMO-${String(i + 1).padStart(3, '0')}`,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();
  }

  // ── Estimates (12) ────────────────────────────────────────────────────────
  const estimateStatuses = ['draft', 'sent', 'approved', 'approved', 'approved', 'rejected',
    'approved', 'sent', 'approved', 'approved', 'rejected', 'approved'];

  // Look up the estimator (or any user) to satisfy estimated_by NOT NULL
  const estimatorUser = await t('users')
    .whereRaw(`email LIKE '%estimator%' OR email LIKE '%owner%'`)
    .orderBy('created_at', 'asc')
    .first();
  const fallbackUser = estimatorUser ?? (await t('users').orderBy('created_at', 'asc').first());
  const estimatedById: string = fallbackUser?.id ?? tenantId; // last resort: tenantId (should never happen)

  const estimateIds: string[] = [];
  for (let i = 0; i < 12; i++) {
    const id = generateId();
    estimateIds.push(id);
    const customerId = customerIds[i % customerIds.length];
    const vehicleId = vehicleIds[i % vehicleIds.length];
    const insId = i % 3 === 0 ? null : i % 2 === 0 ? insId1 : insId2;
    const baseAmt = 800 + i * 250;

    await t('estimates')
      .insert({
        id,
        tenant_id: tenantId,
        customer_id: customerId,
        vehicle_id: vehicleId,
        insurance_company_id: insId,
        estimate_number: `EST-2026-${String(i + 1).padStart(4, '0')}`,
        status: estimateStatuses[i],
        subtotal: baseAmt.toFixed(2),
        tax_amount: (baseAmt * 0.08275).toFixed(2),
        total: (baseAmt * 1.08275).toFixed(2),
        estimated_by: estimatedById,
        notes: `Demo estimate ${i + 1} - Acme UAT seed`,
        created_at: new Date(Date.now() - (30 - i) * 86400000),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();

    // 2 line items per estimate
    for (let j = 0; j < 2; j++) {
      await t('estimate_lines')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          estimate_id: id,
          line_type: j === 0 ? 'labor' : 'parts',
          description: j === 0 ? 'PDR Labor' : 'Parts & Materials',
          quantity: 1,
          unit_price: (j === 0 ? baseAmt * 0.6 : baseAmt * 0.4).toFixed(2),
          total: (j === 0 ? baseAmt * 0.6 : baseAmt * 0.4).toFixed(2),
          sort_order: j,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict('id')
        .ignore();
    }
  }

  // ── Service Orders (5) ────────────────────────────────────────────────────
  const soStatuses = ['in_progress', 'completed', 'completed', 'in_progress', 'completed'];
  const soIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const id = generateId();
    soIds.push(id);
    await t('service_orders')
      .insert({
        id,
        tenant_id: tenantId,
        estimate_id: estimateIds[i],
        customer_id: customerIds[i % customerIds.length],
        vehicle_id: vehicleIds[i % vehicleIds.length],
        order_number: `SO-2026-${String(i + 1).padStart(4, '0')}`,
        status: soStatuses[i],
        notes: `Demo service order ${i + 1} - Acme UAT seed`,
        started_at: new Date(Date.now() - (20 - i * 3) * 86400000),
        completed_at: soStatuses[i] === 'completed' ? new Date(Date.now() - (5 - i) * 86400000) : null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();
  }

  // ── Fiscal Periods (3) ────────────────────────────────────────────────────
  const periods = [
    { name: 'March 2026', start: '2026-03-01', end: '2026-03-31', status: 'closed' },
    { name: 'April 2026', start: '2026-04-01', end: '2026-04-30', status: 'closed' },
    { name: 'May 2026', start: '2026-05-01', end: '2026-05-31', status: 'open' },
  ];
  const periodIds: string[] = [];
  for (const p of periods) {
    const id = generateId();
    periodIds.push(id);
    await t('fiscal_periods')
      .insert({
        id,
        tenant_id: tenantId,
        name: p.name,
        start_date: p.start,
        end_date: p.end,
        status: p.status,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();
  }

  // ── Financial Transactions (30) ───────────────────────────────────────────
  const txTypes = ['income', 'expense'];
  const txCategories = [
    'PDR Revenue', 'Paint & Body Revenue', 'Insurance Payment',
    'Parts', 'Labor', 'Utilities', 'Rent', 'Insurance Premium',
  ];
  for (let i = 0; i < 30; i++) {
    const isIncome = i % 3 !== 2;
    const amount = (500 + i * 80).toFixed(2);
    const daysAgo = 60 - i * 2;
    await t('financial_transactions')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        transaction_type: isIncome ? 'income' : 'expense',
        category: txCategories[i % txCategories.length],
        amount,
        description: `Demo transaction ${i + 1}`,
        payment_method: isIncome ? 'check' : 'ach',
        transaction_date: new Date(Date.now() - daysAgo * 86400000),
        reference_number: `TXN-DEMO-${String(i + 1).padStart(4, '0')}`,
        created_by: estimatedById,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();
  }

  // ── Chart of Accounts check + seed ───────────────────────────────────────
  const coaCount = await t('chart_of_accounts').count('id as n').first();
  if (!coaCount || Number(coaCount.n) === 0) {
    console.log('  COA empty — seeding minimal chart of accounts for demo JEs…');
    const coaRows = [
      { account_number: '1010', name: 'Cash / Checking', account_type: 'asset', normal_balance: 'debit', is_active: true },
      { account_number: '1100', name: 'Accounts Receivable', account_type: 'asset', normal_balance: 'debit', is_active: true },
      { account_number: '4010', name: 'PDR Revenue', account_type: 'revenue', normal_balance: 'credit', is_active: true },
      { account_number: '4020', name: 'Paint & Body Revenue', account_type: 'revenue', normal_balance: 'credit', is_active: true },
      { account_number: '4030', name: 'Insurance Revenue', account_type: 'revenue', normal_balance: 'credit', is_active: true },
      { account_number: '5010', name: 'Parts Expense', account_type: 'expense', normal_balance: 'debit', is_active: true },
      { account_number: '5100', name: 'Payroll Expense', account_type: 'expense', normal_balance: 'debit', is_active: true },
      { account_number: '5200', name: 'Contractor Expense', account_type: 'expense', normal_balance: 'debit', is_active: true },
      { account_number: '5800', name: 'Depreciation Expense', account_type: 'expense', normal_balance: 'debit', is_active: true },
      { account_number: '1590', name: 'Accumulated Depreciation', account_type: 'asset', normal_balance: 'credit', is_active: true },
      { account_number: '1510', name: 'Equipment', account_type: 'asset', normal_balance: 'debit', is_active: true },
      { account_number: '3010', name: "Owner's Equity", account_type: 'equity', normal_balance: 'credit', is_active: true },
      { account_number: '3100', name: 'Retained Earnings', account_type: 'equity', normal_balance: 'credit', is_active: true },
    ];
    for (const row of coaRows) {
      await t('chart_of_accounts')
        .insert({ id: generateId(), tenant_id: tenantId, ...row, created_at: new Date(), updated_at: new Date() })
        .onConflict(['tenant_id', 'account_number'])
        .ignore();
    }
  }

  // ── Journal Entries (3 posted — required for P&L / BS / TB) ──────────────
  const [cashAccount] = await t('chart_of_accounts').where({ account_number: '1010' }).select('id');
  const [arAccount] = await t('chart_of_accounts').where({ account_number: '1100' }).select('id');
  const [revenueAccount] = await t('chart_of_accounts').where({ account_number: '4010' }).select('id');
  const [insuranceRevAccount] = await t('chart_of_accounts').where({ account_number: '4030' }).select('id');
  const [partsExpAccount] = await t('chart_of_accounts').where({ account_number: '5010' }).select('id');
  const [deprExpAccount] = await t('chart_of_accounts').where({ account_number: '5800' }).select('id');
  const [accumDeprAccount] = await t('chart_of_accounts').where({ account_number: '1590' }).select('id');

  if (cashAccount && revenueAccount) {
    const jeData = [
      {
        id: generateId(),
        date: '2026-03-31',
        ref: 'JE-DEMO-0001',
        memo: 'March 2026 PDR Revenue recognition',
        period: periodIds[0],
        lines: [
          { account_id: cashAccount.id, debit: '18500.00', credit: '0.00', desc: 'Cash received — March PDR' },
          { account_id: revenueAccount.id, debit: '0.00', credit: '18500.00', desc: 'PDR Revenue — March' },
        ],
      },
      {
        id: generateId(),
        date: '2026-04-30',
        ref: 'JE-DEMO-0002',
        memo: 'April 2026 Insurance claim settlement',
        period: periodIds[1],
        lines: [
          { account_id: cashAccount.id, debit: '22750.00', credit: '0.00', desc: 'Cash received — April insurance' },
          { account_id: insuranceRevAccount?.id ?? revenueAccount.id, debit: '0.00', credit: '22750.00', desc: 'Insurance Revenue — April' },
        ],
      },
      {
        id: generateId(),
        date: '2026-04-30',
        ref: 'JE-DEMO-0003',
        memo: 'April 2026 Depreciation — demo compressor',
        period: periodIds[1],
        lines: [
          { account_id: deprExpAccount?.id ?? partsExpAccount?.id ?? revenueAccount.id, debit: '125.00', credit: '0.00', desc: 'Depreciation Expense — April' },
          { account_id: accumDeprAccount?.id ?? cashAccount.id, debit: '0.00', credit: '125.00', desc: 'Accumulated Depreciation — April' },
        ],
      },
    ];

    for (const je of jeData) {
      await t('journal_entries')
        .insert({
          id: je.id,
          tenant_id: tenantId,
          entry_date: je.date,
          entry_number: je.ref,
          description: je.memo,
          status: 'posted',
          fiscal_period_id: je.period,
          created_by: estimatedById,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict('id')
        .ignore();

      for (const [idx, line] of je.lines.entries()) {
        await t('journal_entry_lines')
          .insert({
            id: generateId(),
            tenant_id: tenantId,
            journal_entry_id: je.id,
            account_id: line.account_id,
            debit: line.debit,
            credit: line.credit,
            description: line.desc,
            sort_order: idx + 1,
          })
          .onConflict('id')
          .ignore();
      }
    }
  }

  // ── Asset Category + Fixed Asset (FAM) ───────────────────────────────────
  // asset_categories requires 4 NOT NULL FK refs to chart_of_accounts — look them up first
  const [famEquipAcct] = await t('chart_of_accounts').where({ account_number: '1510' }).select('id');
  const [famDeprAcct]  = await t('chart_of_accounts').where({ account_number: '5800' }).select('id');
  const [famAccumAcct] = await t('chart_of_accounts').where({ account_number: '1590' }).select('id');

  if (famEquipAcct && famDeprAcct && famAccumAcct) {
    let assetCategoryId: string | null = null;
    const existingCat = await t('asset_categories').where({ category_name: 'Machinery & Equipment' }).first();
    if (existingCat) {
      assetCategoryId = existingCat.id;
    } else {
      assetCategoryId = generateId();
      await t('asset_categories')
        .insert({
          id: assetCategoryId,
          tenant_id: tenantId,
          category_name: 'Machinery & Equipment',
          default_depreciation_method: 'straight_line',
          default_useful_life_months: 84,
          default_salvage_pct: '10.00',
          asset_account_id: famEquipAcct.id,
          depreciation_account_id: famDeprAcct.id,
          expense_account_id: famDeprAcct.id,
          gain_loss_account_id: famAccumAcct.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict('id')
        .ignore();
    }

    if (assetCategoryId) {
      const assetId = generateId();
      await t('fixed_assets')
        .insert({
          id: assetId,
          tenant_id: tenantId,
          category_id: assetCategoryId,
          asset_tag: 'FAM-DEMO-001',
          asset_name: 'Demo PDR Compressor Unit',
          description: 'Dent repair air compressor - demo asset for UAT',
          serial_number: 'SN-DEMO-2026-001',
          acquisition_date: '2026-01-01',
          acquisition_cost: '3000.00',
          salvage_value: '300.00',
          useful_life_months: 84,
          depreciation_method: 'straight_line',
          depreciation_start_date: '2026-01-01',
          accumulated_depreciation: '0.00',
          net_book_value: '3000.00',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict('id')
        .ignore();

      // Monthly straight-line depreciation schedules for Jan-Apr 2026 (periods 1-4)
      const monthlyDepr = ((3000 - 300) / 7 / 12).toFixed(2);
      const schedPeriods = [
        { num: 1, start: '2026-01-01', end: '2026-01-31' },
        { num: 2, start: '2026-02-01', end: '2026-02-28' },
        { num: 3, start: '2026-03-01', end: '2026-03-31' },
        { num: 4, start: '2026-04-01', end: '2026-04-30' },
      ];
      for (const p of schedPeriods) {
        await t('depreciation_schedules')
          .insert({
            id: generateId(),
            tenant_id: tenantId,
            fixed_asset_id: assetId,
            period_number: p.num,
            period_start: p.start,
            period_end: p.end,
            depreciation_amount: monthlyDepr,
            accumulated_amount: (parseFloat(monthlyDepr) * p.num).toFixed(2),
            remaining_value: (3000 - parseFloat(monthlyDepr) * p.num).toFixed(2),
            status: p.num < 4 ? 'posted' : 'scheduled',
            created_at: new Date(),
          })
          .onConflict(['fixed_asset_id', 'period_number'])
          .ignore();
      }
    }
  } else {
    console.log('  FAM skipped: required GL accounts (1510/5800/1590) not found in COA');
  }

  console.log('✓ Acme demo data seeded:');
  console.log('  • 2 insurance companies');
  console.log('  • 15 customers');
  console.log('  • 18 vehicles');
  console.log('  • 12 estimates + 24 estimate lines');
  console.log('  • 5 service orders');
  console.log('  • 3 fiscal periods');
  console.log('  • 30 financial transactions');
  console.log('  • COA (13 accounts if not present)');
  console.log('  • 3 posted journal entries');
  console.log('  • 1 asset category + 1 fixed asset + 4 depreciation schedules');
}
