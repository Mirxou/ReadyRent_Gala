import { cn } from "@/lib/utils";
import { Spotlight } from "./spotlight";

/**
 * BentoGrid Container
 * A CSS Grid wrapper for the bento layout.
 */
export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

/**
 * BentoGridItem
 * Uses the Spotlight component as a base for interactivity.
 */
export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <Spotlight
            className={cn(
                "row-span-1 group/bento transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black/40 dark:border-white/5 border-transparent justify-between flex flex-col space-y-4",
                className
            )}
            fill="rgba(var(--primary), 0.15)"
        >
            <div className="relative z-10 flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden group-hover/bento:scale-[1.02] transition-transform duration-500">
                {header}
            </div>
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                <div className="mb-2 text-primary">
                    {icon}
                </div>
                <div className="font-bold text-foreground mb-2 mt-2 text-xl">
                    {title}
                </div>
                <div className="font-normal text-muted-foreground text-sm">
                    {description}
                </div>
            </div>
        </Spotlight>
    );
};
