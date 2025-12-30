/*
 * Manual OpenInsider import (batch 3) additional screenshot rows.
 * Usage: node scripts/import_openinsider_manual_3.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseUSD(str) {
	if (!str) return null;
	const s = String(str).trim();
	const neg = s.startsWith('-');
	const cleaned = s.replace(/[$,\s+\-]/g, '');
	const n = Number(cleaned);
	if (!Number.isFinite(n)) return null;
	return neg ? -n : n;
}

function parseQty(str) {
	if (!str) return null;
	return String(str).replace(/[,\s]/g, '');
}

function toDateZ(s) {
	if (!s) return null;
	return new Date(s.endsWith('Z') ? s : `${s}Z`);
}

async function upsertCompany(ticker, name) {
	const existing = await prisma.openInsiderCompany.findUnique({ where: { ticker } }).catch(() => null);
	if (existing) return existing;
	return prisma.openInsiderCompany.create({ data: { ticker, name } });
}

async function upsertOwner(name, title) {
	const existing = await prisma.openInsiderOwner.findUnique({ where: { name } }).catch(() => null);
	if (existing) return existing;
	try {
		return await prisma.openInsiderOwner.create({ data: { name, title, isInstitution: false } });
	} catch (_e) {
		return prisma.openInsiderOwner.create({ data: { name, title } });
	}
}

async function upsertTx(data) {
	const { companyId, ownerId, transactionDate, transactionType } = data;
	const existing = await prisma.openInsiderTransaction.findFirst({
		where: { companyId, ownerId, transactionDate, transactionType },
	});
	if (existing) return existing;
	return prisma.openInsiderTransaction.create({ data });
}

async function main() {
	const rows = [
		['2025-10-29T11:47:30', '2025-10-27', 'VICR', 'Vicor Corp', 'Crilly Sean', 'Corp. VP-Eng., Pwr Syst.', 'S - Sale', '$89.61', '-12,000', '15,532', '-44%', '-$1,075,336'],
		['2025-10-29T09:20:05', '2025-10-27', 'IRMD', 'Iradimed Corp', 'Susi Roger E.', 'CEO, Pres, COB, 10%', 'S - Sale', '$77.69', '-5,000', '4,552,950', '0%', '-$388,429'],
		['2025-10-29T08:54:18', '2025-10-28', 'RCUS', 'Arcus Biosciences, Inc.', 'Goeltz II Robert C.', 'CFO', 'S - Sale', '$20.00', '-5,000', '92,138', '-5%', '-$100,000'],
	];

	let done = 0;
	for (const r of rows) {
		const [filingDate, tradeDate, ticker, companyName, insiderName, title, tradeType, price, qty, owned, deltaOwn, value] = r;
		const company = await upsertCompany(ticker, companyName);
		const owner = await upsertOwner(insiderName, title);
		await upsertTx({
			transactionDate: toDateZ(filingDate),
			tradeDate: toDateZ(`${tradeDate}T00:00:00Z`),
			transactionType: tradeType,
			lastPrice: parseUSD(price),
			quantity: parseQty(qty),
			sharesHeld: parseQty(owned),
			owned,
			value,
			valueNumeric: parseUSD(value),
			companyId: company.id,
			ownerId: owner.id,
		});
		done += 1;
		console.log(`✔ Ensured ${ticker} ${insiderName} ${tradeType}`);
	}
	console.log(`\n✅ Done. Processed ${done} manual trades.`);
}

main()
	.catch((e) => { console.error('Import failed:', e); process.exit(1); })
	.finally(async () => { await prisma.$disconnect(); });
















