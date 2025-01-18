import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Answer } from './answers';
import { User } from './user';

@Entity({ name: 'answerVotes' })
export class AnswerVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['upvote', 'downvote'] })
  voteType: 'upvote' | 'downvote';

  @ManyToOne(() => Answer, (answer) => answer.votes , { onDelete: 'CASCADE' })
  answer: Answer;
  
  @ManyToOne(() => User, (user) => user.answerVotes)
  user: User;
}
