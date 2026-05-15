import React, { useState } from 'react'
import EstimationForm from './components/EstimationForm'
import Sidebar from './components/Sidebar'
import OverallProjects from './components/OverallProjects'
import ProjectList from './components/ProjectList'
import ProjectDetails from './components/ProjectDetails'
import LoadingScreen from './components/LoadingScreen'
import DashboardHome from './components/DashboardHome'
import KanbanBoard from './components/KanbanBoard'
import ClientView from './components/ClientView'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [activeView, setActiveView] = useState('home');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    setActiveView('project-details');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <DashboardHome onNavigate={setActiveView} />;
      case 'add-project':
        return <EstimationForm />;
      case 'view-projects':
        return <ProjectList onSelectProject={handleSelectProject} />;
      case 'project-details':
        return <ProjectDetails projectId={selectedProjectId} onBack={() => setActiveView('view-projects')} onNavigate={setActiveView} />;
      case 'overall':
        return <OverallProjects />;
      case 'kanban':
        return <KanbanBoard onSelectProject={handleSelectProject} />;
      case 'client-view':
        return <ClientView projectId={selectedProjectId} />;
      default:
        return <DashboardHome onNavigate={setActiveView} />;
    }
  };

  return (
    <>
      <LoadingScreen />
      <div className="app-layout">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="main-content">
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            Innovative Estimation
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            {activeView === 'home' && 'Welcome Back, Admin'}
            {activeView === 'add-project' && 'Create New Estimation'}
            {activeView === 'view-projects' && 'Project Management'}
            {activeView === 'project-details' && 'Estimation Details'}
            {activeView === 'overall' && 'Global Material Analytics'}
            {activeView === 'kanban' && 'Project Management Board'}
          </p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '2rem', fontSize: '0.8rem' }}>
          <p>© 2026 Innovative Estimation Dashboard. Professional Reporting Tool.</p>
        </footer>
      </main>
    </div>
    </>
  )
}

export default App
