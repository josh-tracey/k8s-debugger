export interface IOperation {
  label: string
  execute: () => void | Promise<void> | never
}
