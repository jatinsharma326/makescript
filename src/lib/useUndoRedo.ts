import { useRef, useCallback } from 'react';
import { SubtitleSegment, VideoFilters, TrimPoint, TextOverlay } from './types';

// Only track the parts of state that matter for undo/redo
export interface UndoSnapshot {
    subtitles: SubtitleSegment[];
    filters?: VideoFilters;
    trimPoints?: TrimPoint;
    textOverlays?: TextOverlay[];
    playbackSpeed?: number;
}

const MAX_HISTORY = 30;

export function useUndoRedo() {
    const pastRef = useRef<UndoSnapshot[]>([]);
    const futureRef = useRef<UndoSnapshot[]>([]);

    const pushSnapshot = useCallback((snapshot: UndoSnapshot) => {
        pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), snapshot];
        futureRef.current = []; // Clear redo stack on new action
    }, []);

    const undo = useCallback((): UndoSnapshot | null => {
        if (pastRef.current.length === 0) return null;
        const prev = pastRef.current[pastRef.current.length - 1];
        pastRef.current = pastRef.current.slice(0, -1);
        return prev;
    }, []);

    const redo = useCallback((): UndoSnapshot | null => {
        if (futureRef.current.length === 0) return null;
        const next = futureRef.current[futureRef.current.length - 1];
        futureRef.current = futureRef.current.slice(0, -1);
        return next;
    }, []);

    const pushToFuture = useCallback((snapshot: UndoSnapshot) => {
        futureRef.current = [...futureRef.current, snapshot];
    }, []);

    const canUndo = useCallback(() => pastRef.current.length > 0, []);
    const canRedo = useCallback(() => futureRef.current.length > 0, []);

    const resetHistory = useCallback(() => {
        pastRef.current = [];
        futureRef.current = [];
    }, []);

    return { pushSnapshot, undo, redo, pushToFuture, canUndo, canRedo, resetHistory };
}
