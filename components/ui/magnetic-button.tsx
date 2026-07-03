'use client';

import { useRef, useState, forwardRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import confetti from 'canvas-confetti';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    withConfetti?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
    ({ className, asChild = false, withConfetti = false, variant = 'primary', size = 'default', onClick, children, ...props }, ref) => {
        const buttonRef = useRef<HTMLButtonElement>(null);
        const [isHovered, setIsHovered] = useState(false);

        const [{ x, y, scale }, springApi] = useSpring(() => ({
            x: 0,
            y: 0,
            scale: 1,
            config: { tension: 300, friction: 20 }
        }));

        const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!buttonRef.current) return;

            const rect = buttonRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) * 0.3;
            const deltaY = (e.clientY - centerY) * 0.3;

            springApi.start({ x: deltaX, y: deltaY, scale: 1.05 });
        };

        const handleMouseLeave = () => {
            springApi.start({ x: 0, y: 0, scale: 1 });
            setIsHovered(false);
        };

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            const button = e.currentTarget;

            // Ripple Effect
            const circle = document.createElement("span");
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            const radius = diameter / 2;

            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
            circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
            circle.classList.add("ripple");

            const ripple = button.getElementsByClassName("ripple")[0];
            if (ripple) { ripple.remove(); }
            button.appendChild(circle);

            if (withConfetti) {
                const rect = buttonRef.current?.getBoundingClientRect();
                if (rect) {
                    confetti({
                        particleCount: 50,
                        spread: 70,
                        origin: {
                            x: (rect.left + rect.width / 2) / window.innerWidth,
                            y: (rect.top + rect.height / 2) / window.innerHeight
                        },
                        colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4']
                    });
                }
            }
            onClick?.(e);
        };

        const Comp = asChild ? Slot : 'button';

        const variantStyles = {
            primary: 'bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold text-white shadow-lg glow-purple',
            secondary: 'bg-gradient-to-r from-gala-cyan to-gala-purple text-white shadow-lg glow-pink',
            outline: 'border-2 border-white/10 text-foreground hover:bg-gala-purple/10 backdrop-blur-md',
            ghost: 'hover:bg-gala-purple/10 text-foreground'
        };

        const sizeStyles = {
            default: 'px-8 py-4 rounded-full',
            sm: 'px-4 py-2 text-sm rounded-xl',
            lg: 'px-10 py-6 text-xl rounded-[2rem]',
            icon: 'p-3 rounded-full'
        };

        // When asChild is true, we can't add extra children (shimmer, span wrapper)
        // because Slot expects a single React element child
        if (asChild) {
            return (
                <animated.div
                    style={{
                        transform: x.to((x) => `translate3d(${x}px, ${y.get()}px, 0) scale(${scale.get()})`),
                        display: 'inline-block'
                    }}
                >
                    <Comp
                        {...props}
                        ref={(node: HTMLButtonElement | null) => {
                            (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                            if (typeof ref === 'function') ref(node);
                            else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                        }}
                        className={cn(
                            "relative font-semibold transition-all duration-300 outline-none",
                            variantStyles[variant],
                            sizeStyles[size],
                            className
                        )}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleClick}
                    >
                        {children}
                    </Comp>
                </animated.div>
            );
        }

        // When asChild is false, we can add shimmer and wrapper
        return (
            <animated.div
                style={{
                    transform: x.to((x) => `translate3d(${x}px, ${y.get()}px, 0) scale(${scale.get()})`),
                    display: 'inline-block'
                }}
            >
                <Comp
                    {...props}
                    ref={(node: HTMLButtonElement | null) => {
                        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                        if (typeof ref === 'function') ref(node);
                        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                    }}
                    className={cn(
                        "relative font-semibold transition-all duration-300 overflow-hidden outline-none",
                        variantStyles[variant],
                        sizeStyles[size],
                        className
                    )}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />

                    {/* Content */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {children}
                    </span>
                </Comp>
            </animated.div>
        );
    }
);

MagneticButton.displayName = 'MagneticButton';
