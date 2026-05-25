import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { listUsers } from '../../services/admin.service';

interface CcEmailsInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
  maxEmails?: number;
}

interface Suggestion {
  id: string;
  name: string;
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CcEmailsInput({ value, onChange, disabled, maxEmails = 10 }: CcEmailsInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const atLimit = value.length >= maxEmails;

  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await listUsers({ search: input, limit: 5, isActive: 'true' });
        const filtered = result.data
          .filter((u) => !value.includes(u.email.toLowerCase()))
          .map((u) => ({ id: u.id, name: u.name, email: u.email }));
        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, value]);

  function addEmail(email: string) {
    const normalized = email.toLowerCase().trim();
    if (!normalized || !EMAIL_REGEX.test(normalized)) return;
    if (value.includes(normalized)) return;
    if (value.length >= maxEmails) return;
    onChange([...value, normalized]);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
  }

  function removeEmail(email: string) {
    onChange(value.filter((e) => e !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        addEmail(suggestions[highlightedIndex].email);
        return;
      }
      if (input.trim()) {
        e.preventDefault();
        addEmail(input);
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeEmail(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function handleBlur() {
    // Delay to allow click on dropdown
    setTimeout(() => {
      if (input.trim() && EMAIL_REGEX.test(input.trim())) {
        addEmail(input);
      }
      setShowDropdown(false);
    }, 200);
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        {value.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="text-accent/60 hover:text-accent"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {!atLimit && !disabled && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => input.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
            placeholder={value.length === 0 ? 'Digite emails...' : ''}
            className="flex-1 min-w-[120px] bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
          />
        )}
      </div>

      <div className="flex justify-end mt-1">
        <span className="text-[11px] text-text-muted">{value.length}/{maxEmails}</span>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface-1 shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addEmail(s.email);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-surface-2 ${
                i === highlightedIndex ? 'bg-surface-2' : ''
              }`}
            >
              <span className="font-medium text-text-primary">{s.name}</span>
              <span className="ml-2 text-text-muted">{s.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
