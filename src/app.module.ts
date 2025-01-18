import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './typeorm/entities/answers';
import { QuestionUpdate } from './typeorm/entities/questionUpdates';
import { Question } from './typeorm/entities/questions';
import { AnswerUpdate } from './typeorm/entities/answerUpdates';
import { User } from './typeorm/entities/user';
import { UsersModule } from './users/users.module';
import { QuestionVote } from './typeorm/entities/questionVote';
import { AnswerVote } from './typeorm/entities/answerVote ';
import { UserNotification } from './typeorm/entities/userNotification';
import { MailService } from './common/mail/mail.service';



@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port:  +process.env.DATABASE_PORT,
      username:  process.env.DATABASE_USER,
      password:  process.env.DATABASE_PASSWORD,
      database:  process.env.DATABASE_NAME,
      entities: [
        Answer,
        AnswerUpdate,
        Question,
        QuestionUpdate,
        User,
        AnswerVote,
        QuestionVote,
        UserNotification
      ],
      // autoLoadEntities : true,
      synchronize:  false ,
      migrationsRun: false,
      dropSchema: false
    }),
    QuestionsModule, 
    AnswersModule, 
    UsersModule],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
