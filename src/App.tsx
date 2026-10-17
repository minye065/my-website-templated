import { useCallback,useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import StarMap from './components/StarMap';
import Profile from './components/Profile';
import Layer1InfoPanel from './components/Layer1InfoPanel';
import Lightbox, { LightboxContext, type LightboxImage } from './components/Lightbox';
import { BlackHoleRenderer } from '././blackhole/renderer/blackhole';
import { Params, DEFAULTS } from '././blackhole/renderer/params';
import Controls from '././components/BlackHoleControls';

type siteState = 'entry' | 'starMap' | 'profile';

function clamp(value: number, min: number, max: number): number
{
  return Math.min(Math.max(value, min), max);
}

export default function App()
{
  // const [explore, setExplore] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const [showPanel, setShowPanel] = useState(false);
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
  // useEffect(() =>
  // {
  //   if(currentSiteState !== 'starMap') { return };
  //
  //   const onKey = (e: KeyboardEvent) =>
  //   {
  //     if (e.key !== 'Escape') return;
  //     if (lightbox)
  //     {
  //       setLightbox(null);
  //       return;
  //     }
  //     if (showPanel)
  //     {
  //       setShowPanel(false);
  //       return;
  //     }
  //     setExplore(false);
  //   };
  //   window.addEventListener('keydown', onKey);
  //   return () => window.removeEventListener('keydown', onKey);
  // }, [lightbox, showPanel]);

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
  }, [currentSiteState]);

  useEffect(() =>
    {
    const handleKeyDown = (e: KeyboardEvent) =>
    {
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

    if (vignetteOverlay)
    {
      vignetteOverlay.style.opacity = '0';
      vignetteOverlay.style.transform = 'scale(1)';
      vignetteOverlay.style.transformOrigin = '50% 50%';
      vignetteOverlay.style.background = isZoomingIn
        ? 'radial-gradient(circle at 50% 50%, transparent 6.15%, rgba(3,4,10,0.9) 55.4%)'
        : 'radial-gradient(circle at 50% 50%, transparent 13.8%, rgba(3,4,10,0.72) 76.9%)';
    }
    if (bloomOverlay)
    {
      bloomOverlay.style.opacity = '0';
      bloomOverlay.style.transform = 'scale(0.86)';
      bloomOverlay.style.transformOrigin = '50% 50%';
      bloomOverlay.style.background = isZoomingIn
        ? 'none'
        : 'radial-gradient(circle at 50% 50%, rgba(255,246,230,0.34) 0%, rgba(186,214,255,0.12) 16%, transparent 48%)';
    }
    if (travelVeil)
    {
      travelVeil.style.opacity = '0';
      travelVeil.style.pointerEvents = 'auto';
      travelVeil.style.backgroundColor = isZoomingIn ? '#03040a' : veilTone;
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

      let zoomEased: number;
      if (isZoomingIn)
      {
        const smoothstepProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
        const acceleratingEase = smoothstepProgress * smoothstepProgress;
        const deceleratingEase = 1 - Math.pow(1 - rawProgress, 1.65);
        zoomEased = acceleratingEase * 0.74 + deceleratingEase * 0.26;
      }
      else
      {
        zoomEased = pullAwayEased * 0.84 + rawProgress * 0.16;
      }

      if (isZoomingIn)
      {
        blackHoleRenderer.setParams({
          ...startParams,
          distance: startParams.distance + (7.15 - startParams.distance) * zoomEased,
          fieldOfView: startParams.fieldOfView + (3.08 - startParams.fieldOfView) * zoomEased,
          offsetX: startParams.offsetX + (0 - startParams.offsetX) * zoomEased,
          offsetY: startParams.offsetY + (0 - startParams.offsetY) * zoomEased,
          exposure: startParams.exposure + (startParams.exposure * 1.14 - startParams.exposure) * zoomEased,
          diskGlow: startParams.diskGlow + (Math.min(1, startParams.diskGlow + 0.32) - startParams.diskGlow) * zoomEased,
          doppler: startParams.doppler + (Math.min(1, startParams.doppler + 0.16) - startParams.doppler) * zoomEased,
          starBrightness: startParams.starBrightness + (startParams.starBrightness * 0.24 - startParams.starBrightness) * zoomEased,
          roll: startParams.roll + (startParams.roll - 6.5 - startParams.roll) * zoomEased,
        });
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

      const veilStartProgress = isZoomingIn ? 0.80 : 0.85;
      const veilProgress = clamp((rawProgress - veilStartProgress) / (1 - veilStartProgress), 0, 1);
      const veilOpacity = veilProgress * veilProgress * (3 - 2 * veilProgress);
      if (travelVeil) travelVeil.style.opacity = String(veilOpacity);

      if (vignetteOverlay)
      {
        const maxVignetteOpacity = isZoomingIn ? 0.72 : 0.36;
        vignetteOverlay.style.opacity = String(maxVignetteOpacity * zoomEased * (1 - veilOpacity));
        vignetteOverlay.style.transform = isZoomingIn ? `scale(${1.08 - zoomEased * 0.22})` : 'scale(1)';
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

      const fadeOutVeil = (): void =>
      {
        const veilFadeStartTime = performance.now();
        const renderVeilFadeFrame = (fadeTimestamp: number): void =>
        {
          const fadeProgress = clamp((fadeTimestamp - veilFadeStartTime) / 660, 0, 1);
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
      if (destinationState === 'profile') animation(true, 2620);
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
      console.log('inside');
    }
    else
    {
      triggerAnimation('starMap');
      console.log('outside');
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
          <StarMap active={currentSiteState === 'starMap'} />

          {currentSiteState === 'starMap' && (
            <>
              <button
                aria-label={showPanel ? 'Close panel' : 'Open info'}
                onClick={() => setShowPanel((prev) => !prev)}
                className="absolute bottom-4 left-4 z-40 h-40 w-60 bg-transparent"
              />

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
                {showPanel && (
                  <Layer1InfoPanel key="layer1-panel" onClose={() => setShowPanel(false)} />
                )}
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
