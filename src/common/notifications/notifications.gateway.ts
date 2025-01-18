import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm/entities/user';

import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { UserNotification } from 'src/typeorm/entities/userNotification';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer() public server: Server;

    async handleConnection(socket: Socket) {
      try {
        const token = socket.handshake.headers.authorization;

        if (!token) {
          throw new HttpException('Authorization token is missing', HttpStatus.UNAUTHORIZED);
        }

        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });

        if (!decoded.userId) {
          throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
        if (!user) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        user.socketId = socket.id;
        await this.userRepository.save(user);

        this.logger.log(`User ${decoded.userId} connected with socket ID ${socket.id}`);

        const pendingNotifications = await this.userNotificationRepository.find({ where: { user: { id: decoded.userId } } });
        for (const notification of pendingNotifications) {
          socket.emit('notification', { message: notification.message });
          await this.userNotificationRepository.remove(notification);
        }
      } catch (error) {
        this.logger.error(error.message);
        socket.emit('error', { message: error.message });
        socket.disconnect();
      }
    }



  async handleDisconnect(socket: Socket) {
    try {
      const user = await this.userRepository.findOne({ where: { socketId: socket.id } });
      if (user) {
        user.socketId = null;
        await this.userRepository.save(user);
        this.logger.log(`User ${user.id} disconnected`);
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async sendNotification(userId: number, message: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!user.socketId) {
        const notification = this.userNotificationRepository.create({ user, message });
        await this.userNotificationRepository.save(notification);
        this.logger.log(`Notification saved for user ${userId}: ${message}`);
      } else {
        this.server.to(user.socketId).emit('notification', { message });
        this.logger.log(`Notification sent to user ${userId}: ${message}`);
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
