import { YouTubeClient } from '../youtube-client.js';

export class SummaryTool {
  static async handle(params: any, client: YouTubeClient): Promise<string> {
    const { videoId } = params;

    if (!videoId) {
      throw new Error('videoId parameter is required');
    }

    const transcript = await client.getTranscript(videoId);
    const summary = SummaryTool.generateSummary(transcript);
    
    return `Summary for video ${videoId}:\n\n${summary}`;
  }

  static generateSummary(transcript: string): string {
    // Remove extra whitespace and split into sentences
    const cleaned = transcript.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.length > 20);
    
    // If transcript is short, return it as-is
    if (sentences.length <= 3) {
      return cleaned;
    }

    // Create a summary by taking first few and last few sentences
    const summaryLength = Math.floor(sentences.length / 3);
    const startSentences = sentences.slice(0, Math.max(2, summaryLength)).join('. ');
    const endSentences = sentences.slice(-Math.max(2, summaryLength)).join('. ');
    
    // Try to identify key points
    const keyPoints = this.extractKeyPoints(sentences);
    
    let summary = '';
    if (keyPoints.length > 0) {
      summary += `Key Points:\n${keyPoints.map((point, i) => `- ${point}`).join('\n')}\n\n`;
    }
    
    summary += `Overview: ${startSentences}... ${endSentences}`;
    
    return summary;
  }

  private static extractKeyPoints(sentences: string[]): string[] {
    // Simple keyword extraction based on sentence length and common patterns
    const keyPoints: string[] = [];
    
    for (const sentence of sentences) {
      // Look for sentences that start with action words or contain important keywords
      const lowerSentence = sentence.toLowerCase().trim();
      if (
        lowerSentence.length > 30 && 
        lowerSentence.length < 150 &&
        (lowerSentence.startsWith('we') || 
         lowerSentence.startsWith('they') ||
         lowerSentence.startsWith('this') ||
         lowerSentence.includes('important') ||
         lowerSentence.includes('learn') ||
         lowerSentence.includes('understand') ||
         lowerSentence.includes('key'))
      ) {
        const trimmed = sentence.trim();
        if (trimmed.length < 200) {
          keyPoints.push(trimmed);
        }
      }
      
      if (keyPoints.length >= 5) break;
    }
    
    return keyPoints;
  }
}

