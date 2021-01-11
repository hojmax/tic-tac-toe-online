import React, { useState } from 'react'
import Lobby from './components/Lobby.js'
import Connecting from './components/Connecting.js'
import "./App.css"

function App() {
  const [lobby, setLobby] = useState("")
  const [lobbyExists, setLobbyExists] = useState(false)
  if (lobby) {
    return <Lobby lobbyExists={lobbyExists} lobby={lobby} />
  } else {
    return <Connecting setLobbyExists={setLobbyExists} setLobby={setLobby} />
  }
}

export default App