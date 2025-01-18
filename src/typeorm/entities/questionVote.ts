import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Question } from './questions';
import { User } from './user';

@Entity({ name: 'questionVotes' })
export class QuestionVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['upvote', 'downvote'] })
  voteType: 'upvote' | 'downvote';

  @ManyToOne(() => Question, (question) => question.votes , { onDelete: 'CASCADE' })
  question: Question;

  @ManyToOne(() => User, (user) => user.questionVotes)
  user: User;
}
