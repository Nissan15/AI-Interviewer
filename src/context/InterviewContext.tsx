import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  InterviewSession,
  InterviewConfig,
  InterviewExchange,
  InterviewStatus,
} from '../types/interview';
import { InterviewEvaluation } from '../types/evaluation';
import { textToSpeechService } from '../services/speech/textToSpeech';
import { speechToTextService } from '../services/speech/speechToText';
import { generateInterviewQuestion, processInterviewTurn } from '../services/ai/interviewEngine';
import { evaluateInterviewSession } from '../services/ai/evaluationEngine';
import { useResume } from './ResumeContext';
import { useSettings } from './SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { interviewService } from '../services/interviews/interviewService';

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
  endInterview: () => Promise<InterviewEvaluation | null>;
  toggleMute: () => void;
  clearSession: () => void;
}

const InterviewContext = createContext<InterviewContextValue | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resume, candidateProfile, setLearningPath } = useResume();
  const { autoSpeakQuestions, speechRate, voiceUri } = useSettings();
  const { user } = useAuth();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [latestEvaluation, setLatestEvaluation] = useState<InterviewEvaluation | null>(null);

  const exchangesRef = useRef<InterviewExchange[]>([]);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const currentQuestionIdRef = useRef<string | null>(null);
  const dbSessionIdRef = useRef<string | null>(null);

  // Keep transcriptRef synchronized
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  // Countdown timer effect
  useEffect(() => {
    if (status === 'speaking' || status === 'listening' || status === 'evaluating') {
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
      startListeningToCandidate();
      return;
    }

    setIsAiSpeaking(true);
    setStatus('speaking');
    speechToTextService.stopListening();

    textToSpeechService.speak(text, {
      rate: speechRate,
      voiceUri: voiceUri || undefined,
      onStart: () => {
        setIsAiSpeaking(true);
      },
      onEnd: () => {
        setIsAiSpeaking(false);
        startListeningToCandidate();
      },
      onError: (err) => {
        console.warn('TTS Error:', err);
        setIsAiSpeaking(false);
        startListeningToCandidate();
      },
    });
  };

  const startListeningToCandidate = () => {
    if (isMuted) return;

    if (!speechToTextService.isSupported()) {
      setStatus('listening');
      return;
    }

    setStatus('listening');
    setIsListening(true);
    setCurrentTranscript('');

    speechToTextService.startListening({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript) => {
        setCurrentTranscript(transcript);
      },
      onError: (err) => {
        console.warn('STT Error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const startInterview = async (config: InterviewConfig) => {
    setError(null);
    const sessionId = `session_${Date.now()}`;

    const initialSession: InterviewSession = {
      id: sessionId,
      resumeId: resume?.id,
      config,
      status: 'connecting',
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      exchanges: [],
      currentTranscript: '',
      isMuted: false,
      timeRemainingSeconds: config.durationMinutes * 60,
    };

    setSession(initialSession);
    setStatus('connecting');
    setTimeRemainingSeconds(config.durationMinutes * 60);
    setCurrentQuestionNumber(1);
    exchangesRef.current = [];

    // Create session in Supabase if authenticated
    if (user) {
      try {
        const { data: dbSession } = await interviewService.createSession({
          user_id: user.id,
          resume_id: resume?.id && !resume.id.startsWith('res_') ? resume.id : null,
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

    try {
      setIsProcessing(true);
      const firstQ = await generateInterviewQuestion(
        config,
        candidateProfile,
        1,
        []
      );
      setIsProcessing(false);

      setCurrentQuestion(firstQ.questionText);
      setStatus('speaking');

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
      setStatus('error');
      setError(err.message || 'Failed to start interview.');
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
    setStatus('evaluating');

    // Record exchange in memory
    const newExchange: InterviewExchange = {
      id: `ex_${Date.now()}`,
      questionNumber: currentQuestionNumber,
      questionText: currentQuestion,
      questionTimestamp: new Date().toISOString(),
      userAnswerText: answerToProcess || '(Candidate gave no response)',
      answerTimestamp: new Date().toISOString(),
    };

    const updatedExchanges = [...exchangesRef.current, newExchange];
    exchangesRef.current = updatedExchanges;

    try {
      const historyForTurn = updatedExchanges.map((ex) => ({
        question: ex.questionText,
        answer: ex.userAnswerText || '',
      }));

      // Call Central AI turn engine with candidate profile context
      const turnResult = await processInterviewTurn(
        currentQuestion,
        answerToProcess,
        historyForTurn,
        candidateProfile,
        session?.config?.type || 'technical'
      );

      newExchange.isFollowUp = turnResult.isFollowUp;
      newExchange.followUpReason = turnResult.followUpReason;
      newExchange.aiQuickFeedback = turnResult.quickFeedback;

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
      setCurrentTranscript('');
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
      setError(err.message || 'Error processing response.');
      setStatus('listening');
    }
  };

  const endInterview = async (): Promise<InterviewEvaluation | null> => {
    speechToTextService.stopListening();
    textToSpeechService.cancel();
    setIsListening(false);
    setIsAiSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);

    setStatus('completed');
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
        candidateProfile
      );

      setLatestEvaluation(evaluation);
      setIsProcessing(false);

      // Save evaluation and learning recommendations to Supabase
      if (user && dbSessionIdRef.current) {
        await interviewService.saveEvaluation({
          session_id: dbSessionIdRef.current,
          user_id: user.id,
          communication_score: evaluation.communicationScore,
          technical_score: evaluation.technicalScore,
          relevance_score: evaluation.relevanceScore,
          clarity_score: evaluation.clarityScore,
          confidence_score: evaluation.confidenceScore,
          depth_score: (evaluation as any).depthScore || 75,
          problem_solving_score: (evaluation as any).problemSolvingScore || 75,
          overall_score: evaluation.overallScore,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          feedback: evaluation.overallFeedback,
        });

        if ((evaluation as any).learningPathSuggestions) {
          await interviewService.saveLearningRecommendations(
            user.id,
            dbSessionIdRef.current,
            (evaluation as any).learningPathSuggestions
          );
          setLearningPath((evaluation as any).learningPathSuggestions);
        }
      }

      return evaluation;
    } catch (err: any) {
      setIsProcessing(false);
      setError('Evaluation could not be generated: ' + err.message);
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
        if (status === 'listening') {
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
    setStatus('idle');
    setCurrentQuestion('');
    setCurrentTranscript('');
    setCurrentQuestionNumber(1);
    exchangesRef.current = [];
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
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
