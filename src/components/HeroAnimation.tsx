"use client";

import Lottie from "lottie-react";
import familyAnimation from "../../public/family.json";

export function HeroAnimation() {
    return (
        <div className="relative w-full max-w-lg xl:max-w-xl">
            {/* Soft glow behind the animation */}
            <div className="absolute inset-0 rounded-full bg-copper-500/8 blur-3xl scale-90" />
            <Lottie
                animationData={familyAnimation}
                loop
                autoplay
                className="relative w-full h-auto"
                style={{ minHeight: "320px" }}
            />
        </div>
    );
}
