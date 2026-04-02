import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const getAttachmentErrorMessage = async (err) => {
  if (err.response?.data instanceof Blob) {
    try {
      const text = await err.response.data.text();
      const parsed = JSON.parse(text);
      return parsed.error || 'Download failed';
    } catch {
      return 'Download failed';
    }
  }

  return err.response?.data?.error || 'Download failed';
};

const getDownloadFilename = (contentDisposition, fallbackName) => {
  if (!contentDisposition) return fallbackName;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || fallbackName;
};

export default function ChallengeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [flag, setFlag] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    api.get(`/challenges/${id}`)
      .then(r => setChallenge(r.data.challenge))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDownload = async () => {
    if (!challenge?.attachment_url || downloading) return;

    setDownloading(true);
    setDownloadError('');

    try {
      const res = await api.get(`/challenges/${id}/download`, {
        responseType: 'blob',
      });
      const filename = getDownloadFilename(
        res.headers['content-disposition'],
        challenge.attachment_name || `challenge-${id}-attachment`
      );
      const blobUrl = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      setDownloadError(await getAttachmentErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.post(`/challenges/${id}/submit`, { flag });
      setResult(res.data);
      if (res.data.correct) {
        setChallenge(prev => ({
          ...prev,
          is_solved: true,
          solve_count: (prev?.solve_count || 0) + 1,
        }));
        refreshUser();
        setFlag('');
      }
    } catch (err) {
      setResult({ correct: false, message: err.response?.data?.error || 'Submission error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="glow" style={{ fontFamily: 'var(--pixel)', fontSize: '10px' }}>LOADING MISSION<span className="blink">...</span></span>
    </div>
  );

  if (!challenge) return null;

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      <div style={{ paddingTop: 30, maxWidth: 800, margin: '0 auto' }}>
        <button className="btn btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 24 }}>
          ← BACK
        </button>

        {/* Challenge header */}
        <div className="pixel-card" style={{ marginBottom: 20, borderColor: challenge.category_color }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                {challenge.category_icon} {challenge.category}
              </div>
              <h1 style={{ fontSize: '13px', color: challenge.category_color,
                textShadow: `0 0 10px ${challenge.category_color}`, marginBottom: 8 }}>
                {challenge.title}
              </h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className={`badge badge-${challenge.difficulty}`}>{challenge.difficulty.toUpperCase()}</span>
                <span style={{ fontFamily: 'var(--pixel)', fontSize: '10px', color: 'var(--yellow)' }}>
                  {challenge.points} PTS
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                  {challenge.solve_count} solves
                </span>
              </div>
            </div>
            {challenge.is_solved && (
              <div className="notif notif-success" style={{ margin: 0 }}>✓ MISSION COMPLETE</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--text-dim)', marginBottom: 12 }}>
            {'>'} MISSION BRIEFING
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)', lineHeight: 1.8,
            whiteSpace: 'pre-wrap' }}>
            {challenge.description}
          </div>
        </div>

        {/* Attachment */}
        {challenge.attachment_url && (
          <div className="pixel-card" style={{ marginBottom: 16, borderColor: 'var(--cyan)' }}>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--cyan)', marginBottom: 10 }}>
              {'>'} ATTACHMENT
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-cyan btn-sm"
              disabled={downloading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {downloading ? '...' : '↓'} DOWNLOAD: {challenge.attachment_name}
            </button>
            {downloadError && (
              <div className="notif notif-error" style={{ marginTop: 12 }}>
                ✗ {downloadError}
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        {challenge.hint && (
          <div className="pixel-card" style={{ marginBottom: 16, borderColor: 'var(--yellow)' }}>
            <button className="btn btn-yellow btn-sm" onClick={() => setShowHint(!showHint)}>
              {showHint ? '▲ HIDE HINT' : '▼ REVEAL HINT'}
            </button>
            {showHint && (
              <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--yellow)' }}>
                💡 {challenge.hint}
              </div>
            )}
          </div>
        )}

        {/* Flag submission */}
        <div className="pixel-card" style={{ borderColor: challenge.is_solved ? 'var(--primary)' : 'rgba(0,255,136,0.5)' }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: '8px', color: 'var(--text-dim)', marginBottom: 12 }}>
            {'>'} SUBMIT FLAG
          </div>
          {!challenge.is_solved ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  className="pixel-input"
                  style={{ flex: 1, minWidth: 200 }}
                  type="text"
                  placeholder="sybau{enter_your_flag_here}"
                  value={flag}
                  onChange={e => setFlag(e.target.value)}
                  disabled={submitting}
                  spellCheck={false}
                />
                <button className="btn" type="submit" disabled={submitting || !flag.trim()}>
                  {submitting ? '[ CHECKING... ]' : '[ SUBMIT ]'}
                </button>
              </div>
              {result && (
                <div className={`notif ${result.correct ? 'notif-success' : 'notif-error'}`} style={{ marginTop: 12 }}>
                  {result.correct ? '✓ ' : '✗ '}{result.message}
                </div>
              )}
            </form>
          ) : (
            <div className="notif notif-success">
              ✓ You already solved this mission! +{challenge.points} pts awarded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
