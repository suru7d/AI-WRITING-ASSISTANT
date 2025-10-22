import React, { useState } from "react";
import axios from "axios";
import Login from "./Login";
import { FaSpellCheck, FaSyncAlt, FaCheck, FaPencilAlt } from "react-icons/fa";
import { SiGrammarly } from "react-icons/si";
import { usePrivy } from "@privy-io/react-auth";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Editor = () => {
  const { getAccessToken } = usePrivy();
  const [text, setText] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");
  const [rephrasedSentences, setRephrasedSentences] = useState([]);
  const [correctedSentences, setCorrectedSentences] = useState([]);
  const [spellCheckedText, setSpellCheckedText] = useState("");
  const [grammarCheckedText, setGrammarCheckedText] = useState("");
  const [loading, setLoading] = useState({ spell: false, grammar: false, rephrase: false });
  const [error, setError] = useState("");

  // Load persisted corrections
  React.useEffect(() => {
    const saved = localStorage.getItem("correctedSentences");
    if (saved) {
      try {
        setCorrectedSentences(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Persist on change
  React.useEffect(() => {
    localStorage.setItem("correctedSentences", JSON.stringify(correctedSentences));
  }, [correctedSentences]);

  const handleTextChange = (e) => setText(e.target.value);

  const handleSentenceSelection = () => {
    const selection = window.getSelection().toString();
    if (selection) setSelectedSentence(selection);
  };

  const rephraseSentence = async () => {
    try {
      setError("");
      setLoading((s) => ({ ...s, rephrase: true }));
      const sentenceToUse = (selectedSentence && selectedSentence.trim()) || text.trim();
      if (!sentenceToUse) return;
      const response = await axios.post(
        `${API_BASE_URL}/api/analyze`,
        {
          sentence: sentenceToUse,
        },
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
          },
        }
      );
      const list = response.data?.rephrasedSentences;
      if (Array.isArray(list) && list.length > 0) {
        setRephrasedSentences(list);
      } else {
        const corrected = response.data?.corrected;
        if (corrected) setRephrasedSentences([corrected]);
      }
    } catch (error) {
      console.error("Error rephrasing sentence:", error);
      setError("Failed to rephrase. Please try again.");
    }
    finally {
      setLoading((s) => ({ ...s, rephrase: false }));
    }
  };

  const addCorrectedSentence = (sentence) => {
    if (!sentence) return;
    if (correctedSentences.includes(sentence)) return;
    setCorrectedSentences([...correctedSentences, sentence]);
    // Replace selection or whole textarea with accepted text
    if (selectedSentence) {
      const replaced = text.replace(selectedSentence, sentence);
      setText(replaced);
      setSelectedSentence("");
    } else {
      setText(sentence);
    }
  };

  const checkSpelling = async () => {
    try {
      setError("");
      setLoading((s) => ({ ...s, spell: true }));
      const response = await axios.post(
        `${API_BASE_URL}/api/spellcheck`,
        { text },
        {}
      );
      setSpellCheckedText(response.data?.corrected);
    } catch (error) {
      console.error("Error checking spelling:", error);
      setError("Failed to check spelling. Please try again.");
    }
    finally {
      setLoading((s) => ({ ...s, spell: false }));
    }
  };

  const checkGrammar = async () => {
    try {
      setError("");
      setLoading((s) => ({ ...s, grammar: true }));
      const response = await axios.post(
        `${API_BASE_URL}/api/grammarcheck`,
        { text }
      );
      setGrammarCheckedText(response.data?.corrected);
    } catch (error) {
      console.error("Error checking grammar:", error);
      setError("Failed to check grammar. Please try again.");
    }
    finally {
      setLoading((s) => ({ ...s, grammar: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              AI Writing Assistant
            </h2>
            <p className="mb-4 text-gray-600">
              Enhance your writing with our advanced AI tools.
            </p>
            <textarea
              value={text}
              onChange={handleTextChange}
              onMouseUp={handleSentenceSelection}
              placeholder="Type your text here..."
              rows={10}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end mt-4 space-x-4">
              <Button onClick={checkSpelling} icon={<FaSpellCheck />} disabled={loading.spell}>
                {loading.spell ? "Checking..." : "Check Spelling"}
              </Button>
              <Button onClick={checkGrammar} icon={<SiGrammarly />} disabled={loading.grammar}>
                {loading.grammar ? "Checking..." : "Check Grammar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ResultSection
              title="Spell Checked Text"
              text={spellCheckedText}
              placeholder="Enhance your writing with our advanced AI tools."
              onAccept={() => addCorrectedSentence(spellCheckedText)}
              icon={<FaSpellCheck className="text-green-500" />}
            />
            <ResultSection
              title="Grammar Checked Text"
              text={grammarCheckedText}
              placeholder="Enhance your writing with our advanced AI tools."
              onAccept={() => addCorrectedSentence(grammarCheckedText)}
              icon={<SiGrammarly className="text-blue-500" />}
            />
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 my-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaPencilAlt className="mr-2 text-purple-500" />
              Selected Sentence:
            </h3>
            <p className="mb-4">
              {selectedSentence || "Enhance your writing with our advanced AI tools."}
            </p>
            <Button onClick={rephraseSentence} icon={<FaSyncAlt />} disabled={!text.trim() || loading.rephrase}>
              {loading.rephrase ? "Rephrasing..." : "Rephrase"}
            </Button>
          </div>

          {rephrasedSentences.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg p-6 my-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaSyncAlt className="mr-2 text-indigo-500" />
                Rephrased Sentences:
              </h3>
              {rephrasedSentences.map((sentence, index) => (
                <div
                  key={index}
                  className="mb-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  <p className="mb-2">{sentence}</p>
                  <Button
                    onClick={() => addCorrectedSentence(sentence)}
                    icon={<FaCheck />}
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white shadow-lg rounded-lg p-6 sticky top-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaCheck className="mr-2 text-green-500" />
              Corrected Sentences
            </h3>
            <p className="mb-4 text-gray-600">
              Your approved corrections will appear here.
            </p>
              {correctedSentences.length > 0 ? (
                correctedSentences.map((sentence, index) => (
                <div
                  key={index}
                  className="mb-2 pb-2 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="mr-2">{sentence}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(sentence)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">
                No corrected sentences yet.
              </p>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="container mx-auto mt-4">
          <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

const Button = ({ onClick, children, icon, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-blue-600 text-white px-4 py-2 rounded-full font-semibold transition duration-300 flex items-center ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
    }`}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
  </button>
);

const ResultSection = ({ title, text, placeholder, onAccept, icon }) => (
  <div className="bg-white shadow-lg rounded-lg p-6">
    <h3 className="text-xl font-semibold mb-4 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    <p className="mb-4">{text || placeholder}</p>
    <Button onClick={onAccept} icon={<FaCheck />} disabled={!text}>
      Accept
    </Button>
  </div>
);

export default Editor;