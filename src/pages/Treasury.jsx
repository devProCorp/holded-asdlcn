import { useTreasury } from '../hooks/useHolded';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency } from '../utils/format';
import { Building2, CreditCard, Landmark, Wallet } from 'lucide-react';

const typeIcons = {
  bank: Landmark,
  cash: Wallet,
  card: CreditCard,
};

const typeLabels = {
  bank: 'Banco',
  cash: 'Caja',
  card: 'Tarjeta',
};

export default function Treasury() {
  const { data, isLoading, error } = useTreasury();

  if (isLoading) return <LoadingSpinner text="Cargando tesoreria..." />;
  if (error) return <ErrorMessage error={error} />;

  const accounts = data || [];
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const positiveBalance = accounts.filter(a => Number(a.balance) > 0).reduce((sum, a) => sum + Number(a.balance), 0);
  const negativeBalance = accounts.filter(a => Number(a.balance) < 0).reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Tesoreria</h2>
        <div className="text-right space-y-1">
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalBalance)}
          </p>
          <div className="flex gap-4 text-xs">
            <span className="text-green-400">Disponible: {formatCurrency(positiveBalance)}</span>
            <span className="text-red-400">Deuda: {formatCurrency(negativeBalance)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const Icon = typeIcons[account.type] || Building2;
          const balance = Number(account.balance) || 0;
          return (
            <div key={account.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-neutral-800' : 'bg-red-950/30'}`}>
                  <Icon size={20} className={balance >= 0 ? 'text-neutral-400' : 'text-red-400'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" title={account.name}>{account.name}</p>
                  <p className="text-xs text-neutral-500">{typeLabels[account.type] || account.type} - {account.treasuryName || ''}</p>
                </div>
              </div>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(balance)}
              </p>
              <div className="mt-2 space-y-1">
                {account.iban && (
                  <p className="text-xs text-neutral-600 font-mono">{account.iban}</p>
                )}
                {account.accountNumber && (
                  <p className="text-xs text-neutral-600">Cuenta: {account.accountNumber}</p>
                )}
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <p className="text-neutral-500 col-span-full text-center py-10">No hay cuentas de tesoreria</p>
        )}
      </div>
    </div>
  );
}
