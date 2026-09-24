import React from 'react';
import { Mic, MicOff, PhoneOff, AlertTriangle } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';
import { AudioVisualizer } from './AudioVisualizer';
import { QuestionDisplay } from './QuestionDisplay';
import { TranscriptView } from './TranscriptView';
import { Timer } from '../common/Timer/Timer';
import { Button } from '../common/Button/Button';
import './LiveInterviewRoom.css';

interface LiveInterviewRoomProps {
  onFinish: () => void;
}

export const LiveInterviewRoom: React.FC<LiveInterviewRoomProps> = ({ onFinish }) => {
  const {
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
    submitAnswer,
    endInterview,
    toggleMute,
  } = useInterview();

  const handleEndSession = async () => {
    await endInterview();
    onFinish();
  };

  const getStatusText = () => {
    if (isProcessing) return 'AI Processing Answer...';
    if (isAiSpeaking) return 'AI Interviewer Speaking...';
    if (isMuted) return 'Microphone Muted';
    if (isListening) return 'Listening to Candidate...';
    return 'Ready';
  };

  return (
    <div className="live-interview-room animate-fade-in">
      {/* Top Session Bar */}
      <div className="room-top-bar">
        <div className="room-info-cluster">
          <span className="room-badge">Live AI Session</span>
          <span className="room-config-tag">
            {session?.config.type.replace('_', ' ').toUpperCase()} • {session?.config.difficulty.toUpperCase()}
          </span>
        </div>

        <div className="room-controls-right">
          <Timer seconds={timeRemainingSeconds} label="Session Time" />
          <Button
            variant={isMuted ? 'danger' : 'secondary'}
            size="sm"
            leftIcon={isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<PhoneOff size={16} />}
            onClick={handleEndSession}
          >
            End Interview
          </Button>
        </div>
      </div>

      {error && (
        <div className="room-error-alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Interview Stage */}
      <div className="room-stage">
        {/* Center Audio Visualizer */}
        <AudioVisualizer
          isAiSpeaking={isAiSpeaking}
          isCandidateSpeaking={Boolean(isListening && currentTranscript)}
          statusText={getStatusText()}
        />

        {/* Question Display */}
        <QuestionDisplay
          questionNumber={currentQuestionNumber}
          questionText={currentQuestion}
          isAiSpeaking={isAiSpeaking}
        />

        {/* Live Transcript & Candidate Interaction */}
        <TranscriptView
          currentTranscript={currentTranscript}
          isListening={isListening && !isMuted}
          isProcessing={isProcessing}
          onSubmitAnswer={submitAnswer}
          exchanges={session?.exchanges || []}
        />
      </div>
    </div>
  );
};
