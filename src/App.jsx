import React from 'react';
import { PageProvider } from './store/pageStore.jsx';
import { Editor } from './components/Editor';

function App() {
  return (
    <PageProvider>
      <Editor />
    </PageProvider>
  );
}

export default App;
