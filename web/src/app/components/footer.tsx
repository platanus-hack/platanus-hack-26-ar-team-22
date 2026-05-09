import TranqueraLogo from "./tranquera-logo";

const footerLinks = [
  {
    label: "Producto",
    links: [
      { label: "Architecture", href: "#how-it-works" },
      { label: "Protocols", href: "#features" },
      { label: "Terminal Demo", href: "#terminal" },
      { label: "Acceso anticipado", href: "#waitlist" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Compliance Framework", href: "#" },
      { label: "Legal Protocols", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
  {
    label: "Sistema",
    links: [
      { label: "System Status", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "Security Architecture", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <a href="#" className="flex items-center gap-2.5 w-fit">
              <TranqueraLogo className="h-[18px] w-auto text-white opacity-30" />
            </a>
            <p className="font-mono text-[10px] text-white/20 leading-[1.9] max-w-[180px]">
              Firewall corporativo para Claude Code.
              <br />
              Precision. Silence. Permanence.
            </p>
            <div className="flex flex-col gap-1 mt-1">
              <span className="font-mono text-[9px] text-white/15 tracking-[0.08em]">
                v0.1.0-alpha
              </span>
              <span className="font-mono text-[9px] text-white/10 tracking-[0.06em]">
                Tranquera Infrastructure
              </span>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.label} className="flex flex-col gap-4">
              <span className="font-mono text-[9px] text-white/25 tracking-[0.2em] uppercase">
                {group.label}
              </span>
              <div className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="font-mono text-[11px] text-white/30 hover:text-white/60 transition-colors tracking-[0.03em]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="font-mono text-[9px] text-white/15 tracking-[0.08em] uppercase">
            © 2026 Tranquera Infrastructure · Platanus Hack 26 · Team 22
          </p>
          <p className="font-mono text-[9px] text-white/10 tracking-[0.06em]">
            Precision · Silence · Permanence
          </p>
        </div>
      </div>
    </footer>
  );
}
