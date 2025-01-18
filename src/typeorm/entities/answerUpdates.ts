import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Answer } from './answers';
import { User } from './user';

@Entity({ name: 'answerUpdates' })
export class AnswerUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  proposedContent: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.answerUpdates)
  proposedBy: User;

  @ManyToOne(() => Answer, (answer) => answer.updates)
  answer: Answer;

}
