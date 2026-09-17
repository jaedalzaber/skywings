import { after } from 'next/server'

/**
 * Runs work after the current response, so an editor's save or a visitor's
 * form is not held up by email. Outside a request -- a seed script, a test --
 * there is no response to wait for, so it simply starts the work.
 */
export function runAfterResponse(task: () => Promise<unknown>) {
  try {
    after(task)
  } catch {
    void task().catch((error) => console.error('[newsletter]', error))
  }
}
