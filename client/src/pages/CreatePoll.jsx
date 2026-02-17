import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;


function CreatePoll() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const navigate = useNavigate();

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    try {
      const filteredOptions = options.filter((opt) => opt.trim() !== "");

      if (filteredOptions.length < 2) {
        alert("Minimum 2 options required");
        return;
      }

      const res = await axios.post(`${API}/polls`, {
        question,
        options: filteredOptions,
      });

      navigate(`/poll/${res.data._id}`);
    } catch (err) {
      alert("Error creating poll");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Create Poll</h2>

      <input
        placeholder="Enter question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: "100%", marginBottom: 20 }}
      />

      {options.map((opt, index) => (
        <input
          key={index}
          placeholder={`Option ${index + 1}`}
          value={opt}
          onChange={(e) => handleOptionChange(index, e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />
      ))}

      <button onClick={addOption}>Add Option</button>
      <br /><br />
      <button onClick={handleSubmit}>Create Poll</button>
    </div>
  );
}

export default CreatePoll;
