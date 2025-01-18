import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AnswerUpdate } from './answerUpdates';
import { QuestionUpdate } from './questionUpdates';
import { Question } from './questions';
import { Answer } from './answers';
import { AnswerVote } from './answerVote ';
import { QuestionVote } from './questionVote';
import { UserNotification } from './userNotification';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  socketId: string;

  @OneToMany(() => AnswerUpdate, (answerUpdate) => answerUpdate.proposedBy)
  answerUpdates: AnswerUpdate[];

  @OneToMany(() => QuestionUpdate, (questionUpdates) => questionUpdates.proposedBy)
  questionUpdates: QuestionUpdate[];

  @OneToMany(() => Question, (question) => question.createdBy)
  question: Question[];

  @OneToMany(() => Answer, (answer) => answer.createdBy)
  answer: Answer[];
  
  @OneToMany(() => QuestionVote, (vote) => vote.user)
  questionVotes: QuestionVote[];

  @OneToMany(() => AnswerVote, (vote) => vote.user)
  answerVotes: AnswerVote[];

  
  @OneToMany(() => UserNotification, userNotification => userNotification.user)
  public userNotification: UserNotification[];

  @CreateDateColumn()
  createdAt: Date;
}
