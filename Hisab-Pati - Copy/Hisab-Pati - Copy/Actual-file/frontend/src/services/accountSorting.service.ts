import { Account } from '../core/types';

/**
 * Sort accounts alphabetically by name (A → Z)
 */
export const sortAccountsAlphabetically = (accounts: Account[]): Account[] => {
    return [...accounts].sort((a, b) => {
        if (!a.name && !b.name) return 0;
        if (!a.name) return 1;
        if (!b.name) return -1;

        return a.name.localeCompare(b.name, undefined, {
            numeric: false,
            sensitivity: 'base'
        });
    });
};

export const getSortedGLAccounts = (accounts: Account[]): Account[] => {
    const glAccounts = accounts.filter(a => a.level === 3);
    return sortAccountsAlphabetically(glAccounts);
};

export const getSortedAccountsByType = (
    accounts: Account[],
    type: string
): Account[] => {
    const filtered = accounts.filter(a => a.type === type);
    return sortAccountsAlphabetically(filtered);
};
