import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function CreatePaste() {
    const [content, setContent] = useState('');
    const [ttl, setTtl] = useState('');
    const [maxViews, setMaxViews] = useState('');
    const [createdUrl, setCreatedUrl] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const validateInput = () => {
        if (!content.trim()) {
            return 'Content cannot be empty.';
        }
        if (ttl && (isNaN(ttl) || parseInt(ttl) <= 0)) {
            return 'TTL must be a positive number.';
        }
        if (maxViews && (isNaN(maxViews) || parseInt(maxViews) <= 0)) {
            return 'Max Views must be a positive number.';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                content,
                ttl_seconds: ttl ? parseInt(ttl) : undefined,
                max_views: maxViews ? parseInt(maxViews) : undefined,
            };

            const response = await axios.post('/api/pastes', payload);
            setCreatedUrl(response.data.url);
        } catch (err) {
            console.error(err);
            // Extract meaningful error message
            let errMsg = 'Failed to create paste';
            if (err.response?.data?.error) {
                const apiError = err.response.data.error;
                if (typeof apiError === 'string') {
                    errMsg = apiError;
                } else if (Array.isArray(apiError)) {
                    // Zod issues
                    errMsg = apiError.map(issue => issue.message || JSON.stringify(issue)).join(', ');
                } else {
                    errMsg = JSON.stringify(apiError);
                }
            }
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(createdUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy info: ', err);
        }
    };

    if (createdUrl) {
        return (
            <div className="container">
                <div className="card success-message">
                    <h1>Paste Created! 🚀</h1>
                    <p>Your paste is ready. Share this secure link:</p>
                    <div className="url-container">
                        <a href={createdUrl} className="paste-url url-text" target="_blank" rel="noopener noreferrer">
                            {createdUrl}
                        </a>
                        <button onClick={handleCopy} disabled={copied} className="copy-btn">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <button onClick={() => {
                        setCreatedUrl(null);
                        setContent('');
                        setTtl('');
                        setMaxViews('');
                        setCopied(false);
                    }} style={{ marginTop: '1rem', width: '100%' }}>Create Another</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <h1>New Paste</h1>
                {error && (
                    <div className="error-message" role="alert" style={{ color: 'var(--error-color)', marginBottom: '1rem', padding: '0.5rem', border: '1px solid var(--error-color)', borderRadius: '4px' }}>
                        ⚠️ {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Content</label>
                        <textarea
                            rows="10"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste your text here..."
                            required
                        ></textarea>
                    </div>
                    <div className="options-grid">
                        <div className="form-group option-group">
                            <label>TTL (Seconds) - Optional</label>
                            <input
                                type="number"
                                value={ttl}
                                onChange={(e) => setTtl(e.target.value)}
                                placeholder="e.g. 60"
                                min="1"
                            />
                        </div>
                        <div className="form-group option-group">
                            <label>Max Views - Optional</label>
                            <input
                                type="number"
                                value={maxViews}
                                onChange={(e) => setMaxViews(e.target.value)}
                                placeholder="e.g. 5"
                                min="1"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Paste'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreatePaste;
