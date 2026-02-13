import { InventorySubLedger, InventoryMovement, Account, AccountLevel, AccountType, Transaction, JournalEntry } from '../types';

/**
 * ============================================================================
 * INVENTORY ENGINE - DOUBLE-ENTRY ACCOUNTING COMPLIANCE
 * ============================================================================
 */

export const getInventoryGLAccounts = (accounts: Account[]): Account[] => {
    const inventoryGLs = accounts.filter(a => a.isInventoryGL && a.level === AccountLevel.GL);
    return inventoryGLs.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, {
            numeric: false,
            sensitivity: 'base'
        });
    });
};

export const getReceivableGLAccounts = (accounts: Account[]): Account[] => {
    const receivableGroup = accounts.find(a => a.level === AccountLevel.GROUP && a.code === '20000');
    if (!receivableGroup) return [];
    const receivableAccounts = accounts.filter(a => a.level === AccountLevel.GL && a.parentAccountId === receivableGroup.id);
    return receivableAccounts.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: false, sensitivity: 'base' });
    });
};

export const getPayableGLAccounts = (accounts: Account[]): Account[] => {
    const payableGroup = accounts.find(a => a.level === AccountLevel.GROUP && a.code === '70000');
    if (!payableGroup) return [];
    const payableAccounts = accounts.filter(a => a.level === AccountLevel.GL && a.parentAccountId === payableGroup.id);
    return payableAccounts.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: false, sensitivity: 'base' });
    });
};

export const getCostOfSalesAccount = (accounts: Account[]): Account | undefined => {
    return accounts.find(a => a.level === AccountLevel.GROUP && a.code === '180000');
};

export const getSubLedgersForGL = (
    subLedgers: InventorySubLedger[],
    glAccountId: string
): InventorySubLedger[] => {
    return subLedgers.filter(sl => sl.inventoryGLAccountId === glAccountId);
};

export const calculateSubLedgerBalance = (
    subLedger: InventorySubLedger,
    movements: InventoryMovement[],
    startDate: string,
    endDate: string
): {
    quantity: number;
    value: number;
    openingQuantity: number;
    openingValue: number;
    debitQuantity: number;
    debitAmount: number;
    creditQuantity: number;
    creditAmount: number;
} => {
    const priorMovements = movements.filter(m => m.subLedgerId === subLedger.id && m.date < startDate);
    const periodMovements = movements.filter(
        m => m.subLedgerId === subLedger.id && m.date >= startDate && m.date <= endDate
    );

    let openingQuantity = subLedger.quantity || 0;
    let openingValue = (subLedger.quantity || 0) * (subLedger.rate || 0);

    priorMovements.forEach(m => {
        if (m.movementType === 'IN') {
            openingQuantity += m.quantity || 0;
            openingValue += m.amount || 0;
        } else {
            openingQuantity -= m.quantity || 0;
            openingValue -= (m.cosAmount || m.amount || 0);
        }
    });

    openingQuantity = Math.max(0, openingQuantity);
    openingValue = Math.max(0, openingValue);

    let debitQuantity = 0;
    let debitAmount = 0;
    let creditQuantity = 0;
    let creditAmount = 0;

    periodMovements.forEach(m => {
        if (m.movementType === 'IN') {
            debitQuantity += m.quantity || 0;
            debitAmount += m.amount || 0;
        } else {
            creditQuantity += m.quantity || 0;
            creditAmount += (m.cosAmount || m.amount || 0);
        }
    });

    const closingQuantity = openingQuantity + debitQuantity - creditQuantity;
    const closingValue = openingValue + debitAmount - creditAmount;

    return {
        quantity: Math.max(0, closingQuantity || 0),
        value: Math.max(0, closingValue || 0),
        openingQuantity: Math.max(0, openingQuantity || 0),
        openingValue: Math.max(0, openingValue || 0),
        debitQuantity: Math.max(0, debitQuantity || 0),
        debitAmount: Math.max(0, debitAmount || 0),
        creditQuantity: Math.max(0, creditQuantity || 0),
        creditAmount: Math.max(0, creditAmount || 0)
    };
};

export const generateSubLedgerId = (userId: string): string => {
    return `sl_${Date.now()}_${userId}`;
};

export const generateMovementId = (): string => {
    return `im_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateSubLedger = (
    itemName: string,
    glAccountId: string,
    quantity: number,
    rate: number
): { isValid: boolean; error?: string } => {
    if (!itemName || itemName.trim() === '') {
        return { isValid: false, error: 'Item name is required' };
    }
    if (!glAccountId) {
        return { isValid: false, error: 'Please select an inventory GL account' };
    }
    if (quantity < 0) {
        return { isValid: false, error: 'Quantity cannot be negative' };
    }
    if (rate < 0) {
        return { isValid: false, error: 'Rate cannot be negative' };
    }
    return { isValid: true };
};

export const createSalesVoucher = (
    userId: string,
    voucherId: string,
    date: string,
    description: string,
    receivableAccountId: string,
    items: Array<{
        inventoryGLAccountId: string;
        subLedgerId: string;
        quantity: number;
        rate: number;
    }>,
    subLedgers: InventorySubLedger[],
    movements: InventoryMovement[],
    accounts: Account[],
    revenueAccountId?: string
): {
    transaction: Transaction;
    movements: InventoryMovement[];
} => {
    const salesAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    let totalCOGS = 0;

    const entries: JournalEntry[] = [];

    entries.push({
        accountId: receivableAccountId,
        debit: salesAmount,
        credit: 0
    });

    let salesBillAccountId = accounts.find(a => a.code === '160001' && a.level === AccountLevel.GL)?.id;
    if (!salesBillAccountId) salesBillAccountId = revenueAccountId || 'SALES_REVENUE_TEMP';

    entries.push({
        accountId: salesBillAccountId,
        debit: 0,
        credit: salesAmount
    });

    const costRateMap: Record<string, number> = {};

    items.forEach(item => {
        const subLedger = subLedgers.find(sl => sl.id === item.subLedgerId);
        if (!subLedger) return;

        const avgCost = calculateWeightedAverageCost(subLedger, movements, date);
        costRateMap[item.subLedgerId] = avgCost;
        const itemCOGS = item.quantity * avgCost;
        totalCOGS += itemCOGS;

        const inventoryGLId = item.inventoryGLAccountId;
        const cogsGL = mapInventoryGLToCOGSGL(inventoryGLId, accounts);

        if (cogsGL && itemCOGS > 0) {
            entries.push({
                accountId: cogsGL.id,
                debit: itemCOGS,
                credit: 0
            });

            entries.push({
                accountId: inventoryGLId,
                debit: 0,
                credit: itemCOGS
            });
        }
    });

    const transaction: Transaction = {
        id: crypto.randomUUID(),
        userId,
        voucherNo: voucherId,
        date,
        description: description || 'Sales Voucher',
        entries,
        voucherType: 'SALES',
        reference: `COGS: ${totalCOGS.toFixed(2)}`,
        itemLines: items.map(item => ({
            id: crypto.randomUUID(),
            subLedgerId: item.subLedgerId,
            inventoryGLAccountId: item.inventoryGLAccountId,
            itemName: subLedgers.find(sl => sl.id === item.subLedgerId)?.itemName || 'Unknown Item',
            quantity: item.quantity,
            rate: item.rate
        }))
    };

    const inventoryMovements = items.map(item => {
        const costRate = costRateMap[item.subLedgerId] || 0;
        const movement = {
            id: generateMovementId(),
            userId,
            subLedgerId: item.subLedgerId,
            voucherId: transaction.id,
            movementType: 'OUT' as const,
            quantity: item.quantity,
            rate: costRate,
            amount: item.quantity * costRate,
            date,
            reference: voucherId,
            cosAmount: item.quantity * costRate
        };
        return movement;
    });

    return { transaction, movements: inventoryMovements };
};

export const createPurchaseVoucher = (
    userId: string,
    voucherId: string,
    date: string,
    description: string,
    payableAccountId: string,
    items: Array<{
        inventoryGLAccountId: string;
        subLedgerId: string;
        quantity: number;
        rate: number;
    }>,
    accounts: Account[] = [],
    subLedgers: InventorySubLedger[] = []
): {
    transaction: Transaction;
    movements: InventoryMovement[];
} => {
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const entries: JournalEntry[] = [];

    items.forEach(item => {
        entries.push({
            accountId: item.inventoryGLAccountId,
            debit: item.quantity * item.rate,
            credit: 0
        });
    });

    entries.push({
        accountId: payableAccountId,
        debit: 0,
        credit: totalAmount
    });

    const transaction: Transaction = {
        id: crypto.randomUUID(),
        userId,
        voucherNo: voucherId,
        date,
        description: description || 'Purchase Voucher',
        entries,
        voucherType: 'PURCHASE',
        itemLines: items.map(item => ({
            id: crypto.randomUUID(),
            subLedgerId: item.subLedgerId,
            inventoryGLAccountId: item.inventoryGLAccountId,
            itemName: subLedgers.find(sl => sl.id === item.subLedgerId)?.itemName || 'Unknown Item',
            quantity: item.quantity,
            rate: item.rate
        }))
    };

    const movements = items.map(item => ({
        id: generateMovementId(),
        userId,
        subLedgerId: item.subLedgerId,
        voucherId: transaction.id,
        movementType: 'IN' as const,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
        date,
        reference: voucherId
    }));

    return { transaction, movements };
};

export const calculateWeightedAverageCost = (
    subLedger: InventorySubLedger,
    movements: InventoryMovement[],
    upToDate: string
): number => {
    const purchaseMovements = movements.filter(
        m => m.subLedgerId === subLedger.id && m.date <= upToDate && m.movementType === 'IN'
    );

    let totalQuantity = (subLedger.quantity || 0);
    let totalValue = ((subLedger.quantity || 0) * (subLedger.rate || 0));

    purchaseMovements.forEach(m => {
        totalQuantity += (m.quantity || 0);
        totalValue += (m.amount || 0);
    });

    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
};

export const mapInventoryGLToCOGSGL = (
    inventoryGLId: string,
    accounts: Account[]
): Account | undefined => {
    const inventoryGL = accounts.find(a => a.id === inventoryGLId);
    if (!inventoryGL) return undefined;
    const codeSuffix = inventoryGL.code.substring(inventoryGL.code.length - 2);
    const cogsCode = `1800${codeSuffix}`;
    return accounts.find(a => a.code === cogsCode && a.isCOGSGL === true);
};
