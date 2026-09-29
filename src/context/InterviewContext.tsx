import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  InterviewSession,
  InterviewConfig,
  InterviewExchange,
  InterviewStatus,
  HRInterviewState,
} from "../types/interview";
import { InterviewEvaluation } from "../types/evaluation";
import { textToSpeechService } from "../services/speech/textToSpeech";
import { speechToTextService } from "../services/speech/speechToText";
import {
  generateInterviewQuestion,
  processInterviewTurn,
} from "../services/ai/interviewEngine";
import { evaluateInterviewSession } from "../services/ai/evaluationEngine";
import { useResume } from "./ResumeContext";
import { useSettings } from "./SettingsContext";
import { useAuth } from "../hooks/useAuth";
import { interviewService } from "../services/interviews/interviewService";
import { assessmentService } from "../services/assessments/assessmentService";
import { activityService } from "../services/activity/activityService";

interface InterviewContextValue {
  session: InterviewSession | null;
  status: InterviewStatus;
  currentQuestion: string;
  currentQuestionNumber: number;
  currentTranscript: string;
  isAiSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isMuted: boolean;
  timeRemainingSeconds: number;
  error: string | null;
  latestEvaluation: InterviewEvaluation | null;
  startInterview: (config: InterviewConfig) => Promise<void>;
  submitAnswer: (customAnswer?: string) => Promise<void>;
  handleMicTap: () => Promise<void>;
  startListeningToCandidate: () => void;
  stopListeningAndAnalyse: () => Promise<void>;
  repeatQuestion: () => void;
  endInterview: () => Promise<InterviewEvaluation | null>;
  toggleMute: () => void;
  clearSession: () => void;
}

const InterviewContext = createContext<InterviewContextValue | undefined>(
  undefined,
);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { resume, candidateProfile, setLearningPath } = useResume();
  const { autoSpeakQuestions, speechRate, voiceUri } = useSettings();
  const { user } = useAuth();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [latestEvaluation, setLatestEvaluation] =
    useState<InterviewEvaluation | null>(null);

  const exchangesRef = useRef<InterviewExchange[]>([]);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const currentQuestionIdRef = useRef<string | null>(null);
  const dbSessionIdRef = useRef<string | null>(null);
  const hrStateRef = useRef<HRInterviewState | null>(null);

  // Keep transcriptRef synchronized
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  // Countdown timer effect
  useEffect(() => {
    if (
      status === "speaking" ||
      status === "listening" ||
      status === "evaluating" ||
      status === "ready"
    ) {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      textToSpeechService.cancel();
      speechToTextService.stopListening();
    };
  }, []);

  const speakCurrentQuestion = (text: string) => {
    if (!text || !autoSpeakQuestions || !textToSpeechService.isSupported()) {
      setIsAiSpeaking(false);
      setStatus("ready");
      speechToTextService.stopListening();
      setIsListening(false);
      return;
    }

    setIsAiSpeaking(true);
    setStatus("speaking");
    speechToTextService.stopListening();
    setIsListening(false);

    textToSpeechService.speak(text, {
      rate: speechRate,
      voiceUri: voiceUri || undefined,
      onStart: () => {
        setIsAiSpeaking(true);
      },
      onEnd: () => {
        setIsAiSpeaking(false);
        // Question asked: candidate turn starts in ready state (tap mic to speak)
        setStatus("ready");
      },
      onError: (err) => {
        console.warn("TTS Error:", err);
        setIsAiSpeaking(false);
        setStatus("ready");
      },
    });
  };

  const startListeningToCandidate = () => {
    setError(null);
    if (isMuted) {
      setIsMuted(false);
    }

    if (!speechToTextService.isSupported()) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge, or switch to Type mode."
      );
      setStatus("ready");
      return;
    }

    // Cancel any AI speech if user interrupts
    textToSpeechService.cancel();
    setIsAiSpeaking(false);

    setStatus("listening");
    setIsListening(true);
    setCurrentTranscript("");
    transcriptRef.current = "";

    speechToTextService.startListening({
      onStart: () => {
        setIsListening(true);
        setStatus("listening");
      },
      onResult: (transcript) => {
        setCurrentTranscript(transcript);
        transcriptRef.current = transcript;
      },
      onError: (err) => {
        console.warn("STT Error:", err);
        setError(err);
        setIsListening(false);
        setStatus("ready");
      },
      onEnd: () => {
        if (!isProcessing) {
          setIsListening(false);
        }
      },
    });
  };

  const stopListeningAndAnalyse = async () => {
    speechToTextService.stopListening();
    setIsListening(false);

    const speechText = (transcriptRef.current || currentTranscript).trim();

    if (!speechText) {
      setError(
        "No speech detected. Please tap the mic and speak your answer clearly, or use Type / Refine mode."
      );
      setStatus("ready");
      return;
    }

    setError(null);
    // User tapped the mic again -> AI starts analysing the speech!
    await submitAnswer(speechText);
  };

  const handleMicTap = async () => {
    if (isProcessing) return;

    // If candidate taps while AI is speaking, allow them to interrupt and speak early
    if (isAiSpeaking) {
      textToSpeechService.cancel();
      setIsAiSpeaking(false);
      startListeningToCandidate();
      return;
    }

    if (!isListening) {
      // First tap -> start speaking
      startListeningToCandidate();
    } else {
      // Second tap -> stop speaking & AI starts analysing speech
      await stopListeningAndAnalyse();
    }
  };

  const repeatQuestion = () => {
    if (isProcessing || !currentQuestion) return;
    speechToTextService.stopListening();
    setIsListening(false);
    speakCurrentQuestion(currentQuestion);
  };

  const startInterview = async (config: InterviewConfig) => {
    setError(null);
    const sessionId = `session_${Date.now()}`;

    const initialSession: InterviewSession = {
      id: sessionId,
      resumeId: resume?.id,
      config,
      status: "connecting",
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      exchanges: [],
      currentTranscript: "",
      isMuted: false,
      timeRemainingSeconds: config.durationMinutes * 60,
    };

    setSession(initialSession);
    setStatus("connecting");
    setTimeRemainingSeconds(config.durationMinutes * 60);
    setCurrentQuestionNumber(1);
    exchangesRef.current = [];

    // Create session in Supabase if authenticated
    if (user) {
      try {
        const { data: dbSession } = await interviewService.createSession({
          user_id: user.id,
          resume_id:
            resume?.id && !resume.id.startsWith("res_") ? resume.id : null,
          interview_type: config.type,
          difficulty: config.difficulty,
          duration: config.durationMinutes,
        });
        dbSessionIdRef.current = dbSession?.id || sessionId;
      } catch (err) {
        dbSessionIdRef.current = sessionId;
      }
    } else {
      dbSessionIdRef.current = sessionId;
    }

    const initialHrState: HRInterviewState = {
      questionsAsked: [],
      competenciesEvaluated: [],
      candidateClaims: [],
      importantDetails: [],
      followUpOpportunities: [],
      pendingCompetencies: [
        'Communication',
        'Teamwork & Collaboration',
        'Conflict Management',
        'Problem-Solving & STAR',
        'Adaptability & Learning Agility',
        'Accountability & Mistake Handling',
        'Decision-Making Under Pressure',
        'Self-Awareness & Feedback',
        'Career Motivation & Alignment',
        'Leadership & Initiative'
      ],
      questionCount: 1,
      targetQuestions: 10,
      currentPhase: 'introduction'
    };
    hrStateRef.current = initialHrState;

    try {
      setIsProcessing(true);
      const firstQ = await generateInterviewQuestion(
        config,
        candidateProfile,
        1,
        [],
        hrStateRef.current
      );
      setIsProcessing(false);

      if (hrStateRef.current) {
        hrStateRef.current.questionsAsked.push(firstQ.questionText);
        if (firstQ.competencyEvaluated) {
          hrStateRef.current.competenciesEvaluated.push(firstQ.competencyEvaluated);
        }
      }

      setCurrentQuestion(firstQ.questionText);
      setStatus("speaking");

      // Record question to Supabase if authenticated
      if (user && dbSessionIdRef.current) {
        const qId = await interviewService.recordQuestion({
          session_id: dbSessionIdRef.current,
          user_id: user.id,
          question_number: 1,
          question_text: firstQ.questionText,
          question_type: firstQ.category,
          topic: firstQ.topic,
          difficulty: firstQ.difficulty,
        });
        currentQuestionIdRef.current = qId;
      }

      // Speak aloud and transition to candidate turn
      speakCurrentQuestion(firstQ.questionText);
    } catch (err: any) {
      setIsProcessing(false);
      setStatus("error");
      setError(err.message || "Failed to start interview.");
      throw err;
    }
  };

  const submitAnswer = async (customAnswer?: string) => {
    const answerToProcess = (customAnswer || transcriptRef.current).trim();

    speechToTextService.stopListening();
    setIsListening(false);
    textToSpeechService.cancel();
    setIsAiSpeaking(false);
    setIsProcessing(true);
    setStatus("evaluating");

    // Record exchange in memory
    const newExchange: InterviewExchange = {
      id: `ex_${Date.now()}`,
      questionNumber: currentQuestionNumber,
      questionText: currentQuestion,
      questionTimestamp: new Date().toISOString(),
      userAnswerText: answerToProcess || "(Candidate gave no response)",
      answerTimestamp: new Date().toISOString(),
    };

    const updatedExchanges = [...exchangesRef.current, newExchange];
    exchangesRef.current = updatedExchanges;

    try {
      const historyForTurn = updatedExchanges.map((ex) => ({
        question: ex.questionText,
        answer: ex.userAnswerText || "",
      }));

      // Call Central AI turn engine with candidate profile context
      const turnResult = await processInterviewTurn(
        currentQuestion,
        answerToProcess,
        historyForTurn,
        candidateProfile,
        session?.config?.type || "general_hr",
        hrStateRef.current
      );

      newExchange.isFollowUp = turnResult.isFollowUp;
      newExchange.followUpReason = turnResult.followUpReason;
      newExchange.aiQuickFeedback = turnResult.quickFeedback;
      newExchange.category = turnResult.category;
      newExchange.topic = turnResult.topic;
      newExchange.competencyEvaluated = turnResult.competencyEvaluated;
      newExchange.acknowledgementText = turnResult.acknowledgementText;
      newExchange.starScore = turnResult.starScore;

      // Update internal interview state
      if (turnResult.updatedHrState) {
        hrStateRef.current = turnResult.updatedHrState;
      } else if (hrStateRef.current) {
        hrStateRef.current.questionsAsked.push(turnResult.nextQuestionText);
        if (
          turnResult.competencyEvaluated &&
          !hrStateRef.current.competenciesEvaluated.includes(turnResult.competencyEvaluated)
        ) {
          hrStateRef.current.competenciesEvaluated.push(turnResult.competencyEvaluated);
        }
        hrStateRef.current.questionCount = currentQuestionNumber + 1;
      }

      // Save answer to Supabase if authenticated
      if (user && dbSessionIdRef.current && currentQuestionIdRef.current) {
        await interviewService.recordAnswer({
          question_id: currentQuestionIdRef.current,
          session_id: dbSessionIdRef.current,
          user_id: user.id,
          answer_text: answerToProcess,
          technical_accuracy: turnResult.evaluation?.technicalAccuracy,
          communication: turnResult.evaluation?.communication,
          clarity: turnResult.evaluation?.clarity,
          depth: turnResult.evaluation?.depth,
          problem_solving: turnResult.evaluation?.problemSolving,
          confidence: turnResult.evaluation?.confidence,
          quick_feedback: turnResult.quickFeedback,
        });
      }

      const nextQNumber = currentQuestionNumber + 1;
      setCurrentQuestion(turnResult.nextQuestionText);
      setCurrentQuestionNumber(nextQNumber);
      setCurrentTranscript("");
      transcriptRef.current = "";
      setIsProcessing(false);

      // Record next question to Supabase
      if (user && dbSessionIdRef.current) {
        const qId = await interviewService.recordQuestion({
          session_id: dbSessionIdRef.current,
          user_id: user.id,
          question_number: nextQNumber,
          question_text: turnResult.nextQuestionText,
          question_type: turnResult.category,
          topic: turnResult.topic,
          difficulty: turnResult.difficulty,
          is_follow_up: turnResult.isFollowUp,
          follow_up_reason: turnResult.followUpReason,
        });
        currentQuestionIdRef.current = qId;
      }

      // Speak next question
      speakCurrentQuestion(turnResult.nextQuestionText);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || "Error processing response.");
      setStatus("ready");
    }
  };

  const endInterview = async (): Promise<InterviewEvaluation | null> => {
    speechToTextService.stopListening();
    textToSpeechService.cancel();
    setIsListening(false);
    setIsAiSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);

    setStatus("completed");
    setIsProcessing(true);

    const activeSession = session;
    const durationSeconds = activeSession
      ? activeSession.config.durationMinutes * 60 - timeRemainingSeconds
      : 300;

    try {
      const evaluation = await evaluateInterviewSession(
        dbSessionIdRef.current || activeSession?.id || `sess_${Date.now()}`,
        durationSeconds,
        exchangesRef.current,
        candidateProfile,
        hrStateRef.current,
        activeSession?.config?.type || 'general_hr'
      );

      setLatestEvaluation(evaluation);
      setIsProcessing(false);

      // Save evaluation and learning recommendations
      if (user) {
        const sessionId = dbSessionIdRef.current || activeSession?.id || `sess_${Date.now()}`;

        if (dbSessionIdRef.current) {
          try {
            await interviewService.saveEvaluation({
              session_id: dbSessionIdRef.current,
              user_id: user.id,
              communication_score: evaluation.communicationScore,
              technical_score: evaluation.technicalScore,
              relevance_score: evaluation.relevanceScore,
              clarity_score: evaluation.clarityScore,
              confidence_score: evaluation.confidenceScore,
              depth_score: (evaluation as any).depthScore || 75,
              problem_solving_score: evaluation.problemSolvingScore || 75,
              overall_score: evaluation.overallScore,
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
              feedback: evaluation.overallFeedback,
            });
          } catch (evErr) {
            console.warn('[InterviewContext] Save evaluation warning:', evErr);
          }

          if ((evaluation as any).learningPathSuggestions) {
            try {
              await interviewService.saveLearningRecommendations(
                user.id,
                dbSessionIdRef.current,
                (evaluation as any).learningPathSuggestions,
              );
              setLearningPath((evaluation as any).learningPathSuggestions);
            } catch (lrErr) {
              console.warn('[InterviewContext] Save learning recommendations warning:', lrErr);
            }
          }
        }

        const reportData = {
          sessionId,
          interviewType: activeSession?.config?.type || 'general_hr',
          difficulty: activeSession?.config?.difficulty || 'intermediate',
          roleTarget: activeSession?.config?.roleTarget,
          communicationScore: evaluation.communicationScore,
          technicalScore: evaluation.technicalScore,
          relevanceScore: evaluation.relevanceScore,
          clarityScore: evaluation.clarityScore,
          confidenceScore: evaluation.confidenceScore,
          problemSolvingScore: evaluation.problemSolvingScore || 75,
          overallScore: evaluation.overallScore,
          overallFeedback: evaluation.overallFeedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          recommendedPreparationAreas: evaluation.recommendedPreparationAreas || [],
          questionAssessments: evaluation.questionAssessments || [],
          exchanges: exchangesRef.current || [],
          durationSeconds,
          completedAt: new Date().toISOString(),
          learningPathSuggestions: (evaluation as any).learningPathSuggestions,
          competencyBreakdown: evaluation.competencyBreakdown || [],
          strongestResponses: evaluation.strongestResponses || [],
          weakestResponses: evaluation.weakestResponses || [],
          suggestedPracticeQuestions: evaluation.suggestedPracticeQuestions || [],
          starOverallRating: evaluation.starOverallRating,
          executiveSummary: evaluation.executiveSummary || evaluation.overallFeedback,
        };

        // Persist unified assessment report strictly partitioned by user.id
        try {
          await assessmentService.saveAssessmentReport(user.id, {
            assessmentType: 'interview',
            title: `AI Mock Interview (${(activeSession?.config?.type || 'General').toUpperCase()})`,
            category: `${activeSession?.config?.type || 'General'} Round`,
            score: evaluation.overallScore,
            totalQuestions: exchangesRef.current.length || 1,
            correctAnswers: exchangesRef.current.length || 1,
            incorrectAnswers: 0,
            accuracy: evaluation.overallScore,
            timeSpentSeconds: durationSeconds,
            reportData,
          });
        } catch (repErr) {
          console.warn('[InterviewContext] Save assessment report warning:', repErr);
        }

        // Also save to user-isolated interview history partition
        try {
          await interviewService.saveInterviewHistoryItem(user.id, {
            id: `int_rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            sessionId,
            userId: user.id,
            interviewType: activeSession?.config?.type || 'general_hr',
            difficulty: activeSession?.config?.difficulty || 'intermediate',
            durationSeconds,
            overallScore: evaluation.overallScore,
            communicationScore: evaluation.communicationScore,
            technicalScore: evaluation.technicalScore,
            confidenceScore: evaluation.confidenceScore,
            relevanceScore: evaluation.relevanceScore,
            problemSolvingScore: evaluation.problemSolvingScore || 75,
            clarityScore: evaluation.clarityScore,
            overallFeedback: evaluation.overallFeedback,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            recommendedPreparationAreas: evaluation.recommendedPreparationAreas || [],
            questionAssessments: evaluation.questionAssessments || [],
            exchanges: exchangesRef.current || [],
            createdAt: new Date().toISOString(),
            roleTarget: activeSession?.config?.roleTarget,
            reportData,
          });
        } catch (histErr) {
          console.warn('[InterviewContext] Save interview history warning:', histErr);
        }
      }

      return evaluation;
    } catch (err: any) {
      setIsProcessing(false);
      setError("Evaluation could not be generated: " + err.message);
      return null;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        speechToTextService.stopListening();
        setIsListening(false);
      } else {
        if (status === "listening") {
          startListeningToCandidate();
        }
      }
      return next;
    });
  };

  const clearSession = () => {
    textToSpeechService.cancel();
    speechToTextService.stopListening();
    setSession(null);
    setStatus("idle");
    setCurrentQuestion("");
    setCurrentTranscript("");
    setCurrentQuestionNumber(1);
    exchangesRef.current = [];
    hrStateRef.current = null;
    setError(null);
    setLatestEvaluation(null);
  };

  return (
    <InterviewContext.Provider
      value={{
        session,
        status,
        currentQuestion,
        currentQuestionNumber,
        currentTranscript,
        isAiSpeaking,
        isListening,
        isProcessing,
        isMuted,
        timeRemainingSeconds,
        error,
        latestEvaluation,
        startInterview,
        submitAnswer,
        handleMicTap,
        startListeningToCandidate,
        stopListeningAndAnalyse,
        repeatQuestion,
        endInterview,
        toggleMute,
        clearSession,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = (): InterviewContextValue => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
};
