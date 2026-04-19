import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./PrivateTableModal.css";

interface PrivateTableModalProps {
  onCreateTable: (pin: string) => void;
  onJoinTable: (pin: string) => void;
  onClose: () => void;
}

export const PrivateTableModal: React.FC<PrivateTableModalProps> = ({
  onCreateTable,
  onJoinTable,
  onClose,
}) => {
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleCreateSubmit = () => {
    if (!pin || pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setError("PIN must contain only numbers");
      return;
    }
    onCreateTable(pin);
  };

  const handleJoinSubmit = () => {
    if (!pin || pin.length < 4) {
      setError("Please enter a valid PIN");
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setError("PIN must contain only numbers");
      return;
    }
    onJoinTable(pin);
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <AnimatePresence mode="wait">
          {mode === "select" && (
            <motion.div
              key="select"
              className="modal-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Private Table</h2>
              <p className="subtitle">Create or join a private game</p>

              <div className="mode-buttons">
                <motion.button
                  className="mode-btn create"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMode("create");
                    setPin("");
                    setError("");
                  }}
                >
                  <div className="btn-icon">🆕</div>
                  <div className="btn-text">Create Table</div>
                  <div className="btn-desc">Start a new private game</div>
                </motion.button>

                <motion.button
                  className="mode-btn join"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMode("join");
                    setPin("");
                    setError("");
                  }}
                >
                  <div className="btn-icon">🔓</div>
                  <div className="btn-text">Join Table</div>
                  <div className="btn-desc">Enter a PIN to join</div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create"
              className="modal-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Create Private Table</h2>
              <p className="subtitle">Share this PIN with friends to join</p>

              <input
                type="text"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                maxLength={6}
                className="pin-input"
                autoFocus
              />

              {error && <div className="error-msg">{error}</div>}

              <div className="pin-display">
                {pin ? (
                  <div className="pin-circles">
                    {pin.split("").map((digit, idx) => (
                      <div key={idx} className="pin-digit">
                        {digit}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pin-hint">Enter a PIN above</p>
                )}
              </div>

              <div className="modal-actions">
                <motion.button
                  className="btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode("select")}
                >
                  Back
                </motion.button>
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateSubmit}
                  disabled={!pin || pin.length < 4}
                >
                  Create Table
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              className="modal-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2>Join Private Table</h2>
              <p className="subtitle">Enter the PIN provided by the host</p>

              <input
                type="text"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                maxLength={6}
                className="pin-input"
                autoFocus
              />

              {error && <div className="error-msg">{error}</div>}

              <div className="pin-display">
                {pin ? (
                  <div className="pin-circles">
                    {pin.split("").map((digit, idx) => (
                      <div key={idx} className="pin-digit">
                        {digit}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pin-hint">Enter the PIN above</p>
                )}
              </div>

              <div className="modal-actions">
                <motion.button
                  className="btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode("select")}
                >
                  Back
                </motion.button>
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoinSubmit}
                  disabled={!pin || pin.length < 4}
                >
                  Join Table
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
