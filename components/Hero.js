export default function Hero() {
  return (
    <section className="bg-secondary text-primary px-6 py-12 md:py-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Image du drapeau */}
        <div className="w-full md:w-3/5">
          <img
            src="https://flagcdn.com/w640/fr.png"
            alt="Flag of France"
            className="w-full rounded-xl shadow-2xl border-8 border-white"
          />
        </div>

        {/* Texte */}
        <div className="w-full md:w-2/5 flex flex-col gap-6">
          <span className="text-accent-green font-bold tracking-widest uppercase text-xs">
            Featured Today
          </span>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            The Tricolour of Liberty
          </h1>
          <p className="text-lg leading-relaxed text-primary/80">
            The Flag of France features three vertical bands of blue, white, and red. Known as the Tricolore, it has become one of the most influential flags in history.
          </p>
          <div className="flex gap-4">
            <button className="flex-1 bg-primary text-secondary py-4 px-6 rounded-lg font-bold hover:bg-primary/90 transition-all">
              Full History
            </button>
            <button className="w-14 h-14 rounded-lg bg-accent-blue/20 border-2 border-accent-blue/30 hover:bg-accent-blue/40 transition-all flex items-center justify-center text-xl">
              🔖
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}