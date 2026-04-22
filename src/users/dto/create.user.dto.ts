import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
	@IsString()
	@IsNotEmpty()
	readonly name: string;

	@IsEmail()
	readonly email: string;

	@IsString()
	@MinLength(8)
	@IsNotEmpty()
	readonly password: string;
}