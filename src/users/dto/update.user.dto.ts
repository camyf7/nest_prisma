import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
	@IsString()
	@IsOptional()
	readonly name?: string;

	@IsString()
	@MinLength(8)
	@IsOptional()
	readonly password?: string;
}