import { cn } from "@/lib/utils";

const variants = {
  low: "border-mint/25 bg-mint/10 text-[#147556]",
  medium: "border-amber/25 bg-amber/10 text-[#8f5c0b]",
  high: "border-coral/25 bg-coral/10 text-[#a13d31]",
  neutral: "border-line bg-[#eef3f7] text-[#4a5968]"
};

export function Badge({
  className,
  variant = "neutral",
  children
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md border px-2 text-xs font-semibold capitalize",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
