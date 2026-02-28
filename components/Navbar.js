export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-primary text-secondary sticky top-0 z-50">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏳️</span>
        <span className="text-xl font-black tracking-tight">knowflags</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" className="text-sm font-semibold hover:text-accent-gold transition-colors">Gallery</a>
        <a href="#" className="text-sm font-semibold hover:text-accent-gold transition-colors">Games</a>
        <a href="#" className="text-sm font-semibold hover:text-accent-gold transition-colors">History</a>
        <a href="#" className="text-sm font-semibold hover:text-accent-gold transition-colors">Submit</a>
      </nav>

      {/* Bouton langue */}
      <button className="bg-secondary text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-blue transition-colors">
        EN / FR
      </button>

    </header>
  )
}