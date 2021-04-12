import api from '../api'
import RootStore from '../store'
import { LogGrouper, LogTagger } from '../streaming/tranformers'
import { IOperation } from './interface'
import { selector } from '../helpers/prompts'

import * as tty from 'tty'

const LogStreamer: IOperation = {
  execute: async () => {
    let streams: any = []

    const LogGrouping = new LogGrouper()
    console.clear()
    const choices: string[] = (await selector('pods', 'checkbox-plus'))
      .selection as string[]

    LogGrouping.pipe(new tty.WriteStream(1))

    if (choices.length > 0) {
      const tagStreams = await Promise.all(
        choices.map(async (name: string) => {
          const LogTagging = new LogTagger(name)
          streams = await api.streamLog(
            name,
            RootStore.currentNamespace,
            LogTagging
          )

          streams.forEach((stream: any) =>
            stream.on('complete', () => {
              streams.forEach((s: any) => s.abort())
            })
          )

          return LogTagging
        })
      )

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('keypress', (_, key) => {
        if (key?.name === 'escape' || key?.name === 'q') {
          streams.forEach((s: any) => s.abort())
        }
      })

      await Promise.all(
        tagStreams.map(async (tagStream) => {
          tagStream.pipe(LogGrouping)

          await new Promise((done) => {
            LogGrouping.on('end', done)
            tagStream.on('finish', done)
          })
        })
      )
    } else {
      console.clear()
    }
  },
  label: 'Log Streamer',
}

export default LogStreamer
