import {  IsNotEmpty, IsString, MinLength } from 'class-validator';
import {Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class QueryDto  {
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    query: string;

    @IsOptional()
    @IsPositive()
    @Type(()=>Number)
    limit:number

    @IsOptional()
    @IsPositive()
    @Type(()=>Number)
    offset:number
}
