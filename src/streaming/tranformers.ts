import { Transform } from 'stream'
import { FgBlue, FgRed, FgYellow, Reset } from '../colors'

export class LogTagger extends Transform {
  private podName: string
  constructor(podName: string) {
    super()
    this.podName = podName
  }
  public _transform = (chunk: Buffer, _: any, next: any) => {
    next(null, `${this.podName}|:::|${chunk.toLocaleString()}`)
  }
}

export class LogGrouper extends Transform {
  private prevPodName: string | null = null
  public _transform = (chunk: Buffer, _: any, next: any) => {
    const [podname, log] = chunk.toLocaleString().split('|:::|')

    let message: string | null = null

    if (!this.prevPodName || this.prevPodName !== podname) {
      message = `${FgRed}[ ${FgYellow}${podname} ${Reset}- ${FgBlue}${new Date().toLocaleString()}${FgRed} ]${Reset}\n${log}`
      this.prevPodName = podname
    } else {
      message = log
    }
    if (message) {
      next(null, message)
    }
  }
}

export class Tranformer extends Transform {
  private scanFunction: (chunk: Buffer) => void
  constructor(func: (chunk: Buffer) => void) {
    super()
    this.scanFunction = func
  }
  public _transform = (chunk: Buffer, _: any, next: any) => {
    this.scanFunction(chunk)
    next(null)
  }
}

export const printer = new Tranformer((chunk) => {
  console.log(chunk.toLocaleString())
})
