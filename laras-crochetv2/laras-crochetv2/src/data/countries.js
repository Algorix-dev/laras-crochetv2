// TIP: flag emoji instead of custom SVGs (like CurrencySelector uses
// for just 3 currencies) — with ~30 countries here, hand-drawing SVG
// flags for each would be a lot of code for little visual gain, and
// every modern browser renders flag emoji natively.
export const countries = [
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'CD', name: 'DR Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
];

export const defaultCountry = countries[0]; // Nigeria — matches her design's default selection
