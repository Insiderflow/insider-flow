/*
 * Manual OpenInsider import for three rows from screenshot.
 * Usage:
 *   cd "insider-flow/web" && node scripts/import_openinsider_manual.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Parse helpers */
function parseUSD(str) {
	if (!str) return null;
	const cleaned = String(str).replace(/[$,\s+]/g, '').replace(/^\+/, '');
	const sign = String(str).trim().startsWith('-') ? -1 : 1;
	const n = Number(cleaned.replace('-', ''));
	return Number.isFinite(n) ? sign * n : null;
}

function parseQty(str) {
	if (!str) return null;
	return String(str).replace(/[,\s]/g, '');
}

function z(dateStr) {
	// Coerce to ISO with Z if not already
	if (!dateStr) return null;
	return new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
}

async function upsertCompany(ticker, name) {
	const existing = await prisma.openInsiderCompany.findUnique({ where: { ticker } });
	if (existing) return existing;
	return prisma.openInsiderCompany.create({ data: { ticker, name } });
}

async function upsertOwner(name, title, isInstitution = false) {
	const existing = await prisma.openInsiderOwner.findUnique({ where: { name } }).catch(() => null);
	if (existing) return existing;
	// Some schemas may not have isInstitution; fall back to name/title only
	try {
		return await prisma.openInsiderOwner.create({ data: { name, title, isInstitution } });
	} catch (_e) {
		return prisma.openInsiderOwner.create({ data: { name, title } });
	}
}

async function upsertTransaction(payload) {
	const { companyId, ownerId, transactionDate, transactionType, tradeDate } = payload;
	// De-dupe: same company, owner, transactionDate, type
	const existing = await prisma.openInsiderTransaction.findFirst({
		where: { companyId, ownerId, transactionDate, transactionType },
	});
	if (existing) return existing;
	return prisma.openInsiderTransaction.create({ data: payload });
}

async function main() {
	const rows = [
		{
			filingDate: '2025-10-29T10:57:32',
			tradeDate: '2025-10-28',
			ticker: 'TPL',
			companyName: 'Texas Pacific Land Corp',
			insiderName: 'Horizon Kinetics Asset Management LLC',
			title: '10%',
			tradeType: 'P - Purchase',
			price: '$925.20',
			qty: '+1',
			owned: '1,162,553',
			deltaOwn: '0%',
			value: '+$925',
			isInstitution: true,
		},
		{
			filingDate: '2025-10-29T10:55:06',
			tradeDate: '2025-10-28',
			ticker: 'APD',
			companyName: 'Air Products & Chemicals, Inc.',
			insiderName: 'Pellicciotti William J Jr',
			title: 'Principal Accounting Officer',
			tradeType: 'F - Tax',
			price: '$256.03',
			qty: '-303',
			owned: '3,284',
			deltaOwn: '-8%',
			value: '-$77,577',
			isInstitution: false,
		},
		{
			filingDate: '2025-10-29T10:52:49',
			tradeDate: '2025-10-28',
			ticker: 'RCG',
			companyName: 'Renn Fund, Inc.',
			insiderName: 'Stahl Murray',
			title: 'Pres, Co-Portfolio Manager, 10%',
			tradeType: 'P - Purchase',
			price: '$2.62',
			qty: '+1,134',
			owned: '953,056',
			deltaOwn: '0%',
			value: '+$2,971',
			isInstitution: false,
		},
	];

	let created = 0;
	for (const r of rows) {
		const company = await upsertCompany(r.ticker, r.companyName);
		const owner = await upsertOwner(r.insiderName, r.title, r.isInstitution);

		const payload = {
			transactionDate: z(r.filingDate),
			tradeDate: z(`${r.tradeDate}T00:00:00Z`),
			transactionType: r.tradeType,
			lastPrice: parseUSD(r.price),
			quantity: parseQty(r.qty),
			sharesHeld: parseQty(r.owned),
			owned: r.owned,
			value: r.value,
			valueNumeric: parseUSD(r.value),
			companyId: company.id,
			ownerId: owner.id,
		};

		await upsertTransaction(payload);
		created += 1;
		console.log(`✔ Inserted/ensured ${r.ticker} ${r.insiderName} ${r.tradeType}`);
	}

	console.log(`\n✅ Done. Processed ${created} manual OpenInsider transactions.`);
}

main()
	.catch((e) => {
		console.error('Import failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
