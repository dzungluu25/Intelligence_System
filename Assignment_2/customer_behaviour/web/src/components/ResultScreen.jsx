import React from 'react'
import ShapChart from './ShapChart.jsx'
import { titleCase } from '../lib/sephora.js'

export default function ResultScreen({ result, model, onRestart }) {
  if (!result) return null

  const rec = result.prediction === 'recommend'
  const pRec = Math.round(result.p_recommend * 100)
  const { signals = {}, contributions, review_terms } = result

  const toward = (review_terms?.toward || []).map((t) => t.term)
  const against = (review_terms?.against || []).map((t) => t.term)

  return (
    <div className="res-dashboard">
      <header className="res-nav">
        <div className="res-nav__left">
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            ← Score another review
          </button>
        </div>
        <div className="res-nav__right">
          <span className="pill">Model: <b>{result.model}</b></span>
          <span className="pill">Cut-off: <b>{Math.round(result.threshold * 100)}%</b></span>
        </div>
      </header>

      <main className="res-grid">
        <div className="res-col res-col--left">
          {/* verdict */}
          <div className={`hero-card ${rec ? 'hero-card--good' : 'hero-card--bad'}`}>
            <span className={`hero-card__status-badge ${rec ? 'hero-card__status-badge--good' : 'hero-card__status-badge--bad'}`}>
              {rec ? 'POSITIVE OUTCOME' : 'NEGATIVE OUTCOME'}
            </span>
            <h2 className="hero-card__title">
              {rec
                ? 'High likelihood of product recommendation.'
                : 'Low likelihood of product recommendation.'}
            </h2>
            <p className="hero-card__subtitle">
              Confidence Score: <b>{pRec}%</b> (Threshold: {Math.round(result.threshold * 100)}%).
            </p>
          </div>

          {/* probability meter */}
          <div className="card">
            <h4 className="card-section-title">Prediction Confidence</h4>
            <div className="meter">
              <div className="meter__track">
                <span
                  className={`meter__fill ${rec ? 'meter__fill--good' : 'meter__fill--bad'}`}
                  style={{ width: `${pRec}%` }}
                />
                <span className="meter__threshold" style={{ left: `${Math.round(result.threshold * 100)}%` }} />
              </div>
              <div className="meter__scale">
                <span>0%</span>
                <span>Cut-off: {Math.round(result.threshold * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
            <p className="card-hint">
              Model certainty is <b>{pRec}%</b> based on similar historical profiles.
            </p>
          </div>

          {/* review terms */}
          {(toward.length > 0 || against.length > 0) && (
            <div className="card words-card">
              <h4 className="card-section-title">Textual Drivers</h4>
              {against.length > 0 && (
                <div className="words-group">
                  <span className="words-group__lbl text-bad">Negative Drivers</span>
                  <div className="words-chips">
                    {against.map((w, i) => (
                      <span key={i} className="word-chip word-chip--bad">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {toward.length > 0 && (
                <div className="words-group">
                  <span className="words-group__lbl text-good">Positive Drivers</span>
                  <div className="words-chips">
                    {toward.map((w, i) => (
                      <span key={i} className="word-chip word-chip--good">{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* interpretation */}
          <div className={`retention-playbook ${rec ? 'retention-playbook--good' : 'retention-playbook--bad'}`}>
            <div className="retention-playbook__head">
              <span className="retention-playbook__title">Suggested Action</span>
            </div>
            <p className="retention-playbook__text">
              {rec
                ? 'Profile alignment is strong. Suitable for targeted promotions.'
                : 'Sentiment is negative. Requires further QA or follow-up.'}
            </p>
          </div>

          <details className="how-it-works">
            <summary>Methodology</summary>
            <p>
              Trained on ~104k Sephora datasets using <b>Logistic Regression</b>. 
              Features combine tabular user profiles with TF-IDF vectorization of text reviews.
            </p>
          </details>
        </div>

        <div className="res-col res-col--right">
          {/* signals */}
          <div className="card signals-card">
            <h4 className="card-section-title">Analyzed Features</h4>
            <div className="kv-grid">
              <span className="kv__k">Skin Type</span>
              <span className="kv__v">{signals.skin_type ? titleCase(signals.skin_type) : '—'}</span>
              <span className="kv__k">Category</span>
              <span className="kv__v">{signals.category || '—'}</span>
              <span className="kv__k">Brand</span>
              <span className="kv__v">{signals.brand || '—'}</span>
              <span className="kv__k">Price</span>
              <span className="kv__v">
                {signals.price_usd != null ? `$${signals.price_usd}` : '—'}
                {signals.price_tier ? ` · ${signals.price_tier}` : ''}
              </span>
              <span className="kv__k">Product Likes</span>
              <span className="kv__v">
                {signals.product_loves != null ? Number(signals.product_loves).toLocaleString() : '—'}
              </span>
              <span className="kv__k">Review Length</span>
              <span className="kv__v">{signals.review_tokens} words</span>
            </div>
            <p className="card-hint">
              Baseline profile data provides ~0.8 ROC-AUC accuracy.
            </p>
          </div>

          <div className="card">
            <ShapChart contributions={contributions} />
          </div>
        </div>
      </main>
    </div>
  )
}
