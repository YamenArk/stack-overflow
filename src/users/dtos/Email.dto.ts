import { IsEmail, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';


export class EmailDto  {
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
