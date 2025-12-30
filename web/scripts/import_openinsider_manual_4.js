/*
 * Manual OpenInsider import (batch 4) from latest screenshots.
 * Usage: node scripts/import_openinsider_manual_4.js
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
		// Insider Trading (first image)
		['2025-10-30T06:21:47', '2025-10-28', 'WAB', 'Westinghouse Air Brake Technologies Corp', 'Deninno David L', 'EVP, GC, Sec.', 'M - OptEx', '$61.33', '+2,100', '60,450', '+4%', '+$128,793'],
		['2025-10-30T06:21:47', '2025-10-28', 'WAB', 'Westinghouse Air Brake Technologies', 'Deninno David L', 'EVP, GC, Sec.', 'S - Sale+OE', '$199.87', '-2,100', '60,450', '-3%', '-$419,731'],
		['2025-10-30T06:13:27', '2025-10-23', 'PETV', 'Petvivo Holdings, Inc.', 'Lowenthal Garry N', 'CFO', 'A - Grant', '$1.27', '+75,000', '667,967', '+13%', '+$95,250'],
		['2025-10-30T06:07:05', '2025-10-23', 'PETV', 'Petvivo Holdings, Inc.', 'Lai John', 'CEO', 'A - Grant', '$1.27', '+75,000', '2,095,710', '+4%', '+$95,250'],
		// Insider Sales $100k+ (second image)
		['2025-10-29T21:40:09', '2025-10-29', 'CRVW', 'Corewave, Inc.', 'Magnetar Financial LLC', '10%', 'S - Sale', '$138.48', '-464,169', '862,889', '-35%', '-$64,279,131'],
		['2025-10-29T21:39:31', '2025-10-29', 'CRVW', 'Corewave, Inc.', 'Magnetar Financial LLC', '10%', 'S - Sale', '$138.48', '-804,514', '6,279,363', '-11%', '-$111,412,046'],
		['2025-10-29T21:31:10', '2025-10-28', 'CRVW', 'Corewave, Inc.', 'Magnetar Financial LLC', '10%', 'S - Sale', '$138.61', '-378,293', '878,399', '-30%', '-$52,436,174'],
		['2025-10-29T21:30:40', '2025-10-28', 'CRVW', 'Corewave, Inc.', 'Magnetar Financial LLC', '10%', 'S - Sale', '$138.61', '-435,637', '1,238,279', '-26%', '-$60,384,774'],
		['2025-10-29T21:29:32', '2025-10-28', 'CRVW', 'Corewave, Inc.', 'Magnetar Financial LLC', '10%', 'S - Sale', '$138.61', '-639,675', '1,633,981', '-28%', '-$88,666,857'],
		['2025-10-29T21:28:50', '2025-10-27', 'CRVW', 'Corewave, Inc.', 'Magnetar Financial LLC', '10%', 'S - Sale', '$135.02', '-531,599', '896,147', '-37%', '-$71,776,505'],
		['2025-10-29T21:35:07', '2025-10-27', 'NTRA', 'Natera, Inc.', 'Chapman Steven Leonard', 'CEO, Pres', 'S - Sale', '$191.80', '-6,015', '149,840', '-4%', '-$1,153,656'],
		['2025-10-29T21:35:05', '2025-10-27', 'NTRA', 'Natera, Inc.', 'Brophy Michael Burkes', 'CFO', 'S - Sale', '$191.15', '-5,063', '64,126', '-7%', '-$967,778'],
		['2025-10-29T21:05:09', '2025-10-27', 'NTRA', 'Natera, Inc.', 'Rabinowitz Daniel', 'SEC., GC', 'S - Sale', '$191.87', '-1,993', '201,699', '-1%', '-$382,390'],
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
















