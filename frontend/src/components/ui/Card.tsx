import { cn } from "@/utils/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border bg-white p-6", className)}>
      {children}
    </div>
  );
}
