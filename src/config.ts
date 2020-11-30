export const refreshPeriod = 4000
export const gracePeriod = refreshPeriod * 4

export const K8S_DEBUGGER_ISOLATED_CONTEXT = Boolean(
  process.env['K8S_DEBUGGER_ISOLATED_CONTEXT']
)
export const experimentalEnabled = Boolean(
  process.env.K8S_DEBUGGER_EXPERIMENTAL_ENABLED
)


export const defaultPageSize = 15
