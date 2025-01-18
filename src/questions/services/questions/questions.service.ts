import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationsGateway } from 'src/common/notifications/notifications.gateway';
import { AddQuestionVoteDto } from 'src/questions/dtos/addQuestionVote.dto';
import { QuestionsDto } from 'src/questions/dtos/questions.dto';
import { UpdatePendingQuestionAnswerDto } from 'src/questions/dtos/updatePendingQustion.dto';
import { TextGenerationService } from 'src/common/text-generation/text-generation.service';
import { Question } from 'src/typeorm/entities/questions';
import { QuestionUpdate } from 'src/typeorm/entities/questionUpdates';
import { QuestionVote } from 'src/typeorm/entities/questionVote';
import { User } from 'src/typeorm/entities/user';
import { DataSource, Repository } from 'typeorm';
const axios = require('axios');
import { AnswersService } from 'src/answers/services/answers/answers.service';
import { AnswersDto } from 'src/answers/dtos/Answers.dto';
import { ElasticsearchService } from 'src/common/elasticsearch/elasticsearch.service';
import { QueryDto } from 'src/questions/dtos/query.dto';
import { PaginationQueryDto } from 'src/questions/dtos/pagination-query.dto';

@Injectable()
export class QuestionsService {
    constructor(
        @InjectRepository(Question)
        private readonly questionsRepository: Repository<Question>,
        @InjectRepository(QuestionVote)
        private readonly questionVoteRepository: Repository<QuestionVote>,
        @InjectRepository(QuestionUpdate)
        private readonly questionUpdateRepository: Repository<QuestionUpdate>,
        // @InjectRepository(AnswerUpdate) private answerUpdateRepository:
        //  Repository<AnswerUpdate>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly dataSource: DataSource,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly textGenerationService: TextGenerationService,
        private readonly answersService: AnswersService,
        private readonly elasticsearchService: ElasticsearchService,

    ) {}
    async addQuestion(
        questionsDetails : QuestionsDto,
        userId : number
    ){
        if (!userId) {
            throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
        }
        const user = await this.usersRepository.findOne({where : { id: userId}});
        if (!user ) {
        throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
        }

        const existingQuestion = await this.questionsRepository.findOne({
            where: { question : questionsDetails.question },
        });

        const newQuestion = this.questionsRepository.create({
            ...questionsDetails,
            createdBy: user,
        });

        const savedQuestion = await this.questionsRepository.save(newQuestion);

        const { questionId, question, createdAt } = savedQuestion;
        const id = String(questionId);

        // Index Elasticsearch
        this.elasticsearchService
        .indexDocument(process.env.ELASTICSEARCH_INDEX, id, {
            question,
            createdAt,
            createdBy: userId,
        })
        .then(() => {
            console.log('Document indexed successfully');
        })
        .catch((error) => {
            console.error('Error indexing document:', error);
        });



        //generate Answaers
        const generateAnswer = existingQuestion
        ? this.answersService.getAiAnswer(existingQuestion.questionId)
        : this.textGenerationService.generateText(questionsDetails.question);

        generateAnswer
        .then((generatedAnswer) => {
            this.createAndAddAnswer(generatedAnswer, questionId);
        })
        .catch((error) => {
            console.error("Error generating text or adding answer", error);
        });
        
        return ;





    }

    async updateQustion(
        questionsDetails : QuestionsDto,
        questionId : number,
        userId : number
    ){
        if (!userId) {
            throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
        }
        const user = await this.usersRepository.findOne({where : { id: userId}});
        if (!user ) {
            throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
        }
        const question  = await this.questionsRepository.findOne({
            where : {questionId},
            relations : ['createdBy']
        });
        if (!question ) {
            throw new HttpException(`question with id ${questionId} not found`, HttpStatus.NOT_FOUND);
        }
        if(user.id == question.createdBy.id)
        {
            question.question = questionsDetails.question;
            await this.questionsRepository.save(question);

        }
        else
        {
            const newQuestionUpdate = await this.questionUpdateRepository.create({
                proposedContent : questionsDetails.question,
                proposedBy : user,
                question : question,
                status :'pending',
            })
          await this.questionUpdateRepository.save(newQuestionUpdate);

            //sending notification
            const notificationMessage = `User ${user.username} has proposed an update to your question.`;
            await this.notificationsGateway.sendNotification(question.createdBy.id, notificationMessage);
        }
    }

    async deletequestion(
        questionId : number,
        userId : number
    ){
        if (!userId) {
            throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
        }
        const user = await this.usersRepository.findOne({where : { id: userId}});
        if (!user ) {
            throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
        }
        const question  = await this.questionsRepository.findOne({
            where : {questionId},
            relations : ['createdBy']
        });
        if (!question ) {
            throw new HttpException(`question with id ${questionId} not found`, HttpStatus.NOT_FOUND);
        }
        if(user.id != question.createdBy.id)
        {
            throw new ForbiddenException('you can only delete your questions')
        }
        await this.questionsRepository.remove(question)
    }

    async getQustions(
        paginationQuery :  PaginationQueryDto
    ){
        const {limit , offset} = paginationQuery
        const questions = await this.questionsRepository.find({
            relations : ['createdBy'],
            skip : offset,
            take : limit,
            select:{
                questionId : true,
                question : true,
                createdAt : true,
                numberOfDownVote : true,
                numberOfUpVote : true,
                createdBy : {
                    id : true,
                    username : true
                },
            }
        });
        return questions;
    }

    async updatePendingQustion(
        updatePendingQustionDetails : UpdatePendingQuestionAnswerDto,
        id : number ,
        userId : number
        ){
        if (!userId) {
            throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
        }
        const user = await this.usersRepository.findOne({where : { id: userId}});
        if (!user ) {
            throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
        }
        const questionUpdate = await this.questionUpdateRepository.findOne({
            where: { id },
            relations: ['question', 'question.createdBy'],
        });

        if (!questionUpdate ) {
            throw new HttpException(`questionUpdate with id ${id} not found`, HttpStatus.NOT_FOUND);
        }

        if(questionUpdate.status != 'pending'){
            throw new BadRequestException('The status must be "pending" to proceed.');
        }
        const questionCreator = questionUpdate.question.createdBy;
        if (questionCreator.id !== user.id) {
            throw new ForbiddenException('You are not authorized to update this question.');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            if (updatePendingQustionDetails.status === 'approved') {
                questionUpdate.status = 'approved';
                await queryRunner.manager.save(questionUpdate);

                questionUpdate.question.question = questionUpdate.proposedContent;
                await queryRunner.manager.save(questionUpdate.question);
            } else {
                questionUpdate.status = 'rejected';
                await queryRunner.manager.save(questionUpdate);
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getPendingQustion(
        userId : number,
        paginationQuery :  PaginationQueryDto
    ){
        const {limit , offset} = paginationQuery
        if (!userId) {
            throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
        }
        const user = await this.usersRepository.findOne({where : { id: userId}});
        if (!user ) {
            throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
        }
        const pendingQuestions = await this.questionUpdateRepository.find({
            where: {
                status: 'pending',
                question: { createdBy: { id: user.id } },
            },
            skip : offset,
            take : limit,
            relations: ['question','proposedBy'],
        });
        return pendingQuestions
    }


    async addQuestionVote(
        addQuestionVoteDetails: AddQuestionVoteDto,
        questionId: number,
        userId: number
      ) {
        if (!userId) {
          throw new HttpException(`Something wrong with the token`, HttpStatus.NOT_FOUND);
        }

        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new HttpException(`User with id ${userId} not found`, HttpStatus.NOT_FOUND);
        }

        const question = await this.questionsRepository.findOne({ where: { questionId } });
        if (!question) {
          throw new HttpException(`Question with id ${questionId} not found`, HttpStatus.NOT_FOUND);
        }
        // Check for existing vote
        const existingVote = await this.questionVoteRepository.findOne({
            where: { user: { id: userId }, question: {  questionId } },
        });

        if (existingVote) {
            if (existingVote.voteType === addQuestionVoteDetails.voteType) {
            throw new HttpException(
                `You have already ${existingVote.voteType} this question`,
                HttpStatus.BAD_REQUEST
            );
            }

            existingVote.voteType = addQuestionVoteDetails.voteType;

            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
            if (addQuestionVoteDetails.voteType === 'upvote') {
                question.numberOfUpVote++;
                question.numberOfDownVote--;
            } else {
                question.numberOfDownVote++;
                question.numberOfUpVote--;
            }

            await queryRunner.manager.save(existingVote);
            await queryRunner.manager.save(question);

            await queryRunner.commitTransaction();
            } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(`Transaction failed: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            } finally {
            await queryRunner.release();
            }

            return;
        }

        // If no existing vote found
        const vote = this.questionVoteRepository.create({
            question,
            user,
            voteType: addQuestionVoteDetails.voteType,
        });

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (addQuestionVoteDetails.voteType === 'upvote') {
            question.numberOfUpVote++;
            } else {
            question.numberOfDownVote++;
            }

            await queryRunner.manager.save(vote);
            await queryRunner.manager.save(question);

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(`Transaction failed: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }


      }


      async removeQuestionVote(questionId: number, userId: number) {
        if (!userId) {
          throw new HttpException('Invalid token or user ID', HttpStatus.BAD_REQUEST);
        }

        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
        }

        // Find the question
        const question = await this.questionsRepository.findOne({
          where: { questionId },
        });
        if (!question) {
          throw new HttpException(`Question with ID ${questionId} not found`, HttpStatus.NOT_FOUND);
        }

        const existingVote = await this.questionVoteRepository.findOne({
          where: { user: { id: userId }, question: { questionId } },
        });
        if (!existingVote) {
          throw new HttpException(
            `No vote found for user ${userId} on question ${questionId}`,
            HttpStatus.BAD_REQUEST
          );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          if (existingVote.voteType === 'upvote') {
            question.numberOfUpVote--;
          } else if (existingVote.voteType === 'downvote') {
            question.numberOfDownVote--;
          }

          await queryRunner.manager.remove(existingVote);

          await queryRunner.manager.save(question);

          await queryRunner.commitTransaction();
        } catch (err) {
          await queryRunner.rollbackTransaction();
          throw new HttpException(`Transaction failed: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
          await queryRunner.release();
        }
      }


      async createAndAddAnswer(answer: string, questionId: number) {
        const answerDto = new AnswersDto();
        answerDto.answer = answer;
        await this.answersService.addAnswer(answerDto, questionId, 1);
    }


    async searchQuestions(query: QueryDto) {
        const {limit , offset} = query
        const searchResult = await this.elasticsearchService.search(process.env.ELASTICSEARCH_INDEX, {
            query: {
                match: {
                    question: query.query
                },
            },
            from: offset, 
            size: limit,  
        });
    
        return searchResult.hits.hits.map((hit) => hit._source);
    }
    

}
