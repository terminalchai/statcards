import { useRef, useState } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { Search, Download, Copy, Check, Github, BarChart2, RotateCcw, Loader2 } from 'lucide-react'
import StatsCard from './components/StatsCard'
import { useGitHubStats } from './hooks/useGitHubStats'
import { themes } from './data/themes'

export default function App() {
  const [input,    setInput]    = useState('')
  const [themeId,  setThemeId]  = useState('midnight')
  const [copied,   setCopied]   = useState(false)
  const [exporting,setExporting]= useState(false)

  const cardRef = useRef(null)
  const { status, data, error, fetchStats } = useGitHubStats()
  const theme = themes.find(t => t.id === themeId) ?? themes[0]

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    const u = input.trim()
    if (u) fetchStats(u)
  }

  const handleReset = () => {
    setInput('')
    window.location.reload()
  }

  // ── Export ────────────────────────────────────────────────────────────────
  async function captureCard(fn) {
    if (!cardRef.current || !data) return
    setExporting(true)
    try {
      await fn(cardRef.current)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = () => captureCard(async (el) => {
    const url = await toPng(el, { pixelRatio: 2, cacheBust: true })
    const a   = document.createElement('a')
    a.href     = url
    a.download = `${data.username}-statcard.png`
    a.click()
  })

  const handleCopy = () => captureCard(async (el) => {
    const blob = await toBlob(el, { pixelRatio: 2, cacheBust: true })
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  })

  const isLoading = status === 'loading'
  const hasCard   = status === 'success' && data

  return (
    <div className="min-h-screen lg:h-screen bg-surface-950 text-white flex flex-col lg:overflow-hidden">

      {/* ── Header ── */}
      <header className="border-b border-white/[0.06] bg-surface-950/90 backdrop-blur-sm flex-shrink-0 overflow-x-clip">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="logo-icon w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BarChart2 className="w-[17px] h-[17px] text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[24px] font-bold tracking-tight leading-none">StatCards</h1>
              <p className="hidden sm:block text-[10px] text-white/30 leading-none mt-0.5">GitHub stats, beautifully</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={handleReset}
                className="btn-ghost w-11 h-11 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <div className="w-px h-5 bg-white/[0.08]" />

            <button
              onClick={handleCopy}
              disabled={!hasCard || exporting}
              className="btn-ghost min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium disabled:opacity-30 cursor-pointer"
            >
              {copied
                ? <Check className="w-4 h-4 text-emerald-400" />
                : <Copy className="w-4 h-4 text-white/50" />
              }
              <span className={`hidden sm:inline ${copied ? 'text-emerald-400' : 'text-white/70'}`}>
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!hasCard || exporting}
              className="btn-export-primary flex items-center gap-2 px-5 py-2.5 min-h-[44px] min-w-[88px] rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-bold text-white hover:from-indigo-400 hover:to-purple-400 disabled:opacity-30 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export PNG
            </button>

            <a
              href="https://github.com/terminalchai/statcards"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost hidden sm:flex w-11 h-11 items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70"
              title="View source"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="sidebar lg:w-[340px] xl:w-[360px] lg:overflow-y-auto flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06]">

          {/* Search */}
          <div className="ctrl-group">
            <p className="ctrl-group-label">GitHub Username</p>
            <form onSubmit={handleSearch} className="relative">
              <input
                className="search-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. terminalchai"
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-400 disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Search"
              >
                {isLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Search className="w-3.5 h-3.5" />
                }
              </button>
            </form>

            {/* Error message */}
            {status === 'error' && (
              <p className="mt-3 text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Stats summary */}
            {data && (
              <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
                <span>✓</span>
                <span>{data.repos} repos · {data.stars} stars · {data.languages.length} languages</span>
              </div>
            )}
          </div>

          {/* Theme picker */}
          <div className="ctrl-group">
            <p className="ctrl-group-label">Theme</p>
            <div className="theme-grid">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`theme-btn${themeId === t.id ? ' selected' : ''}`}
                  title={t.name}
                >
                  {/* Mini swatch */}
                  <div
                    className="theme-swatch"
                    style={{
                      background: `linear-gradient(135deg, ${t.swatchLeft} 50%, ${t.swatchRight} 100%)`,
                      border: `1px solid ${t.border}`,
                    }}
                  />
                  <span className="theme-name">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="ctrl-group">
            <p className="ctrl-group-label">How it works</p>
            <ol className="space-y-2.5 text-[11px] text-white/35 leading-relaxed list-none">
              <li className="flex gap-2.5"><span className="text-indigo-400/70 font-mono shrink-0">01</span> Enter any public GitHub username</li>
              <li className="flex gap-2.5"><span className="text-indigo-400/70 font-mono shrink-0">02</span> Pick a theme that suits you</li>
              <li className="flex gap-2.5"><span className="text-indigo-400/70 font-mono shrink-0">03</span> Download as PNG or copy to clipboard</li>
              <li className="flex gap-2.5"><span className="text-indigo-400/70 font-mono shrink-0">04</span> Drop it in your README or portfolio</li>
            </ol>
          </div>

        </aside>

        {/* ── Canvas ── */}
        <main className="flex-1 overflow-auto canvas-bg">
          <div className="min-h-full flex items-center justify-center px-6 py-10 lg:px-10 lg:py-14">

            {/* Idle state */}
            {status === 'idle' && (
              <div className="text-center max-w-sm">
                {/* Ghost card preview */}
                <div
                  className="mb-8 text-left"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(168,85,247,0.03) 100%)',
                    border: '1px dashed rgba(99,102,241,0.2)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    opacity: 0.75,
                  }}
                >
                  <div style={{ height: 4, background: 'linear-gradient(90deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.3) 100%)' }} />
                  <div style={{ padding: 20, display: 'flex', gap: 16 }}>
                    <div style={{ width: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '2px dashed rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 className="w-5 h-5 text-indigo-400/25" />
                      </div>
                      <div style={{ width: 50, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ width: 36, height: 7, borderRadius: 4, background: 'rgba(99,102,241,0.1)' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ width: '70%', height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['Stars','Repos','Forks','PRs','Followers'].map(l => (
                          <div key={l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 56 }}>
                            <div style={{ width: 24, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }} />
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                  </div>
                </div>
                {/* Instruction */}
                <div className="flex items-center gap-3 justify-center mb-2">
                  <div className="w-px h-4 bg-white/10" />
                  <p className="text-white/35 text-sm font-medium">Type a GitHub username to see your card</p>
                  <div className="w-px h-4 bg-white/10" />
                </div>
                <p className="text-white/18 text-xs">Supports any public GitHub profile</p>
              </div>
            )}

            {/* Loading state — skeleton card */}
            {status === 'loading' && (
              <div className="w-full max-w-2xl">
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0f0f28 0%, #12122a 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  {/* accent bar skeleton */}
                  <div className="skeleton" style={{ height: 4 }} />
                  {/* body */}
                  <div style={{ padding: 24, display: 'flex', gap: 20 }}>
                    {/* left col */}
                    <div style={{ width: 92, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
                      <div className="skeleton" style={{ width: 64, height: 12 }} />
                      <div className="skeleton" style={{ width: 48, height: 10 }} />
                    </div>
                    {/* right col */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="skeleton" style={{ height: 12, width: '80%' }} />
                      <div className="skeleton" style={{ height: 12, width: '55%' }} />
                      <div style={{ display: 'flex', gap: 7 }}>
                        {[68,68,68,68,68].map((w,i) => (
                          <div key={i} className="skeleton" style={{ width: w, height: 50, borderRadius: 8 }} />
                        ))}
                      </div>
                      <div>
                        <div className="skeleton" style={{ height: 5, borderRadius: 99, marginBottom: 8 }} />
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[60,50,70,55].map((w,i) => (
                            <div key={i} className="skeleton" style={{ width: w, height: 10 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* footer placeholder */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '7px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="skeleton" style={{ width: 140, height: 10 }} />
                  </div>
                </div>
                <p className="text-center text-xs text-white/20 mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching from GitHub API…
                </p>
              </div>
            )}

            {/* Error state (canvas) */}
            {status === 'error' && (
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-red-400/70 text-sm">{error}</p>
              </div>
            )}

            {/* Card */}
            {hasCard && (
              <div className="w-full max-w-2xl">
                {/* Ambient glow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    inset: '10%',
                    background: `radial-gradient(ellipse at center, ${theme.accent}22 0%, transparent 70%)`,
                    filter: 'blur(70px)',
                    zIndex: 0,
                    transition: 'background 0.4s ease',
                  }}
                />
                <div
                  key={`${data.username}-${themeId}`}
                  className="relative z-10 card-enter"
                >
                  <StatsCard ref={cardRef} data={data} theme={theme} />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 py-3 flex items-center justify-between text-[11px] text-white/20">
        <span>
          Made with ☕ by{' '}
          <a href="https://github.com/terminalchai" target="_blank" rel="noopener noreferrer" className="text-white/35 hover:text-indigo-400 transition-colors">
            Terminal Chai
          </a>
        </span>
        <span className="hidden sm:block">Enter username → Pick theme → Export</span>
      </footer>
    </div>
  )
}
