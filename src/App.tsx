import { useCallback,useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import StarMap from './components/StarMap';
import Profile from './components/Profile';
import Lightbox, { LightboxContext, type LightboxImage } from './components/Lightbox';
import { BlackHoleRenderer } from './blackhole/renderer/blackhole';
import { Params, DEFAULTS } from './blackhole/renderer/params';
import Controls from './components/BlackHoleControls';

type siteState = 'entry' | 'starMap' | 'profile';

function clamp(value: number, min: number, max: number): number
{
  return Math.min(Math.max(value, min), max);
}

function prefersReducedMotion(): boolean
{
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const warpParams =
{
  swingEnd: 0.30,
  holdMilliseconds: 200,
  plungeEnd: 0.84,
  swingDegrees: 180,
  swingInclination: 11,
  plungeCurve: 3.4,
  pullBack: 1.04,
  horizonDistance: 1.18,
  finalDistance: 1.04,
  swingFieldOfView: 1.85,
  plungeFieldOfView: 1.1,
  twistRoll: -5,
  crossTwistRoll: -3,
  warpExponent: 0.7,
  plungeInclination: 15,
  plungeLookTurn: 0,
  crossLookTurn: 0,
}

export default function App()
{
  // const [explore, setExplore] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [showControls, setShowControls] = useState(false);
  const [currentSiteState, setCurrentSiteState] = useState<siteState>('entry');
  const [isAnimating, setIsAnimating] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const travelVeilRef = useRef<HTMLDivElement>(null);
  const vignetteOverlayRef = useRef<HTMLDivElement>(null);
  const bloomOverlayRef = useRef<HTMLDivElement>(null);
  const graySkyOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => () =>
  {
    if(transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
    if (animationFrameRef.current !== 0) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  useEffect(() =>
  {
    if (!canvasRef.current) return;
    const blackHoleRenderer = new BlackHoleRenderer(canvasRef.current, DEFAULTS);
    rendererRef.current = blackHoleRenderer;
    return () =>
    {
      blackHoleRenderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() =>
  {
    rendererRef.current?.setActive(currentSiteState === 'entry');
    rendererRef.current?.setParams(paramsRef.current);
    rendererRef.current?.setWarp(0, 0, 0);
  }, [currentSiteState]);

  useEffect(() =>
    {
    const handleKeyDown = (e: KeyboardEvent) =>
    {
      const focused = document.activeElement;
      if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'p')
      {
        setShowControls(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const patchParams = useCallback((patch: Partial<Params>) =>
  {
    setParams((prev) =>
    {
      const next = { ...prev, ...patch };
      rendererRef.current?.setParams(next);
      return next;
    });
  }, []);

  const animation = (isZoomingIn: boolean, durationMilliseconds: number): void =>
  {
    cancelAnimationFrame(animationFrameRef.current);
    const blackHoleRenderer = rendererRef.current;
    if (!blackHoleRenderer) return;

    const startParams = paramsRef.current;
    const animationStartTime = performance.now();

    const vignetteOverlay = vignetteOverlayRef.current;
    const travelVeil = travelVeilRef.current;
    const bloomOverlay = bloomOverlayRef.current;
    const graySkyOverlay = graySkyOverlayRef.current;
    const veilTone = '#15171c';
    const warpCap = prefersReducedMotion() ? 0.3 : 1;
    const plungeLogSpan = Math.log(warpParams.horizonDistance / (startParams.distance * warpParams.pullBack));
    const crossLogSpan = Math.log(warpParams.finalDistance / warpParams.horizonDistance);

    blackHoleRenderer.setWarp(0, 0, 0);

    if (vignetteOverlay)
    {
      vignetteOverlay.style.opacity = '0';
      vignetteOverlay.style.transform = 'scale(1)';
      vignetteOverlay.style.transformOrigin = '50% 50%';
      vignetteOverlay.style.background = isZoomingIn
        ? 'radial-gradient(circle at 50% 50%, transparent 62%, rgba(3,4,10,0.96) 86%)'
        : 'radial-gradient(circle at 50% 50%, transparent 13.8%, rgba(3,4,10,0.72) 76.9%)';
    }
    if (bloomOverlay)
    {
      bloomOverlay.style.opacity = '0';
      bloomOverlay.style.transform = isZoomingIn ? 'scale(0.2)' : 'scale(0.86)';
      bloomOverlay.style.transformOrigin = '50% 50%';
      bloomOverlay.style.background = isZoomingIn
        ? 'radial-gradient(circle at 50% 50%, rgba(240,247,255,1) 0%, rgba(150,190,255,0.75) 16%, rgba(60,90,210,0) 55%)'
        : 'radial-gradient(circle at 50% 50%, rgba(255,246,230,0.34) 0%, rgba(186,214,255,0.12) 16%, transparent 48%)';
    }
    if (travelVeil)
    {
      travelVeil.style.opacity = '0';
      travelVeil.style.pointerEvents = 'auto';
      travelVeil.style.backgroundColor = isZoomingIn ? '#e4eeff' : veilTone;
    }
    if (graySkyOverlay)
    {
      graySkyOverlay.style.opacity = '0';
    }

    const renderAnimationFrame = (frameTimestamp: number): void =>
    {
      const rawProgress = clamp((frameTimestamp - animationStartTime) / durationMilliseconds, 0, 1);

      const pullAwayProgress = clamp(rawProgress / 0.42, 0, 1);
      const pullAwayEased = pullAwayProgress < 0.5
        ? 4 * pullAwayProgress * pullAwayProgress * pullAwayProgress
        : 1 - Math.pow(-2 * pullAwayProgress + 2, 3) / 2;
      const lookDownProgress = clamp((rawProgress - 0.42) / 0.44, 0, 1);
      const lookDownEased = lookDownProgress * lookDownProgress * (3 - 2 * lookDownProgress);
      const zoomEased = pullAwayEased * 0.84 + rawProgress * 0.16;

      const swingProgress = clamp(rawProgress / warpParams.swingEnd, 0, 1);
      const swingEased = swingProgress * swingProgress * (3 - 2 * swingProgress);
      const holdEnd = warpParams.swingEnd + warpParams.holdMilliseconds / durationMilliseconds;
      const plungeProgress = clamp((rawProgress - holdEnd) / (warpParams.plungeEnd - holdEnd), 0, 1);
      const plungeEased = Math.pow(plungeProgress, warpParams.plungeCurve);
      const crossProgress = clamp((rawProgress - warpParams.plungeEnd) / (1 - warpParams.plungeEnd), 0, 1);
      const crossEased = crossProgress * crossProgress * (3 - 2 * crossProgress);

      if (isZoomingIn)
      {
        const currentDistance = Math.exp(Math.log(startParams.distance) + Math.log(warpParams.pullBack) * swingEased + plungeLogSpan * plungeEased + crossLogSpan * crossEased);
        blackHoleRenderer.setParams({
          ...startParams,
          distance: currentDistance,
          fieldOfView: startParams.fieldOfView + (warpParams.swingFieldOfView - startParams.fieldOfView) * swingEased + (warpParams.plungeFieldOfView - warpParams.swingFieldOfView) * plungeEased,
          offsetX: startParams.offsetX * (1 - swingEased),
          offsetY: startParams.offsetY * (1 - swingEased),
          azimuth: startParams.azimuth + warpParams.swingDegrees * swingEased,
          inclination: startParams.inclination + (warpParams.swingInclination - startParams.inclination) * swingEased + (warpParams.plungeInclination - warpParams.swingInclination) * plungeEased,
          roll: startParams.roll * (1 - swingEased) + warpParams.twistRoll * plungeEased + warpParams.crossTwistRoll * crossEased,
          exposure: startParams.exposure * (1 + 0.14 * plungeEased),
          diskGlow: Math.min(1, startParams.diskGlow + 0.32 * plungeEased),
          doppler: Math.min(1, startParams.doppler + 0.16 * plungeEased),
          starBrightness: startParams.starBrightness * (1 + 0.6 * plungeEased),
        });
        const warpStrength = Math.pow(plungeEased, warpParams.warpExponent) * warpCap;
        const lookTurnDegrees = (warpParams.plungeLookTurn * Math.pow(plungeEased, warpParams.warpExponent) + warpParams.crossLookTurn * crossEased) * warpCap;
        blackHoleRenderer.setWarp(warpStrength, crossEased * warpCap, lookTurnDegrees);
      }
      else
      {
        blackHoleRenderer.setParams({
          ...startParams,
          distance: startParams.distance + (startParams.distance * 9 - startParams.distance) * pullAwayEased,
          fieldOfView: startParams.fieldOfView + (startParams.fieldOfView * 0.85 - startParams.fieldOfView) * pullAwayEased,
          offsetX: startParams.offsetX + (0 - startParams.offsetX) * pullAwayEased,
          offsetY: startParams.offsetY + (1.55 - startParams.offsetY) * lookDownEased,
          exposure: startParams.exposure + (startParams.exposure * 1.08 - startParams.exposure) * pullAwayEased,
          diskGlow: startParams.diskGlow + (startParams.diskGlow * 0.3 - startParams.diskGlow) * pullAwayEased,
          starBrightness: startParams.starBrightness + (Math.min(2.4, startParams.starBrightness * 1.6) - startParams.starBrightness) * (pullAwayEased * 0.3 + lookDownEased * 0.7),
          starAmount: startParams.starAmount + (Math.min(1.45, startParams.starAmount + 0.45) - startParams.starAmount) * (pullAwayEased * 0.3 + lookDownEased * 0.7),
          nebulosity: startParams.nebulosity + (Math.min(1, startParams.nebulosity + 0.22) - startParams.nebulosity) * (pullAwayEased * 0.3 + lookDownEased * 0.7),
          saturation: startParams.saturation + (0 - startParams.saturation) * lookDownEased,
        });
      }

      const veilStartProgress = 0.85;
      const veilProgress = isZoomingIn ? 0 : clamp((rawProgress - veilStartProgress) / (1 - veilStartProgress), 0, 1);
      const veilOpacity = veilProgress * veilProgress * (3 - 2 * veilProgress);
      if (travelVeil && !isZoomingIn) travelVeil.style.opacity = String(veilOpacity);

      if (vignetteOverlay)
      {
        if (isZoomingIn)
        {
          if (crossProgress > 0)
          {
            const holeRadius = 62 - 60 * crossEased;
            vignetteOverlay.style.background = `radial-gradient(circle at 50% 50%, transparent ${holeRadius}%, rgba(3,4,10,0.96) ${holeRadius + 24}%)`;
          }
          vignetteOverlay.style.opacity = String(0.3 * plungeEased + 0.7 * crossEased);
          vignetteOverlay.style.transform = `scale(${1.08 - plungeEased * 0.1})`;
        }
        else
        {
          vignetteOverlay.style.opacity = String(0.36 * zoomEased * (1 - veilOpacity));
          vignetteOverlay.style.transform = 'scale(1)';
        }
      }

      if (bloomOverlay && isZoomingIn)
      {
        bloomOverlay.style.opacity = String(crossEased * crossEased);
        bloomOverlay.style.transform = `scale(${0.2 + 2.2 * crossEased * crossEased * crossEased})`;
      }

      if (bloomOverlay && !isZoomingIn)
      {
        bloomOverlay.style.opacity = String(0.7 * pullAwayEased * (1 - lookDownEased) * (1 - veilOpacity));
        bloomOverlay.style.transform = `scale(${0.86 + pullAwayEased * 1.15})`;
      }

      if (graySkyOverlay && !isZoomingIn)
      {
        graySkyOverlay.style.opacity = String(lookDownEased * (1 - veilOpacity));
      }

      if (rawProgress < 1)
      {
        animationFrameRef.current = requestAnimationFrame(renderAnimationFrame);
        return;
      }

      if (travelVeil) travelVeil.style.opacity = '1';
      if (vignetteOverlay) vignetteOverlay.style.opacity = '0';
      if (bloomOverlay) bloomOverlay.style.opacity = '0';
      setCurrentSiteState(isZoomingIn ? 'profile' : 'starMap');

      const fadeDurationMilliseconds = isZoomingIn ? 900 : 660;
      const fadeOutVeil = (): void =>
      {
        const veilFadeStartTime = performance.now();
        const renderVeilFadeFrame = (fadeTimestamp: number): void =>
        {
          const fadeProgress = clamp((fadeTimestamp - veilFadeStartTime) / fadeDurationMilliseconds, 0, 1);
          const veilFadeOpacity = Math.pow(1 - fadeProgress, 3);
          if (travelVeil) travelVeil.style.opacity = String(veilFadeOpacity);
          if (graySkyOverlay && !isZoomingIn) graySkyOverlay.style.opacity = String(veilFadeOpacity);
          if (fadeProgress < 1)
          {
            animationFrameRef.current = requestAnimationFrame(renderVeilFadeFrame);
            return;
          }
          if (travelVeil)
          {
            travelVeil.style.opacity = '0';
            travelVeil.style.pointerEvents = 'none';
          }
          animationFrameRef.current = 0;
          isTransitioningRef.current = false;
        };
        animationFrameRef.current = requestAnimationFrame(renderVeilFadeFrame);
      };

      transitionTimeoutRef.current = window.setTimeout(fadeOutVeil, 140);
    };

    animationFrameRef.current = requestAnimationFrame(renderAnimationFrame);
  };

  const triggerAnimation = useCallback((destinationState: siteState) =>
  {
    if (isTransitioningRef.current || destinationState === currentSiteState) return;
    isTransitioningRef.current = true;

    if (destinationState === 'profile' || destinationState === 'starMap')
    {
      if (destinationState === 'profile') animation(true, prefersReducedMotion() ? 900 : 4800);
      else animation(false, 3260);
    }
    else
    {
      setIsAnimating(true);
      transitionTimeoutRef.current = window.setTimeout(() =>
      {
        rendererRef.current?.setParams({ ...paramsRef.current, offsetX: 0, offsetY: 0 });
        setCurrentSiteState(destinationState);
        setIsAnimating(false);
        isTransitioningRef.current = false;
        transitionTimeoutRef.current = null;
      }, 400);
    }
  }, [currentSiteState]);

  useEffect(() =>
  {
    const onKey = (e: KeyboardEvent) =>
    {
      if (e.key !== 'Escape') return;
      if (lightbox)
      {
        e.stopImmediatePropagation();
        setLightbox(null);
        return;
      }
      if (currentSiteState === 'profile') triggerAnimation('entry');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [lightbox, currentSiteState, triggerAnimation]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) =>
  {
    if (!canvasRef.current || !rendererRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - canvasRect.left;
    const clickY = event.clientY - canvasRect.top;
    const isInsideBlackHole = rendererRef.current.screenClicked(clickX, clickY);

    if (isInsideBlackHole)
    {
      triggerAnimation('profile');
    }
    else
    {
      triggerAnimation('starMap');
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#03040a]">
      <div
        aria-hidden={currentSiteState !== 'entry'}
        className={`absolute inset-0 z-0 ${
          currentSiteState === 'entry' ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 h-full w-full touch-none"
        />
        {currentSiteState === 'entry' && showControls && (
          <div className="absolute right-0 top-0 z-30 h-full w-[320px]">
            <Controls p={params} set={patchParams} onClose={() => setShowControls(false)} />
          </div>
        )}
      </div>

      <LightboxContext.Provider value={setLightbox}>
        <div
          aria-hidden={currentSiteState !== 'starMap'}
          className={`absolute inset-0 z-10 overflow-hidden bg-[#03040a] ${
            currentSiteState === 'starMap' ? 'visible' : 'invisible pointer-events-none'
          }`}
        >
          <StarMap active={currentSiteState === 'starMap'} onExit={() => triggerAnimation('entry')} />

          {currentSiteState === 'starMap' && (
            <>
              <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => triggerAnimation('entry')}
                className="absolute top-3 left-1/2 z-40 -translate-x-1/2 isolate overflow-hidden bg-[#2d2423] px-3 py-2 font-mono text-xs text-[#d34343]/80 backdrop-blur-md transition hover:bg-[#3c2726] hover:text-[#ff4b4b]"
              >
                <span className="relative z-10">← Back</span>
              </motion.button>

              <AnimatePresence>
                {lightbox && (
                  <Lightbox key="lightbox" image={lightbox} onClose={() => setLightbox(null)} />
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </LightboxContext.Provider>

      {currentSiteState === 'profile' && (
        <div className="absolute inset-0 z-10 overflow-hidden bg-[#03040a]">
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-4 sm:p-6"
          >
            <Profile />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => triggerAnimation('entry')}
            className="absolute top-3 left-1/2 z-40 -translate-x-1/2 isolate overflow-hidden bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-white/80 backdrop-blur-md"
          >
            <span className="relative z-10">← Back</span>
          </motion.button>
        </div>
      )}
      <div
        ref={vignetteOverlayRef}
        aria-hidden
        className="pointer-events-none fixed z-40"
        style={{ opacity: 0, inset: '-15%' }}
      />
      <div
        ref={bloomOverlayRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40"
        style={{ opacity: 0 }}
      />
      <div
        ref={graySkyOverlayRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-[#0e1013] mix-blend-screen"
        style={{ opacity: 0 }}
      />
      <div
        ref={travelVeilRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-[#03040a]"
        style={{ opacity: 0 }}
      />
      <motion.div
        initial={false}
        animate={{ opacity: isAnimating ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        aria-hidden={!isAnimating}
        style={{ pointerEvents: isAnimating ? 'auto' : 'none' }}
        className="fixed inset-0 z-50 bg-[#03040a]"
      />
    </div>
  );
}
