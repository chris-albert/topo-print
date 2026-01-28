import { Link } from '@tanstack/react-router';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <svg className="w-8 h-8" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,10 90,80 10,80" fill="#16a34a" opacity="0.8" />
            <polygon points="35,30 65,80 5,80" fill="#22c55e" opacity="0.6" />
            <polygon points="65,25 95,80 35,80" fill="#15803d" opacity="0.7" />
          </svg>
          <span className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
            Topo Print
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            activeProps={{ className: 'text-sm font-medium text-primary-700' }}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            activeProps={{ className: 'text-sm font-medium text-primary-700' }}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
