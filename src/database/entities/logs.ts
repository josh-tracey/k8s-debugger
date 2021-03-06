import { Entity, Column } from 'typeorm'
import { PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'logs' })
export class Log {
  @PrimaryGeneratedColumn('increment') id!: number

  @Column({ type: 'text', name: 'pod_name' }) pod_name: string

  @Column({ type: 'text', name: 'data' }) data: string

  @Column({ type: 'text', name: 'created_at' }) createdAt: string

  @Column({ type: 'text', name: 'namespace' }) namespace: string

  @Column({ type: 'text', name: 'context' }) context: string
}
