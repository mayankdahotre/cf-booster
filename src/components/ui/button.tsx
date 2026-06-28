import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] text-[13px] font-normal transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cf-link disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-cf-header text-white border border-[#1a5f8a] hover:bg-[#1a5f8a] shadow-none',
        destructive: 'bg-destructive text-white border border-red-700 hover:bg-red-700',
        outline: 'border border-cf-border bg-white text-foreground hover:bg-secondary',
        secondary: 'bg-secondary text-foreground border border-cf-border hover:bg-muted',
        ghost: 'text-cf-link hover:bg-accent hover:underline',
        link: 'text-cf-link underline-offset-2 hover:underline p-0 h-auto',
        success: 'bg-[#008000]/10 text-[#008000] border border-[#008000]/40 hover:bg-[#008000]/20',
      },
      size: {
        default: 'h-8 px-3 py-1',
        sm: 'h-7 px-2 text-xs',
        lg: 'h-9 px-4',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
