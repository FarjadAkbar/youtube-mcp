import axios from 'axios';
import { YoutubeTranscript } from 'youtube-transcript';

export class YouTubeClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get transcript of a YouTube video
   */
  async getTranscript(videoId: string): Promise<string> {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      const transcript = transcriptItems
        .map((item: any) => item.text)
        .join(' ')
        .trim();
      return transcript;
    } catch (error) {
      throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for videos on YouTube
   */
  async searchVideos(query: string, maxResults: number = 5): Promise<any[]> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          key: this.apiKey,
        },
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet,statistics,contentDetails,brandingSettings',
          id: channelId,
          key: this.apiKey,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      return response.data.items[0];
    } catch (error) {
      throw new Error(`Failed to get channel info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all videos from a channel
   */
  async getChannelVideos(channelId: string, maxResults: number = 50): Promise<any[]> {
    try {
      // First, get the uploads playlist ID
      const channelInfo = await this.getChannelInfo(channelId);
      const uploadsPlaylistId = channelInfo.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new Error('Could not find uploads playlist for channel');
      }

      // Then get videos from the uploads playlist
      const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults,
          key: this.apiKey,
        },
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get channel videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

