import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users/users.controller';
import { UsersService } from './services/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/user';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MailService } from 'src/common/mail/mail.service';


@Module({
  imports:[
    TypeOrmModule.forFeature([
      User
    ]),
    CacheModule.register({
    }),
    JwtModule.registerAsync({
      imports :[ConfigModule],
      useFactory :async () => ({
        secret : process.env.JWT_SECRET
        ,signOptions: { expiresIn: '1d' },
      }),
      inject : [ConfigService]
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService,MailService]
})
export class UsersModule {}
