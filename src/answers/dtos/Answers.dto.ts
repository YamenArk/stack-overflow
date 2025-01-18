import {  IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AnswersDto  {
    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    answer: string;
}
