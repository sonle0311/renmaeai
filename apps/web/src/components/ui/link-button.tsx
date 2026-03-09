"use client";

import Link from "next/link";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * LinkButton — wrapper cho Link + buttonVariants.
 *
 * Dùng trong Server Components thay cho <Button asChild><Link>.
 * Base-nova Button dùng @base-ui/react (client-only),
 * nên không thể gọi buttonVariants() trực tiếp trong Server Components.
 */
export function LinkButton({
    href,
    variant,
    size,
    className,
    children,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
} & VariantProps<typeof buttonVariants>) {
    return (
        <Link
            href={href}
            className={cn(buttonVariants({ variant, size }), className)}
        >
            {children}
        </Link>
    );
}
