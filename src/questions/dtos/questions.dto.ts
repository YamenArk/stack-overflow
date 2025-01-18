import {  IsNotEmpty, IsString, MinLength } from 'class-validator';


export class QuestionsDto  {
    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    question: string;
}
