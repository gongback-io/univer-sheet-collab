import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Sheet from './sheets/Sheet';

function Home() {
    const [id, setId] = useState<string>('');
    const navigate = useNavigate();

    const handleGoClick = () => {
        if (id) {
            navigate(`/doc/${id}`);
        }
    };

    return (
        <div style={{ width: '400px', margin: '0 auto' }}>
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <label htmlFor="idInput" style={{ display: 'block', marginBottom: '8px' }}>
                    INPUT: DOC ID
                </label>
                <input
                    id="idInput"
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        boxSizing: 'border-box',
                    }}
                />
            </div>
            <button onClick={handleGoClick}>GO</button>
        </div>
    );
}

function DocRoute() {
    const { docId } = useParams<{ docId: string }>();
    return <Sheet docId={docId} />;
}

function App() {
    return (
        <Router>
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: 0 }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/doc/:docId" element={<DocRoute />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
