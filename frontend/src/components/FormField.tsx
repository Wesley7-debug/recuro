import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="ui-label">{label}</label>
      {children}
    </div>
  );
}
