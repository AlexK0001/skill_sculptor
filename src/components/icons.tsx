import { LucideProps } from "lucide-react";

export const Logo = ({ className, ...props }: LucideProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 2L12 22M12 2C8 2 5 5 5 9C5 13 8 16 12 16M12 2C16 2 19 5 19 9C19 13 16 16 12 16M12 16C8 16 5 19 5 22H19C19 19 16 16 12 16Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);