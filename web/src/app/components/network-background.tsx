export default function NetworkBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 18% 44%, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.028) 28%, transparent 66%)",
        }}
      />
      <div
        className="absolute -left-[18%] top-[8%] h-[70%] w-[58%] -rotate-12 blur-3xl"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025) 42%, transparent 78%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.025) 38%, transparent 64%)",
        }}
      />
    </div>
  );
}
