import { Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async authenticate(signInDto: SignInDto) {
    const user = await this.databaseService.user.create({
      data: {
        name: signInDto.name,
        email: signInDto.email,
        passwordHash: signInDto.password,
      },
    });

    return {
      message: 'Usuário criado com sucesso',
      user,
    };
  }
}