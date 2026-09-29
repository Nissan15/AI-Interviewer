import React, { useEffect } from "react";
import { Mic, MicOff, PhoneOff, AlertTriangle } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";
import { AudioVisualizer } from "./AudioVisualizer";
import { QuestionDisplay } from "./QuestionDisplay";
import { TranscriptView } from "./TranscriptView";
import { Timer } from "../common/Timer/Timer";
import { Button } from "../common/Button/Button";
import "./LiveInterviewRoom.css";

interface LiveInterviewRoomProps {
  onFinish: () => void;
}

export const LiveInterviewRoom: React.FC<LiveInterviewRoomProps> = ({
  onFinish,
}) => {
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
    handleMicTap,
    repeatQuestion,
    submitAnswer,
    endInterview,
    toggleMute,
  } = useInterview();

  // Spacebar push-to-talk convenience shortcut when not typing in textarea/input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const activeEl = document.activeElement;
        const isInput =
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            (activeEl as HTMLElement).isContentEditable);
        if (!isInput && !isProcessing) {
          e.preventDefault();
          handleMicTap();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMicTap, isProcessing]);

  const handleEndSession = async () => {
    await endInterview();
    onFinish();
  };

  const getStatusText = () => {
    if (isProcessing) return "AI Analysing Speech & Formulating Follow-up...";
    if (isAiSpeaking) return "AI Interviewer Speaking (tap mic to answer early)...";
    if (isListening) return "Listening to Candidate • Tap mic to finish & analyse";
    if (status === "ready") return "AI Ready • Tap mic to start speaking";
    return "Ready • Tap mic to speak";
  };

  return (
    <div className="live-interview-room animate-fade-in">
      {/* Top Session Bar */}
      <div className="room-top-bar">
        <div className="room-info-cluster">
          <span className="room-badge">Live AI Session</span>
          <span className="room-config-tag">
            {session?.config.type.replace("_", " ").toUpperCase()} •{" "}
            {session?.config.difficulty.toUpperCase()}
          </span>
          {isListening && (
            <span className="room-mic-status recording">
              <span className="pulse-red-dot" /> Mic Recording
            </span>
          )}
        </div>

        <div className="room-controls-right">
          <Timer seconds={timeRemainingSeconds} label="Session Time" />
          <Button
            variant={isMuted ? "danger" : "secondary"}
            size="sm"
            leftIcon={isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            onClick={toggleMute}
          >
            {isMuted ? "Unmute" : "Mute"}
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
        {/* Center Audio Visualizer with Tap-to-Talk Orb */}
        <AudioVisualizer
          isAiSpeaking={isAiSpeaking}
          isCandidateSpeaking={Boolean(isListening && currentTranscript)}
          isListening={isListening}
          isProcessing={isProcessing}
          statusText={getStatusText()}
          onMicTap={handleMicTap}
        />

        {/* Question Display */}
        <QuestionDisplay
          questionNumber={currentQuestionNumber}
          questionText={currentQuestion}
          isAiSpeaking={isAiSpeaking}
          onRepeatQuestion={repeatQuestion}
        />

        {/* Live Transcript & Candidate Interaction */}
        <TranscriptView
          currentTranscript={currentTranscript}
          isListening={isListening && !isMuted}
          isProcessing={isProcessing}
          isAiSpeaking={isAiSpeaking}
          onMicTap={handleMicTap}
          onSubmitAnswer={submitAnswer}
          exchanges={session?.exchanges || []}
        />
      </div>
    </div>
  );
};
