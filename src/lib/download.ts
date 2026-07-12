/**
 * Trigger a file download for a Blob. The anchor is inserted into the DOM before clicking —
 * some browsers (Firefox, certain Android WebViews) ignore a detached anchor's .click().
 */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  // defer cleanup — some browsers start the download async and need the URL/anchor to survive
  // the current tick, or the file can arrive empty
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 0)
}
