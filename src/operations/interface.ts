export interface IOperation {
  label: string
  execute: (...args: any[]) => void | Promise<void> | never
}
