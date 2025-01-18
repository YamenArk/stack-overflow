import { Module } from '@nestjs/common';
import { AnswersController } from './controllers/answers/answers.controller';
import { AnswersService } from './services/answers/answers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/typeorm/entities/questions';
import { User } from 'src/typeorm/entities/user';
import { Answer } from 'src/typeorm/entities/answers';
import { AnswerUpdate } from 'src/typeorm/entities/answerUpdates';
import { AnswerVote } from 'src/typeorm/entities/answerVote ';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { NotificationsGateway } from 'src/common/notifications/notifications.gateway';
import { UserNotification } from 'src/typeorm/entities/userNotification';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports:[
       TypeOrmModule.forFeature([
         Answer,
         Question,
         User,
         AnswerUpdate,
         AnswerVote,
         UserNotification
       ]),
      JwtModule.registerAsync({
          imports :[ConfigModule],
          useFactory :async () => ({
            secret : process.env.JWT_SECRET
            ,signOptions: { expiresIn: '1d' },
          }),
          inject : [ConfigService]
        }),
        UsersModule,
     ],
  exports: [AnswersService],
  controllers: [AnswersController],
  providers: [AnswersService, NotificationsGateway]

})
export class AnswersModule {}
