import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import PDFChat from './PDFChat/PDFChat';

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={
          <PDFChat/>
        } />
      </Routes>
    </Router>
    </>
  );
}

export default App;