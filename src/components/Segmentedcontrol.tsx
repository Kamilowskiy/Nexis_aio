import type { ReactNode } from 'react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`inline-flex rounded-lg border border-white/10 bg-[#1a1b20] p-0.5 ${className}`}>
      {options.map((option, index) => {
        const isActive = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative px-3 py-1.5 text-xs font-medium transition-all duration-200
              flex items-center gap-1.5 pr-7 pl-7
              ${isFirst ? 'rounded-l-md' : ''}
              ${isLast ? 'rounded-r-md' : ''}
              ${!isFirst && !isLast ? '' : ''}
              ${isActive 
                ? 'bg-[#2d2f38] text-white shadow-xs shadow-white/10' 
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            {option.icon && (
              <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;