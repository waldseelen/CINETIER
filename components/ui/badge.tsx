import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground",
                secondary:
                    "border-transparent bg-surface-2 text-foreground",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground",
                outline:
                    "text-foreground border-border",
                neon:
                    "border-transparent bg-neon/20 text-neon border border-neon/30",
                turquoise:
                    "border-transparent bg-turquoise/20 text-turquoise border border-turquoise/30",
                public:
                    "border-transparent bg-neon/20 text-neon",
                unlisted:
                    "border-transparent bg-turquoise/20 text-turquoise",
                private:
                    "border-transparent bg-surface-2 text-muted-foreground",
                spoiler:
                    "border-transparent bg-cinetier-warning/20 text-cinetier-warning",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
