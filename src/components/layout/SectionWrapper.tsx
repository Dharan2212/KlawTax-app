import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  background?: "default" | "muted" | "dark" | "gradient";
  spacing?: "sm" | "md" | "lg";
  id?: string;
}

export default function SectionWrapper({ children, className, background = "default", spacing = "md", id }: SectionWrapperProps) {
  const bgClasses = {
    default: "bg-background",
    muted: "bg-muted",
    dark: "bg-neutral-900 text-neutral-50",
    gradient: "",
  };
  const pyClasses = {
    sm: "py-16 md:py-20",
    md: "py-20 md:py-28 lg:py-32",
    lg: "py-24 md:py-32 lg:py-40",
  };

  return (
    <section id={id} className={cn(bgClasses[background], pyClasses[spacing], background === "gradient" && "bg-[image:var(--gradient-mesh-light)]", className)}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}
