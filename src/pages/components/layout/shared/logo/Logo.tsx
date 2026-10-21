import BrandLogo from "@/components/BrandLogo";

export interface LogoProps {
  className?: string;
  variant?: "full" | "short";
}

const Logo = ({ className = "h-7 w-auto", variant = "full" }: LogoProps) => {
  return (
    <BrandLogo
      variant={variant}
      className={`text-black dark:text-white transition-colors ${className}`.trim()}
    />
  );
};

export default Logo;
