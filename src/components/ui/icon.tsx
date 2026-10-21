import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ComponentProps } from 'react';

type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, 'icon'> & { icon: IconSvgElement };

/** Icône Hugeicons : trait de 1,6, couleur héritée, masquée aux lecteurs d'écran sauf si un aria-label est fourni. */
export function Icon({ icon, size = 16, strokeWidth = 1.6, ...props }: IconProps) {
  const labelled = props['aria-label'] != null;
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color="currentColor"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      {...props}
    />
  );
}
