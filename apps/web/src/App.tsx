import { useState } from 'react';
import { ConnectWallet } from './components/ConnectWallet';
import { Landing } from './pages/Landing';
import { Registry } from './pages/Registry';
import { Developers } from './pages/Developers';
import { Auditors } from './pages/Auditors';
import { Docs } from './pages/Docs';
import { Home } from './pages/Home';
import { RegisterAuditor } from './pages/RegisterAuditor';
import { RegisterSkill } from './pages/RegisterSkill';
import { Verify } from './pages/Verify';
import { Status } from './pages/Status';

type View = 'landing' | 'registry' | 'developers' | 'auditors' | 'docs' | 'dapp';
type Tab = 'home' | 'auditor' | 'skill' | 'verify' | 'status';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'verify', label: 'Verify Skill' },
  { id: 'auditor', label: 'Register Auditor' },
  { id: 'skill', label: 'Submit Skill' },
  { id: 'status', label: 'Status' },
];

export function App() {
  const [view, setView] = useState<View>('landing');
  const [tab, setTab] = useState<Tab>('home');

  if (view === 'landing') {
    return (
      <Landing
        onEnterApp={() => setView('dapp')}
        onExploreRegistry={() => setView('registry')}
        onDevelopers={() => setView('developers')}
        onAuditors={() => setView('auditors')}
        onDocs={() => setView('docs')}
      />
    );
  }

  const navProps = {
    onBack: () => setView('landing'),
    onRegistry: () => setView('registry'),
    onDevelopers: () => setView('developers'),
    onAuditors: () => setView('auditors'),
    onDocs: () => setView('docs'),
  };

  if (view === 'registry') {
    return <Registry {...navProps} />;
  }

  if (view === 'developers') {
    return <Developers {...navProps} />;
  }

  if (view === 'auditors') {
    return <Auditors {...navProps} />;
  }

  if (view === 'docs') {
    return <Docs {...navProps} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-logo" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
          <span>AEGIS</span> Protocol
        </div>
        <ConnectWallet />
      </header>

      <nav className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'home' && <Home onNavigate={setTab} />}
        {tab === 'auditor' && <RegisterAuditor />}
        {tab === 'skill' && <RegisterSkill />}
        {tab === 'verify' && <Verify />}
        {tab === 'status' && <Status />}
      </main>
    </div>
  );
}
