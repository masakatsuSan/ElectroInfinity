const axios = require('axios')

const PLAYLIST_BASE = 'https://www.googleapis.com/youtube/v3/playlistItems'
const MAX_RESULTS = 50
const MAX_VIDEOS = 500

function extractPlaylistId(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()

  if (/^[A-Za-z0-9_-]{13,}$/.test(trimmed) && !trimmed.includes('://') && !trimmed.includes('youtube')) {
    return trimmed
  }

  const patterns = [
    /[?&]list=([A-Za-z0-9_-]+)/,
    /youtube\.com\/playlist\?.*list=([A-Za-z0-9_-]+)/,
    /youtu\.be\/?[?&]list=([A-Za-z0-9_-]+)/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) return match[1]
  }

  return null
}

function resolveThumbnail(snippet) {
  const thumbs = snippet?.thumbnails
  if (!thumbs) return ''
  return thumbs.maxresdefault?.url || thumbs.standard?.url || thumbs.medium?.url || thumbs.default?.url || ''
}

async function importPlaylist(playlistId, { signal } = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    const err = new Error('YouTube API key is not configured. Set YOUTUBE_API_KEY in the environment.')
    err.code = 'NO_YOUTUBE_KEY'
    throw err
  }

  const videos = []
  const seen = new Set()
  let pageToken = null

  while (videos.length < MAX_VIDEOS) {
    let response
    try {
      response = await axios.get(PLAYLIST_BASE, {
        params: {
          part: 'snippet,contentDetails',
          playlistId,
          maxResults: MAX_RESULTS,
          pageToken: pageToken || undefined,
          key: apiKey,
        },
        timeout: 15000,
        signal,
      })
    } catch (httpErr) {
      const status = httpErr.response?.status
      const reason = httpErr.response?.data?.error?.message || httpErr.message

      if (status === 404 || /playlist/i.test(reason)) {
        const notFound = new Error(`Playlist not found or is private/unavailable (${reason})`)
        notFound.code = 'PLAYLIST_NOT_FOUND'
        throw notFound
      }
      if (status === 403 || status === 400 || status === 429) {
        const quotaErr = new Error(`YouTube API error (${reason}). Check API key + quota.`)
        quotaErr.code = 'YOUTUBE_API_ERROR'
        quotaErr.status = status
        throw quotaErr
      }
      throw httpErr
    }

    const items = response.data?.items || []

    for (const item of items) {
      const videoId = item?.contentDetails?.videoId
      const snippet = item?.snippet
      if (!videoId || seen.has(videoId)) continue
      seen.add(videoId)

      videos.push({
        videoId,
        title: (snippet?.title || `Lecture ${videos.length + 1}`).replace(/^\s*#\d+\s*-\s*/, ''),
        thumbnail: resolveThumbnail(snippet),
      })

      if (videos.length >= MAX_VIDEOS) break
    }

    const nextToken = response.data?.nextPageToken
    if (!nextToken) break
    pageToken = nextToken
  }

  if (videos.length === 0) {
    const empty = new Error('No videos found in this playlist.')
    empty.code = 'PLAYLIST_EMPTY'
    throw empty
  }

  return { videos, totalFetched: videos.length }
}

module.exports = { extractPlaylistId, importPlaylist, MAX_VIDEOS, MAX_RESULTS }
