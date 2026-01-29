declare const __GIT_HASH__: string;

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
        <span>
          Topo Print{' '}
          <span className="text-slate-600" title={`Build ${__GIT_HASH__}`}>
            ({__GIT_HASH__})
          </span>
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            OpenStreetMap
          </a>
          <a
            href="https://www.mapbox.com/about/maps/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            Mapbox
          </a>
        </div>
      </div>
    </footer>
  );
}
