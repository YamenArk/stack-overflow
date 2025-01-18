import { IsEmail, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';


export class AuthLoginDto  {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    password: string;
}
