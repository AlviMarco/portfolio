import { BaseRepository } from './base.repository.js';
import { prisma } from '../config/prisma.js';
import type { Transaction } from '@prisma/client';

export class TransactionRepository extends BaseRepository<Transaction> {
    constructor() {
        super('transaction');
    }

    async findByCompany(companyId: string) {
        return this.model.findMany({
            where: { companyId },
            include: {
                entries: {
                    include: { account: true }
                },
                movements: {
                    include: { item: true }
                }
            },
            orderBy: { date: 'desc' }
        });
    }

    async createWithEntries(data: any) {
        return prisma.$transaction(async (tx) => {
            // Create properties
            const transaction = await tx.transaction.create({
                data: {
                    companyId: data.companyId,
                    voucherNo: data.voucherNo,
                    date: new Date(data.date),
                    description: data.description,
                    voucherType: data.voucherType,
                    reference: data.reference,
                    entries: {
                        create: data.entries.map((entry: any) => ({
                            accountId: entry.accountId,
                            debit: entry.debit || 0,
                            credit: entry.credit || 0
                        }))
                    }
                }
            });

            // Update account balances
            for (const entry of data.entries) {
                await tx.account.update({
                    where: { id: entry.accountId },
                    data: {
                        balance: {
                            increment: entry.debit - entry.credit
                        }
                    }
                });
            }

            // Handle inventory if present
            if (data.movements && data.movements.length > 0) {
                for (const move of data.movements) {
                    await tx.inventoryMovement.create({
                        data: {
                            companyId: data.companyId,
                            itemId: move.itemId,
                            transactionId: transaction.id,
                            movementType: move.movementType,
                            quantity: move.quantity,
                            rate: move.rate,
                            amount: move.amount,
                            cosAmount: move.cosAmount,
                            date: new Date(data.date)
                        }
                    });

                    // Update inventory item quantity and rate
                    await tx.inventoryItem.update({
                        where: { id: move.itemId },
                        data: {
                            quantity: {
                                increment: move.movementType === 'IN' ? move.quantity : -move.quantity
                            }
                            // Rate updates depend on valuation method (logic simplified here)
                        }
                    });
                }
            }

            return transaction;
        });
    }
}

export const transactionRepository = new TransactionRepository();
