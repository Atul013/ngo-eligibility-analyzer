import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { trainModel, compareModels, TrainResult } from '../api/client'
import { toast } from 'sonner'
import { Brain, Trophy, BarChart2 } from 'lucide-react'

function MetricCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-lg p-4 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ConfusionMatrix({ matrix, classes }: { matrix: number[][]; classes: string[] }) {
  const flat = matrix.flat()
  const max = Math.max(...flat)
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Confusion Matrix</h3>
      <div className="overflow-x-auto">
        <table className="text-xs mx-auto">
          <thead>
            <tr>
              <th className="px-3 py-2 text-gray-500">Actual \ Predicted</th>
              {classes.map(c => <th key={c} className="px-3 py-2 text-gray-400">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-gray-400 font-medium">{classes[i]}</td>
                {row.map((val, j) => (
                  <td key={j} className="px-3 py-2 text-center rounded" style={{
                    background: `rgba(34,197,94,${val / max * 0.7})`,
                    color: val > 0 ? '#fff' : '#6b7280',
                  }}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ResultPanel({ result, title }: { result: TrainResult; title: string }) {
  const classes = Object.keys(result.class_distribution)
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Accuracy"  value={`${(result.accuracy  * 100).toFixed(2)}%`} color="text-green-400" />
        <MetricCard label="Precision" value={`${(result.precision * 100).toFixed(2)}%`} color="text-blue-400" />
        <MetricCard label="Recall"    value={`${(result.recall    * 100).toFixed(2)}%`} color="text-purple-400" />
      </div>

      <div className="glass rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <div className="flex justify-between"><span>Train samples</span><span className="text-white">{result.train_samples}</span></div>
        <div className="flex justify-between"><span>Test samples</span><span className="text-white">{result.test_samples}</span></div>
        {Object.entries(result.class_distribution).map(([cls, cnt]) => (
          <div key={cls} className="flex justify-between">
            <span>{cls}</span>
            <span className="text-white">{cnt} records</span>
          </div>
        ))}
      </div>

      {result.confusion_matrix && (
        <ConfusionMatrix matrix={result.confusion_matrix} classes={classes} />
      )}
    </div>
  )
}

export default function Training() {
  const [algo, setAlgo] = useState<'decision_tree' | 'random_forest' | 'both'>('both')
  const [result, setResult] = useState<TrainResult | null>(null)

  const { data: modelStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['model-status'],
    queryFn: compareModels,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => trainModel(algo),
    onSuccess: (data) => {
      setResult(data)
      refetchStatus()
      toast.success('Model trained successfully!')
    },
    onError: () => toast.error('Training failed'),
  })

  const isBoth = result && 'decision_tree' in result && 'random_forest' in result

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Training</h1>
        <p className="text-sm text-gray-400 mt-1">Train and evaluate ML models on the beneficiary dataset</p>
      </div>

      {/* Status chips */}
      {modelStatus && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(modelStatus).map(([algo, { trained }]) => (
            <div key={algo} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
              trained ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${trained ? 'bg-green-400' : 'bg-gray-600'}`} />
              {algo.replace('_', ' ')} — {trained ? 'trained' : 'not trained'}
            </div>
          ))}
        </div>
      )}

      {/* Train controls */}
      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Train a Model</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Algorithm</label>
            <select
              className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
              value={algo}
              onChange={e => setAlgo(e.target.value as typeof algo)}
            >
              <option value="both">Both (Decision Tree + Random Forest)</option>
              <option value="random_forest">Random Forest</option>
              <option value="decision_tree">Decision Tree</option>
            </select>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-medium text-sm"
          >
            {isPending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Brain className="w-4 h-4" />}
            {isPending ? 'Training…' : 'Train'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {isBoth ? (
            <>
              {/* Best model banner */}
              {'best_model' in result && (
                <div className="flex items-center gap-3 glass rounded-xl p-4 border border-yellow-500/30">
                  <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Best Model</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {(result.best_model as string).replace('_', ' ')} performed better
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResultPanel result={(result as { decision_tree: TrainResult }).decision_tree} title="Decision Tree" />
                <ResultPanel result={(result as { random_forest: TrainResult }).random_forest} title="Random Forest" />
              </div>
            </>
          ) : (
            <ResultPanel
              result={result}
              title={algo === 'random_forest' ? 'Random Forest' : 'Decision Tree'}
            />
          )}
        </div>
      )}

      {!result && !isPending && (
        <div className="glass rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <BarChart2 className="w-8 h-8 text-gray-600" />
          <p className="text-sm text-gray-500">No results yet — click Train to start</p>
        </div>
      )}
    </div>
  )
}
