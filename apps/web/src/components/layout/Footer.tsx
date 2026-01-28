export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <span>Topo Print - Generate 3D terrain models for printing</span>
        <div className="flex items-center gap-4">
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors"
          >
            OpenStreetMap
          </a>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors"
          >
            Open-Meteo
          </a>
        </div>
      </div>
    </footer>
  );
}
