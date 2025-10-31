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

      if (transcript && transcript.length >= 20) {
        return transcript;
      }

      // Fallback to video description if transcript is empty/too short
      const description = await this.getVideoDescription(videoId);
      return description ?? '';
    } catch (error) {
      // As a fallback on error, try returning the description
      try {
        const description = await this.getVideoDescription(videoId);
        if (description) return description;
      } catch (_) {
        // ignore secondary failure
      }
      throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for videos on YouTube
   */
  async searchVideos(query: string, maxResults: number = 5): Promise<any[]> {
    const doRequest = async (q: string) => {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q,
          type: 'video',
          maxResults,
          key: this.apiKey,
        },
      });
      return response.data.items || [];
    };

    try {
      try {
        return await doRequest(query);
      } catch (err: any) {
        // If 400, try a simplified query removing special characters
        const status = err?.response?.status;
        const data = err?.response?.data;
        if (status === 400) {
          const simplified = query.replace(/[$"']/g, '').replace(/\s+/g, ' ').trim();
          if (simplified && simplified !== query) {
            try {
              return await doRequest(simplified);
            } catch (_) {
              // fall through to throw below
            }
          }
        }
        const detail = data ? ` Response: ${JSON.stringify(data)}` : '';
        throw new Error(`Failed to search videos: ${err?.message || 'Unknown error'}.${detail}`);
      }
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

  /**
   * Get video description (fallback content when transcript is unavailable)
   */
  async getVideoDescription(videoId: string): Promise<string | null> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet',
          id: videoId,
          key: this.apiKey,
        },
      });
      const item = response.data.items?.[0];
      const description = item?.snippet?.description || null;
      return description ? String(description).trim() : null;
    } catch (error) {
      return null;
    }
  }
}

