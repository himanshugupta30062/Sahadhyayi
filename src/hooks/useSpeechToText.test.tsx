// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const secureFetchMock = vi.hoisted(() => vi.fn());
vi.mock('../security/secureFetch', () => ({ secureFetch: secureFetchMock }));
import { useSpeechToText } from './useSpeechToText';

class MockRecorder {
  static instance: MockRecorder | undefined;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onstop?.());
  constructor(public stream: { getTracks: () => Array<{ stop: () => void }> }) {
    MockRecorder.instance = this;
  }
}
const tracks = [{ stop: vi.fn() }];
const stream = { getTracks: () => tracks };

describe('useSpeechToText', () => {
  const onTranscript = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    secureFetchMock.mockResolvedValue({ ok: true, json: async () => ({ transcription: 'recognized words' }) });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('MediaRecorder', MockRecorder);
    MockRecorder.instance = undefined;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts recording and collects non-empty audio chunks', async () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, onError }));
    await act(async () => { await result.current.startRecording(); });
    expect(result.current.isRecording).toBe(true);
    expect(MockRecorder.instance?.start).toHaveBeenCalled();
    MockRecorder.instance?.ondataavailable?.({ data: new Blob(['audio']) });
    MockRecorder.instance?.ondataavailable?.({ data: new Blob([]) });
  });

  it('transcribes on stop and cleans up stream tracks', async () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, onError }));
    await act(async () => { await result.current.startRecording(); });
    await act(async () => { MockRecorder.instance?.ondataavailable?.({ data: new Blob(['sample']) }); MockRecorder.instance?.onstop?.(); });
    expect(secureFetchMock).toHaveBeenCalledWith('/api/stt', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
    expect(onTranscript).toHaveBeenCalledWith('recognized words');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(tracks[0].stop).toHaveBeenCalled();
  });

  it('reports missing transcription and failed STT responses', async () => {
    secureFetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) }).mockResolvedValueOnce({ ok: false });
    const { result } = renderHook(() => useSpeechToText({ onTranscript, onError }));
    await act(async () => { await result.current.startRecording(); });
    await act(async () => { await MockRecorder.instance?.onstop?.(); });
    expect(onError).toHaveBeenCalledWith('No transcription received');
    await act(async () => { await result.current.startRecording(); });
    await act(async () => { await MockRecorder.instance?.onstop?.(); });
    expect(onError).toHaveBeenCalledWith('Failed to transcribe audio. Please try again.');
  });

  it('reports microphone permission failures and toggles recording', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useSpeechToText({ onTranscript, onError }));
    await act(async () => { await result.current.startRecording(); });
    expect(onError).toHaveBeenCalledWith('Could not access microphone. Please check permissions.');
    await act(async () => { await result.current.toggleRecording(); });
    expect(result.current.isRecording).toBe(true);
    act(() => { result.current.toggleRecording(); });
    expect(result.current.isRecording).toBe(false);
  });
});
