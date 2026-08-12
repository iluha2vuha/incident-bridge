import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('Incident Bridge static slice', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/review')
  })

  it('renders the development review index', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /one round, two truths/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /round control/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /debrief/i })).toHaveLength(2)
    expect(screen.getByRole('link', { name: /^tie$/i })).toBeInTheDocument()
  })

  it('keeps participant routes out of the development navigation', () => {
    window.history.pushState({}, '', '/participant/join')

    render(<App />)

    expect(screen.getByRole('heading', { name: /incident bridge/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /review index/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^facilitator$/i })).not.toBeInTheDocument()
  })

  it('shows only HR private information in the HR round variant', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('link', { name: /^round$/i }))

    expect(
      screen.getByText(/sender display name looks like a senior HR employee/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/action required before today's pay run/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/password reset was requested for the employee/i),
    ).not.toBeInTheDocument()
  })

  it('shows only IT Helpdesk private information in the IT round variant', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /it helpdesk/i }))
    await userEvent.click(screen.getByRole('link', { name: /^round$/i }))

    expect(screen.getByText(/password reset was requested for the employee/i)).toBeInTheDocument()
    expect(screen.getByText(/BridgeDesk ticket/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/sender display name looks like a senior HR employee/i),
    ).not.toBeInTheDocument()
  })

  it('supports choice selection and confirmation', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('link', { name: /^round$/i }))
    await userEvent.click(screen.getByLabelText(/contact the employee through a trusted channel/i))
    await userEvent.click(screen.getByRole('button', { name: /submit decision/i }))

    expect(screen.getByRole('heading', { name: /confirm your decision/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    expect(screen.getByText(/vote accepted/i)).toBeInTheDocument()
  })

  it('renders facilitator role warnings', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /empty role/i }))

    expect(screen.getByText(/IT Helpdesk has no participants/i)).toBeInTheDocument()
  })

  it('renders the participant final debrief preview', () => {
    window.history.pushState({}, '', '/participant/debrief')

    render(<App />)

    expect(screen.getByRole('heading', { name: /final debrief/i })).toBeInTheDocument()
    expect(screen.getByText(/results are organisational learning signals/i)).toBeInTheDocument()
    expect(screen.getByText(/incident control/i)).toBeInTheDocument()
  })

  it('renders facilitator tie resolution choices', () => {
    window.history.pushState({}, '', '/facilitator/tie')

    render(<App />)

    expect(screen.getByRole('heading', { name: /hr department decision/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /2 votes/i })).toHaveLength(2)
    expect(screen.getByRole('link', { name: /confirm resolution/i })).toBeInTheDocument()
  })
})
