import React from 'react';
import { PageProvider } from './store/pageStore.jsx';
import { AppContent } from './AppContent';

function App() {
  return (
    <PageProvider>
      <AppContent />
    </PageProvider>
  );
}

export default App;
