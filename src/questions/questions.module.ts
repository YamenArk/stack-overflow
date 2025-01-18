import { Module } from '@nestjs/common';
import { QuestionsController } from './controllers/questions/questions.controller';
import { QuestionsService } from './services/questions/questions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/typeorm/entities/questions';
import { User } from 'src/typeorm/entities/user';
import { QuestionUpdate } from 'src/typeorm/entities/questionUpdates';
import { QuestionVote } from 'src/typeorm/entities/questionVote';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { NotificationsGateway } from 'src/common/notifications/notifications.gateway';
import { UserNotification } from 'src/typeorm/entities/userNotification';
import { TextGenerationService } from 'src/common/text-generation/text-generation.service';
import { UserService } from 'src/common/user/user.service';
import { Answer } from 'src/typeorm/entities/answers';
import { AnswerUpdate } from 'src/typeorm/entities/answerUpdates';
import { AnswersModule } from 'src/answers/answers.module';
import { ElasticsearchService } from 'src/common/elasticsearch/elasticsearch.service';


@Module({
  imports:[
     TypeOrmModule.forFeature([
       Question,
       User,
       QuestionUpdate,
       QuestionVote,
       UserNotification,
       Answer,
       AnswerUpdate
     ]),
    JwtModule.registerAsync({
      imports :[ConfigModule],
      useFactory :async () => ({
        secret : process.env.JWT_SECRET
        ,signOptions: { expiresIn: '1d' },
      }),
      inject : [ConfigService]
    }),
    AnswersModule,  
    ConfigModule.forRoot(), 
   ],
  controllers: [QuestionsController],
  providers: [
    QuestionsService,
    NotificationsGateway,
    TextGenerationService,
    UserService,
    ElasticsearchService
  ]
})
export class QuestionsModule {}
