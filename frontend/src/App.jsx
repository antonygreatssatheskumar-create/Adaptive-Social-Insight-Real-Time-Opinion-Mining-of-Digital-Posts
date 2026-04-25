import { useState, useEffect, useRef } from 'react'
import TextAnalyzer from './components/TextAnalyzer.jsx'
import ImageAnalyzer from './components/ImageAnalyzer.jsx'

/* ── Floating orb background ─────────────────────────────────────────────── */
function OrbField() {
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      {/* Large slow orbs */}
      <div style={{
        position:'absolute', width:'700px', height:'700px',
        borderRadius:'50%', top:'-200px', left:'-200px',
        background:'radial-gradient(circle, #00f5ff12 0%, transparent 70%)',
        animation:'orb1 18s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', width:'600px', height:'600px',
        borderRadius:'50%', bottom:'-150px', right:'-150px',
        background:'radial-gradient(circle, #ff2d7812 0%, transparent 70%)',
        animation:'orb2 22s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', width:'400px', height:'400px',
        borderRadius:'50%', top:'40%', left:'50%',
        background:'radial-gradient(circle, #ffd70008 0%, transparent 70%)',
        animation:'orb3 28s ease-in-out infinite',
      }}/>
      {/* Grid overlay */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`
          linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize:'60px 60px',
      }}/>
      {/* Scanline */}
      <div style={{
        position:'absolute', left:0, right:0, height:'2px',
        background:'linear-gradient(90deg, transparent, #00f5ff18, transparent)',
        animation:'scanline 8s linear infinite',
      }}/>
    </div>
  )
}

/* ── Custom cursor ───────────────────────────────────────────────────────── */
function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  const pos     = useRef({ x:0, y:0 })
  const ring    = useRef({ x:0, y:0 })

  useEffect(() => {
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top  = e.clientY + 'px'
      }
    }
    let raf
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.14
      ring.current.y += (pos.current.y - ring.current.y) * 0.14
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px'
        ringRef.current.style.top  = ring.current.y + 'px'
      }
      raf = requestAnimationFrame(animate)
    }
    window.addEventListener('mousemove', move)
    raf = requestAnimationFrame(animate)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div id="cursor">
      <div ref={dotRef} id="cursor-dot" style={{ position:'fixed', width:'8px', height:'8px', background:'#fff', borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9999, transition:'width .2s, height .2s, background .2s' }}/>
      <div ref={ringRef} id="cursor-ring" style={{ position:'fixed', width:'36px', height:'36px', border:'1.5px solid rgba(255,255,255,0.45)', borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9998 }}/>
    </div>
  )
}

/* ── Animated counter ────────────────────────────────────────────────────── */
function StatBadge({ value, label, color }) {
  return (
    <div style={{ textAlign:'center', animation:'fadeUp .6s ease both' }}>
      <div style={{ fontFamily:'Bebas Neue', fontSize:'38px', color, lineHeight:1, letterSpacing:'0.05em' }}>{value}</div>
      <div style={{ fontSize:'11px', color:'#6b6888', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:'2px' }}>{label}</div>
    </div>
  )
}

/* ── Tab button ──────────────────────────────────────────────────────────── */
function Tab({ active, onClick, children, icon }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex:1, padding:'18px 24px', background:'none', border:'none',
        cursor:'none', fontFamily:'DM Sans', fontSize:'13px', fontWeight:600,
        letterSpacing:'0.08em', textTransform:'uppercase',
        color: active ? '#fff' : hovered ? '#aaa' : '#555',
        borderBottom: active ? '2px solid var(--cyan)' : '2px solid transparent',
        transition:'all .25s cubic-bezier(0.16,1,0.3,1)',
        position:'relative', overflow:'hidden',
      }}
    >
      {(active || hovered) && (
        <div style={{
          position:'absolute', inset:0,
          background: active ? 'linear-gradient(180deg, #00f5ff08 0%, transparent 100%)' : 'linear-gradient(180deg, #ffffff05 0%, transparent 100%)',
          pointerEvents:'none',
        }}/>
      )}
      <span style={{ position:'relative' }}>{icon} {children}</span>
    </button>
  )
}

const FEATURES = [
  { icon:'⚡', label:'Real-time Analysis', color:'var(--cyan)' },
  { icon:'🌐', label:'100+ Languages',     color:'var(--gold)' },
  { icon:'🙄', label:'Sarcasm Detection',  color:'var(--magenta)' },
  { icon:'🖼️', label:'Image OCR',          color:'var(--green)' },
]

export default function App() {
  const [tab, setTab] = useState('text')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Cursor />
      <OrbField />

      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', padding:'0 0 80px' }}>

        {/* ── ONLY CHANGE: maxWidth 820px → 1400px, padding 0 24px → 0 48px ── */}
        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 48px' }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <header style={{ paddingTop:'64px', paddingBottom:'52px', opacity: loaded ? 1 : 0, transition:'opacity .8s ease' }}>

            {/* Top badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'8px',
              background:'rgba(0,245,255,0.06)', border:'1px solid rgba(0,245,255,0.2)',
              borderRadius:'99px', padding:'6px 18px', marginBottom:'28px',
              animation:'fadeUp .5s ease both',
            }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--cyan)', display:'inline-block', animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:'11px', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--cyan)' }}>
                Final Year Project · ML Powered
              </span>
            </div>

            {/* Big title */}
            <div style={{ overflow:'hidden', marginBottom:'4px', animation:'fadeUp .6s .1s ease both' }}>
              <h1 style={{
                fontFamily:'Bebas Neue', fontSize:'clamp(52px, 7vw, 96px)',
                lineHeight:0.92, letterSpacing:'0.04em',
                background:'linear-gradient(135deg, #f0eeff 0%, #00f5ff 50%, #f0eeff 100%)',
                backgroundSize:'200% 200%',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                animation:'shimmer 6s linear infinite',
              }}>
                ADAPTIVE
              </h1>
            </div>
            <div style={{ overflow:'hidden', animation:'fadeUp .6s .18s ease both' }}>
              <h1 style={{
                fontFamily:'Bebas Neue', fontSize:'clamp(52px, 7vw, 96px)',
                lineHeight:0.92, letterSpacing:'0.04em',
                color:'transparent',
                WebkitTextStroke:'1.5px rgba(240,238,255,0.3)',
              }}>
                SOCIAL INSIGHT
              </h1>
            </div>

            <p style={{
              color:'#6b6888', fontSize:'15px', maxWidth:'480px',
              marginTop:'22px', marginBottom:'40px', lineHeight:1.8,
              animation:'fadeUp .6s .26s ease both',
            }}>
              Real-time opinion mining of digital posts.<br/>
              Powered by RoBERTa · EasyOCR · deep-translator.
            </p>

            {/* Feature pills */}
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', animation:'fadeUp .6s .34s ease both' }}>
              {FEATURES.map((f, i) => (
                <div key={f.label} style={{
                  display:'flex', alignItems:'center', gap:'7px',
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'99px', padding:'7px 16px', fontSize:'12px',
                  color:'#aaa', fontWeight:500, backdropFilter:'blur(8px)',
                  transition:'all .2s', cursor:'none',
                  animation:`fadeUp .5s ${.38 + i * .06}s ease both`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${f.color}15`
                  e.currentTarget.style.borderColor = `${f.color}44`
                  e.currentTarget.style.color = f.color
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = '#aaa'
                }}
                >
                  <span>{f.icon}</span> {f.label}
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div style={{
              display:'flex', gap:'40px', marginTop:'44px', paddingTop:'32px',
              borderTop:'1px solid rgba(255,255,255,0.06)',
              animation:'fadeUp .6s .56s ease both',
            }}>
              <StatBadge value="3"    label="Sentiment Classes" color="var(--cyan)" />
              <StatBadge value="100+" label="Languages"         color="var(--gold)" />
              <StatBadge value="2"    label="ML Models"         color="var(--magenta)" />
              <StatBadge value="∞"    label="Analyses"          color="var(--green)" />
            </div>
          </header>

          {/* ── Main card ────────────────────────────────────────────────── */}
          <div style={{
            background:'rgba(8,7,26,0.8)',
            backdropFilter:'blur(24px)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'24px',
            overflow:'hidden',
            boxShadow:'0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            animation:'fadeUp .7s .3s ease both',
          }}>
            {/* Glowing top border */}
            <div style={{
              height:'1px',
              background:'linear-gradient(90deg, transparent 0%, var(--cyan) 30%, var(--magenta) 70%, transparent 100%)',
              opacity:0.6,
            }}/>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <Tab active={tab==='text'}  onClick={() => setTab('text')}  icon="💬">Text Analysis</Tab>
              <Tab active={tab==='image'} onClick={() => setTab('image')} icon="🖼️">Image Analysis</Tab>
            </div>

            {/* Content — ONLY CHANGE: padding 36px → 48px */}
            <div style={{ padding:'48px' }}>
              <div key={tab} style={{ animation:'fadeIn .3s ease' }}>
                {tab === 'text'  && <TextAnalyzer />}
                {tab === 'image' && <ImageAnalyzer />}
              </div>
            </div>

            {/* Bottom glow */}
            <div style={{
              height:'1px',
              background:'linear-gradient(90deg, transparent 0%, rgba(255,45,120,0.4) 50%, transparent 100%)',
            }}/>
          </div>

          {/* Footer */}
          <footer style={{ textAlign:'center', marginTop:'48px', color:'#333', fontSize:'12px', letterSpacing:'0.1em', textTransform:'uppercase', animation:'fadeIn 1s .8s ease both', opacity:0, animationFillMode:'both' }}>
            Flask · React · HuggingFace · EasyOCR · deep-translator
          </footer>
        </div>
      </div>
    </>
  )
}