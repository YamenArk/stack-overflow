import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswersDto } from 'src/answers/dtos/Answers.dto';
import { NotificationsGateway } from 'src/common/notifications/notifications.gateway';
import { AddQuestionVoteDto } from 'src/questions/dtos/addQuestionVote.dto';
import { PaginationQueryDto } from 'src/questions/dtos/pagination-query.dto';
import { UpdatePendingQuestionAnswerDto } from 'src/questions/dtos/updatePendingQustion.dto';
import { Answer } from 'src/typeorm/entities/answers';
import { AnswerUpdate } from 'src/typeorm/entities/answerUpdates';
import { AnswerVote } from 'src/typeorm/entities/answerVote ';
import { Question } from 'src/typeorm/entities/questions';
import { User } from 'src/typeorm/entities/user';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AnswersService {
      constructor(
            @InjectRepository(Question)
            private readonly questionsRepository: Repository<Question>,
            @InjectRepository(User)
            private readonly usersRepository: Repository<User>,
            @InjectRepository(Answer)
            private readonly answerRepository: Repository<Answer>,
            @InjectRepository(AnswerUpdate)
            private readonly answerUpdateRepository: Repository<AnswerUpdate>,
            @InjectRepository(AnswerVote)
            private readonly answervoteRepository: Repository<AnswerVote>,
            private readonly dataSource: DataSource, 
            private readonly notificationsGateway: NotificationsGateway,    
        ) {}
        async addAnswer(answersDetails : AnswersDto,questionId : number,userId : number){
            if (!userId) {
                throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
            }
            const question = await this.questionsRepository.findOne({where : { questionId}});
            if (!question ) {
            throw new HttpException(`question with id ${questionId} not found`, HttpStatus.NOT_FOUND);
            }
            const user = await this.usersRepository.findOne({where : { id: userId}});
            if (!user ) {
            throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
            }
    
            const newanswer = await this.answerRepository.create({
                ...answersDetails,
                question : question,
                createdBy : user
            })
          await this.answerRepository.save(newanswer);
        }

        async getAiAnswer(questionId : number){
            const answer = await this.answerRepository.findOne({
                where :{
                    question : { questionId},
                    createdBy : {id : 1},
                },
            })

            return answer ? answer.answer : null;  // Return only the 'answer' field
        }

        async updateAnswer(answersDetails : AnswersDto,answerId : number,userId : number){
            if (!userId) {
                throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
            }
            const user = await this.usersRepository.findOne({where : { id: userId}});
            if (!user ) {
                throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
            }
            const answer  = await this.answerRepository.findOne({
                where : {answerId},
                relations : ['createdBy']
            });
            if (!answer ) {
                throw new HttpException(`answer with id ${answerId} not found`, HttpStatus.NOT_FOUND);
            }
            if(answer.createdBy.id == 1){
                throw new HttpException('AI-generated answers cannot be updated.', HttpStatus.FORBIDDEN);
            }
            if(user.id == answer.createdBy.id)
            {
                answer.answer = answersDetails.answer;
                await this.answerRepository.save(answer);
    
            }
            else
            {
                const newAnswerUpdate = await this.answerUpdateRepository.create({
                    proposedContent : answersDetails.answer,
                    proposedBy : user,
                    answer : answer,
                    status :'pending',
                })
                await this.answerUpdateRepository.save(newAnswerUpdate);

                //sending notification
                const notificationMessage = `User ${user.username} has proposed an update to your answer.`;
                await this.notificationsGateway.sendNotification(answer.createdBy.id, notificationMessage);
            }
        }
    
        async deleteAnswer(answerId : number,userId : number){
            if (!userId) {
                throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
            }
            const user = await this.usersRepository.findOne({where : { id: userId}});
            if (!user ) {
                throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
                    }
            const answer  = await this.answerRepository.findOne({
                where : {answerId},
                relations :['createdBy']
            });
            if (!answer ) {
                throw new HttpException(`answer with id ${answerId} not found`, HttpStatus.NOT_FOUND);
                    }
            
            if(user.id != answer.createdBy.id)
            {
              throw new ForbiddenException('you can only delete your answers')
            }
            await this.answerRepository.remove(answer)
        }
    
        async getAnswers( 
            questionId: number,
            paginationQuery : PaginationQueryDto
        ){
            const {limit , offset} = paginationQuery
            const question = await this.questionsRepository.findOne({where : { questionId}});
            if (!question ) {
            throw new HttpException(`question with id ${questionId} not found`, HttpStatus.NOT_FOUND);
            }
            const answers = await this.answerRepository.find({
                where : {
                    question: { questionId }
                },
                relations : ['createdBy'],
                skip : offset,
                take : limit,
                select:{
                    answerId : true,
                    answer : true,
                    createdAt : true,
                    numberOfUpVote : true,
                    numberOfDownVote : true,
                    createdBy : {
                        id : true,
                        username : true
                    },
                    
                }
            });
            return answers;
        }

        async updatePendingAnswer(updatePendingAnswerDetails : UpdatePendingQuestionAnswerDto, id : number , userId : number){
            if (!userId) {
                throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
            }
            const user = await this.usersRepository.findOne({where : { id: userId}});
            if (!user ) {
                throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
            }
            const answerUpdate = await this.answerUpdateRepository.findOne({
                where: { id },
                relations: ['answer', 'answer.createdBy'],
            });
    
            if (!answerUpdate ) {
                throw new HttpException(`answerUpdate with id ${id} not found`, HttpStatus.NOT_FOUND);
            }
    
            if(answerUpdate.status != 'pending'){
                throw new BadRequestException('The status must be "pending" to proceed.');
            }
            const answerCreator = answerUpdate.answer.createdBy;
            if (answerCreator.id !== user.id) {
                throw new ForbiddenException('You are not authorized to update this question.');
            }
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.startTransaction();
            
            try {
                if (updatePendingAnswerDetails.status == 'approved') {
                    answerUpdate.status = 'approved';
                    await queryRunner.manager.save(answerUpdate); 
                    answerUpdate.answer.answer = answerUpdate.proposedContent;
                    await queryRunner.manager.save(answerUpdate.answer); 
                } else {
                    answerUpdate.status = 'rejected';
                    await queryRunner.manager.save(answerUpdate); 
                }
                await queryRunner.commitTransaction();
            } catch (error) {
                await queryRunner.rollbackTransaction(); 
                throw error;
            } finally {
                await queryRunner.release();  
            }
            
        }
    
        async getPendingAnswer(
            userId : number,
            paginationQuery : PaginationQueryDto
        ){
            const {limit , offset} = paginationQuery;
            if (!userId) {
                throw new HttpException(`something wrong with the token`, HttpStatus.NOT_FOUND);
            }
            const user = await this.usersRepository.findOne({where : { id: userId}});
            if (!user ) {
                throw new HttpException(`user with id ${userId} not found`, HttpStatus.NOT_FOUND);
            }
            const pendingAnswers = await this.answerUpdateRepository.find({
                where: {
                    status: 'pending',
                    answer: { createdBy: { id: user.id } }, 
                },
                skip : offset,
                take : limit,
                relations: ['answer','proposedBy'], 
            });
            return pendingAnswers
        }
    
        async addanswerVote(
            addAnswerVoteDetails: AddQuestionVoteDto,
            answerId: number,
            userId: number
            ) {
            if (!userId) {
                throw new HttpException(`Something wrong with the token`, HttpStatus.NOT_FOUND);
            }
            
            const user = await this.usersRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new HttpException(`User with id ${userId} not found`, HttpStatus.NOT_FOUND);
            }
            
            const answer = await this.answerRepository.findOne({ where: { answerId } });
            if (!answer) {
                throw new HttpException(`Question with id ${answerId} not found`, HttpStatus.NOT_FOUND);
            }
            // Check for existing vote
            const existingVote = await this.answervoteRepository.findOne({
                where: { user: { id: userId }, answer: {  answerId } },
            });
            
            if (existingVote) {
                if (existingVote.voteType === addAnswerVoteDetails.voteType) {
                throw new HttpException(
                    `You have already ${existingVote.voteType} this question`,
                    HttpStatus.BAD_REQUEST
                );
                }
            
                existingVote.voteType = addAnswerVoteDetails.voteType;
            
                const queryRunner = this.dataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
            
                try {
                if (addAnswerVoteDetails.voteType === 'upvote') {
                    answer.numberOfUpVote++;
                    answer.numberOfDownVote--;
                } else {
                    answer.numberOfDownVote++;
                    answer.numberOfUpVote--;
                }
            
                await queryRunner.manager.save(existingVote); 
                await queryRunner.manager.save(answer);   
            
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
            const vote = this.answervoteRepository.create({
                answer,
                user,
                voteType: addAnswerVoteDetails.voteType,
            });
            
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            
            try {
                if (addAnswerVoteDetails.voteType === 'upvote') {
                answer.numberOfUpVote++;
                } else {
                    answer.numberOfDownVote++;
                }
            
                await queryRunner.manager.save(vote); 
                await queryRunner.manager.save(answer); 
            
                await queryRunner.commitTransaction();
            } catch (err) {
                await queryRunner.rollbackTransaction();
                throw new HttpException(`Transaction failed: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            } finally {
                await queryRunner.release();
            }
        
            
            }
        async removeAnswerVote(answerId: number, userId: number) {
        if (!userId) {
            throw new HttpException('Invalid token or user ID', HttpStatus.BAD_REQUEST);
        }
        
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
        }
        
        // Find the question
        const answer = await this.answerRepository.findOne({
            where: { answerId },
        });
        if (!answer) {
            throw new HttpException(`Answer with ID ${answerId} not found`, HttpStatus.NOT_FOUND);
        }
        
        const existingVote = await this.answervoteRepository.findOne({
            where: { user: { id: userId }, answer: { answerId } },
        });
        if (!existingVote) {
            throw new HttpException(
            `No vote found for user ${userId} on answer ${answerId}`,
            HttpStatus.BAD_REQUEST
            );
        }
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            if (existingVote.voteType === 'upvote') {
            answer.numberOfUpVote--;
            } else if (existingVote.voteType === 'downvote') {
                answer.numberOfDownVote--;
            }
        
            await queryRunner.manager.remove(existingVote);
        
            await queryRunner.manager.save(answer);
        
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new HttpException(`Transaction failed: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
        }
}
