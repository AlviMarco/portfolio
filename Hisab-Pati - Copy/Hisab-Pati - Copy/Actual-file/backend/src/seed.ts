import { prisma } from './config/prisma.js';
import { AccountType, VoucherType, MovementType, AccountLevel } from '@prisma/client';

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create Default User (if not exists)
    const user = await prisma.user.upsert({
        where: { id: 'dev-user-id' },
        update: {},
        create: {
            id: 'dev-user-id',
            email: 'dev@hisabpati.com',
            name: 'Dev User'
        }
    });

    // 2. Create Default Company
    const company = await prisma.company.upsert({
        where: { id: 'dev-company-id' },
        update: {},
        create: {
            id: 'dev-company-id',
            userId: user.id,
            name: 'Pati-Hisab Demo Store',
            financialYearStart: new Date('2025-01-01'),
            financialYearEnd: new Date('2025-12-31'),
        }
    });

    console.log(`🏢 Company created: ${company.name}`);

    // 3. Seed Chart of Accounts
    const accountsData = [
        { code: '1', name: 'Assets', type: AccountType.ASSET, level: AccountLevel.MAIN },
        { code: '101', name: 'Current Assets', type: AccountType.ASSET, level: AccountLevel.GROUP, parentCode: '1' },
        { code: '10101', name: 'Cash in Hand', type: AccountType.ASSET, level: AccountLevel.GL, parentCode: '101' },
        { code: '10102', name: 'Bank Account (HBL)', type: AccountType.ASSET, level: AccountLevel.GL, parentCode: '101' },
        { code: '102', name: 'Fixed Assets', type: AccountType.ASSET, level: AccountLevel.GROUP, parentCode: '1' },
        { code: '103', name: 'Inventory', type: AccountType.ASSET, level: AccountLevel.GROUP, parentCode: '1', isInventoryGL: true },

        { code: '2', name: 'Liabilities', type: AccountType.LIABILITY, level: AccountLevel.MAIN },
        { code: '201', name: 'Current Liabilities', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentCode: '2' },
        { code: '20101', name: 'Accounts Payable', type: AccountType.LIABILITY, level: AccountLevel.GL, parentCode: '201' },

        { code: '3', name: 'Equity', type: AccountType.EQUITY, level: AccountLevel.MAIN },
        { code: '301', name: 'Owner Capital', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentCode: '3' },

        { code: '4', name: 'Income', type: AccountType.INCOME, level: AccountLevel.MAIN },
        { code: '401', name: 'Sales Revenue', type: AccountType.INCOME, level: AccountLevel.GROUP, parentCode: '4' },

        { code: '5', name: 'Expenses', type: AccountType.EXPENSE, level: AccountLevel.MAIN },
        { code: '501', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentCode: '5', isCOGSGL: true },
        { code: '502', name: 'Operating Expenses', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentCode: '5' },
    ];

    const accountMap = new Map();

    for (const acc of accountsData) {
        const parentId = acc.parentCode ? accountMap.get(acc.parentCode) : null;
        const createdAcc = await prisma.account.upsert({
            where: { companyId_code: { companyId: company.id, code: acc.code } },
            update: {
                isInventoryGL: acc.isInventoryGL || false,
                isCOGSGL: acc.isCOGSGL || false
            },
            create: {
                companyId: company.id,
                name: acc.name,
                code: acc.code,
                type: acc.type,
                level: acc.level,
                parentAccountId: parentId,
                isInventoryGL: acc.isInventoryGL || false,
                isCOGSGL: acc.isCOGSGL || false,
                balance: 0
            }
        });
        accountMap.set(acc.code, createdAcc.id);
    }

    console.log('📊 Chart of accounts seeded.');

    // 4. Seed Inventory Items
    const inventoryItems = [
        { name: 'Engine Oil 10W-40', code: 'INV-001', qty: 25, rate: 1200 },
        { name: 'Brake Pads Set', code: 'INV-002', qty: 5, rate: 3500 },
        { name: 'Air Filter', code: 'INV-003', qty: 15, rate: 850 },
    ];

    const inventoryGLId = accountMap.get('103');

    for (const item of inventoryItems) {
        await prisma.inventoryItem.upsert({
            where: { companyId_itemCode: { companyId: company.id, itemCode: item.code } },
            update: { quantity: item.qty, rate: item.rate },
            create: {
                companyId: company.id,
                itemName: item.name,
                itemCode: item.code,
                quantity: item.qty,
                rate: item.rate,
                inventoryGLAccountId: inventoryGLId
            }
        });
    }

    console.log('📦 Inventory items seeded.');

    // 5. Create some sample transactions to affect balances
    // Let's create a Sales transaction
    const salesAccId = accountMap.get('401');
    const cashAccId = accountMap.get('10101');

    const sampleVoucher = 'SAL-001';
    await prisma.transaction.upsert({
        where: { companyId_voucherNo: { companyId: company.id, voucherNo: sampleVoucher } },
        update: {},
        create: {
            companyId: company.id,
            voucherNo: sampleVoucher,
            date: new Date(),
            description: 'Sample Cash Sale',
            voucherType: VoucherType.SALES,
            entries: {
                create: [
                    { accountId: cashAccId, debit: 5000, credit: 0 },
                    { accountId: salesAccId, debit: 0, credit: 5000 }
                ]
            }
        }
    });

    // Manually Update Balances (Simulating what a trigger or service would do)
    await prisma.account.update({ where: { id: cashAccId }, data: { balance: { increment: 5000 } } });
    await prisma.account.update({ where: { id: salesAccId }, data: { balance: { increment: 5000 } } });

    console.log('💸 Sample transactions seeded.');
    console.log('✅ Seeding complete!');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
