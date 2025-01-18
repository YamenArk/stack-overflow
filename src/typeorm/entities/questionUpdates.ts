import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Question } from './questions';
import { User } from './user';

@Entity({ name: 'questionUpdates' })
export class QuestionUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  proposedContent: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.questionUpdates)
  proposedBy: User;

  @ManyToOne(() => Question, (question) => question.updates)
  question: Question;
}
