export default function Header({ view, setView, apiOk }) {
  return (
    <header className="app-header">
      <div className="inner">
        <span className="brand">
          Blood Sugar AI
        </span>
        <nav className="nav">
          <button
            className={view === 'screen' ? 'active' : ''}
            onClick={() => setView('screen')}
          >
            Screening
          </button>
          <button
            className={view === 'operator' ? 'active' : ''}
            onClick={() => setView('operator')}
          >
            Operator
          </button>
        </nav>
        <span
          className={'status-dot' + (apiOk ? ' ok' : '')}
          title={apiOk ? 'Connected to the API' : 'API not reachable'}
        />
      </div>
    </header>
  )
}
