import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { trainModel, compareModels, TrainResult } from '../api/client'
import { toast } from 'sonner'
import { Brain, Trophy, BarChart2, CheckCircle2, Circle } from 'lucide-react'

const TOOLTIP_STYLE = {
  background: '#181818',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  fontSize: 12,
  color: '#F5F0E8',
}

const card: React.CSSProperties = {
  background: '#181818',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...card, background: '#0C0C0C', padding: '14px 16px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#C4A882', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function ConfusionMatrix({ matrix, classes }: { matrix: number[][]; classes: string[] }) {
  const max = Math.max(...matrix.flat(), 1)
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 10, color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confusion Matrix</p>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 10px', color: '#5E5A55', fontWeight: 400, textAlign: 'left' }}>Actual ╲ Predicted</th>
            {classes.map(c => <th key={c} style={{ padding: '4px 10px', color: '#787068', fontWeight: 500 }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: '4px 10px', color: '#787068', fontWeight: 500 }}>{classes[i]}</td>
              {row.map((val, j) => {
                const intensity = val / max
                const isMatch = i === j
                return (
                  <td key={j} style={{
                    padding: '8px 14px', textAlign: 'center', borderRadius: 6, fontWeight: 500, color: '#F5F0E8',
                    background: isMatch
                      ? `rgba(196,168,130,${0.08 + intensity * 0.5})`
                      : `rgba(255,255,255,${intensity * 0.06})`,
                    border: isMatch ? '1px solid rgba(196,168,130,0.18)' : '1px solid rgba(255,255,255,0.04)',
                  }}>
                    {val}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultPanel({ result, title }: { result: TrainResult; title: string }) {
  const classes = Object.keys(result.class_distribution)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#F5F0E8' }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricBadge label="Accuracy"  value={`${(result.accuracy  * 100).toFixed(1)}%`} />
        <MetricBadge label="Precision" value={`${(result.precision * 100).toFixed(1)}%`} />
        <MetricBadge label="Recall"    value={`${(result.recall    * 100).toFixed(1)}%`} />
      </div>
      <div style={{ ...card, background: '#0C0C0C', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Training samples', result.train_samples],
          ['Test samples', result.test_samples],
          ...Object.entries(result.class_distribution).map(([cls, cnt]) => [cls, `${cnt} records`]),
        ].map(([k, v]) => (
          <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#5E5A55' }}>{k}</span>
            <span style={{ color: '#F5F0E8' }}>{v}</span>
          </div>
        ))}
      </div>
      {result.confusion_matrix && (
        <div style={{ ...card, background: '#0C0C0C', padding: '16px 18px' }}>
          <ConfusionMatrix matrix={result.confusion_matrix} classes={classes} />
        </div>
      )}
    </div>
  )
}

export default function Training() {
  const [algo, setAlgo] = useState<'decision_tree' | 'random_forest' | 'both'>('both')
  const [result, setResult] = useState<TrainResult | null>(null)

  const { data: modelStatus, refetch: refetchStatus } = useQuery({ queryKey: ['model-status'], queryFn: compareModels })
  const { mutate, isPending } = useMutation({
    mutationFn: () => trainModel(algo),
    onSuccess: (data) => { setResult(data); refetchStatus(); toast.success('Training complete') },
    onError: () => toast.error('Training failed'),
  })

  const isBoth = result && 'decision_tree' in result && 'random_forest' in result

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5E5A55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Machine Learning</p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em' }}>Model Training</h1>
      </div>

      {/* Status chips */}
      {modelStatus && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(modelStatus).map(([name, { trained }]) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 400,
              background: trained ? 'rgba(196,168,130,0.07)' : 'rgba(255,255,255,0.02)',
              border: trained ? '1px solid rgba(196,168,130,0.18)' : '1px solid rgba(255,255,255,0.06)',
              color: trained ? '#C4A882' : '#5E5A55',
            }}>
              {trained ? <CheckCircle2 size={11} /> : <Circle size={11} />}
              <span style={{ textTransform: 'capitalize' }}>{name.replace('_', ' ')}</span>
              <span style={{ opacity: 0.6 }}>· {trained ? 'ready' : 'not trained'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ ...card, padding: '20px 20px', marginBottom: 20 }}>
        <p style={{ margin: '0 0 14px', fontSize: 11, color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Train Configuration</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: '#787068' }}>Algorithm</label>
            <select
              value={algo}
              onChange={e => setAlgo(e.target.value as typeof algo)}
              style={{
                background: '#0C0C0C', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#F5F0E8',
                fontFamily: 'inherit', cursor: 'pointer',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.35)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <option value="both" style={{ background: '#181818' }}>Both — Decision Tree + Random Forest</option>
              <option value="random_forest" style={{ background: '#181818' }}>Random Forest only</option>
              <option value="decision_tree" style={{ background: '#181818' }}>Decision Tree only</option>
            </select>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#F5F0E8', border: 'none', borderRadius: 7,
              padding: '10px 20px', fontSize: 13, fontWeight: 500,
              color: '#0C0C0C', cursor: isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: isPending ? 0.5 : 1, transition: 'opacity 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => !isPending && (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = isPending ? '0.5' : '1')}
          >
            {isPending
              ? <div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#0C0C0C', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <Brain size={13} strokeWidth={2} />}
            {isPending ? 'Training…' : 'Start Training'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isBoth ? (
            <>
              {'best_model' in result && (
                <div style={{
                  ...card,
                  borderColor: 'rgba(196,168,130,0.18)',
                  background: 'rgba(196,168,130,0.04)',
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <Trophy size={16} color="#C4A882" strokeWidth={1.8} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#C4A882' }}>
                      Best model: <span style={{ textTransform: 'capitalize' }}>{(result.best_model as string).replace('_', ' ')}</span>
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#787068' }}>Higher accuracy on the held-out test set</p>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ ...card, padding: '20px 20px' }}>
                  <ResultPanel result={(result as { decision_tree: TrainResult }).decision_tree} title="Decision Tree" />
                </div>
                <div style={{ ...card, padding: '20px 20px' }}>
                  <ResultPanel result={(result as { random_forest: TrainResult }).random_forest} title="Random Forest" />
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...card, padding: '20px 20px' }}>
              <ResultPanel result={result} title={algo === 'random_forest' ? 'Random Forest' : 'Decision Tree'} />
            </div>
          )}
        </div>
      )}

      {!result && !isPending && (
        <div style={{ ...card, padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <BarChart2 size={24} color="#3D3530" strokeWidth={1.5} />
          <p style={{ margin: 0, fontSize: 13, color: '#787068' }}>No training results yet</p>
          <p style={{ margin: 0, fontSize: 11, color: '#5E5A55' }}>Choose an algorithm and click Start Training</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
