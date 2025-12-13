import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-normal ease-snappy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground hover:bg-neon-hover active:bg-neon-pressed active:scale-[0.98] shadow-glow-sm hover:shadow-glow-md",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
                outline:
                    "border border-border bg-transparent hover:bg-surface-1 hover:text-accent-foreground hover:border-turquoise",
                secondary:
                    "bg-surface-1 text-foreground hover:bg-surface-2 active:scale-[0.98]",
                ghost:
                    "hover:bg-surface-1 hover:text-foreground",
                link:
                    "text-primary underline-offset-4 hover:underline",
                neon:
                    "bg-neon text-cinetier-bg-0 font-semibold hover:bg-neon-hover active:bg-neon-pressed shadow-glow-neon hover:shadow-glow-xl active:scale-[0.98]",
                turquoise:
                    "bg-turquoise text-cinetier-bg-0 font-semibold hover:bg-turquoise-hover shadow-glow-turquoise hover:shadow-glow-md active:scale-[0.98]",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                xl: "h-12 rounded-lg px-10 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
