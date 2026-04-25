import { useState, useRef } from 'react'
import axios from 'axios'
import ResultCard from './ResultCard.jsx'

const STEPS = [
  { icon:'🔍', label:'OCR Scanning', sub:'Detecting text regions in image' },
  { icon:'🌐', label:'Language Detection', sub:'Identifying language & translating' },
  { icon:'🧠', label:'ML Analysis', sub:'Running sentiment & sarcasm models' },
]

function DropZone({ onFile, dragging, setDragging }) {
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef()
  const active = dragging || hovered

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current.click()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:'relative', cursor:'none', overflow:'hidden',
        border:`1.5px dashed ${active ? 'var(--magenta)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius:'20px', padding:'60px 24px', textAlign:'center',
        background: active ? 'rgba(255,45,120,0.05)' : 'rgba(255,255,255,0.02)',
        transition:'all .3s cubic-bezier(0.16,1,0.3,1)',
        transform: active ? 'scale(1.01)' : 'scale(1)',
        boxShadow: active ? '0 0 40px rgba(255,45,120,0.1), inset 0 0 40px rgba(255,45,120,0.03)' : 'none',
      }}
    >
      {/* Corner accents */}
      {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
        <div key={pos} style={{
          position:'absolute',
          top: pos.includes('top') ? '12px' : 'auto',
          bottom: pos.includes('bottom') ? '12px' : 'auto',
          left: pos.includes('left') ? '12px' : 'auto',
          right: pos.includes('right') ? '12px' : 'auto',
          width:'16px', height:'16px',
          borderTop: pos.includes('top') ? `2px solid ${active ? 'var(--magenta)' : 'rgba(255,255,255,0.2)'}` : 'none',
          borderBottom: pos.includes('bottom') ? `2px solid ${active ? 'var(--magenta)' : 'rgba(255,255,255,0.2)'}` : 'none',
          borderLeft: pos.includes('left') ? `2px solid ${active ? 'var(--magenta)' : 'rgba(255,255,255,0.2)'}` : 'none',
          borderRight: pos.includes('right') ? `2px solid ${active ? 'var(--magenta)' : 'rgba(255,255,255,0.2)'}` : 'none',
          transition:'border-color .3s',
        }}/>
      ))}

      {/* 3D floating icon */}
      <div style={{
        fontSize:'52px', marginBottom:'16px', display:'inline-block',
        animation: active ? 'none' : 'float 4s ease-in-out infinite',
        filter: active ? 'drop-shadow(0 0 20px rgba(255,45,120,0.6))' : 'none',
        transition:'filter .3s',
      }}>
        🖼️
      </div>

      <div style={{ fontWeight:600, color: active ? '#fff' : '#aaa', fontSize:'16px', marginBottom:'8px', transition:'color .3s' }}>
        {dragging ? 'Drop it here!' : 'Drop image or click to upload'}
      </div>
      <div style={{ fontSize:'12px', color:'#555', letterSpacing:'0.05em' }}>
        Supports Tamil & English text · JPG PNG WEBP
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={e => onFile(e.target.files[0])} style={{ display:'none' }}/>
    </div>
  )
}

function LoadingSteps({ step }) {
  return (
    <div style={{
      marginTop:'20px', borderRadius:'16px', overflow:'hidden',
      border:'1px solid rgba(255,255,255,0.06)',
      background:'rgba(255,255,255,0.02)',
      animation:'fadeUp .3s ease',
    }}>
      {STEPS.map((s, i) => {
        const done    = i < step
        const active  = i === step
        return (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:'16px', padding:'16px 20px',
            borderBottom: i < STEPS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: active ? 'rgba(0,245,255,0.04)' : 'none',
            transition:'background .3s',
          }}>
            <div style={{
              width:'32px', height:'32px', borderRadius:'50%', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px',
              background: done ? 'var(--green)' : active ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${done ? 'var(--green)' : active ? 'var(--cyan)' : 'rgba(255,255,255,0.08)'}`,
              transition:'all .3s',
            }}>
              {done ? '✓' : active ? <span style={{ animation:'spin .8s linear infinite', display:'inline-block', fontSize:'10px' }}>◌</span> : s.icon}
            </div>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color: done ? 'var(--green)' : active ? 'var(--cyan)' : '#555', transition:'color .3s' }}>
                {s.label}
              </div>
              <div style={{ fontSize:'11px', color:'#444', marginTop:'2px' }}>{s.sub}</div>
            </div>
            {done && (
              <div style={{ marginLeft:'auto', fontSize:'12px', color:'var(--green)', fontFamily:'JetBrains Mono' }}>Done</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ImageAnalyzer() {
  const [preview, setPreview] = useState(null)
  const [b64Data, setB64Data] = useState(null)
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState(-1)
  const [error,   setError]   = useState(null)
  const [dragging,setDragging]= useState(false)

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file.'); return
    }
    setError(null); setResult(null)
    const reader = new FileReader()
    reader.onload = e => { setPreview(e.target.result); setB64Data(e.target.result) }
    reader.readAsDataURL(file)
  }

  const analyse = async () => {
    if (!b64Data) return
    setLoading(true); setError(null); setResult(null); setStep(0)

    const tick = (n) => new Promise(r => setTimeout(() => { setStep(n); r() }, 900))

    try {
      await tick(0)
      const res = await axios.post('/api/analyse/image', { image: b64Data })
      await tick(1)
      await tick(2)
      await new Promise(r => setTimeout(r, 500))

      if (!res.data.ocr?.text_found) {
        setError('No readable text found in this image.')
      } else {
        setResult(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Backend not running. Start python app.py')
    } finally {
      setLoading(false); setStep(-1)
    }
  }

  const reset = () => { setPreview(null); setB64Data(null); setResult(null); setError(null) }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
        <div style={{ width:'3px', height:'20px', background:'var(--magenta)', borderRadius:'99px' }}/>
        <span style={{ fontSize:'11px', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--magenta)' }}>
          Image Input
        </span>
      </div>

      {!preview ? (
        <DropZone onFile={handleFile} dragging={dragging} setDragging={setDragging} />
      ) : (
        <div style={{ position:'relative' }}>
          {/* Image preview with 3D frame */}
          <div style={{
            position:'relative', borderRadius:'16px', overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.08)',
            boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
            marginBottom:'16px',
          }}>
            <img src={preview} alt="Uploaded" style={{
              width:'100%', maxHeight:'280px', objectFit:'contain',
              display:'block', background:'rgba(4,3,16,0.8)',
            }}/>
            {/* Overlay shimmer */}
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none',
              background:'linear-gradient(180deg, transparent 60%, rgba(3,2,10,0.8) 100%)',
            }}/>
            <button onClick={reset} style={{
              position:'absolute', top:'12px', right:'12px',
              background:'rgba(255,45,120,0.9)', border:'none',
              borderRadius:'50%', width:'32px', height:'32px',
              color:'#fff', fontSize:'16px', cursor:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 12px rgba(255,45,120,0.4)',
              transition:'transform .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >×</button>
          </div>

          {/* Analyse button */}
          <button onClick={analyse} disabled={loading} style={{
            width:'100%', padding:'18px',
            background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff2d78, #ff006e)',
            border:'none', borderRadius:'14px',
            color: loading ? '#555' : '#fff', fontSize:'14px', fontWeight:700,
            fontFamily:'DM Sans', cursor: loading ? 'not-allowed' : 'none',
            letterSpacing:'0.08em', textTransform:'uppercase',
            transition:'all .25s', boxShadow: loading ? 'none' : '0 8px 32px rgba(255,45,120,0.3)',
          }}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='scale(1.01)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)' }}
          >
            {loading ? '⏳ Processing…' : '📸 Extract Text & Analyse'}
          </button>
        </div>
      )}

      {loading && <LoadingSteps step={step} />}

      {error && (
        <div style={{
          marginTop:'16px', padding:'16px 20px',
          background:'rgba(255,45,120,0.08)', border:'1px solid rgba(255,45,120,0.3)',
          borderRadius:'12px', color:'#ff6b9d', fontSize:'13px',
          animation:'slideInLeft .3s ease', display:'flex', alignItems:'center', gap:'10px',
        }}>
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

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
