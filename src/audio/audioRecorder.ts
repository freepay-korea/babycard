/**
 * src/audio/audioRecorder.ts
 * 
 * Manages browser MediaRecorder for capturing parents' voices.
 */

export interface RecordingResult {
  blob: Blob;
  url: string;
  durationMs: number;
}

export class SimpleAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private startTime = 0;
  private isRecording = false;

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  public get recording(): boolean {
    return this.isRecording;
  }

  public async start(): Promise<void> {
    if (!SimpleAudioRecorder.isSupported()) {
      throw new Error('이 브라우저는 마이크 녹음을 지원하지 않습니다.');
    }

    this.chunks = [];

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Find supported mimeType
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        '',
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (!mime || MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      this.mediaRecorder = selectedMimeType
        ? new MediaRecorder(this.stream, { mimeType: selectedMimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.startTime = Date.now();
      this.isRecording = true;
    } catch (err: any) {
      this.cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해 주세요.');
      }
      throw new Error(`마이크 연결 중 오류가 발생했습니다: ${err.message || err}`);
    }
  }

  public async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('녹음 중이 아닙니다.'));
        return;
      }

      const recorder = this.mediaRecorder;
      const durationMs = Date.now() - this.startTime;

      recorder.onstop = () => {
        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(this.chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          this.cleanup();
          resolve({ blob, url, durationMs });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      recorder.stop();
      this.isRecording = false;
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.chunks = [];
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
