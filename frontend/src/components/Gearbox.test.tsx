import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { gatePositions, Gearbox, routeAlongGate } from './Gearbox'

describe('Gearbox controls', () => {
  it('supports a semantic click alternative for every gate', async () => {
    const onShift = vi.fn()
    const user = userEvent.setup()
    render(<Gearbox gear={0} onShift={onShift} />)
    await user.click(screen.getByRole('button', { name: 'Engage gear 5' }))
    expect(onShift).toHaveBeenCalledWith(5)
  })

  it('snaps a pointer drag to the nearest gate', () => {
    const onShift = vi.fn()
    render(<Gearbox gear={0} onShift={onShift} />)
    const gearbox = screen.getByRole('region', { name: 'Six-speed gear selector' })
    const track = within(gearbox).getByRole('button', { name: 'Engage gear 1' }).closest('.shift-gate') as HTMLDivElement
    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, toJSON: () => ({}),
    })
    fireEvent.pointerDown(track, { pointerId: 1, clientX: 50, clientY: 50 })
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 80, clientY: 82 })
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 80, clientY: 82 })
    expect(onShift).toHaveBeenCalledWith(6)
  })

  it('routes cross-gate shifts through neutral instead of cutting diagonally', () => {
    expect(routeAlongGate(gatePositions[1], 6)).toEqual([
      { x: 20, y: 24 },
      { x: 20, y: 50 },
      { x: 80, y: 50 },
      { x: 80, y: 76 },
    ])
  })
})
