import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const COUNTRY_PHONE_CODES = [
  { country: 'Argentina', code: '+54', flag: 'ar' },
  { country: 'Bolivia', code: '+591', flag: 'bo' },
  { country: 'Brasil', code: '+55', flag: 'br' },
  { country: 'Chile', code: '+56', flag: 'cl' },
  { country: 'Colombia', code: '+57', flag: 'co' },
  { country: 'Costa Rica', code: '+506', flag: 'cr' },
  { country: 'Cuba', code: '+53', flag: 'cu' },
  { country: 'Ecuador', code: '+593', flag: 'ec' },
  { country: 'El Salvador', code: '+503', flag: 'sv' },
  { country: 'Guatemala', code: '+502', flag: 'gt' },
  { country: 'Honduras', code: '+504', flag: 'hn' },
  { country: 'México', code: '+52', flag: 'mx' },
  { country: 'Nicaragua', code: '+505', flag: 'ni' },
  { country: 'Panamá', code: '+507', flag: 'pa' },
  { country: 'Paraguay', code: '+595', flag: 'py' },
  { country: 'Perú', code: '+51', flag: 'pe' },
  { country: 'República Dominicana', code: '+1', flag: 'do' },
  { country: 'Uruguay', code: '+598', flag: 'uy' },
  { country: 'Venezuela', code: '+58', flag: 've' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  success?: boolean;
  defaultCountry?: string;
}

/**
 * Parses a stored phone value like "+5491112345678" into { countryCode, localNumber }.
 */
function parsePhoneValue(value: string) {
  if (!value) return { countryCode: '', localNumber: '' };
  // Try to match the longest country code first
  const sorted = [...COUNTRY_PHONE_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const entry of sorted) {
    if (value.startsWith(entry.code)) {
      return { countryCode: entry.code, localNumber: value.slice(entry.code.length) };
    }
  }
  // Fallback: if starts with +, try to split
  if (value.startsWith('+')) {
    return { countryCode: '', localNumber: value };
  }
  return { countryCode: '', localNumber: value };
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = '9 11 1234-5678',
  className,
  error,
  success,
  defaultCountry,
}) => {
  const parsed = parsePhoneValue(value);
  
  const [selectedCode, setSelectedCode] = useState(() => {
    if (parsed.countryCode) return parsed.countryCode;
    if (defaultCountry) {
      const match = COUNTRY_PHONE_CODES.find(c => c.country === defaultCountry);
      if (match) return match.code;
    }
    return '+54';
  });
  const [localNumber, setLocalNumber] = useState(parsed.localNumber);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync when defaultCountry changes and no value set
  useEffect(() => {
    if (defaultCountry && !value) {
      const match = COUNTRY_PHONE_CODES.find(c => c.country === defaultCountry);
      if (match) setSelectedCode(match.code);
    }
  }, [defaultCountry, value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedEntry = COUNTRY_PHONE_CODES.find(c => c.code === selectedCode);
  const flagCode = selectedEntry?.flag || 'ar';

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9\s\-]/g, '');
    setLocalNumber(val);
    const cleaned = val.replace(/[\s\-]/g, '');
    onChange(selectedCode + cleaned);
  };

  const handleSelectCountry = (code: string) => {
    setSelectedCode(code);
    setDropdownOpen(false);
    const cleaned = localNumber.replace(/[\s\-]/g, '');
    onChange(code + cleaned);
  };

  return (
    <div className={cn('relative flex items-stretch', className)}>
      {/* Flag selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            'flex items-center gap-1.5 h-10 px-3 rounded-l-md border border-r-0 bg-secondary text-sm transition-colors',
            error ? 'border-destructive' : success ? 'border-primary' : 'border-input',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        >
          <img
            src={`https://flagcdn.com/w40/${flagCode}.png`}
            srcSet={`https://flagcdn.com/w80/${flagCode}.png 2x`}
            width={20}
            height={15}
            alt={selectedEntry?.country || ''}
            className="rounded-sm object-cover"
            style={{ width: 20, height: 15 }}
          />
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-64 max-h-60 overflow-y-auto bg-popover border border-border rounded-md shadow-lg">
            {COUNTRY_PHONE_CODES.map((entry) => (
              <button
                key={entry.flag}
                type="button"
                onClick={() => handleSelectCountry(entry.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left',
                  entry.code === selectedCode && 'bg-accent'
                )}
              >
                <img
                  src={`https://flagcdn.com/w40/${entry.flag}.png`}
                  srcSet={`https://flagcdn.com/w80/${entry.flag}.png 2x`}
                  width={20}
                  height={15}
                  alt={entry.country}
                  className="rounded-sm object-cover shrink-0"
                  style={{ width: 20, height: 15 }}
                />
                <span className="text-foreground">{entry.country}</span>
                <span className="text-muted-foreground ml-auto">{entry.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone number input */}
      <Input
        value={localNumber}
        onChange={handleLocalChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          'rounded-l-none bg-secondary',
          error ? 'border-destructive' : success ? 'border-primary' : 'border-input'
        )}
      />
    </div>
  );
};

export default PhoneInput;
