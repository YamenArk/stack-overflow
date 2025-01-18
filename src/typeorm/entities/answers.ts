import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
import { Question } from './questions';
import { AnswerUpdate } from './answerUpdates';
import { User } from './user';
import { AnswerVote } from './answerVote ';

@Entity({ name: 'answers' })
export class Answer {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    answerId: number;

    @Column({ type: 'text', nullable: false })
    answer: string;
    
    @Column({ default: 0 })
    numberOfUpVote: number;

    @Column({ default: 0 })
    numberOfDownVote: number;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => AnswerUpdate, (answerUpdate) => answerUpdate.proposedBy)
    updates: AnswerUpdate[];

    @ManyToOne(() => User, (user) => user.answer)
    createdBy: User;

    @ManyToOne(() => Question, (question) => question.answer, { onDelete: 'CASCADE' })
    public question: Question

    @OneToMany(() => AnswerVote, (vote) => vote.answer , { onDelete: 'CASCADE' })
    votes: AnswerVote[];
}