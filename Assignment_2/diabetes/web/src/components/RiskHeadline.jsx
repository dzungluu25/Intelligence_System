import { pct, bandColor, bandTint } from '../lib/format.js'

export default function RiskHeadline({ result }) {
  const { probability, band, band_label, uncertainty_band } = result
  return (
    <div
      className="card"
      style={{ background: bandTint(band), borderColor: bandColor(band) + '55' }}
    >
      <div className="headline">
        <div className="risk-num" style={{ color: bandColor(band) }}>
          {pct(probability)}
        </div>
        <div>
          <span className="band-pill" style={{ background: bandColor(band) }}>
            {band}
          </span>
          <div className="verdict" style={{ marginTop: 6 }}>
            {band_label}
          </div>
        </div>
      </div>

      {uncertainty_band && (
        <div className="uncertainty">
          Unanswered queries variance: <strong>{pct(uncertainty_band[0])}</strong> to{' '}
          <strong>{pct(uncertainty_band[1])}</strong>.
        </div>
      )}

      <div className="uncertainty">
        Screening aid only. Consult a clinician.
      </div>
    </div>
  )
}
