function Marquee() {
  const text = 'REVOLUTION FIT LAB • REFORMER PILATES • STRONG CORE • TOTAL BODY TONE • URBAN ENERGY •'

  return (
    <div className="bg-brand-red overflow-hidden py-4 relative">
      <div className="flex animate-scroll whitespace-nowrap">
        {/* Duplicate content multiple times for seamless infinite scroll */}
        {[...Array(6)].map((_, i) => (
          <span key={i} className="font-barlow font-black text-2xl text-white uppercase tracking-wider mr-16 inline-block">
            {text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
          display: flex;
        }
      `}</style>
    </div>
  )
}

export default Marquee
