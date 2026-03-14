import { useEffect, useMemo, useRef, useState } from 'react';

function OptionButton({ option, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        background: selected ? 'rgba(232, 93, 26, 0.12)' : 'transparent',
        color: selected ? '#F8FAFC' : 'rgba(226,232,240,0.82)',
      }}
    >
      {option}
    </button>
  );
}

export default function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
  placeholder = 'Search...',
  error = '',
  multiple = false,
}) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedValue = multiple ? (Array.isArray(value) ? value : []) : value;

  useEffect(() => {
    const handleClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const base = Array.isArray(options) ? options : [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return base.slice(0, 80);
    return base
      .filter((option) => option.toLowerCase().includes(normalizedQuery))
      .slice(0, 80);
  }, [options, query]);

  const displayValue = multiple
    ? normalizedValue.length
      ? `${normalizedValue.length} selected`
      : ''
    : normalizedValue;

  const handleSelect = (option) => {
    if (multiple) {
      const next = normalizedValue.includes(option)
        ? normalizedValue.filter((item) => item !== option)
        : [...normalizedValue, option];
      onChange({ target: { name, value: next } });
      return;
    }
    onChange({ target: { name, value: option } });
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="absolute left-4 top-3 z-10 text-[10px] text-accent font-semibold uppercase tracking-wider pointer-events-none">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="glass-input pt-6 text-left flex items-center justify-between"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
      >
        <span className={displayValue ? 'text-white' : 'text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {multiple && normalizedValue.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedValue.slice(0, 6).map((item) => (
            <span
              key={item}
              className="px-2 py-1 rounded-full text-[10px] border"
              style={{ borderColor: 'rgba(232,93,26,0.3)', background: 'rgba(232,93,26,0.1)', color: '#F8FAFC' }}
            >
              {item}
            </span>
          ))}
          {normalizedValue.length > 6 && (
            <span className="px-2 py-1 rounded-full text-[10px] text-gray-400 border border-white/10">
              +{normalizedValue.length - 6} more
            </span>
          )}
        </div>
      )}
      {open && (
        <div
          className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/10 z-20"
          style={{
            background: 'rgba(6, 11, 22, 0.96)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.42)',
          }}
        >
          <div className="p-3 border-b border-white/5">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="glass-input"
              style={{ background: 'rgba(15, 23, 42, 0.8)' }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <OptionButton
                  key={option}
                  option={option}
                  onSelect={handleSelect}
                  selected={multiple ? normalizedValue.includes(option) : normalizedValue === option}
                />
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500">No matching options</div>
            )}
          </div>
        </div>
      )}
      {error && <div className="mt-1 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}
