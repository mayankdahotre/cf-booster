import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const badgeVariants = cva('inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-xs font-normal', {
  variants: {
    variant: {
      default: 'cf-tag',
      secondary: 'bg-secondary text-foreground border border-cf-border',
      destructive: 'bg-red-50 text-destructive border border-red-200',
      outline: 'border border-cf-border bg-white text-foreground',
      success: 'bg-green-50 text-[#008000] border border-green-200',
      warning: 'bg-orange-50 text-[#ff8c00] border border-orange-200',
      rating: 'border font-bold font-mono bg-transparent',
      tag: 'cf-tag',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
