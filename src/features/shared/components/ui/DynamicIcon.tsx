import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";
import React from "react";

interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: React.ReactNode;
}

/**
 * Renders a Lucide icon dynamically by name.
 * Handles cases where the icon name might be missing or invalid.
 */
export const DynamicIcon = React.memo(
  ({ name, fallback, ...props }: DynamicIconProps) => {
    // Normalize name (handle potential casing issues or missing names)
    if (!name) return <>{fallback}</>;

    // Lucide icons are PascalCase (e.g., 'Boxing' -> 'Boxing', 'box' -> 'Box')
    const iconName = name.charAt(0).toUpperCase() + name.slice(1);
    const IconComponent =
      (LucideIcons as any)[iconName] || (LucideIcons as any)[name];

    if (!IconComponent) {
      console.warn(`DynamicIcon: Icon "${name}" not found in lucide-react.`);
      return <>{fallback || <LucideIcons.HelpCircle {...props} />}</>;
    }

    return <IconComponent {...props} />;
  },
);

DynamicIcon.displayName = "DynamicIcon";
