import React from 'react'

// Monochrome diverging bars of the linear model's per-feature pull (log-odds).
// Bars grow from a centre axis: right = toward "recommend", left = toward "won't".
// Direction is shown by side + sign; fill style (solid vs hatched) keeps it readable
// with no colour.
export default function ShapChart({ contributions }) {
  if (!contributions?.items?.length) return null

  const { base_p, final_p, items, other_effect, dataset_base_rate } = contributions
  const rows = [...items]
  if (other_effect && Math.abs(other_effect) >= 0.01) {
    rows.push({ label: 'Other smaller factors combined', kind: 'other', effect: other_effect })
  }

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.effect)), 0.4)
  const half = (e) => `${Math.max(2, (Math.abs(e) / maxAbs) * 50)}%`
  const sign = (e) => (e >= 0 ? `+${e.toFixed(2)}` : `−${Math.abs(e).toFixed(2)}`)

  const basePct = Math.round(base_p * 100)
  const finalPct = Math.round(final_p * 100)
  const netDelta = finalPct - basePct

  const tagText = { text: 'review', tabular: 'profile', other: 'other' }

  return (
    <div className="rbw-shap">
      <p className="rbw-label">Why — each factor&apos;s pull</p>
      <p className="rbw-shap__legend">
        <span className="rbw-shap__key rbw-shap__key--pos" /> toward recommend
        &nbsp;&nbsp;
        <span className="rbw-shap__key rbw-shap__key--neg" /> toward won&apos;t recommend
      </p>

      <div className="rbw-shap__rows">
        {rows.map((it, idx) => {
          const neg = it.effect < 0
          return (
            <div
              key={idx}
              className={`rbw-shap__row${it.kind === 'other' ? ' is-other' : ''}`}
            >
              <div className="rbw-shap__name" title={it.label}>
                <span className="rbw-shap__tag">{tagText[it.kind] || 'profile'}</span>
                <span>{it.label}</span>
              </div>
              <div className="rbw-shap__track">
                <span className="rbw-shap__axis" />
                <span
                  className={`rbw-shap__bar ${neg ? 'is-neg' : 'is-pos'}`}
                  style={{ width: half(it.effect) }}
                />
              </div>
              <span className="rbw-shap__val">{sign(it.effect)}</span>
            </div>
          )
        })}
      </div>

      <p className="rbw-shap__flow">
        Neutral {basePct}%
        <span className="rbw-shap__arrow"> → </span>
        net pull {netDelta >= 0 ? `+${netDelta}` : `−${Math.abs(netDelta)}`} pts
        <span className="rbw-shap__arrow"> → </span>
        recommends <b>{finalPct}%</b>
      </p>

      <p className="rbw-note">
        Bars are log-odds pulls. The {basePct}% start is the model&apos;s neutral point
        (classes weighted equally, so not the{' '}
        {Math.round((dataset_base_rate ?? 0.85) * 100)}% dataset rate). Review terms
        dominate — the text is written alongside the recommend tick (§14a).
      </p>
    </div>
  )
}
