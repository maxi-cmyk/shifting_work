import { describe, expect, it } from 'vitest'
import { formatDuration, getOutcome, getRecommendation, type Gear } from './domain'

describe('timing recommendations', () => {
  it('suggests an upshift when a task finishes with 20% or more in reserve', () => {
    const recommendation = getRecommendation(479, 600, 3)
    expect(recommendation.outcome).toBe('early')
    expect(recommendation.suggestedGear).toBe(4)
  })

  it('holds the current gear inside the target window', () => {
    expect(getOutcome(481, 600)).toBe('on-target')
    expect(getOutcome(719, 600)).toBe('on-target')
    expect(getRecommendation(600, 600, 4).suggestedGear).toBe(4)
  })

  it('suggests a downshift once elapsed time reaches 120% of target', () => {
    const recommendation = getRecommendation(720, 600, 4)
    expect(recommendation.outcome).toBe('overrun')
    expect(recommendation.suggestedGear).toBe(3)
  })

  it.each([
    [6, 0],
    [1, 0],
  ] satisfies [Gear, Gear][])('uses neutral as recovery at the edge gears', (gear, expected) => {
    const recommendation = gear === 6
      ? getRecommendation(100, 600, gear)
      : getRecommendation(800, 600, gear)
    expect(recommendation.suggestedGear).toBe(expected)
  })
})

describe('duration formatting', () => {
  it('formats short and long sessions with tabular timer strings', () => {
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(3661)).toBe('1:01:01')
  })
})
