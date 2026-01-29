import { useState } from 'react';

const LOCALSTORAGE_KEY = 'mapbox-access-token';

export function getStoredMapboxToken(): string {
  try {
    return localStorage.getItem(LOCALSTORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function storeMapboxToken(token: string) {
  try {
    if (token) {
      localStorage.setItem(LOCALSTORAGE_KEY, token);
    } else {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

interface MapboxTokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
}

export function MapboxTokenInput({ token, onTokenChange }: MapboxTokenInputProps) {
  const [showInfo, setShowInfo] = useState(false);

  const handleChange = (value: string) => {
    const trimmed = value.trim();
    onTokenChange(trimmed);
    storeMapboxToken(trimmed);
  };

  const isValid = token.startsWith('pk.');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="mapbox-token" className="text-sm font-medium text-slate-300">
          Mapbox Access Token
        </label>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="How to get a Mapbox token"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div className="bg-blue-900/30 border border-blue-800 text-blue-400 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium">How to get a free Mapbox token:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Go to{' '}
              <a
                href="https://account.mapbox.com/auth/signup/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-300"
              >
                mapbox.com
              </a>{' '}
              and create a free account
            </li>
            <li>Copy your default public token from the account page</li>
            <li>Paste it here — it starts with <code className="bg-blue-900/50 px-1 rounded">pk.</code></li>
          </ol>
          <p className="text-blue-500 mt-1">Free tier: 200K tile requests/month</p>
        </div>
      )}

      <div className="relative">
        <input
          id="mapbox-token"
          type="text"
          value={token}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="pk.eyJ1Ijoi..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          spellCheck={false}
          autoComplete="off"
        />
        {token && (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
              isValid ? 'text-green-400' : 'text-amber-400'
            }`}
          >
            {isValid ? 'Valid format' : 'Check token'}
          </span>
        )}
      </div>
    </div>
  );
}
