import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
import { Answer } from './answers';
import { QuestionUpdate } from './questionUpdates';
import { User } from './user';
import { QuestionVote } from './questionVote';

@Entity({ name: 'questions' })
export class Question {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    questionId: number;

    @Column({ type: 'text', nullable: false })
    question: string;

    @Column({ default: 0 })
    numberOfUpVote: number;

    @Column({ default: 0 })
    numberOfDownVote: number;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => QuestionUpdate, (questionUpdate) => questionUpdate.proposedBy)
    updates: QuestionUpdate[];

    @ManyToOne(() => User, (user) => user.question)
    createdBy: User;

    @OneToMany(() => Answer, answer => answer.question, { onDelete: 'CASCADE' })
    public answer: Answer[];

    @OneToMany(() => QuestionVote, (vote) => vote.question , { onDelete: 'CASCADE' })
    votes: QuestionVote[];
}