export function deckPath(id: string, hash?: string) {
  const path = `/deck?id=${encodeURIComponent(id)}`
  return hash ? `${path}#${hash}` : path
}

export function studyPath(id: string) {
  return `/study?id=${encodeURIComponent(id)}`
}
