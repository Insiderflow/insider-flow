/*
 * Manual OpenInsider import (batch 2) from screenshot rows.
 * Usage: node scripts/import_openinsider_manual_2.js
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
		// Filing Date, Trade Date, Ticker, Company, Insider, Title, Type, Price, Qty, Owned, ΔOwn, Value
		['2025-10-29T13:56:25', '2025-10-28', 'VICR', 'Vicor Corp', 'Lavie Zmira', 'Dir', 'M - OptEx', '$48.42', '+3,720', '0', '-100%', '+$180,125'],
		['2025-10-29T13:56:25', '2025-10-28', 'VICR', 'Vicor Corp', 'Lavie Zmira', 'Dir', 'S - Sale+OE', '$89.58', '-3,720', '0', '-100%', '-$333,238'],
		['2025-10-29T13:55:51', '2025-10-28', 'PEBK', 'Peoples Bancorp of North Carolina Inc', 'Abernethy James S', 'Dir', 'S - Sale', '$30.95', '-600', '215,148', '0%', '-$18,572'],
		['2025-10-29T13:55:30', '2025-10-23', 'HYMC', 'Hycroft Mining Holding Corp', 'Thomas David Brian', 'SVP, GM', 'S - Sale', '$7.39', '-20,000', '96,070', '-17%', '-$147,800'],
		['2025-10-29T13:21:13', '2025-10-28', 'CHMG', 'Chemung Financial Corp', 'Streeter Jeffrey B', 'Dir', 'P - Purchase', '$51.64', '+1,316', '30,542', '+5%', '+$67,952'],
		['2025-10-29T13:13:52', '2025-10-27', 'BEAM', 'Beam Therapeutics Inc.', 'Fmr LLC', 'See Remark 1, 10%', 'S - Sale', '$26.68', '-459', '1,980,688', '0%', '-$12,246'],
		['2025-10-29T12:33:33', '2025-10-27', 'IVYIX', 'Institutional Investment Strategy Fund', 'Ghodoosi Arash', 'Pres, Principal Exec', 'P - Purchase', '$12.14', '+0', '1,995', '0%', '+$3'],
		['2025-10-29T12:28:57', '2025-10-28', 'VICR', 'Vicor Corp', 'Gusinov Alex', 'Corp. VP Eng.', 'S - Sale', '$89.75', '-4,019', '12,680', '-24%', '-$360,706'],
		['2025-10-29T12:13:23', '2025-10-25', 'FFIN', 'First Financial Bankshares Inc', 'Hickox Michelle S', 'EVP, CFO', 'P - Purchase', '$31.15', '+2,000', '24,461', '+9%', '+$62,300'],
		['2025-10-29T12:01:14', '2025-10-25', 'NBBK', 'Nb Bancorp, Inc.', 'Pascucci Hope', 'Dir', 'P - Purchase', '$18.07', '+4,688', '200,000', '+2%', '+$84,702'],
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
