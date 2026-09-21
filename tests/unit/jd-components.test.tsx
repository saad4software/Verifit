// Matching polling is exercised independently in matching-components.test.tsx.
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JdDetail } from '@/modules/jds/components/jd-detail'
import type { Jd } from '@/modules/jds/schema'
import { JdImport } from '@/modules/jds/components/jd-import'
const push = vi.hoisted(() => vi.fn())
vi.mock('@/modules/matching/components/matches-panel', () => ({ MatchesPanel: () => null }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}))
beforeEach(() => {
  push.mockReset()
})
afterEach(() => {
  vi.unstubAllGlobals()
})
it('lets the user open a duplicate or deliberately create an independent copy', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        { existingId: 'existing', error: 'Already imported' },
        { status: 409 },
      ),
    )
    .mockResolvedValueOnce(
      Response.json({ jd: { _id: 'copy' } }, { status: 201 }),
    )
  vi.stubGlobal('fetch', fetcher)
  render(<JdImport />)
  fireEvent.click(screen.getByRole('radio', { name: 'Web page URL' }))
  fireEvent.change(screen.getByLabelText('Job ad URL'), {
    target: { value: 'https://example.com/job' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Import job description' }),
  )
  expect(
    await screen.findByRole('link', { name: 'Open existing JD' }),
  ).toHaveAttribute('href', '/dashboard/jds/existing')
  fireEvent.click(screen.getByRole('button', { name: 'Create separate copy' }))
  await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/jds/copy'))
})

const jd: Jd = {
  _id: 'jd',
  _rev: '1',
  _type: 'jd',
  userId: 'user',
  source: { id: 'source', text: 'React developer required', origin: 'pasted' },
  content: {
    fields: [
      {
        _key: 'title',
        category: 'title',
        text: 'React developer',
        evidence: ['React developer'],
      },
    ],
    requirements: [],
    groups: [],
  },
  warnings: [],
  findings: [],
  error: null,
  processing: null,
  readiness: 'needs_review',
  replacement: null,
  attempts: 1,
}
it('shows source, preserves unsupported corrections, and supports Save and confirm', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        { error: 'Title is unsupported by the source.' },
        { status: 422 },
      ),
    )
    .mockResolvedValueOnce(
      Response.json({ jd: { ...jd, readiness: 'ready', _rev: '2' } }),
    )
  vi.stubGlobal('fetch', fetcher)
  render(<JdDetail initialJd={jd} />)
  // Defaults to preview mode with retained source hidden
  expect(screen.getByTestId('jd-viewer')).toBeVisible()
  expect(screen.queryByTestId('retained-source-panel')).not.toBeInTheDocument()

  // Switch to edit mode to view retained source and edit fields
  fireEvent.click(screen.getByTestId('toggle-edit-mode'))
  expect(screen.getByText('React developer required')).toBeVisible()
  fireEvent.change(screen.getByLabelText('title content'), {
    target: { value: 'CEO' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save and confirm' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('unsupported')
  expect(screen.getByLabelText('title content')).toHaveValue('CEO')
  fireEvent.change(screen.getByLabelText('title content'), {
    target: { value: 'React developer' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save and confirm' }))
  expect(await screen.findByText('Ready for future matching')).toBeVisible()
})
it('cancelling deletion keeps the JD open without a delete request', () => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  render(<JdDetail initialJd={jd} />)
  fireEvent.click(screen.getByRole('button', { name: 'Delete JD' }))
  expect(
    screen.getByRole('dialog', { name: 'Delete job description?' }),
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(fetcher).not.toHaveBeenCalled()
})
it('offers pasted recovery with the retained URL and returns to processing', async () => {
  const failed: Jd = {
    ...jd,
    content: null,
    error: 'Page blocked',
    source: {
      ...jd.source,
      text: '',
      url: 'https://example.com/job',
      origin: 'fetched',
    },
  }
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        Response.json({
          jd: {
            ...failed,
            error: null,
            source: {
              ...failed.source,
              text: 'React developer required',
              origin: 'pasted',
            },
            processing: {
              id: 'attempt',
              startedAt: new Date().toISOString(),
              stage: 'structuring',
              attempt: 1,
            },
          },
        }),
      ),
  )
  render(<JdDetail initialJd={failed} />)
  fireEvent.change(screen.getByLabelText('Paste the job ad'), {
    target: { value: 'React developer required' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Continue with pasted text' }),
  )
  expect(
    await screen.findByText(/Structuring the job description/),
  ).toBeVisible()
  expect(screen.getByText(/Pasted text; URL kept as provenance/)).toBeVisible()
})
it.each(['Accept replacement', 'Reject replacement'])(
  'offers %s after source-side review',
  async (name) => {
    const withReplacement: Jd = {
      ...jd,
      readiness: 'ready',
      replacement: {
        source: { ...jd.source, id: 'replacement', text: 'New source excerpt' },
        content: jd.content,
        findings: [],
        warnings: [],
        error: null,
        processing: null,
      },
    }
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ jd: { ...jd, readiness: 'ready' } }),
        ),
    )
    render(<JdDetail initialJd={withReplacement} />)
    fireEvent.click(screen.getByRole('button', { name: 'Review replacement' }))
    fireEvent.click(screen.getByTestId('toggle-edit-mode'))
    expect(screen.getByText('New source excerpt')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Ready for future matching')).toBeVisible()
  },
)

it('defaults to preview, hides retained source in preview, and shows it in edit view', () => {
  render(<JdDetail initialJd={jd} />)

  // Default view is preview
  expect(screen.getByTestId('jd-viewer')).toBeVisible()
  expect(screen.queryByTestId('retained-source-panel')).not.toBeInTheDocument()

  // Switch to edit view: retained source panel appears
  fireEvent.click(screen.getByTestId('toggle-edit-mode'))
  expect(screen.getByTestId('retained-source-panel')).toBeVisible()
  expect(screen.getByText('React developer required')).toBeVisible()
  expect(screen.getByLabelText('title content')).toBeVisible()

  // Switch back to preview view: retained source is hidden again
  fireEvent.click(screen.getByTestId('toggle-preview-mode'))
  expect(screen.getByTestId('jd-viewer')).toBeVisible()
  expect(screen.queryByTestId('retained-source-panel')).not.toBeInTheDocument()
})


it.each([false, true])('prints the selected JD preview from edit mode (replacement: %s)', (replacement) => {
  const initialJd: Jd = {
    ...jd,
    replacement: replacement ? {
      source: { ...jd.source, id: 'replacement' },
      content: { fields: [{ _key: 'title', category: 'title', text: 'Replacement role', evidence: [] }], requirements: [], groups: [] },
      findings: [], warnings: [], error: null, processing: null,
    } : null,
  }
  const print = vi.spyOn(window, 'print').mockImplementation(() => {
    expect(screen.getByTestId('jd-viewer')).toHaveTextContent('Updated draft role')
    expect(screen.queryByTestId('retained-source-panel')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('title content')).not.toBeInTheDocument()
  })
  try {
    render(<JdDetail initialJd={initialJd} />)
    if (replacement) fireEvent.click(screen.getByRole('button', { name: 'Review replacement' }))
    fireEvent.click(screen.getByTestId('toggle-edit-mode'))
    fireEvent.change(screen.getByLabelText('title content'), { target: { value: 'Updated draft role' } })
    fireEvent.click(screen.getByTestId('print-jd-button'))
    expect(print).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTestId('toggle-edit-mode'))
    expect(screen.getByLabelText('title content')).toHaveValue('Updated draft role')
  } finally {
    print.mockRestore()
  }
})
