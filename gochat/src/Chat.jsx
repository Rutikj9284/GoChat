import React, { useContext, useEffect, useState } from "react";
import Avatar from "./Avatar";
import { UserContext } from "./UserContext";
import _ from "lodash";
import axios from "axios";
function Chat() {
  //to connect to wss
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  //to save the typed message
  const [newMessage, setNewMessage] = useState("");
  //to show the message on screen
  const [message, setMessage] = useState([]);
  //bring the name of us i.e. we're logged in
  const { id, setUsername, setid } = useContext(UserContext);
  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4040");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        connectToWs();
      }, 1000); //after connection gets lost it will try to recoonect to WS after 1000ms i.e 1sec.
    });
  }

  function showOnlinePeople(people) {
    const uniquePeople = {};
    people.forEach(({ userId, username }) => {
      uniquePeople[userId] = username;
    });
    setOnlinePeople(uniquePeople);
  }
  function handleMessage(e) {
    try {
      const messageData = JSON.parse(e.data);
      if ("online" in messageData) {
        showOnlinePeople(messageData.online);
      } else {
        if(messageData.sender === selectedId){
          setMessage((prev) => [...prev, { ...messageData }]);
        }
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  //select the contact
  function selectContact(id) {
    setSelectedId(id);
  }

  //function to send the message
  function sendMessage(e, file=null) {
    if(e) e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedId,
        text: newMessage,
        file
      })
    );

    if(file){
      axios.get('/messages/'+selectedId).then(res=>{
        setNewMessage(res.data);
        setNewMessage("");
      })
    }else{
      //set this message to message array and clear it
      setMessage((prev) => [
        ...prev,
        { text: newMessage, sender: id, recipient: selectedId, _id: Date.now() },
      ]);
      //set newMessage to empty as we've added it to message wala array -> remember from meesage wala array we're fetching the text onto the screen
      setNewMessage("");
    }
  }

  //func to logout -> from userContext id, username is the credentials of lgged in person after logout set it to null
  function logout() {
    axios.post("/logout").then(() => {
      setid(null);
      setUsername(null);
    });
  }

  //don't show my name on people list-> filter out my username from onlinePeople
  const onlinePeopleExceptMe = { ...onlinePeople };
  delete onlinePeopleExceptMe[id];

  useEffect(() => {
    if (selectedId) {
      axios.get("/messages/" + selectedId).then((res) => {
        setMessage(res.data);
      });
    }
  }, [selectedId]);
  //in message[] it can have duplicates i.e. same message 2 times when we tap the send button so remove the duplicacy

  const uniqueMessage = _.uniqBy(message, "_id");

  //to send file/attachments
  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="text-green-600 font-bold p-2 italic text-xl flex mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          GoChat
        </div>
        <div className="flex-grow">
          {Object.keys(onlinePeopleExceptMe).map((id) => (
            <div
              key={id}
              onClick={() => selectContact(id)}
              className={`border-b font-bold border-gray-100 p-3 flex gap-2 items-center cursor-pointer ${
                selectedId === id ? "bg-green-50" : ""
              }`}
            >
              <Avatar online="true" username={onlinePeople[id]} userId={id} />
              <span className="text-gray-800">{onlinePeople[id]}</span>
            </div>
          ))}
        </div>
        <div className="text-center p-2">
          <button
            onClick={logout}
            className="text-white py-2 px-1 bg-blue-500 hover:font-bold border rounded-md"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-green-50 w-2/3 p-2">
        {selectedId && (
          <div>
            <div className="pl-2 font-bold text-gray-600">
              {onlinePeople[selectedId]}
            </div>
            <h6 className="pl-2 text-sm text-gray-500">online</h6>
          </div>
        )}
        <div className="flex-grow">
          {!selectedId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-400">
                &larr; Select a person to chat
              </div>
            </div>
          )}
        </div>

        {selectedId && (
          <div className="overflow-y-scroll p-2 m-1">
            {uniqueMessage.map((m) => {
              return (
                <div
                  className={`${m.sender === id ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`text-left inline-block p-2 my-2 text-sm rounded-md ${
                      m.sender === id
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    <div className="flex">{m.text}</div>
                    {m.file && (
                      <div className="flex">
                        <a className='flex items-center gap-1 underline' href={axios.defaults.baseURL+'/attachments/'+m.file}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
              </svg>
                          {m.file}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              type="text"
              placeholder="type a message"
              className="bg-white flex-grow border rounded-sm p-2"
            />
            <label className="bg-gray-200 p-2 text-gray-600 cursor-pointer rounded-sm border border-gray-500">
              <input type="file" className="hidden" onChange={sendFile}/>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
              </svg>
            </label>
            <button
              type="submit"
              className="bg-green-500 p-2 text-white roundes-sm"
            >
              <svg
                class="h-8 w-8 text-white-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                {" "}
                <line x1="22" y1="2" x2="11" y2="13" />{" "}
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Chat;
