export interface FloatingPosition { x: number; y: number }

export function constrainFloatingPosition(position: FloatingPosition, width: number, height: number, viewportWidth: number, viewportHeight: number): FloatingPosition {
  const margin = 12;
  return {
    x: Math.max(margin, Math.min(position.x, Math.max(margin, viewportWidth - width - margin))),
    y: Math.max(margin, Math.min(position.y, Math.max(margin, viewportHeight - height - margin))),
  };
}
