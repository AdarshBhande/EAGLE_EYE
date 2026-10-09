import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { NewInspectionView } from './components/views/NewInspectionView';
import { InspectionResultView } from './components/views/InspectionResultView';
import { RecheckView } from './components/views/RecheckView';
import { HistoryView } from './components/views/HistoryView';

import { 
  getInspection, 
  parseEngineeringDocuments, 
  inspectCabinetImage, 
  evaluateCabinetQC, 
  generateVisualEvidence, 
  persistInspection, 
  performRecheck 
} from './api/client';
import { 
  PersistedInspection, 
  ExpectedCabinetModel, 
  ObservedCabinetModel, 
  InspectionResult, 
  EvidenceCollection, 
  RecheckResult 
} from './api/types';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new_inspection' | 'results' | 'recheck' | 'history'>('dashboard');
  
  // Active inspection session state
  const [persistedInspection, setPersistedInspection] = useState<PersistedInspection | null>(null);
  const [expectedModel, setExpectedModel] = useState<ExpectedCabinetModel | undefined>();
  const [observedModel, setObservedModel] = useState<ObservedCabinetModel | undefined>();
  const [qcResult, setQcResult] = useState<InspectionResult | undefined>();
  const [evidenceCollection, setEvidenceCollection] = useState<EvidenceCollection | undefined>();
  
  // Recheck session state
  const [recheckResult, setRecheckResult] = useState<RecheckResult | null>(null);
  const [recheckInspectionId, setRecheckInspectionId] = useState<string | null>(null);

  const handleSelectInspection = async (inspectionId: string) => {
    try {
      const data = await getInspection(inspectionId);
      setPersistedInspection(data);
      setExpectedModel(data.expected_model);
      setObservedModel(data.observed_model);
      setActiveTab('results');
    } catch (err: any) {
      alert(`Error loading inspection '${inspectionId}': ${err.message}`);
    }
  };

  const handleCompleteInspection = (
    persisted: PersistedInspection,
    expected: ExpectedCabinetModel,
    observed: ObservedCabinetModel,
    qcRes: InspectionResult,
    evidence: EvidenceCollection
  ) => {
    setPersistedInspection(persisted);
    setExpectedModel(expected);
    setObservedModel(observed);
    setQcResult(qcRes);
    setEvidenceCollection(evidence);
    setActiveTab('results');
  };

  const handleLaunchRecheck = (previousInspectionId: string) => {
    setRecheckInspectionId(previousInspectionId);
    setRecheckResult(null);
    setActiveTab('recheck');
  };

  const handleQuickLaunchScenario = async (scenario: 'fault1' | 'fault2' | 'fault3' | 'fault4' | 'pass') => {
    try {
      // 1. Parse Engineering
      const expected = await parseEngineeringDocuments(undefined, undefined, `CAB-DEMO-${scenario.toUpperCase()}`);
      
      // 2. CV Inspect
      const validJpegBytes = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
        0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
      ]);
      const dummyFile = new File([validJpegBytes], 'sample_cabinet.jpg', { type: 'image/jpeg' });
      const observed = await inspectCabinetImage(dummyFile);

      // 3. Evaluate QC
      const qc = await evaluateCabinetQC(expected, observed);

      // 4. Evidence
      const evi = await generateVisualEvidence(qc, observed, undefined, 'sample_cabinet.jpg');

      // 5. Persist
      const persisted = await persistInspection(qc, expected, observed);

      handleCompleteInspection(persisted, expected, observed, qc, evi);
    } catch (err: any) {
      alert(`Quick Launch Error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#121212', color: '#ffffff', overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedCabinetId={persistedInspection?.cabinet_id}
      />

      {/* Main Control Station Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Header
          title={
            activeTab === 'dashboard' ? 'Industrial Dashboard Overview' :
            activeTab === 'new_inspection' ? 'New Cabinet Inspection Workflow' :
            activeTab === 'results' ? `Inspection Result: ${persistedInspection?.cabinet_id || ''}` :
            activeTab === 'recheck' ? 'Re-check Lifecycle Evaluation' :
            'Audit & Inspection History'
          }
          subtitle="EAGLE EYE — AI Control Cabinet Inspection System"
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              onStartInspection={() => setActiveTab('new_inspection')}
              onSelectInspection={handleSelectInspection}
              onQuickLaunchScenario={handleQuickLaunchScenario}
            />
          )}

          {activeTab === 'new_inspection' && (
            <NewInspectionView
              onCompleteInspection={handleCompleteInspection}
            />
          )}

          {activeTab === 'results' && persistedInspection && (
            <InspectionResultView
              persistedInspection={persistedInspection}
              expectedModel={expectedModel}
              observedModel={observedModel}
              inspectionResult={qcResult}
              evidenceCollection={evidenceCollection}
              onRunRecheck={handleLaunchRecheck}
            />
          )}

          {activeTab === 'recheck' && (
            <RecheckView
              initialInspectionId={recheckInspectionId}
              initialRecheckResult={recheckResult}
              onBackToHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              onSelectInspection={handleSelectInspection}
              onLaunchRecheck={handleLaunchRecheck}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
