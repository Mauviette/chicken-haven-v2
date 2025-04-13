// composables/generateFences.js
export function generateFences(mapChunks, chunkSize, tileSize) {
  const sides = []
  const corners = []

  const unlockedChunks = mapChunks.filter(c => c.unlocked)
  const chunkMap = new Set(unlockedChunks.map(c => `${c.x},${c.y}`))

  const hasChunk = (x, y) => chunkMap.has(`${x},${y}`)

  for (const chunk of unlockedChunks) {
    const baseX = chunk.x * chunkSize * tileSize
    const baseY = chunk.y * chunkSize * tileSize

    // === Fences latéraux ===
    const directions = [
      {
        side: 'top',
        condition: !hasChunk(chunk.x, chunk.y - 1),
        getPos: i => ({
          x: baseX + i * tileSize,
          y: baseY - tileSize
        })
      },
      {
        side: 'bottom',
        condition: !hasChunk(chunk.x, chunk.y + 1),
        getPos: i => ({
          x: baseX + i * tileSize,
          y: baseY + chunkSize * tileSize
        })
      },
      {
        side: 'left',
        condition: !hasChunk(chunk.x - 1, chunk.y),
        getPos: i => ({
          x: baseX - tileSize,
          y: baseY + i * tileSize
        })
      },
      {
        side: 'right',
        condition: !hasChunk(chunk.x + 1, chunk.y),
        getPos: i => ({
          x: baseX + chunkSize * tileSize,
          y: baseY + i * tileSize
        })
      }
    ]

    for (const dir of directions) {
      if (dir.condition) {
        for (let i = 0; i < chunkSize; i++) {
          const pos = dir.getPos(i)
          sides.push({ x: pos.x, y: pos.y, side: dir.side })
        }
      }
    }

    // === Coins (seulement si les deux coins adjacents n'ont pas de voisins) ===
    const coinChecks = [
      {
        x: chunk.x - 1,
        y: chunk.y - 1,
        selfX: baseX - tileSize,
        selfY: baseY - tileSize,
        side1: hasChunk(chunk.x - 1, chunk.y),
        side2: hasChunk(chunk.x, chunk.y - 1),
        pos: 'top-left'
      },
      {
        x: chunk.x + 1,
        y: chunk.y - 1,
        selfX: baseX + chunkSize * tileSize,
        selfY: baseY - tileSize,
        side1: hasChunk(chunk.x + 1, chunk.y),
        side2: hasChunk(chunk.x, chunk.y - 1),
        pos: 'top-right'
      },
      {
        x: chunk.x - 1,
        y: chunk.y + 1,
        selfX: baseX - tileSize,
        selfY: baseY + chunkSize * tileSize,
        side1: hasChunk(chunk.x - 1, chunk.y),
        side2: hasChunk(chunk.x, chunk.y + 1),
        pos: 'bottom-left'
      },
      {
        x: chunk.x + 1,
        y: chunk.y + 1,
        selfX: baseX + chunkSize * tileSize,
        selfY: baseY + chunkSize * tileSize,
        side1: hasChunk(chunk.x + 1, chunk.y),
        side2: hasChunk(chunk.x, chunk.y + 1),
        pos: 'bottom-right'
      }
    ]

    for (const c of coinChecks) {
      if (!c.side1 && !c.side2) {
        corners.push({ x: c.selfX, y: c.selfY, side: c.pos })
      }
    }
  }

  return { sides, corners }
}
