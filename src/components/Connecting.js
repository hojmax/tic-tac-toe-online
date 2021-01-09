import React, { useState, useEffect } from 'react'
import { Database } from "./Fire.js"
import getRandomString from "./RandomString.js";

function Connecting(props) {
  const options = require("../Options.json")
  const [errorMsg, setErrorMsg] = useState("")
  const [waitingForServer, setWaitingForServer] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const clientID = getRandomString(options.clientIDLength)
  const connect = (lobbyCode) => {
    let marking;
    Database.ref("tictactoeGames/_" + lobbyCode).once("value", (snapshot) => {
      const data = snapshot.val()
      marking = (clientID === data.players[data.clientTurn] ? 1 : -1)
    }).then(() => {
      Database.ref("tictactoeGames/_" + lobbyCode).on("value", (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          props.setLobbyExists(true)
          props.setLobby({ server: data, local: { marking: marking, clientID: clientID, code: lobbyCode } })
        } else {
          props.setLobbyExists(false)
        }
      })
    })
    Database.ref("tictactoeGames/_" + lobbyCode).onDisconnect().remove();
  }
  const tryJoining = (lobbyCode) => {
    if (!waitingForServer) {
      setWaitingForServer(true)
      Database.ref("tictactoeGames/_" + lobbyCode).once("value").then(
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            if (data.players.length < 2) {
              Database.ref("tictactoeGames/_" + lobbyCode + "/players")
                .set([data.players[0], clientID])
                .then(connect(lobbyCode))
            }
          } else {
            setErrorMsg("The challenge link is invalid.")
            setShowContent(true)
            setWaitingForServer(false)
          }
        }
      )
    }
  }
  const createLobby = () => {
    if (!waitingForServer) {
      setWaitingForServer(true)
      const newLobbyCode = getRandomString(options.lobbyCodeLength)
      Database.ref("tictactoeGames/_" + newLobbyCode).set({
        board:
          [[0, 0, 0],
          [0, 0, 0],
          [0, 0, 0]],
        players: [clientID],
        clientTurn: Math.floor(Math.random() * 2)
      }).then(() => {
        connect(newLobbyCode)
      })
    }
  }
  useEffect(() => {
    const linkCode = window.location.search.substring(1,options.lobbyCodeLength+1)
    if (linkCode) {
      tryJoining(linkCode)
    } else {
      setShowContent(true)
    }
  }, [])
  if (!showContent) {
    return <></>
  } else {
    return (
      <center>
        <h1>Tic-Tac-Toe Online</h1>
        <p>Create a new lobby <span className="clickableSpan" onClick={createLobby}>here.</span></p>
        {errorMsg && <p className="errorMsg">{errorMsg}</p>}
      </center>
    )
  }
}

export default Connecting