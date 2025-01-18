import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/typeorm/entities/user';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async ensureAIUserExists(): Promise<User> {
    const aiUser = await this.userRepository.findOne({ where: { id: 1 } });

    if (!aiUser) {
      const newAIUser = this.userRepository.create({
        id: 1,  
        username: 'AI', 
        email: 'ai@example.com', 
        password: await bcrypt.hash('defaultPassword', 10), 
      });

      return await this.userRepository.save(newAIUser);
    }

    return aiUser;
  }
}
