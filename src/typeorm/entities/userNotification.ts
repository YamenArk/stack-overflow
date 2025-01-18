import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from './user';



@Entity({ name: 'userNotifications' })
export class UserNotification {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ nullable: false})
    message: string;
    
    @ManyToOne(() => User, (user) => user.userNotification)
    public user: User; // Ensure that the type of this property is Clinic
}