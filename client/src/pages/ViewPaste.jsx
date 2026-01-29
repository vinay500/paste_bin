import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function ViewPaste() {
    const { id } = useParams();
    const [paste, setPaste] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const fetchPaste = async () => {
            try {
                const response = await axios.get(`/api/pastes/${id}`);
                setPaste(response.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError(err.response.data.error || 'Paste not found or expired.');
                } else {
                    setError('Failed to load paste.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPaste();
    }, [id]);

    if (loading) {
        return <div className="container"><h2 style={{ textAlign: 'center' }}>Loading...</h2></div>;
    }

    if (error) {
        return (
            <div className="container">
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
                    <h2 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>Paste Unavailable</h2>
                    <p style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>{error}</p>
                    <Link to="/" className="copy-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Create New Paste
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <pre className="code-view">
                    {paste.content}
                </pre>

                <div className="meta-info">
                    {paste.remaining_views !== null && (
                        <span>Remaining Views: {paste.remaining_views}</span>
                    )}
                    {paste.expires_at && (
                        <span>Expires at: {new Date(paste.expires_at).toLocaleString()}</span>
                    )}
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" style={{ color: 'var(--accent-color)' }}>Create New Paste</Link>
                </div>
            </div>
        </div>
    );
}

export default ViewPaste;
