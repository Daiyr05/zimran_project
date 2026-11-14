import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { sessionHandlers } from './sessions'
import { socialHandlers } from './social'

export const worker = setupWorker(...handlers, ...socialHandlers, ...sessionHandlers)
