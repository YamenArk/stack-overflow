import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/user';
import { AuthLoginDto } from 'src/users/dtos/authLogin.dto';
import { RegistrationDto } from 'src/users/dtos/registration.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/mail/mail.service';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import * as crypto from 'crypto';
import { EmailDto } from 'src/users/dtos/Email.dto';




@Injectable()
@UseInterceptors(CacheInterceptor)
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private jwtService : JwtService,
        private mailService : MailService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: any, 



      ) {}
    async login(authLoginDto: AuthLoginDto){
      const { email, password } = authLoginDto;
      const user = await this.usersRepository.findOne({where: { email: email }});
      if (user) {
        const isPasswordMatch = await bcrypt.compare(password, user.password); 
        if (!isPasswordMatch) {
          throw new UnauthorizedException('Invalid credentials');
        }
        const payload = {
          userId: user.id,
        };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }
    }

    async registration(emailDetails: EmailDto) {
      const exsistingEmail = await this.usersRepository.findOne({
        where: { email: emailDetails.email },
      });
      if (exsistingEmail) {
        throw new HttpException(
          `This email already exists`,
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
    
      const code = Math.floor(10000 + Math.random() * 90000);
      console.log(code)
      const message = `Please reset your password using this code: ${code}`;
      await this.mailService.sendMail(emailDetails.email, 'Password reset', message);
      const cacheKey = crypto.createHash('sha256').update(emailDetails.email).digest('hex');

      await this.cacheManager.set(cacheKey, code, { ttl: 300 }); 
    }
    
    

    async resetPassword(registrationDto: RegistrationDto): Promise<void> {

      const cacheKey = crypto.createHash('sha256').update(registrationDto.email).digest('hex');
    
      const cachedCode = await this.cacheManager.get(cacheKey);      

      if (!cachedCode || cachedCode !== registrationDto.code) {
        throw new HttpException(
          `Invalid reset code for the provided email`,
          HttpStatus.BAD_REQUEST,
        );
      }
    
      const hashedPassword = await bcrypt.hash(registrationDto.password, 10);
    
      const existingUser = await this.usersRepository.findOne({
        where: { email: registrationDto.email },
      });
    
      if (existingUser) {
        throw new HttpException(
          `User with email ${registrationDto.email} already exist`,
          HttpStatus.NOT_FOUND,
        );
      }

      const newUser = await this.usersRepository.create({
        email : registrationDto.email,
        password : hashedPassword,
        username : registrationDto.username
      })
    
      await this.usersRepository.save(newUser);
    
      await this.cacheManager.del(cacheKey);
    }
    
}






