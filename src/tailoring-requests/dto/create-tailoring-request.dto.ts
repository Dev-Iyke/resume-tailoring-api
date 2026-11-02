import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {IsOptional, IsString, IsUUID, MaxLength, MinLength} from "class-validator"

export class CreateTailoringRequestDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID of the user resume"
  })
  @IsString()
  @IsUUID()
  resume_id!: string;

  @ApiPropertyOptional({
    example: "Northstar Products",
    description: "Name of company user is applying to"
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(60)
  company_name?: string;

  @ApiProperty({
    example: "Software Engineer",
    description: "Job role user is applying for"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  job_title!: string;

  @ApiProperty({
    example: "Frontend Developer\n\nAbout the role\nNorthstar Products is looking for a frontend developer to build reliable, accessible web experiences for its customer-facing products. You will work with design, product, and backend teammates to turn product requirements and interface designs into production-ready features.\n\nResponsibilities\n- Build and maintain responsive interfaces using React and TypeScript.\n- Translate Figma designs into reusable, well-structured UI components.\n- Integrate REST APIs and handle loading, empty, and error states.\n- Write and maintain unit and component tests.\n- Improve performance, accessibility, and cross-browser consistency.\n- Participate in sprint planning, code reviews, and technical discussions.\n- Work with backend engineers to clarify API contracts and troubleshoot integration issues.\n\nRequired qualifications\n- At least 2 years of professional frontend development experience.\n- Strong JavaScript and TypeScript skills.\n- Professional experience with React and modern component-based development.\n- Good understanding of HTML, CSS, responsive design, and accessibility.\n- Experience consuming REST APIs.\n- Familiarity with Git-based collaboration and code reviews.\n- Clear communication and a willingness to learn from feedback.\n\nPreferred qualifications\n- Experience with Next.js.\n- Familiarity with Jest and React Testing Library.\n- Experience measuring and improving frontend performance.\n- Exposure to design systems or component libraries.\n- Experience with continuous integration workflows.",
    description: "Job description user is applying for, as posted"
  })
  @IsString()
  @MinLength(100)
  job_description!: string;
}
