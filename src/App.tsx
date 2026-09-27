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

export default function App()
{
  // const [explore, setExplore] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [showControls, setShowControls] = useState(false);
  const [currentSiteState, setCurrentSiteState] = useState<siteState>('entry')
  const [inAnimation, setAnimationState] = useState(false);

  // useEffect(() =>
  // {
  //   if(currentSiteState !== 'starMap') { return };
      
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

  useEffect(() =>
  {
    if (!canvasRef.current) return;
    const renderer = new BlackHoleRenderer(canvasRef.current, DEFAULTS);
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [currentSiteState]);
  useEffect(() => {
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
const set = useCallback((patch: Partial<Params>) =>
  {
    setParams((prev) =>
    {
      const next = { ...prev, ...patch };
      rendererRef.current?.setParams(next);
      return next;
    });
  }, []);
const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) =>
  {
    if (!canvasRef.current || !rendererRef.current) return;
    const canvas = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - canvas.left;
    const y = event.clientY - canvas.top;
    const isInside = rendererRef.current.screenClicked(x, y);
    if (isInside)
    {
      setCurrentSiteState('profile');
      console.log("inside");
    }
    else
    {
      setCurrentSiteState('starMap');
      console.log("outside");
    }
  };
  const triggerAnimation = (targetState: siteState) =>
  {
    setAnimationState(true);
    setTimeout(() =>
    {
      setCurrentSiteState(targetState);
      setAnimationState(false);
    }, 400);
  }

  if(currentSiteState == 'entry')
  {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 h-full w-full touch-none"
        />
        {showControls && (
          <div className="absolute right-0 top-0 z-30 h-full w-[320px]">
            <Controls p={params} set={set} onClose={() => setShowControls(false)} />
          </div>
        )}
        <AnimatePresence>
          {inAnimation && (
            <motion.div
              key="fade-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="pointer-events-none fixed inset-0 z-50 bg-[#03040a]"
            />
          )}
      </AnimatePresence>
      </div>
      
    );
  }
else if(currentSiteState == 'starMap')
{
  return(
    <LightboxContext.Provider value={setLightbox}>
      <div className="relative h-[100dvh] w-full overflow-hidden bg-[#03040a]">
        <StarMap active/>

        <button aria-label={showPanel ? 'Close panel' : 'Open info'}
          onClick={() => setShowPanel((prev) => !prev)}
          className="absolute bottom-4 left-4 z-40 h-40 w-60 bg-transparent"
        />

        <motion.button
          key="back"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          onClick={() => triggerAnimation('entry')}
          className="absolute top-3 left-1/2 z-40 -translate-x-1/2 isolate overflow-hidden bg-[#2d2423] px-3 py-2 font-mono text-xs text-[#d34343]/80 backdrop-blur-md transition hover:bg-[#3c2726] hover:text-[#ff4b4b] before:pointer-events-none before:absolute before:inset-y-0 before:-left-[200%] before:z-0 before:w-[75%] before:skew-x-[-22deg] before:bg-[#ff4b4b]/30 before:opacity-0 before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[420%] hover:before:opacity-100"
        >
          <span className="relative z-10">← Back</span>
        </motion.button>

        <AnimatePresence>
          {showPanel && (
            <Layer1InfoPanel
              key="layer1-panel"
              onClose={() => setShowPanel(false)}
            />
          )}
          {lightbox && (
            <Lightbox
              key="lightbox"
              image={lightbox}
              onClose={() => setLightbox(null)}
            />
          )}
          {inAnimation && (
            <motion.div
              key="fade-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="pointer-events-none fixed inset-0 z-50 bg-[#03040a]"
            />
          )}
        </AnimatePresence>
      </div>
    </LightboxContext.Provider>
    )
  }
  else if(currentSiteState == 'profile')
  {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-[#03040a]">
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-4 sm:p-6"
        >
          <Profile />
        </motion.div>
        
        <motion.button
          key="back"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => triggerAnimation('entry')}
          className="absolute top-3 left-1/2 z-40 -translate-x-1/2 isolate overflow-hidden bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-white/80 backdrop-blur-md cursor-pointer before:pointer-events-none before:absolute before:inset-y-0 before:-left-[200%] before:z-0 before:w-[75%] before:skew-x-[-22deg] before:bg-white/20 before:opacity-0 before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[420%] hover:before:opacity-100"
        >
          <span className="relative z-10">← Back</span>
        </motion.button>

        <AnimatePresence>
          {inAnimation && (
            <motion.div
              key="fade-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="pointer-events-none fixed inset-0 z-50 bg-[#03040a]"
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
}