'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];

class Particle {
    x: number = 0;
    y: number = 0;
    size: number = 0;
    speedX: number = 0;
    speedY: number = 0;
    color: string = '';
    opacity: number = 0;

    constructor(width: number, height: number) {
        this.reset(width, height, true);
    }

    reset(width: number, height: number, initial = false) {
        this.x = initial ? Math.random() * width : (this.speedX > 0 ? -10 : width + 10);
        this.y = initial ? Math.random() * height : (this.speedY > 0 ? -10 : height + 10);
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.opacity = Math.random() * 0.4 + 0.1;
    }

    update(width: number, height: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > width + 20 || this.x < -20 || this.y > height + 20 || this.y < -20) {
            this.reset(width, height);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        const particles: Particle[] = Array.from({ length: 40 }, () => new Particle(width, height));

        let animationId: number;
        let lastTime = 0;

        const animate = (time: number) => {
            // Throttle or handle delta time if needed, but requestAnimationFrame is usually enough
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update(width, height);
                particles[i].draw(ctx);
            }

            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
}
