import Link from "next/link";
import { AppShell } from "@/components/ui";

const constraints = ["600 × 400 target", "HTML, Tailwind, or CSS", "Live pixel score"] as const;

/** One separation plate of a 600 × 400 component: image, type, price, button. */
function Plate({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 600 400" className={`absolute inset-0 h-full w-full ${className}`} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="8" y="8" width="584" height="384" rx="2" />
        <rect x="36" y="36" width="528" height="188" />
        <rect x="36" y="248" width="248" height="16" fill="currentColor" fillOpacity="0.55" stroke="none" />
        <rect x="36" y="278" width="148" height="10" fill="currentColor" fillOpacity="0.35" stroke="none" />
        <rect x="36" y="316" width="96" height="22" fill="currentColor" fillOpacity="0.45" stroke="none" />
        <rect x="392" y="308" width="172" height="52" rx="2" />
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <AppShell nav={<Link href="/admin/new" className="text-[14px] text-muted hover:text-paper">Set up a match</Link>}>
      <div className="mat-grid flex h-full items-center justify-center p-6 max-lg:py-10">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* contents on small screens so the proof can sit between the copy and the button */}
          <div className="min-w-0 max-lg:contents">
            <h1 className="font-expanded text-[clamp(28px,3vw,52px)] leading-[1.05] max-lg:order-1">
              Two developers.
              <br />
              One target.
              <br />
              Closest pixels win.
            </h1>
            <p className="mt-6 max-w-[42ch] text-[17px] leading-relaxed text-paper max-lg:order-2">
              Both of you rebuild the same 600 × 400 target. The closer render wins, scored live.
            </p>
            <div className="max-lg:order-4">
              <Link
                href="/admin/new"
                className="mt-8 inline-flex h-12 items-center rounded-[2px] bg-register px-6 text-[16px] font-semibold text-ink hover:bg-[#fff86b]"
              >
                Set up a match
              </Link>
              <ul className="mt-8 flex flex-col gap-2 text-[14px] text-muted sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-rule">
                {constraints.map((item) => (
                  <li key={item} className="sm:px-4 sm:first:pl-0 sm:last:pr-0">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Plates slide in and settle off register. The yellow tick marks the gap. */}
          <div className="crop-marks w-full border border-rule bg-ink p-6 max-lg:order-3">
            <div className="relative aspect-[3/2] w-full">
              <Plate className="plate-in-left text-plate-a" />
              <div className="absolute inset-0 translate-x-4 translate-y-3">
                <Plate className="plate-in-right text-plate-b" />
              </div>
              <svg
                viewBox="0 0 16 16"
                className="absolute top-[calc(77%-4px)] left-[calc(65.3%-2px)] h-5 w-5 text-register"
                aria-hidden
              >
                <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1.75" />
                <circle cx="8" cy="8" r="2.25" fill="currentColor" />
              </svg>
            </div>
            <p className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule/70 pt-4">
              <span className="text-[13px] text-muted">Example</span>
              <span className="flex items-baseline gap-6">
                <span className="font-expanded text-[26px] leading-none text-plate-a">A 96.2%</span>
                <span className="font-expanded text-[26px] leading-none text-plate-b">B 88.1%</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
