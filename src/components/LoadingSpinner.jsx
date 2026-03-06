import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-neutral-400" />
      <p className="text-sm text-neutral-500 mt-3">{text}</p>
    </div>
  );
}
