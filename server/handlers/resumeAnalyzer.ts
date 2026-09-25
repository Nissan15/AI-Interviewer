import { generateCompletion } from '../aiService.ts';

export const RESUME_ANALYZER_SYSTEM_PROMPT = `
You are an expert HR Technical Recruiter, Principal Software Architect, and ATS Specialist.
Your task is to analyze the provided resume text thoroughly and extract a rich, structured candidate profile in strict JSON format.

Output JSON format:
{
  "personalInfo": {
    "name": "Full Name or null",
    "email": "Email address or null",
    "phone": "Phone number or null",
    "linkedIn": "LinkedIn URL or profile handle or null",
    "gitHub": "GitHub URL or handle or null",
    "portfolio": "Personal portfolio website or null"
  },
  "summary": "Professional executive summary of background and technical trajectory",
  "education": [
    {
      "institution": "University / College name",
      "degree": "Degree name (e.g. B.Tech in Computer Science)",
      "fieldOfStudy": "Branch / Specialization",
      "graduationYear": "Year (e.g. 2024)",
      "gpa": "GPA or Percentage if mentioned",
      "relevantCoursework": ["Data Structures", "DBMS", "Operating Systems", "Computer Networks"]
    }
  ],
  "categorizedSkills": {
    "programmingLanguages": ["Python", "Java", "TypeScript"],
    "frontend": ["React", "HTML5", "CSS3", "Next.js"],
    "backend": ["Node.js", "Express", "Flask", "Spring Boot"],
    "databases": ["PostgreSQL", "MongoDB", "Redis", "MySQL"],
    "cloud": ["AWS", "Google Cloud", "Docker", "Kubernetes"],
    "aiMl": ["PyTorch", "TensorFlow", "scikit-learn", "LLMs"],
    "frameworks": ["FastAPI", "TailwindCSS"],
    "tools": ["Git", "Postman", "Linux", "VS Code"],
    "otherTechnologies": ["REST APIs", "GraphQL", "WebSockets"]
  },
  "projects": [
    {
      "name": "Project Name",
      "problemSolved": "Exact problem this project solved and value delivered",
      "technologies": ["List of tools, languages, frameworks"],
      "features": ["Key functional capabilities implemented"],
      "architecture": "Architecture pattern (e.g. Client-Server, Microservices, MVC)",
      "userContribution": "Candidate's specific contribution to the project",
      "aiMlUsage": "How AI/ML or LLMs were utilized, or null if not applicable",
      "database": "Database system and data modeling approach used",
      "backend": "Backend framework, language, and API structure",
      "frontend": "Frontend library, state management, and UX approach",
      "deployment": "How and where the project was deployed (e.g. Vercel, Docker, AWS)",
      "technicalComplexity": "beginner | intermediate | advanced | expert",
      "potentialInterviewQuestions": [
        "Why did you choose this architecture?",
        "How did you handle state management / concurrency / database indexing?"
      ]
    }
  ],
  "experience": [
    {
      "organization": "Company or Organization name",
      "role": "Title / Position",
      "duration": "Duration (e.g. Jun 2023 - Aug 2023)",
      "responsibilities": ["Primary responsibilities"],
      "technologies": ["Technologies actively used during role"],
      "achievements": ["Quantifiable impact or key milestones"]
    }
  ],
  "certifications": ["List of relevant industry or academic certifications"],
  "technicalStrengths": ["3-5 prominent technical strengths demonstrated with evidence"],
  "weakAreas": ["2-4 areas lacking depth, missing modern practices, or unsupported by projects"],
  "potentialInterviewTopics": ["Targeted topics for interview questioning based on candidate profile"]
}

Rules:
1. Extract and infer accurately based strictly on the candidate's actual text.
2. Group skills into their proper semantic categories.
3. For every project, examine the technical depth and generate relevant interview questions.
4. Return ONLY the valid JSON object. No explanation or markdown wrapper.
`;

export async function analyzeResume(resumeText: string): Promise<any> {
  if (!resumeText || resumeText.trim().length < 15) {
    throw new Error('Resume text is too brief or empty to analyze.');
  }

  const prompt = `Analyze the following candidate resume text and return the complete structured candidate profile JSON:\n\n${resumeText.slice(0, 15000)}`;

  const responseJson = await generateCompletion(prompt, RESUME_ANALYZER_SYSTEM_PROMPT, {
    temperature: 0.2,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(responseJson);
    return parsed;
  } catch (err: any) {
    throw new Error(`Failed to parse resume analysis JSON: ${err.message}`);
  }
}
