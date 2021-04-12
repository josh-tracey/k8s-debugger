import { types, flow, Instance, SnapshotIn } from 'mobx-state-tree'
import api from '../api'

export const Log = types.model({
  podName: types.string,
  timestamp: types.Date,
  log: types.string,
})

const RootModel = types
  .model({
    currentNamespace: types.string,
    currentContext: types.maybe(types.string),
    currentLogs: types.array(Log),
  })
  .actions((self) => ({
    setNamespace: (namespace: string) => {
      self.currentNamespace = namespace
    },
    setContext: flow(function* (context: string) {
      yield api.setContext(context)
      if (api.getCurrentContext() === context) {
        self.currentContext = context
      } else {
        throw new Error('Failed to set context')
      }
    }),
    addLog: (log: ILog) => {self.currentLogs.push(log)},
    clearLogs: () => {
      self.currentLogs.clear()
    },
    sortLogs: () => {
      const logs = self.currentLogs.slice().sort(
        (a: ILog, b: ILog) => a.timestamp.getTime() - b.timestamp.getTime()
      )
      self.currentLogs.replace(logs)
    },
  }))

const RootStore = RootModel.create({ currentNamespace: 'default' })

export default RootStore

export interface ILog extends Instance<typeof Log> {}
export interface ILogSnapshot extends SnapshotIn<typeof Log> {}

export interface IRootStore extends Instance<typeof RootModel> {}
export interface IRootSnapshot extends SnapshotIn<typeof RootModel> {}
