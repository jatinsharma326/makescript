'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoDuration: number;
    videoWidth: number;
    videoHeight: number;
    videoFileName: string;
    videoSrc: string;
}

type ExportStatus = 'settings' | 'rendering' | 'done' | 'error';
type Resolution = '1080p' | '720p' | '480p';
type Format = 'mp4' | 'webm';

const RESOLUTIONS: Record<Resolution, { label: string; scale: number }> = {
    '1080p': { label: '1080p (Full HD)', scale: 1 },
    '720p': { label: '720p (HD)', scale: 0.667 },
    '480p': { label: '480p (SD)', scale: 0.444 },
};

export default function ExportModal({
    isOpen, onClose, videoDuration, videoWidth, videoHeight, videoFileName, videoSrc,
}: ExportModalProps) {
    const [resolution, setResolution] = useState<Resolution>('1080p');
    const [format, setFormat] = useState<Format>('mp4');
    const [status, setStatus] = useState<ExportStatus>('settings');
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const recorderRef = useRef<MediaRecorder | null>(null);
    const cancelledRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            setStatus('settings');
            setProgress(0);
            setDownloadUrl(null);
            setErrorMsg('');
            cancelledRef.current = false;
        }
    }, [isOpen]);

    const handleExport = useCallback(async () => {
        setStatus('rendering');
        setProgress(0);
        cancelledRef.current = false;

        try {
            // Create offscreen video element for rendering
            const video = document.createElement('video');
            video.src = videoSrc;
            video.muted = true;
            video.playsInline = true;

            await new Promise<void>((resolve, reject) => {
                video.onloadeddata = () => resolve();
                video.onerror = () => reject(new Error('Failed to load video'));
                video.load();
            });

            const scale = RESOLUTIONS[resolution].scale;
            const outW = Math.round(videoWidth * scale);
            const outH = Math.round(videoHeight * scale);

            // Canvas for compositing
            const canvas = document.createElement('canvas');
            canvas.width = outW;
            canvas.height = outH;
            const ctx = canvas.getContext('2d')!;

            // Setup MediaRecorder on canvas stream
            const mimeType = format === 'mp4'
                ? (MediaRecorder.isTypeSupported('video/mp4; codecs=avc1') ? 'video/mp4; codecs=avc1' : 'video/webm; codecs=vp9')
                : 'video/webm; codecs=vp9';

            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: resolution === '1080p' ? 8_000_000 : resolution === '720p' ? 4_000_000 : 2_000_000,
            });
            recorderRef.current = recorder;

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

            recorder.onstop = () => {
                if (cancelledRef.current) return;
                const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
                const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
                const url = URL.createObjectURL(blob);
                setDownloadUrl(url);
                setStatus('done');
            };

            recorder.start(100);
            video.currentTime = 0;
            await video.play();

            // Progress loop
            const updateProgress = () => {
                if (cancelledRef.current) return;
                const pct = Math.min(100, (video.currentTime / videoDuration) * 100);
                setProgress(pct);
                if (!video.ended && !video.paused) {
                    requestAnimationFrame(() => {
                        ctx.drawImage(video, 0, 0, outW, outH);
                        updateProgress();
                    });
                } else {
                    // Final frame
                    ctx.drawImage(video, 0, 0, outW, outH);
                    setTimeout(() => recorder.stop(), 200);
                }
            };
            updateProgress();

            video.onended = () => {
                ctx.drawImage(video, 0, 0, outW, outH);
                setTimeout(() => {
                    if (recorder.state === 'recording') recorder.stop();
                }, 200);
            };

        } catch (err) {
            console.error('Export error:', err);
            setErrorMsg(err instanceof Error ? err.message : 'Export failed');
            setStatus('error');
        }
    }, [videoSrc, videoDuration, videoWidth, videoHeight, resolution, format]);

    const handleCancel = useCallback(() => {
        cancelledRef.current = true;
        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
        }
        onClose();
    }, [onClose]);

    const handleDownload = useCallback(() => {
        if (!downloadUrl) return;
        const a = document.createElement('a');
        a.href = downloadUrl;
        const baseName = videoFileName.replace(/\.[^.]+$/, '');
        const ext = format === 'mp4' ? 'mp4' : 'webm';
        a.download = `${baseName}_makescript.${ext}`;
        a.click();
    }, [downloadUrl, videoFileName, format]);

    if (!isOpen) return null;

    const outputW = Math.round(videoWidth * RESOLUTIONS[resolution].scale);
    const outputH = Math.round(videoHeight * RESOLUTIONS[resolution].scale);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        }} onClick={(e) => { if (e.target === e.currentTarget && status === 'settings') onClose(); }}>
            <div style={{
                width: 440, maxWidth: '90vw',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16, padding: 0,
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                animation: 'toastSlideIn 0.2s ease-out',
                fontFamily: "'Inter', sans-serif",
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Export Video</h2>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                            {videoDuration.toFixed(1)}s &middot; {videoWidth}&times;{videoHeight}
                        </p>
                    </div>
                    <button onClick={status === 'rendering' ? handleCancel : onClose}
                        style={{
                            width: 28, height: 28, borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'transparent', color: 'var(--text-secondary)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div style={{ padding: '20px 24px 24px' }}>
                    {status === 'settings' && (
                        <>
                            {/* Resolution */}
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                                Resolution
                            </label>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                                {(Object.keys(RESOLUTIONS) as Resolution[]).map(r => (
                                    <button key={r} onClick={() => setResolution(r)}
                                        style={{
                                            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                            border: `1px solid ${r === resolution ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
                                            background: r === resolution ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            color: r === resolution ? '#818cf8' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                        }}>
                                        {r}
                                    </button>
                                ))}
                            </div>

                            {/* Format */}
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                                Format
                            </label>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                                {(['mp4', 'webm'] as Format[]).map(f => (
                                    <button key={f} onClick={() => setFormat(f)}
                                        style={{
                                            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                            border: `1px solid ${f === format ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
                                            background: f === format ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            color: f === format ? '#818cf8' : 'var(--text-secondary)',
                                            cursor: 'pointer', textTransform: 'uppercase',
                                        }}>
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Output info */}
                            <div style={{
                                padding: '10px 14px', borderRadius: 8, marginBottom: 20,
                                background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)',
                                fontSize: 11, color: 'var(--text-secondary)',
                            }}>
                                Output: {outputW}&times;{outputH} &middot; {format.toUpperCase()} &middot; ~{Math.round(videoDuration * (resolution === '1080p' ? 1 : resolution === '720p' ? 0.5 : 0.25))}MB est.
                            </div>

                            {/* Export button */}
                            <button onClick={handleExport}
                                style={{
                                    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Start Export
                            </button>
                        </>
                    )}

                    {status === 'rendering' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                Rendering video...
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
                                {Math.round(progress)}% complete
                            </div>
                            {/* Progress bar */}
                            <div style={{
                                width: '100%', height: 6, borderRadius: 3,
                                background: 'rgba(99,102,241,0.1)', overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${progress}%`, height: '100%', borderRadius: 3,
                                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    transition: 'width 0.3s ease',
                                }} />
                            </div>
                            <button onClick={handleCancel}
                                style={{
                                    marginTop: 20, padding: '8px 24px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                    border: '1px solid var(--border-color)', background: 'transparent',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                }}>
                                Cancel
                            </button>
                        </div>
                    )}

                    {status === 'done' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
                                background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                Export Complete
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 24 }}>
                                Your video is ready to download
                            </div>
                            <button onClick={handleDownload}
                                style={{
                                    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Video
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
                                background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                Export Failed
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
                                {errorMsg || 'Something went wrong'}
                            </div>
                            <button onClick={() => setStatus('settings')}
                                style={{
                                    padding: '10px 32px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                    color: '#818cf8', cursor: 'pointer',
                                }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
