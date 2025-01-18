import { IsEmail, IsNotEmpty, IsString, Length, Min, MinLength,IsInt } from 'class-validator';
import { Transform } from 'class-transformer';



export class RegistrationDto  {
    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    username: string;


    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()   
    @MinLength(5)
    password: string;

     @Transform(({ value }) => Number(value), { toClassOnly: true }) 
     @IsInt()
     @Min(1)
    code: number
}
