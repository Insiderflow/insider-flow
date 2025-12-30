/*
 * Manual OpenInsider import (batch 5) from latest screenshots (CCK, CHMG, RCUS).
 * Usage: node scripts/import_openinsider_manual_5.js
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
		// CCK grants
		['2025-10-30T09:21:15', '2025-10-29', 'CCK', 'Crown Holdings, Inc.', 'Owens B Craig', 'Dir', 'A - Grant', '$98.76', '+406', '12,822', '+3%', '+$40,095'],
		['2025-10-30T09:10:57', '2025-10-29', 'CCK', 'Crown Holdings, Inc.', 'Hagge Stephen J', 'Dir', 'A - Grant', '$98.76', '+406', '10,513', '+4%', '+$40,095'],
		['2025-10-30T09:01:18', '2025-10-29', 'CCK', 'Crown Holdings, Inc.', 'Funk Andrea J.', 'Dir', 'A - Grant', '$98.76', '+406', '16,739', '+2%', '+$40,095'],
		['2025-10-30T08:51:18', '2025-10-29', 'CCK', 'Crown Holdings, Inc.', 'Fearon Richard H', 'Dir', 'A - Grant', '$98.76', '+406', '11,706', '+4%', '+$40,095'],
		// CHMG additional purchase
		['2025-10-30T09:06:39', '2025-10-29', 'CHMG', 'Chemung Financial Corp', 'Streeter Jeffrey B', 'Dir', 'P - Purchase', '$51.92', '+2,184', '32,726', '+7%', '+$113,400'],
		// RCUS large sale
		['2025-10-30T08:49:09', '2025-10-28', 'RCUS', 'Arcus Biosciences, Inc.', 'Jaen Juan C.', 'Pres', 'S - Sale', '$20.76', '-96,859', '1,458,594', '-6%', '-$2,010,578'],
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

main().catch((e)=>{console.error('Import failed:',e);process.exit(1);}).finally(async()=>{await prisma.$disconnect();});
















