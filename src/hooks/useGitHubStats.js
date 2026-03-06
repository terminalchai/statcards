import { useState, useCallback } from 'react'

async function toBase64(url) {
  try {
    const res = await window.fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return url // fallback to URL if fetch fails
  }
}

export function useGitHubStats() {
  const [status, setStatus]   = useState('idle') // idle | loading | success | error
  const [data,   setData]     = useState(null)
  const [error,  setError]    = useState(null)

  const fetchStats = useCallback(async (username) => {
    if (!username.trim()) return
    setStatus('loading')
    setData(null)
    setError(null)

    try {
      const [userRes, reposRes] = await Promise.all([
        window.fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
        window.fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`),
      ])

      if (userRes.status === 404) throw new Error('User not found — check the username')
      if (userRes.status === 403) throw new Error('GitHub rate limit hit — wait a minute and try again')
      if (!userRes.ok) throw new Error(`GitHub API error (${userRes.status})`)

      const user  = await userRes.json()
      const repos = reposRes.ok ? await reposRes.json() : []

      // Derived stats from repos (excluding forks)
      const ownRepos    = repos.filter(r => !r.fork)
      const totalStars  = ownRepos.reduce((s, r) => s + r.stargazers_count, 0)
      const totalForks  = ownRepos.reduce((s, r) => s + r.forks_count,      0)

      // Top languages by repo count (own repos only)
      const langMap = {}
      ownRepos.forEach(r => {
        if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1
      })
      const langTotal = Object.values(langMap).reduce((a, b) => a + b, 0) || 1
      const languages = Object.entries(langMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({ name, percent: Math.round((count / langTotal) * 100) }))

      // PRs via search API (best-effort, may fail on rate limits)
      let prs = null
      try {
        const prRes = await window.fetch(
          `https://api.github.com/search/issues?q=type:pr+author:${encodeURIComponent(username)}&per_page=1`
        )
        if (prRes.ok) {
          const prData = await prRes.json()
          prs = prData.total_count
        }
      } catch { /* silently ignore — search API stricter */ }

      // Pre-convert avatar to base64 so html-to-image doesn't hit CORS
      const avatarBase64 = await toBase64(user.avatar_url)

      setData({
        name:      user.name || user.login,
        username:  user.login,
        bio:       user.bio || '',
        avatar:    avatarBase64,
        followers: user.followers,
        following: user.following,
        repos:     user.public_repos,
        stars:     totalStars,
        forks:     totalForks,
        prs,
        languages,
        location:  user.location || '',
        company:   user.company  || '',
      })
      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  return { status, data, error, fetchStats }
}
