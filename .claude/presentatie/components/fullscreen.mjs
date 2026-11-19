export async function toggleFullscreen(element) {
  if (element.ownerDocument.fullscreenElement === element) await element.ownerDocument.exitFullscreen();
  else await element.requestFullscreen();
}
