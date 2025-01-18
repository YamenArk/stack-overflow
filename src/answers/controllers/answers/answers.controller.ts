import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AnswersDto } from 'src/answers/dtos/Answers.dto';
import { CheckanswerIdDto } from 'src/answers/dtos/CheckanswerId.dto';
import { AnswersService } from 'src/answers/services/answers/answers.service';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { AddQuestionVoteDto } from 'src/questions/dtos/addQuestionVote.dto';
import { checkIdDto } from 'src/questions/dtos/checkId.dto';
import { checkquestionIdDto } from 'src/questions/dtos/checkquestionId.dto';
import { PaginationQueryDto } from 'src/questions/dtos/pagination-query.dto';
import { UpdatePendingQuestionAnswerDto } from 'src/questions/dtos/updatePendingQustion.dto';

@Controller('answers')
export class AnswersController {

     constructor(private readonly answersService : AnswersService){}
    
        @Post(':questionId')
        @UseGuards(ApiKeyGuard)
        async addAnswers(
            @Req() request: any,
            @Param() params: checkquestionIdDto,
            @Body()answersDto:AnswersDto
        ) {
            const { questionId } = params; 
            const userId = request.user.id; 
            await  this.answersService.addAnswer(answersDto,questionId,userId);
            return {message : "answer created successfully"}
        }
    
        @Put(':answerId')
        @UseGuards(ApiKeyGuard)
        async updateAnswerId(
            @Req() request: any,
            @Param() params: CheckanswerIdDto,
            @Body()updateAnswersDto: AnswersDto
        ) {
            const { answerId } = params; 
            const userId = request.user.id; 
            await  this.answersService.updateAnswer(updateAnswersDto,answerId,userId);
            return {message : "answer updated successfully"}
        }
    
    
    
        @Delete(':answerId')
        @UseGuards(ApiKeyGuard)
        async deleteAnswer(
            @Req() request: any,
            @Param() params: CheckanswerIdDto
        ) {
            const { answerId } = params; 
            const userId = request.user.id; 
            await  this.answersService.deleteAnswer(answerId,userId);
            return {message : 'answer deleted successfully'}
        }
    




         //////votes
        @Put('addAnswerVote/:answerId')
        @UseGuards(ApiKeyGuard)
        async addQuestionVote(
            @Req() request: any,
            @Param() params: CheckanswerIdDto,
            @Body()addAnswerVoteDto: AddQuestionVoteDto
        ) {
            const { answerId } = params; 
            const userId = request.user.id; 
            await  this.answersService.addanswerVote(addAnswerVoteDto,answerId,userId);
            return {message : "vote added successfully"}
        }
    
    
    
        @Delete('removeAnswerVote/:answerId')
        @UseGuards(ApiKeyGuard)
        async removeQuestionVote(
            @Req() request: any,
            @Param() params: CheckanswerIdDto,
        ) {
            const { answerId } = params; 
            const userId = request.user.id; 
            await  this.answersService.removeAnswerVote(answerId,userId);
            return {message : "vote deleted successfully"}
        }
    




          ///////////////////updated answears
    
        @Put('updatePendingAnswer/:id')
        @UseGuards(ApiKeyGuard)
        async updatePendingQustion(
            @Req() request: any,
            @Param() params: checkIdDto,
            @Body()updatePendingAnswerDto: UpdatePendingQuestionAnswerDto
    
        ) {
            const { id } = params; 
            const userId = request.user.id; 
            await  this.answersService.updatePendingAnswer(updatePendingAnswerDto,id,userId);
            return {message : "answer status updated successfully"}
        }
    
        @Get('pendingAnswer')
        @UseGuards(ApiKeyGuard)
        async getPendingQustion(
            @Req() request: any,
            @Query () paginationQuery : PaginationQueryDto
        ) {
            const userId = request.user.id; 
            const answer = await  this.answersService.getPendingAnswer(userId,paginationQuery);
            return {pendingAnswer : answer}
        }







        @Get(':questionId')
        async getAnswers(
            @Param() params: checkquestionIdDto,
            @Query () paginationQuery : PaginationQueryDto

        ): Promise<{ answers: any; }> {
            const { questionId } = params; 
            const answers = await  this.answersService.getAnswers(questionId,paginationQuery);
            return {answers : answers}
        }
}
