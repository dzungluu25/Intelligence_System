import React from 'react'
import ShapChart from './ShapChart.jsx'
import { titleCase } from '../lib/sephora.js'

// Single-column, black-and-white result view. Same data as before — layout and
// styling are deliberately plain (no colour, no cards, hairline rules only).
export default function ResultScreen({ result, model, onRestart }) {
  if (!result) return null

  const rec = result.prediction === 'recommend'
  const pRec = Math.round(result.p_recommend * 100)
  const cutoff = Math.round(result.threshold * 100)
  const { signals = {}, contributions, review_terms } = result

  const toward = (review_terms?.toward || []).map((t) => t.term)
  const against = (review_terms?.against || []).map((t) => t.term)

  const rows = [
    ['Skin type', signals.skin_type ? titleCase(signals.skin_type) : '—'],
    ['Skin tone', signals.skin_tone ? titleCase(signals.skin_tone) : '—'],
    ['Category', signals.category || '—'],
    ['Brand', signals.brand || '—'],
    [
      'Price',
      signals.price_usd != null
        ? `$${signals.price_usd}${signals.price_tier ? ` · ${signals.price_tier}` : ''}`
        : '—',
    ],
    [
      'Product likes',
      signals.product_loves != null ? Number(signals.product_loves).toLocaleString() : '—',
    ],
    ['Review length', `${signals.review_tokens ?? 0} words`],
    ['Has title', signals.has_title ? 'yes' : 'no'],
  ]

  return (
    <div className="rbw">
      <div className="rbw__wrap">
        <div className="rbw__topbar">
          <button type="button" className="rbw__back" onClick={onRestart}>
            ← Score another review
          </button>
          <span className="rbw__meta">
            {result.model} · cut-off {cutoff}%
          </span>
        </div>

        {/* 1 — verdict */}
        <section className="rbw-sec rbw-verdict">
          <p className="rbw-kicker">Prediction</p>
          <h1 className="rbw-verdict__word">{rec ? 'Recommend' : 'Not recommend'}</h1>
          <p className="rbw-verdict__line">
            Confidence <b>{pRec}%</b> &nbsp;/&nbsp; decision threshold {cutoff}%
          </p>
        </section>

        {/* 2 — confidence meter */}
        <section className="rbw-sec">
          <p className="rbw-label">Confidence</p>
          <div className="rbw-meter">
            <div className="rbw-meter__track">
              <span className="rbw-meter__fill" style={{ width: `${pRec}%` }} />
              <span className="rbw-meter__tick" style={{ left: `${cutoff}%` }} />
            </div>
            <div className="rbw-meter__scale">
              <span>0%</span>
              <span style={{ left: `${cutoff}%` }} className="rbw-meter__cut">
                cut-off {cutoff}%
              </span>
              <span>100%</span>
            </div>
          </div>
          <p className="rbw-note">
            P(recommend) = {pRec}% — the model&apos;s probability the reviewer ticks
            &ldquo;recommends this product&rdquo;.
          </p>
        </section>

        {/* 3 — inputs */}
        <section className="rbw-sec">
          <p className="rbw-label">Inputs analyzed</p>
          <dl className="rbw-dl">
            {rows.map(([k, v]) => (
              <div className="rbw-dl__row" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="rbw-note">
            Structured fields alone reach ~0.80 ROC-AUC; the review text carries the rest.
          </p>
        </section>

        {/* 4 — SHAP */}
        <section className="rbw-sec">
          <ShapChart contributions={contributions} />
        </section>

        {/* 5 — review terms */}
        {(toward.length > 0 || against.length > 0) && (
          <section className="rbw-sec">
            <p className="rbw-label">Review terms</p>
            {toward.length > 0 && (
              <div className="rbw-terms">
                <span className="rbw-terms__lbl">Toward recommend</span>
                <div className="rbw-terms__list">
                  {toward.map((w, i) => (
                    <span key={i} className="rbw-token rbw-token--solid">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {against.length > 0 && (
              <div className="rbw-terms">
                <span className="rbw-terms__lbl">Toward won&apos;t recommend</span>
                <div className="rbw-terms__list">
                  {against.map((w, i) => (
                    <span key={i} className="rbw-token rbw-token--outline">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 6 — suggested action */}
        <section className="rbw-sec">
          <p className="rbw-label">Suggested action</p>
          <p className="rbw-action">
            {rec
              ? 'Profile and sentiment align. Suitable for targeted promotion and product ranking.'
              : 'Sentiment is negative. Flag for review-consistency QA and follow-up.'}
          </p>
        </section>

        {/* 7 — methodology */}
        <details className="rbw-method">
          <summary>Methodology</summary>
          <p>
            Logistic Regression trained on ~104k Sephora reviews. Features: tabular skin
            profile + product attributes (one-hot, scaled) concatenated with a TF-IDF
            vectorisation of the review title + body. Bars above are exact per-feature
            log-odds contributions around the training mean (linear SHAP).
          </p>
        </details>
      </div>
    </div>
  )
}
