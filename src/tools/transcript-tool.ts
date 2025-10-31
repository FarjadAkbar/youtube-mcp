import { YouTubeClient } from '../youtube-client.js';

export class TranscriptTool {
  static async handle(params: any, client: YouTubeClient): Promise<string> {
    const { videoId } = params;

    if (!videoId) {
      throw new Error('videoId parameter is required');
    }

    const transcript = await client.getTranscript(videoId);
    
    return `Transcript for video ${videoId}:\n\n${transcript}`;
  }
}

