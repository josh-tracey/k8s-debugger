import * as shell from 'shelljs'

let logTimestampRegex = /(\d{4}-\d{2}-\d{2}[A-Z]\d{2}:\d{2}:\d{2}\.\d{9}[A-Z]) (.*)/gu

export const streamLog = (name: string, namespace?: string) => {
  shell.exec(
    `kubectl logs -f  --timestamps --since=10m ${
      namespace ? `-n ${namespace}` : ''
    } ${name}`,
    { async: true }
  )
}

export const getLogs = (name: string, namespace?: string) => {
  const logs = shell
    .exec(
      `kubectl logs --timestamps ${namespace ? `-n ${namespace}` : ''} ${name}`,
      { silent: true }
    )
    .match(/(.*)/gu)

  if (logs)
    return logs.map((line: string) => {
      const match = logTimestampRegex.exec(line)
      return match
    })
  return null
}
