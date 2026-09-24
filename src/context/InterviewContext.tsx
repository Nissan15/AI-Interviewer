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
import { generateInterviewQuestion } from '../services/ai/questionGenerator';
import { processInterviewTurn } from '../services/ai/interviewEngine';
import { evaluateInterviewSession } from '../services/ai/answerEvaluator';
import { useResume } from './ResumeContext';
import { useSettings } from './SettingsContext';

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
  const { resume } = useResume();
  const { isAiConfigured, autoSpeakQuestions, speechRate, voiceUri } = useSettings();

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
        setError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const startInterview = async (config: InterviewConfig) => {
    setError(null);
    if (!isAiConfigured) {
      throw new Error(
        'AI service is not configured. Please configure your API key in Settings before launching an interview.'
      );
    }

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

    try {
      setIsProcessing(true);
      const firstQ = await generateInterviewQuestion(config, resume, 1, []);
      setIsProcessing(false);

      setCurrentQuestion(firstQ.questionText);
      setStatus('speaking');

      // Speak aloud and transition to listening
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

    // Record exchange
    const newExchange: InterviewExchange = {
      id: `ex_${Date.now()}`,
      questionNumber: currentQuestionNumber,
      questionText: currentQuestion,
      questionTimestamp: new Date().toISOString(),
      userAnswerText: answerToProcess || '(Candidate did not answer)',
      answerTimestamp: new Date().toISOString(),
    };

    const updatedExchanges = [...exchangesRef.current, newExchange];
    exchangesRef.current = updatedExchanges;

    try {
      const historyForTurn = updatedExchanges.map((ex) => ({
        question: ex.questionText,
        answer: ex.userAnswerText || '',
      }));

      // Call AI turn engine
      const turnResult = await processInterviewTurn(currentQuestion, answerToProcess, historyForTurn);

      newExchange.isFollowUp = turnResult.isFollowUp;
      newExchange.followUpReason = turnResult.followUpReason;
      newExchange.aiQuickFeedback = turnResult.quickFeedback;

      setCurrentQuestion(turnResult.nextQuestionText);
      setCurrentQuestionNumber((prev) => prev + 1);
      setCurrentTranscript('');
      setIsProcessing(false);

      // Speak the next question
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
        activeSession?.id || `sess_${Date.now()}`,
        durationSeconds,
        exchangesRef.current
      );

      setLatestEvaluation(evaluation);
      setIsProcessing(false);
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
