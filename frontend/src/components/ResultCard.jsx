import { useEffect, useRef, useState } from 'react'

const COLORS = {
  Positive:             '#00ff88',
  Negative:             '#ff2d78',
  Neutral:              '#ffd700',
  'Negative (Sarcastic)': '#ff2d78',
}
const EMOJIS = {
  Positive:             '😊',
  Negative:             '😠',
  Neutral:              '😐',
  'Negative (Sarcastic)': '🙄',
}

/* ── Animated score bar ──────────────────────────────────────────────────── */
function ScoreBar({ label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 100)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <div style={{ marginBottom:'14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
        <span style={{ fontSize:'12px', color:'#6b6888', letterSpacing:'0.05em' }}>{label}</span>
        <span style={{ fontSize:'13px', color, fontWeight:700, fontFamily:'JetBrains Mono',
          animation: width > 0 ? 'countUp .4s ease' : 'none' }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:'99px', height:'5px', overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:'99px',
          background:`linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow:`0 0 10px ${color}66`,
          width:`${width}%`,
          transition:`width .8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        }}/>
      </div>
    </div>
  )
}

/* ── Glass card panel ────────────────────────────────────────────────────── */
function Panel({ title, accentColor, children, delay = 0 }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.025)',
      backdropFilter:'blur(12px)',
      border:`1px solid rgba(255,255,255,0.06)`,
      borderRadius:'16px', padding:'22px',
      borderTop:`2px solid ${accentColor}44`,
      animation:`fadeUp .5s ${delay}ms ease both`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
        <div style={{ width:'2px', height:'14px', background:accentColor, borderRadius:'99px' }}/>
        <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:accentColor }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

/* ── Main 3D result hero ─────────────────────────────────────────────────── */
function ResultHero({ emoji, label, confidence, color, sarcasmWarning }) {
  const [hover, setHover] = useState(false)
  const [tilt,  setTilt]  = useState({ x:0, y:0 })
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 14
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -14
    setTilt({ x, y })
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setTilt({ x:0, y:0 }) }}
      onMouseMove={handleMouseMove}
      style={{
        position:'relative', overflow:'hidden', borderRadius:'20px',
        padding:'40px 28px', textAlign:'center',
        background:`linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        border:`1px solid ${color}30`,
        boxShadow: hover ? `0 24px 60px ${color}22, 0 0 0 1px ${color}20` : `0 8px 32px ${color}10`,
        transform: hover ? `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(1.01)` : 'perspective(800px) rotateX(0) rotateY(0) scale(1)',
        transition:'transform .15s ease, box-shadow .3s ease',
        cursor:'none',
        animation:'fadeUp .4s ease',
      }}
    >
      {/* Glow spot that follows tilt */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'20px', pointerEvents:'none',
        background:`radial-gradient(circle at ${50 + tilt.x * 3}% ${50 - tilt.y * 3}%, ${color}18 0%, transparent 60%)`,
        transition:'background .15s',
      }}/>

      {/* Corner decoration */}
      <div style={{ position:'absolute', top:'16px', right:'16px', opacity:0.3 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" stroke={color} strokeWidth="1" strokeDasharray="4 6"/>
        </svg>
      </div>

      <div style={{
        fontSize:'56px', marginBottom:'12px', display:'inline-block',
        filter:`drop-shadow(0 0 20px ${color}88)`,
        transform: hover ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
        transition:'transform .3s cubic-bezier(0.16,1,0.3,1)',
        animation:'countUp .5s ease',
      }}>
        {emoji}
      </div>

      <div style={{
        fontFamily:'Bebas Neue', fontSize:'40px', letterSpacing:'0.06em',
        color, lineHeight:1, marginBottom:'8px',
        textShadow:`0 0 30px ${color}66`,
        animation:'countUp .5s .1s ease both',
      }}>
        {label}
      </div>

      <div style={{
        fontFamily:'JetBrains Mono', fontSize:'13px', color:'#6b6888', marginTop:'6px',
        animation:'fadeIn .5s .2s ease both',
      }}>
        {confidence.toFixed(1)}% confidence
      </div>

      {sarcasmWarning && (
        <div style={{
          marginTop:'16px', padding:'10px 18px',
          background:'rgba(255,45,120,0.1)', border:'1px solid rgba(255,45,120,0.3)',
          borderRadius:'10px', fontSize:'12px', color:'#ff6b9d',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          animation:'fadeUp .4s .3s ease both',
        }}>
          <span>🙄</span>
          <span style={{ letterSpacing:'0.03em' }}>Sarcasm detected — sentiment corrected to Negative</span>
        </div>
      )}
    </div>
  )
}

/* ── Language badge ──────────────────────────────────────────────────────── */
function LangBadge({ language, wasTranslated, original, translated }) {
  const [open, setOpen] = useState(false)
  return (
    <Panel title="Language Processing" accentColor="var(--green)" delay={200}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
        <div style={{
          background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.25)',
          borderRadius:'99px', padding:'6px 16px', fontSize:'12px', fontWeight:600, color:'var(--green)',
          display:'flex', alignItems:'center', gap:'6px',
        }}>
          🌐 {language.name}
          {wasTranslated && (
            <span style={{ background:'rgba(0,255,136,0.2)', borderRadius:'99px', padding:'1px 8px', fontSize:'10px', marginLeft:'4px' }}>
              Translated
            </span>
          )}
        </div>

        {wasTranslated && (
          <button onClick={() => setOpen(o => !o)} style={{
            background:'none', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'99px', padding:'5px 14px', fontSize:'11px',
            color:'#666', cursor:'none', fontFamily:'DM Sans', transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color='#aaa'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.color='#666'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)' }}
          >
            {open ? '▲ Hide' : '▼ Show translation'}
          </button>
        )}
      </div>

      {open && wasTranslated && (
        <div style={{ marginTop:'16px', animation:'fadeUp .3s ease' }}>
          <div style={{ marginBottom:'12px' }}>
            <div style={{ fontSize:'10px', color:'#555', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'6px' }}>Original ({language.name})</div>
            <div style={{ fontSize:'14px', color:'#bbb', fontStyle:'italic', lineHeight:1.6, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:'8px', borderLeft:'2px solid rgba(255,255,255,0.1)' }}>
              {original}
            </div>
          </div>
          <div>
            <div style={{ fontSize:'10px', color:'#555', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'6px' }}>Translated (English)</div>
            <div style={{ fontSize:'14px', color:'#ddd', lineHeight:1.6, padding:'10px 14px', background:'rgba(0,255,136,0.04)', borderRadius:'8px', borderLeft:'2px solid rgba(0,255,136,0.3)' }}>
              {translated}
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}

/* ── Main ResultCard ─────────────────────────────────────────────────────── */
export default function ResultCard({ result }) {
  if (!result) return null
  const { sentiment, sarcasm, adjusted_label, sarcasm_warning, language, was_translated, original_text, processed_text, ocr } = result

  // ✅ ONLY CHANGE: use 'Negative (Sarcastic)' label when sarcasm is detected
  const effectiveLabel = (sarcasm?.label === 'Sarcastic') ? 'Negative (Sarcastic)' : adjusted_label
  const mainColor = COLORS[effectiveLabel] || COLORS[sentiment?.label] || '#6c63ff'
  const mainEmoji = EMOJIS[effectiveLabel] || EMOJIS[sentiment?.label] || '❓'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

      {/* 3D Hero */}
      <ResultHero
        emoji={mainEmoji}
        label={effectiveLabel}
        confidence={sentiment?.confidence || 0}
        color={mainColor}
        sarcasmWarning={sarcasm_warning}
      />

      {/* Scores grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

        <Panel title="Sentiment Scores" accentColor="var(--cyan)" delay={100}>
          <ScoreBar label="Positive" value={sentiment?.scores?.Positive || 0} color="var(--positive)" delay={0} />
          <ScoreBar label="Neutral"  value={sentiment?.scores?.Neutral  || 0} color="var(--neutral)"  delay={80} />
          <ScoreBar label="Negative" value={sentiment?.scores?.Negative || 0} color="var(--negative)" delay={160} />
        </Panel>

        <Panel title="Sarcasm Detection" accentColor="var(--magenta)" delay={150}>
          <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
            <div style={{ fontSize:'34px', marginBottom:'6px',
              filter:`drop-shadow(0 0 12px ${sarcasm?.label==='Sarcastic' ? 'var(--magenta)' : 'var(--green)'}88)`,
            }}>
              {sarcasm?.emoji}
            </div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:'22px', letterSpacing:'0.06em',
              color: sarcasm?.label === 'Sarcastic' ? 'var(--magenta)' : 'var(--green)',
            }}>
              {sarcasm?.label}
            </div>
            <div style={{ fontSize:'12px', fontFamily:'JetBrains Mono', color:'#555', marginTop:'4px' }}>
              {sarcasm?.confidence?.toFixed(1)}%
            </div>
          </div>
          <ScoreBar label="Sarcastic"     value={sarcasm?.scores?.Sarcastic || 0}         color="var(--magenta)" delay={0} />
          <ScoreBar label="Not Sarcastic" value={sarcasm?.scores?.['Not Sarcastic'] || 0} color="var(--green)"   delay={80} />
        </Panel>
      </div>

      {/* Language */}
      {language && (
        <LangBadge
          language={language}
          wasTranslated={was_translated}
          original={original_text}
          translated={processed_text}
        />
      )}

      {/* OCR */}
      {ocr?.text_found && (
        <Panel title={`OCR · ${ocr.regions_count} Text Region${ocr.regions_count !== 1 ? 's' : ''} Found`} accentColor="var(--gold)" delay={250}>
          <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
            {ocr.lines.map((line, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 12px', borderRadius:'8px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                animation:`slideInLeft .3s ${i * 50}ms ease both`,
              }}>
                <span style={{ fontSize:'13px', color:'#ccc', fontFamily:'DM Sans' }}>{line.text}</span>
                <span style={{
                  fontSize:'11px', fontFamily:'JetBrains Mono',
                  color: line.confidence > 80 ? 'var(--green)' : line.confidence > 50 ? 'var(--gold)' : 'var(--magenta)',
                  background:'rgba(255,255,255,0.05)', borderRadius:'99px', padding:'2px 8px',
                }}>
                  {line.confidence}%
                </span>
              </div>
            ))}
          </div>
          {ocr.note && (
            <div style={{ marginTop:'12px', fontSize:'11px', color:'#555', fontStyle:'italic' }}>
              ℹ️ {ocr.note}
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}