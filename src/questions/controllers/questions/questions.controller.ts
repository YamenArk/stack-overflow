import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { AddQuestionVoteDto } from 'src/questions/dtos/addQuestionVote.dto';
import { checkIdDto } from 'src/questions/dtos/checkId.dto';
import { checkquestionIdDto } from 'src/questions/dtos/checkquestionId.dto';
import { QuestionsDto } from 'src/questions/dtos/questions.dto';
import { QueryDto } from 'src/questions/dtos/query.dto';
import { UpdatePendingQuestionAnswerDto } from 'src/questions/dtos/updatePendingQustion.dto';
import { QuestionsService } from 'src/questions/services/questions/questions.service';
import { PaginationQueryDto } from 'src/questions/dtos/pagination-query.dto';

@Controller('questions')
export class QuestionsController {
   
    constructor(
        private readonly questionsService : QuestionsService,
    ){}

    @Post('')
    @UseGuards(ApiKeyGuard)
    async addQuestion(
        @Req() request: any,
        @Body()questionsDto: QuestionsDto
    ) {
        const userId = request.user.id; 
        await  this.questionsService.addQuestion(questionsDto,userId);
        return {message : "question created successfully"}
    }


    @Put(':questionId')
    @UseGuards(ApiKeyGuard)
    async updateQustion(
        @Req() request: any,
        @Param() params: checkquestionIdDto,
        @Body()updateQuestionsDto: QuestionsDto
    ) {
        const { questionId } = params; 
        const userId = request.user.id; 
        await  this.questionsService.updateQustion(updateQuestionsDto,questionId,userId);
        return {message : "question updated successfully"}
    }



    @Delete(':questionId')
    @UseGuards(ApiKeyGuard)
    async deletequestion(
        @Req() request: any,
        @Param() params: checkquestionIdDto
    ) {
        const { questionId } = params; 
        const userId = request.user.id; 
        await  this.questionsService.deletequestion(questionId,userId);
        return {message : 'question deleted successfully'}
    }

    @Get('')
    async getQustions(
        @Query () paginationQuery : PaginationQueryDto
    ) {
        const questions = await  this.questionsService.getQustions(paginationQuery);
        return {questions : questions}
    }



    //////votes
    @Put('addQuestionVote/:questionId')
    @UseGuards(ApiKeyGuard)
    async addQuestionVote(
        @Req() request: any,
        @Param() params: checkquestionIdDto,
        @Body()addQuestionVoteDto: AddQuestionVoteDto
    ) {
        const { questionId } = params; 
        const userId = request.user.id; 
        await  this.questionsService.addQuestionVote(addQuestionVoteDto,questionId,userId);
        return {message : "vote added successfully"}
    }



    @Delete('removeQuestionVote/:questionId')
    @UseGuards(ApiKeyGuard)
    async removeQuestionVote(
        @Req() request: any,
        @Param() params: checkquestionIdDto,
    ) {
        const { questionId } = params; 
        const userId = request.user.id; 
        await  this.questionsService.removeQuestionVote(questionId,userId);
        return {message : "vote deleted successfully"}
    }



    ///////////////////updated qustions

    @Put('updatePendingQustion/:id')
    @UseGuards(ApiKeyGuard)
    async updatePendingQustion(
        @Req() request: any,
        @Param() params: checkIdDto,
        @Body()updatePendingQustionDto: UpdatePendingQuestionAnswerDto

    ) {
        const { id } = params; 
        const userId = request.user.id; 
        await  this.questionsService.updatePendingQustion(updatePendingQustionDto,id,userId);
        return {message : "question status updated successfully"}
    }

    @Get('pendingQustion')
    @UseGuards(ApiKeyGuard)
    async getPendingQustion(
        @Req() request: any,
        @Query () paginationQuery : PaginationQueryDto
    ) {
        const userId = request.user.id; 
        const questions = await  this.questionsService.getPendingQustion(userId,paginationQuery);
        return {pendingQustion : questions}
    }



    @Get('search')
    async searchQuestions(
        @Query()queryDto: QueryDto
    ) {
        const results = await this.questionsService.searchQuestions(queryDto);
        return { results };
    }

}

