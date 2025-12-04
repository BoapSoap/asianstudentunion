"use client";

import { useEffect, useRef, useId } from 'react';

/**
 * @typedef {object} GlassSurfaceProps
 * @property {import("react").ReactNode} [children]
 * @property {number | string} [width]
 * @property {number | string} [height]
 * @property {number} [borderRadius]
 * @property {number} [borderWidth]
 * @property {number} [brightness]
 * @property {number} [opacity]
 * @property {number} [blur]
 * @property {number} [displace]
 * @property {number} [backgroundOpacity]
 * @property {number} [saturation]
 * @property {number} [distortionScale]
 * @property {number} [redOffset]
 * @property {number} [greenOffset]
 * @property {number} [blueOffset]
 * @property {'R' | 'G' | 'B' | 'A'} [xChannel]
 * @property {'R' | 'G' | 'B' | 'A'} [yChannel]
 * @property {string} [mixBlendMode]
 * @property {boolean} [forceFallback]
 * @property {string} [className]
 * @property {Record<string, any>} [style]
 */

/**
 * @param {GlassSurfaceProps} props
 */
const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 50,
  borderWidth = 0.07,
  brightness = 52,
  opacity = 0.9,
  blur = 8,
  displace = 0.4,
  backgroundOpacity = 0.18,
  saturation = 1,
  distortionScale = -90,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  forceFallback = false,
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const containerRef = useRef(null);
  const feImageRef = useRef(null);
  const redChannelRef = useRef(null);
  const greenChannelRef = useRef(null);
  const blueChannelRef = useRef(null);
  const gaussianBlurRef = useRef(null);

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  let resizeTimeout;

  const updateDisplacementMap = () => {
    if (!feImageRef.current) return;
    feImageRef.current.setAttribute('href', generateDisplacementMap());
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    if (gaussianBlurRef.current) {
      gaussianBlurRef.current.setAttribute('stdDeviation', displace.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDisplacementMap, 80);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supportsSVGFilters = () => {
    return (
      typeof CSS !== 'undefined' &&
      (CSS.supports?.('backdrop-filter', 'blur(10px)') ||
        CSS.supports?.('-webkit-backdrop-filter', 'blur(10px)'))
    );
  };

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': `url(#${filterId})`
  };

  // DEBUG: always use SVG while testing; swap back to supportsSVGFilters() when ready
  const useSvgFilter = !forceFallback;

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${useSvgFilter ? 'glass-surface--svg' : 'glass-surface--fallback'} ${className}`}
      style={containerStyle}
    >
      {useSvgFilter && (
        <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
              <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

              <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="red"
              />

              <feDisplacementMap
                ref={greenChannelRef}
                in="SourceGraphic"
                in2="map"
                id="greenchannel"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="green"
              />

              <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="blue"
              />

              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
            </filter>
          </defs>
        </svg>
      )}

      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
