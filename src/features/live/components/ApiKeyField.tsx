'use client';

import { useState } from 'react';
import { getStoredApiKey, setStoredApiKey } from '../auth-storage';

interface ApiKeyFieldProps {
  required?: boolean;
  className?: string;
}

export function ApiKeyField({ required = false, className = '' }: ApiKeyFieldProps) {
  const [value, setValue] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredApiKey()
  );

  return (
    <div className={`auth-key-panel ${className}`}>
      <label>
        API key {required ? '— required' : '— optional'}
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            setStoredApiKey(next);
          }}
          placeholder="X-API-Key for capture / history"
          className="ink-input mt-1"
        />
      </label>
      <p className="mt-2 font-data text-[10px] leading-relaxed tracking-wide text-[var(--fog)]/60">
        Stored in this browser only. Protects start/stop and scopes history.
      </p>
    </div>
  );
}
