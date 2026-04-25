import { useState, useRef } from 'react'
import axios from 'axios'
import ResultCard from './ResultCard.jsx'

const EXAMPLES = [
  { label:'English', emoji:'🇬🇧', text:'This product is absolutely amazing! Best purchase I ever made.', color:'#00f5ff' },
  { label:'Tamil',   emoji:'🇮🇳', text:'இந்த தயாரிப்பு மிகவும் மோசமாக இருந்தது. பணம் வீணாகியது.', color:'#ffd700' },
  { label:'Sarcasm', emoji:'🙄', text:'Oh great, another update that broke everything. Just what I needed!', color:'#ff2d78' },
  { label:'Mixed',   emoji:'🔀', text:'இந்த சேவை super fast! மிகவும் satisfied ஆனேன்.', color:'#00ff88' },
]

function ExampleChip({ ex, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:'6px',
        background: hovered ? `${ex.color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? ex.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius:'99px', padding:'7px 16px',
        color: hovered ? ex.color : '#888',
        fontSize:'12px', fontWeight:600, fontFamily:'DM Sans',
        cursor:'none', transition:'all .22s cubic-bezier(0.16,1,0.3,1)',
        letterSpacing:'0.04em',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px ${ex.color}22` : 'none',
      }}
    >
      <span>{ex.emoji}</span> {ex.label}
    </button>
  )
}

function GlowButton({ onClick, disabled, loading, children }) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [ripples, setRipples] = useState([])
  const btnRef = useRef(null)

  const handleClick = (e) => {
    if (disabled) return
    const rect = btnRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { x, y, id }])
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 700)
    setClicked(true)
    setTimeout(() => setClicked(false), 150)
    onClick && onClick()
  }

  return (
    <button
      ref={btnRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      disabled={disabled}
      style={{
        position:'relative', overflow:'hidden',
        marginTop:'20px', width:'100%', padding:'18px',
        background: disabled ? 'rgba(255,255,255,0.05)' :
          hovered ? 'linear-gradient(135deg, #00f5ff, #0080ff)' :
          'linear-gradient(135deg, #00c8d4, #0066cc)',
        border:'none', borderRadius:'14px',
        color: disabled ? '#444' : '#000',
        fontSize:'14px', fontWeight:700, fontFamily:'DM Sans',
        cursor: disabled ? 'not-allowed' : 'none',
        letterSpacing:'0.08em', textTransform:'uppercase',
        transition:'all .25s cubic-bezier(0.16,1,0.3,1)',
        transform: clicked ? 'scale(0.98)' : hovered && !disabled ? 'scale(1.01)' : 'scale(1)',
        boxShadow: disabled ? 'none' : hovered ? '0 16px 48px rgba(0,245,255,0.35)' : '0 8px 24px rgba(0,245,255,0.18)',
      }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{
          position:'absolute', left:r.x, top:r.y,
          width:'10px', height:'10px', borderRadius:'50%',
          background:'rgba(255,255,255,0.4)',
          transform:'translate(-50%,-50%)',
          animation:'ripple .7s ease-out forwards',
          pointerEvents:'none',
        }}/>
      ))}
      <span style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
        {loading ? (
          <>
            <span style={{ width:'14px', height:'14px', border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>
            Analysing…
          </>
        ) : '🔍 Analyse Sentiment'}
      </span>
    </button>
  )
}

export default function TextAnalyzer() {
  const [text, setText]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [focused, setFocused] = useState(false)
  const [charAnim, setCharAnim] = useState(false)

  const analyse = async () => {
    if (!text.trim() || loading) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.post('/api/analyse/text', { text })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Backend not running. Start python app.py')
    } finally {
      setLoading(false)
    }
  }

  const handleExample = (t) => {
    setText(t)
    setCharAnim(true)
    setTimeout(() => setCharAnim(false), 500)
  }

  return (
    <div>
      {/* Section label */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
        <div style={{ width:'3px', height:'20px', background:'var(--cyan)', borderRadius:'99px' }}/>
        <span style={{ fontSize:'11px', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--cyan)' }}>
          Input Text
        </span>
      </div>

      {/* Example chips */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
        {EXAMPLES.map(ex => (
          <ExampleChip key={ex.label} ex={ex} onClick={() => handleExample(ex.text)} />
        ))}
      </div>

      {/* Textarea container with 3D border effect */}
      <div style={{
        position:'relative',
        borderRadius:'16px',
        padding:'1.5px',
        background: focused
          ? 'linear-gradient(135deg, var(--cyan), var(--magenta))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        transition:'background .3s',
        boxShadow: focused ? '0 0 32px rgba(0,245,255,0.15)' : 'none',
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) analyse() }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type in any language — English, Tamil, Hindi, French, Arabic…&#10;Press Ctrl+Enter to analyse"
          rows={6}
          style={{
            width:'100%', display:'block',
            background:'rgba(4,3,16,0.95)',
            border:'none', borderRadius:'15px',
            padding:'18px 20px',
            color:'#f0eeff', fontSize:'15px',
            fontFamily: charAnim ? 'JetBrains Mono' : 'DM Sans',
            resize:'vertical', outline:'none',
            lineHeight:1.75, letterSpacing: charAnim ? '0.02em' : 'normal',
            transition:'font-family .3s',
          }}
        />
      </div>

      {/* Char count + hint */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px', fontSize:'12px', color:'#444' }}>
        <span style={{ color:'#333' }}>Ctrl+Enter to run</span>
        <span style={{ color: text.length > 400 ? 'var(--gold)' : '#444', fontFamily:'JetBrains Mono' }}>
          {text.length} chars
        </span>
      </div>

      <GlowButton onClick={analyse} disabled={loading || !text.trim()} loading={loading} />

      {/* Error */}
      {error && (
        <div style={{
          marginTop:'20px', padding:'16px 20px',
          background:'rgba(255,45,120,0.08)', border:'1px solid rgba(255,45,120,0.3)',
          borderRadius:'12px', color:'#ff6b9d', fontSize:'13px',
          animation:'slideInLeft .3s ease',
          display:'flex', alignItems:'center', gap:'10px',
        }}>
          <span style={{ fontSize:'18px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ marginTop:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
            <div style={{ width:'3px', height:'20px', background:'var(--green)', borderRadius:'99px' }}/>
            <span style={{ fontSize:'11px', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--green)' }}>
              Analysis Result
            </span>
          </div>
          <ResultCard result={result} />
        </div>
      )}
    </div>
  )
}
