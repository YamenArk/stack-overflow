import { Body, Controller, Post } from '@nestjs/common';
import { AuthLoginDto } from 'src/users/dtos/authLogin.dto';
import { EmailDto } from 'src/users/dtos/Email.dto';
import { RegistrationDto } from 'src/users/dtos/registration.dto';
import { UsersService } from 'src/users/services/users/users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService : UsersService){}


    //auth
    @Post('login')
    async login(
      @Body()authLoginDto: AuthLoginDto
    ) {
      const loginDetails = await  this.usersService.login(authLoginDto);
      return {loginDetails : loginDetails}
    }

    @Post('registration')
      async registration(
        @Body() emailDto: EmailDto
      ){
     await this.usersService.registration(emailDto);
     return {message : "message send to your mail"}
    }


    @Post('submit-code')
    async resetPassword(
      @Body() registrationDto: RegistrationDto
    ) {
      await this.usersService.resetPassword(registrationDto);
       return {message : "user Created Successfully"}

    }

  
    // @Post('reset-password')
    // async resetPassword(
    //   @Body('doctorId') doctorId: number,
    //   @Body('code') code: number,
    //   @Body('newPassword') newPassword: string,
    // ): Promise<void> {
    //   await this.doctorSrevice.resetPassword(doctorId, code, newPassword);
    // }

}
