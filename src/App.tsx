/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { generateBrandAsset } from './services/imageService';
import { generateTaglines } from './services/textService';
import { Loader2, ImagePlus, Wand2, KeyRound, Download, RefreshCw, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Asset = {
  id: string;
  medium: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  promptSnippet: string;
  variation: string | null;
  url: string | null;
  loading: boolean;
  error: string | null;
};

const DEFAULT_ASSETS: Omit<Asset, 'url' | 'loading' | 'error'>[] = [
  { id: '1', medium: 'Billboard on a busy highway', aspectRatio: '16:9', promptSnippet: 'large realistic outdoor billboard' },
  { id: '2', medium: 'Newspaper Print Ad', aspectRatio: '3:4', promptSnippet: 'vintage black and white newspaper advertisement layout' },
  { id: '3', medium: 'Instagram Social Post', aspectRatio: '1:1', promptSnippet: 'aesthetic social media lifestyle shot' },
];

function ApiKeySetup({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center"
      >
        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-semibold mb-3">API Key Required</h1>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Brand Builder requires a Google Cloud project with billing enabled to generate high-resolution AI images.
        </p>
        <button
          onClick={onSetup}
          className="w-full bg-white text-black font-medium text-sm px-4 py-3 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          Select Google Cloud Project
        </button>
      </motion.div>
    </div>
  );
}

function MainApp() {
  const [productDesc, setProductDesc] = useState('');
  const [logoConcept, setLogoConcept] = useState('');
  const [variations, setVariations] = useState<string[]>(['']);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [taglines, setTaglines] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTaglines, setIsGeneratingTaglines] = useState(false);
  const [taglinesError, setTaglinesError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!productDesc.trim()) return;

    setIsGenerating(true);
    setTaglines([]);
    setTaglinesError(null);
    
    // Determine active variations
    let activeVariations = variations.map(v => v.trim()).filter(Boolean);
    if (activeVariations.length === 0) {
      activeVariations = ['']; // fallback to base product
    }

    // Initialize new assets
    const newAssets: Asset[] = [];
    activeVariations.forEach((variation, varIdx) => {
      DEFAULT_ASSETS.forEach(asset => {
        newAssets.push({
          ...asset,
          id: `${varIdx}-${asset.id}`,
          variation: variation || null,
          url: null,
          loading: true,
          error: null,
        });
      });
    });
    setAssets(newAssets);

    // Call text generation in background
    setIsGeneratingTaglines(true);
    generateTaglines(productDesc, activeVariations, logoConcept)
      .then(tags => setTaglines(tags))
      .catch(err => setTaglinesError(err.message))
      .finally(() => setIsGeneratingTaglines(false));

    // Generate them in parallel
    await Promise.all(
      newAssets.map(async (asset) => {
        try {
          const url = await generateBrandAsset(
            `${productDesc}, ${asset.promptSnippet}`,
            asset.medium,
            asset.aspectRatio,
            asset.variation || undefined,
            logoConcept || undefined,
            "2K"
          );
          setAssets(prev => prev.map(a => (a.id === asset.id ? { ...a, url, loading: false } : a)));
        } catch (error: any) {
          setAssets(prev => prev.map(a => (a.id === asset.id ? { ...a, loading: false, error: error.message } : a)));
        }
      })
    );

    setIsGenerating(false);
  };

  const handleRegenerateSingle = async (assetToRegen: Asset) => {
    setAssets(prev => prev.map(a => (a.id === assetToRegen.id ? { ...a, loading: true, error: null } : a)));
    try {
      const url = await generateBrandAsset(
        `${productDesc}, ${assetToRegen.promptSnippet}`,
        assetToRegen.medium,
        assetToRegen.aspectRatio,
        assetToRegen.variation || undefined,
        logoConcept || undefined,
        "2K"
      );
      setAssets(prev => prev.map(a => (a.id === assetToRegen.id ? { ...a, url, loading: false } : a)));
    } catch (error: any) {
      setAssets(prev => prev.map(a => (a.id === assetToRegen.id ? { ...a, loading: false, error: error.message } : a)));
    }
  };

  return (
    <div className="h-screen bg-[#F3F4F6] text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-black selection:text-white">
      <header className="flex shrink-0 items-center justify-between px-8 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Brand Builder</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-widest text-slate-400">Model: Nano-banana v2.4</span>
          <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">High Res Active</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar: Controls */}
        <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-6 overflow-y-auto shrink-0 z-10 md:shadow-none shadow-md">
          <div className="space-y-4 shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Product Description</label>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-600 outline-none focus:ring-2 focus:ring-black/5 resize-none h-32 italic placeholder:not-italic"
              placeholder='e.g., "A sleek, ergonomic titanium water bottle with a matte charcoal finish..."'
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>

          <div className="space-y-4 shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Logo Concept <span className="opacity-60">(Optional)</span></label>
            <input
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-black/5"
              placeholder='e.g., "A minimalist mountain peak"'
              value={logoConcept}
              onChange={(e) => setLogoConcept(e.target.value)}
            />
          </div>

          <div className="space-y-4 shrink-0">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Variations <span className="opacity-60">(Optional)</span></label>
              <button 
                onClick={() => setVariations([...variations, ''])}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <Plus className="w-3 h-3"/> Add
              </button>
            </div>
            {variations.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input 
                  type="text"
                  value={v}
                  onChange={(e) => {
                    const newV = [...variations];
                    newV[i] = e.target.value;
                    setVariations(newV);
                  }}
                  placeholder="e.g., Matte Black"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-black/5"
                />
                {variations.length > 1 && (
                  <button onClick={() => setVariations(variations.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-2 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto md:pt-8 pt-4 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !productDesc.trim()}
              className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isGenerating ? 'Generating...' : 'Re-Imagine Brand'}
            </button>
          </div>
        </aside>

        {/* Main Canvas */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto">
          {assets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center max-w-lg mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm w-full">
                <h2 className="text-3xl font-light text-slate-900 tracking-tighter uppercase mb-4">Design pure.</h2>
                <div className="h-1 w-12 bg-black mx-auto mb-6"></div>
                <p className="text-xs text-slate-400 tracking-widest uppercase leading-relaxed max-w-sm mx-auto">
                  Describe your product to the left to visualize it consistently across billboards, newspapers, and social media.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-12 max-w-5xl mx-auto pb-12">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Generated Campaigns</h2>
              </div>
              
              {/* Taglines Section */}
              <AnimatePresence>
                {(taglines.length > 0 || isGeneratingTaglines) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 xl:p-8 shadow-sm overflow-hidden"
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Suggested Taglines</h3>
                    {isGeneratingTaglines ? (
                      <div className="flex items-center text-slate-400 gap-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs uppercase tracking-widest font-bold">Copywriting in progress...</span>
                      </div>
                    ) : taglinesError ? (
                      <div className="text-red-500 text-xs font-bold uppercase tracking-widest">{taglinesError}</div>
                    ) : (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {taglines.map((tagline, i) => (
                          <li key={i} className="font-serif text-lg italic text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start">
                            <span className="text-slate-300 font-sans font-bold text-2xl mr-3 leading-none">"</span>
                            {tagline}
                            <span className="text-slate-300 font-sans font-bold text-2xl ml-1 leading-none self-end">"</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generated Images grouped by variation */}
              <div className="space-y-16">
                {Array.from(new Set(assets.map(a => a.variation))).map((variation, varIndex) => (
                  <div key={varIndex} className="space-y-6">
                    {variation && (
                      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <h3 className="text-sm font-bold tracking-widest text-black uppercase">
                          Variation: <span className="text-slate-500">{variation}</span>
                        </h3>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                      <AnimatePresence>
                        {assets.filter(a => a.variation === variation).map((asset, index) => (
                          <motion.div
                            key={asset.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col group ${asset.aspectRatio === '16:9' ? 'xl:col-span-2' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-3 px-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medium: {asset.medium}</span>
                              <span className="text-[10px] text-slate-300">{asset.aspectRatio} Aspect</span>
                            </div>
                            
                            <div className={`relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 w-full group transition-all ${
                              asset.aspectRatio === '16:9' ? 'aspect-video' :
                              asset.aspectRatio === '3:4' ? 'aspect-[3/4]' : 'aspect-square'
                            }`}>
                              {asset.loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-300" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Visualizing...</span>
                                </div>
                              ) : asset.error ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-6 text-center bg-red-50">
                                  <span className="text-sm font-bold uppercase tracking-widest mb-2">Generation Failed</span>
                                  <span className="text-[10px] px-8 text-red-400 leading-relaxed uppercase">{asset.error}</span>
                                  <button onClick={() => handleRegenerateSingle(asset)} className="mt-4 text-[10px] font-bold bg-white text-red-600 border border-red-200 uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 shadow-sm transition-colors">
                                    Try Again
                                  </button>
                                </div>
                              ) : asset.url ? (
                                <>
                                  <img
                                    src={asset.url}
                                    alt={`${productDesc} on ${asset.medium}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-3">
                                      <button 
                                        onClick={() => handleRegenerateSingle(asset)}
                                        className="bg-white text-black font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                                        title="Regenerate"
                                      >
                                        <RefreshCw className="w-3 h-3" /> Regenerate
                                      </button>
                                      <a 
                                        href={asset.url}
                                        download={`${productDesc.replace(/\s+/g, '-').toLowerCase()}-${asset.medium.replace(/\s+/g, '-').toLowerCase()}.jpg`}
                                        className="bg-white text-black font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                                        title="Download"
                                      >
                                        <Download className="w-3 h-3" /> Download
                                      </a>
                                    </div>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="shrink-0 px-8 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-widest uppercase z-10 relative">
        <div className="flex gap-6">
          <span>ACTIVE NODES: {assets.length > 0 ? '3' : '1'}</span>
          <span className="hidden sm:inline">LATENCY: {isGenerating ? 'ANALYZING...' : '12ms'}</span>
          <span className="hidden md:inline">STORAGE: Cloud-Sync Enabled</span>
        </div>
        <div className="text-slate-900">
          {isGenerating ? 'Processor Active' : 'System Ready'}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    // Determine if we're in the AI studio preview environment
    if (window.aistudio?.hasSelectedApiKey) {
      window.aistudio.hasSelectedApiKey()
        .then(setHasKey)
        .catch(() => setHasKey(false));
    } else {
      // If we're not running in AI studio window, just assume we have the key provided via env
      setHasKey(true);
    }
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assuming success to avoid race condition where hasSelectedApiKey returns false immediately after selection
        setHasKey(true);
      }
    } catch (e) {
      console.error(e);
      // Reset state on failure so the user can try again
      window.aistudio?.hasSelectedApiKey().then(setHasKey).catch(() => setHasKey(false));
    }
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!hasKey) {
    return <ApiKeySetup onSetup={handleSelectKey} />;
  }

  return <MainApp />;
}

