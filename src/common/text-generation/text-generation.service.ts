import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class TextGenerationService {
    private readonly modelEndpoint = 'https://api.sambanova.ai/v1/chat/completions'; 

    constructor(
        private configService: ConfigService,
        private userService: UserService, 
    ) {}

    private get apiKey(): string {
        return this.configService.get<string>('SAMBANOVA_API_KEY'); 
    }

    async onModuleInit() {
        await this.userService.ensureAIUserExists(); 
      }

    async generateText(prompt: string): Promise<string> {
        try {

            const response = await axios.post(
                this.modelEndpoint,
                {
                    stream: false,  
                    model: "Meta-Llama-3.1-8B-Instruct",
                    messages: [
                        {
                            role: "user", 
                            content: prompt 
                        }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`, 
                        "Content-Type": "application/json"
                    }
                }
            );
            const messageContent = response.data?.choices[0]?.message?.content;
            return messageContent || "No response content available";
        } catch (error) {
            console.error("Error generating text:", error.response?.data || error.message);
            console.error("Full error object:", error);
            throw new Error("Error generating text");
        }
    }
}
