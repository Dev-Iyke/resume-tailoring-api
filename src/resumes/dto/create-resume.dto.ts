import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateResumeDto {
  @ApiProperty({
    example:
      "FRONTEND DEVELOPER\n\nSUMMARY\nFrontend developer with 2 years of experience building responsive web applications with React and TypeScript. Comfortable translating Figma designs into accessible interfaces, integrating REST APIs, and collaborating through code reviews and Agile delivery.\n\nSKILLS\nJavaScript, TypeScript, React, Next.js, HTML, CSS, Tailwind CSS, REST APIs, Git, GitHub, Jest, React Testing Library, Figma, responsive design, WCAG accessibility basics\n\nEXPERIENCE\nFrontend Developer | BrightPath Learning | 2024–Present\n- Built and maintained React and TypeScript features for a learning platform used by more than 1,200 monthly learners.\n- Converted Figma layouts into responsive pages, testing them across desktop, tablet, and mobile screen sizes.\n- Integrated REST API endpoints for course listings, learner profiles, and progress tracking.\n- Added component tests with Jest and React Testing Library for key form and navigation flows.\n- Worked with a designer and two backend developers during two-week Agile sprints; participated in planning and code reviews.\n- Improved the course listing page by reducing unnecessary re-renders and optimizing image loading; median load time fell by about 18% in the team’s measurements.\n\nFrontend Developer Intern | Northstar Digital | 2023–2024\n- Developed reusable React components for a small business dashboard.\n- Implemented form validation and displayed API error and loading states.\n- Fixed browser layout issues and documented reproduction steps for bugs.\n- Used GitHub pull requests and received feedback from a senior developer.\n\nPROJECTS\nCommunity Events Portal | React, TypeScript, Tailwind CSS\n- Built an event discovery interface with search, category filters, and responsive event cards.\n- Connected the interface to a public REST API and handled loading, empty, and error states.\n- Added keyboard-friendly navigation and labels to improve accessibility.\n\nPersonal Finance Dashboard | Next.js, TypeScript, CSS Modules\n- Created a dashboard with transaction summaries, category filters, and reusable chart components.\n- Used mock data and documented setup instructions in the project README.\n\nEDUCATION\nB.Sc. Computer Science | Example State University | 2023\n\nADDITIONAL\nPortfolio: https://example.com\nGitHub: https://github.com/example",
    description: 'Plain-text resume content.',
    maxLength: 50000,
  })
  @IsString()
  @Matches(/\S/, { message: 'text must contain non-whitespace characters' })
  @MaxLength(50000)
  text!: string;
}
