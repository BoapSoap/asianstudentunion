"use client";

import {
    useRef,
    useState,
    type ReactNode,
    type CSSProperties,
    type HTMLAttributes,
} from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import clsx from "clsx";
import "./TiltedCard.css";

const springValues = {
    damping: 30,
    stiffness: 100,
    mass: 2,
};

type TiltedCardProps = {
    imageSrc?: string;
    altText?: string;
    captionText?: string;
    containerHeight?: string;
    containerWidth?: string;
    imageHeight?: string;
    imageWidth?: string;
    scaleOnHover?: number;
    rotateAmplitude?: number;
    showMobileWarning?: boolean;
    showTooltip?: boolean;
    overlayContent?: ReactNode;
    displayOverlayContent?: boolean;
    children?: ReactNode;
} & HTMLAttributes<HTMLElement>;

export default function TiltedCard({
    imageSrc,
    altText = "Tilted card image",
    captionText = "",
    containerHeight = "300px",
    containerWidth = "100%",
    imageHeight = "300px",
    imageWidth = "300px",
    scaleOnHover = 1.04,
    rotateAmplitude = 10,
    showMobileWarning = false,
    showTooltip = false,
    overlayContent = null,
    displayOverlayContent = false,
    children,
    className = "",
    style,
    ...rest
}: TiltedCardProps) {
    const ref = useRef<HTMLElement | null>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useMotionValue(0), springValues);
    const rotateY = useSpring(useMotionValue(0), springValues);
    const scale = useSpring(1, springValues);
    const opacity = useSpring(0);
    const rotateFigcaption = useSpring(0, {
        stiffness: 350,
        damping: 30,
        mass: 1,
    });

    const [lastY, setLastY] = useState(0);

    function handleMouse(e: React.MouseEvent<HTMLElement>) {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;

        const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
        const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

        rotateX.set(rotationX);
        rotateY.set(rotationY);

        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);

        const velocityY = offsetY - lastY;
        rotateFigcaption.set(-velocityY * 0.6);
        setLastY(offsetY);
    }

    function handleMouseEnter() {
        scale.set(scaleOnHover);
        opacity.set(1);
    }

    function handleMouseLeave() {
        opacity.set(0);
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
        rotateFigcaption.set(0);
    }

    const content =
        children ?? (
            <motion.img
                src={imageSrc}
                alt={altText}
                className="tilted-card-img"
                style={{
                    width: imageWidth,
                    height: imageHeight,
                }}
            />
        );

    return (
        <figure
            ref={ref as unknown as React.RefObject<HTMLElement>}
            className={clsx("tilted-card-figure", className)}
            style={{
                height: containerHeight,
                width: containerWidth,
                ...(style as CSSProperties),
            }}
            onMouseMove={handleMouse}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...rest}
        >
            {showMobileWarning && (
                <div className="tilted-card-mobile-alert">
                    This effect is not optimized for mobile. Check on desktop.
                </div>
            )}

            <motion.div
                className="tilted-card-inner"
                style={{
                    width: imageWidth,
                    height: imageHeight,
                    rotateX,
                    rotateY,
                    scale,
                }}
            >
                <div className="tilted-card-content">{content}</div>

                {displayOverlayContent && overlayContent && (
                    <motion.div className="tilted-card-overlay">{overlayContent}</motion.div>
                )}
            </motion.div>

            {showTooltip && (
                <motion.figcaption
                    className="tilted-card-caption"
                    style={{
                        x,
                        y,
                        opacity,
                        rotate: rotateFigcaption,
                    }}
                >
                    {captionText}
                </motion.figcaption>
            )}
        </figure>
    );
}
