import { Link } from 'react-router-dom';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, to }) {
  const colors = {
    blue: 'bg-blue-950/40 text-blue-400',
    green: 'bg-green-950/40 text-green-400',
    purple: 'bg-purple-950/40 text-purple-400',
    orange: 'bg-orange-950/40 text-orange-400',
    red: 'bg-red-950/40 text-red-400',
    cyan: 'bg-cyan-950/40 text-cyan-400',
  };

  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-neutral-600 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );

  const className = `bg-neutral-900 rounded-xl border border-neutral-800 p-5 block ${to ? 'hover:border-neutral-600 hover:shadow-sm transition-all cursor-pointer' : ''}`;

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
