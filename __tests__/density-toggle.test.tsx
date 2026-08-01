import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DensityToggle } from '@/components/DensityToggle'
import { DensityProvider } from '@/lib/context/DensityContext'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

function renderWithProvider() {
  return render(
    <DensityProvider>
      <DensityToggle />
    </DensityProvider>
  )
}

describe('DensityToggle', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('renders with "Comfortable" label by default', () => {
    renderWithProvider()
    expect(screen.getByText('Comfortable')).toBeInTheDocument()
  })

  it('toggles to "Compact" when clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText('Compact')).toBeInTheDocument()
  })

  it('toggles back to "Comfortable" when clicked again', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    const button = screen.getByRole('button')
    await user.click(button)
    expect(screen.getByText('Compact')).toBeInTheDocument()

    await user.click(button)
    expect(screen.getByText('Comfortable')).toBeInTheDocument()
  })

  it('has correct aria-label describing current density', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('comfortable'))

    await user.click(button)
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('compact'))
  })

  it('persists preference in localStorage after toggle', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    const button = screen.getByRole('button')
    await user.click(button)

    expect(localStorageMock.setItem).toHaveBeenCalledWith('pulse_density_preference', 'compact')
  })
})
