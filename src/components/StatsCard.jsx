import { forwardRef } from 'react'
import { getLangColor } from '../data/langColors'

function formatNum(n) {
  if (n === null || n === undefined) return '—'
  if (typeof n === 'string') return n
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function StatPill({ label, value, theme }) {
  return (
    <div style={{
      background:   theme.statBg,
      border:       `1px solid ${theme.border}`,
      borderRadius: 8,
      padding:      '8px 12px',
      display:      'flex',
      flexDirection:'column',
      gap:          3,
      minWidth:     68,
    }}>
      <span style={{ fontSize: 17, fontWeight: 700, color: theme.text, lineHeight: 1 }}>
        {formatNum(value)}
      </span>
      <span style={{
        fontSize:      10,
        color:         theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontWeight:    600,
      }}>
        {label}
      </span>
    </div>
  )
}

const StatsCard = forwardRef(function StatsCard({ data, theme }, ref) {
  if (!data) return null

  return (
    <div
      ref={ref}
      style={{
        fontFamily:          "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        background:          theme.bgGradient,
        border:              `1px solid ${theme.border}`,
        borderRadius:        16,
        overflow:            'hidden',
        width:               '100%',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {/* ── Accent bar ── */}
      <div style={{ height: 4, background: theme.accentGradient, flexShrink: 0 }} />

      {/* ── Body ── */}
      <div style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Left — avatar + identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 92, flexShrink: 0 }}>
          {/* Avatar with glow */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{
              position:     'absolute',
              inset:        -6,
              borderRadius: '50%',
              background:   `radial-gradient(circle, ${theme.accent}22 0%, transparent 70%)`,
            }} />
            <img
              src={data.avatar}
              alt={data.name}
              style={{
                width:        72,
                height:       72,
                borderRadius: '50%',
                display:      'block',
                border:       `2.5px solid ${theme.accent}55`,
                position:     'relative',
              }}
            />
          </div>
          <span style={{
            fontSize:   13,
            fontWeight: 700,
            color:      theme.text,
            textAlign:  'center',
            lineHeight: 1.3,
            wordBreak:  'break-word',
          }}>
            {data.name}
          </span>
          <span style={{ fontSize: 11, color: theme.accent, marginTop: 4, opacity: 0.9 }}>
            @{data.username}
          </span>
          {data.location && (
            <span style={{ fontSize: 10, color: theme.textMuted, marginTop: 6, textAlign: 'center' }}>
              📍 {data.location}
            </span>
          )}
        </div>

        {/* Right — bio + stats + languages */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Bio */}
          {data.bio && (
            <p style={{
              margin:               0,
              fontSize:             12,
              color:                theme.textMuted,
              lineHeight:           1.55,
              display:              '-webkit-box',
              WebkitLineClamp:      2,
              WebkitBoxOrient:      'vertical',
              overflow:             'hidden',
            }}>
              {data.bio}
            </p>
          )}

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <StatPill label="Stars"     value={data.stars}     theme={theme} />
            <StatPill label="Repos"     value={data.repos}     theme={theme} />
            <StatPill label="Forks"     value={data.forks}     theme={theme} />
            <StatPill label="PRs"       value={data.prs}       theme={theme} />
            <StatPill label="Followers" value={data.followers} theme={theme} />
          </div>

          {/* Languages */}
          {data.languages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {/* Segmented bar */}
              <div style={{
                height:       5,
                borderRadius: 99,
                overflow:     'hidden',
                display:      'flex',
                background:   'rgba(255,255,255,0.05)',
              }}>
                {data.languages.map(l => (
                  <div
                    key={l.name}
                    style={{ width: `${l.percent}%`, background: getLangColor(l.name), flexShrink: 0 }}
                  />
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {data.languages.slice(0, 5).map(l => (
                  <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width:        8,
                      height:       8,
                      borderRadius: '50%',
                      background:   getLangColor(l.name),
                      flexShrink:   0,
                    }} />
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{l.name}</span>
                    <span style={{ fontSize: 11, color: theme.text, fontWeight: 600 }}>{l.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Footer watermark ── */}
      <div style={{
        borderTop:  `1px solid ${theme.border}`,
        padding:    '7px 24px',
        display:    'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: theme.textMuted, opacity: 0.6, letterSpacing: '0.04em' }}>
          statcards · github.com/terminalchai
        </span>
      </div>
    </div>
  )
})

export default StatsCard
