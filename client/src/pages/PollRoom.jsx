import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import socket from "../socket";

const API = "http://localhost:5000/api";

function PollRoom() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      const res = await axios.get(`${API}/polls/${id}`);
      setPoll(res.data);
    };

    fetchPoll();

    socket.emit("joinPoll", id);

    socket.on("voteUpdated", (updatedPoll) => {
      setPoll(updatedPoll);
    });

    const existingVote = localStorage.getItem(`voted-${id}`);
    if (existingVote) {
      setVoted(true);
    }

    return () => {
      socket.off("voteUpdated");
    };
  }, [id]);

  const handleVote = async (index) => {
    try {
      let fingerprintId = localStorage.getItem("fingerprintId");

      if (!fingerprintId) {
        fingerprintId = uuidv4();
        localStorage.setItem("fingerprintId", fingerprintId);
      }

      await axios.post(`${API}/polls/${id}/vote`, {
        selectedOptionIndex: index,
        fingerprintId,
      });

      localStorage.setItem(`voted-${id}`, "true");
      setVoted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Voting failed");
    }
  };

  if (!poll) return <div>Loading...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>{poll.question}</h2>

      {poll.options.map((opt, index) => (
        <div key={index} style={{ marginBottom: 10 }}>
          <button
            disabled={voted}
            onClick={() => handleVote(index)}
          >
            {opt.text}
          </button>

          <span style={{ marginLeft: 10 }}>
            Votes: {opt.votes}
          </span>
        </div>
      ))}

      {voted && <p>You have already voted.</p>}
    </div>
  );
}

export default PollRoom;
