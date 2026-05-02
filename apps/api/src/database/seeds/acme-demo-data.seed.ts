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

  // ── Guard: skip if demo data already present ──────────────────────────────
  const existingCustomers = await t('customers').count('id as n').first();
  if (existingCustomers && Number(existingCustomers.n) > 0) {
    console.log('Demo data already present — skipping seedAcmeDemoData.');
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
  const estimateStatuses = ['draft', 'sent', 'approved', 'approved', 'approved', 'declined',
    'approved', 'sent', 'approved', 'approved', 'declined', 'approved'];

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
        total_amount: (baseAmt * 1.08275).toFixed(2),
        notes: `Demo estimate ${i + 1} — Acme UAT seed`,
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
          description: j === 0 ? 'PDR Labor' : 'Parts & Materials',
          quantity: 1,
          unit_price: (j === 0 ? baseAmt * 0.6 : baseAmt * 0.4).toFixed(2),
          total_price: (j === 0 ? baseAmt * 0.6 : baseAmt * 0.4).toFixed(2),
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
        description: `Demo service order ${i + 1} — Acme UAT seed`,
        start_date: new Date(Date.now() - (20 - i * 3) * 86400000),
        completed_date: soStatuses[i] === 'completed' ? new Date(Date.now() - (5 - i) * 86400000) : null,
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
        type: isIncome ? 'income' : 'expense',
        category: txCategories[i % txCategories.length],
        amount,
        description: `Demo transaction ${i + 1}`,
        transaction_date: new Date(Date.now() - daysAgo * 86400000),
        reference_number: `TXN-DEMO-${String(i + 1).padStart(4, '0')}`,
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
      { code: '1010', name: 'Cash / Checking', type: 'asset', normal_balance: 'debit', is_active: true },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', normal_balance: 'debit', is_active: true },
      { code: '4010', name: 'PDR Revenue', type: 'revenue', normal_balance: 'credit', is_active: true },
      { code: '4020', name: 'Paint & Body Revenue', type: 'revenue', normal_balance: 'credit', is_active: true },
      { code: '4030', name: 'Insurance Revenue', type: 'revenue', normal_balance: 'credit', is_active: true },
      { code: '5010', name: 'Parts Expense', type: 'expense', normal_balance: 'debit', is_active: true },
      { code: '5100', name: 'Payroll Expense', type: 'expense', normal_balance: 'debit', is_active: true },
      { code: '5200', name: 'Contractor Expense', type: 'expense', normal_balance: 'debit', is_active: true },
      { code: '5800', name: 'Depreciation Expense', type: 'expense', normal_balance: 'debit', is_active: true },
      { code: '1590', name: 'Accumulated Depreciation', type: 'asset', normal_balance: 'credit', is_active: true },
      { code: '1510', name: 'Equipment', type: 'asset', normal_balance: 'debit', is_active: true },
      { code: '3010', name: "Owner's Equity", type: 'equity', normal_balance: 'credit', is_active: true },
      { code: '3100', name: 'Retained Earnings', type: 'equity', normal_balance: 'credit', is_active: true },
    ];
    for (const row of coaRows) {
      await t('chart_of_accounts')
        .insert({ id: generateId(), tenant_id: tenantId, ...row, created_at: new Date(), updated_at: new Date() })
        .onConflict('code')
        .ignore();
    }
  }

  // ── Journal Entries (3 posted — required for P&L / BS / TB) ──────────────
  const [cashAccount] = await t('chart_of_accounts').where({ code: '1010' }).select('id');
  const [arAccount] = await t('chart_of_accounts').where({ code: '1100' }).select('id');
  const [revenueAccount] = await t('chart_of_accounts').where({ code: '4010' }).select('id');
  const [insuranceRevAccount] = await t('chart_of_accounts').where({ code: '4030' }).select('id');
  const [partsExpAccount] = await t('chart_of_accounts').where({ code: '5010' }).select('id');
  const [deprExpAccount] = await t('chart_of_accounts').where({ code: '5800' }).select('id');
  const [accumDeprAccount] = await t('chart_of_accounts').where({ code: '1590' }).select('id');

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
          reference_number: je.ref,
          memo: je.memo,
          status: 'posted',
          fiscal_period_id: je.period,
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
            debit_amount: line.debit,
            credit_amount: line.credit,
            description: line.desc,
            line_number: idx + 1,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .onConflict('id')
          .ignore();
      }
    }
  }

  // ── Asset Category + Fixed Asset (FAM) ───────────────────────────────────
  let assetCategoryId: string | null = null;
  const existingCat = await t('asset_categories').where({ name: 'Machinery & Equipment' }).first();
  if (existingCat) {
    assetCategoryId = existingCat.id;
  } else {
    assetCategoryId = generateId();
    await t('asset_categories')
      .insert({
        id: assetCategoryId,
        tenant_id: tenantId,
        name: 'Machinery & Equipment',
        depreciation_method: 'straight_line',
        useful_life_years: 7,
        salvage_value_percent: '10.00',
        gl_asset_account_code: '1510',
        gl_depreciation_account_code: '5800',
        gl_accumulated_account_code: '1590',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('id')
      .ignore();
  }

  const assetId = generateId();
  await t('fixed_assets')
    .insert({
      id: assetId,
      tenant_id: tenantId,
      asset_category_id: assetCategoryId,
      asset_tag: 'FAM-DEMO-001',
      name: 'Demo PDR Compressor Unit',
      description: 'Dent repair air compressor — demo asset for UAT',
      serial_number: 'SN-DEMO-2026-001',
      acquisition_date: '2026-01-01',
      acquisition_cost: '3000.00',
      salvage_value: '300.00',
      useful_life_years: 7,
      depreciation_method: 'straight_line',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflict('asset_tag')
    .ignore();

  // Monthly straight-line depreciation schedules for Jan–Apr 2026
  const monthlyDepr = ((3000 - 300) / 7 / 12).toFixed(2);
  const schedMonths = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01'];
  for (const [idx, periodDate] of schedMonths.entries()) {
    await t('depreciation_schedules')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        asset_id: assetId,
        period_date: periodDate,
        depreciation_amount: monthlyDepr,
        accumulated_depreciation: (parseFloat(monthlyDepr) * (idx + 1)).toFixed(2),
        book_value: (3000 - parseFloat(monthlyDepr) * (idx + 1)).toFixed(2),
        status: idx < 3 ? 'posted' : 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict(['asset_id', 'period_date'])
      .ignore();
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
