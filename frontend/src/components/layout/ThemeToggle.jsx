import { MoonStar, SunMedium } from 'lucide-react';

export default function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
      <span>{isDark ? 'Light' : 'Dark'} mode</span>
    </button>
  );
}
