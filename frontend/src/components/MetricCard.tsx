interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  subtitle?: string;
}

export function MetricCard({ label, value, unit, icon, highlight, subtitle }: Props) {
  return (
    <div className={`rounded-xl p-5 border transition-shadow hover:shadow-md ${
      highlight
        ? 'border-primary-200 bg-primary-50 ring-1 ring-primary-100'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 tabular-nums">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
