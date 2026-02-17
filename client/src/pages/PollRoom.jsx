import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import socket from "../socket";

const API = import.meta.env.VITE_API_URL;


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
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {poll.question}
      </h2>

      {poll.options.map((opt, index) => {
        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
        const percentage =
          totalVotes === 0 ? 0 : ((opt.votes / totalVotes) * 100).toFixed(1);

        return (
          <div key={index} className="mb-4">
            <button
              disabled={voted}
              onClick={() => handleVote(index)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition 
                ${voted ? "bg-gray-200 cursor-not-allowed" : "hover:bg-blue-50"}`}
            >
              <div className="flex justify-between">
                <span>{opt.text}</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </button>
          </div>
        );
      })}

      {voted && (
        <p className="text-sm text-green-600 mt-4">
          You have already voted.
        </p>
      )}
    </div>
  </div>
);

}

export default PollRoom;
