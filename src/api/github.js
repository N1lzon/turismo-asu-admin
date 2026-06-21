export async function fetchLastCommit(owner, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
    {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000),
    }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const [commit] = await res.json()
  return {
    sha: commit.sha.slice(0, 7),
    message: commit.commit.message.split('\n')[0],
    author: commit.commit.author.name,
    date: commit.commit.author.date,
    url: commit.html_url,
  }
}
