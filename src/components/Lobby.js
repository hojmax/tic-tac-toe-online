import React, { useState, useEffect } from 'react'
import { Database } from "./Fire.js"

function Lobby(props) {
  const [gameState, setGameState] = useState(undefined)
  const [waitingForServer, setWaitingForServer] = useState(false)
  const [hasCopiedURL, setHasCopiedURL] = useState(false)
  const getBoardEvaluation = (board) => {
    let hasEmptyCell = false
    for (let i = 0; i < 3; i++) {
      let rowSum = 0
      let colSum = 0
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === 0) {
          hasEmptyCell = true
        }
        rowSum += board[i][j]
        colSum += board[j][i]
      }
      if (Math.abs(rowSum) === 3) {
        let cells = []
        for (let j = 0; j < 3; j++) {
          cells.push([j, i])
        }
        animateWinningMove(cells, rowSum / 3)
        return rowSum / 3
      } else if (Math.abs(colSum) === 3) {
        let cells = []
        for (let j = 0; j < 3; j++) {
          cells.push([i, j])
        }
        animateWinningMove(cells, colSum / 3)
        return colSum / 3
      }
    }
    const diagonals = [
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]]
    ]
    for (let diagonal of diagonals) {
      const diagonalValue = diagonal.reduce((a, b) => a + board[b[1]][b[0]], 0)
      if (Math.abs(diagonalValue) === 3) {
        animateWinningMove(diagonal, diagonalValue / 3)
        return diagonalValue / 3
      }
    }
    if (!hasEmptyCell) {
      return 0
    }
    return undefined
  }
  const animateWinningMove = (cells, winner) => {
    const baseAnimation = " 0.2s ease-in-out, fontBounce 0.2s ease-in-out"
    cells.forEach(e => {
      document.getElementById(`cell${3 * e[1] + e[0]}`).style.animation = winner === props.lobby.local.marking ? "blackToGreen" + baseAnimation : "blackToRed" + baseAnimation
      document.getElementById(`cell${3 * e[1] + e[0]}`).style.color = winner === props.lobby.local.marking ? "green" : "red"
    })
  }
  useEffect(() => {
    setGameState(getBoardEvaluation(props.lobby.server.board))
    setWaitingForServer(false)
  }, [props.lobby.server.board])
  const clientsTurn = () => {
    return props.lobby.local.clientID === props.lobby.server.players[props.lobby.server.clientTurn]
  }
  const canPressCell = (x, y) => {
    return (
      !waitingForServer &&
      clientsTurn() &&
      gameState === undefined &&
      props.lobbyExists &&
      props.lobby.server.players.length === 2 &&
      props.lobby.server.board[y][x] === 0
    )
  }
  const handleCellPress = (x, y) => {
    if (canPressCell(x, y)) {
      setWaitingForServer(true)
      let updates = {}
      const newTurn = 1 - props.lobby.server.players.indexOf(props.lobby.local.clientID)
      updates["tictactoeGames/_" + props.lobby.local.code + "/board/" + y + "/" + x] = props.lobby.local.marking
      updates["tictactoeGames/_" + props.lobby.local.code + "/clientTurn"] = newTurn
      Database.ref().update(updates)
    }
  }
  const copyToClipboard = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  useEffect(() => {
    hasCopiedURL && document.getElementById("lobbyURL").select()
  }, [hasCopiedURL])
  const BottomText = () => {
    if (props.lobby.server.players.length < 2) {
      const lobbyURL = window.location.origin + window.location.pathname + "?" + props.lobby.local.code
      return <>
        <p style={{fontSize: "2vw"}}>Waiting for opponent to join.</p>
        <div id="loadingAnimation"></div>
        <br />
        <br />
        <p style={{ margin: "0px 0px 10px 0px", fontSize: "1.5vw" }}>Invite a friend with an URL:</p>
        <div style={{ fontSize: "0px" }}>
          <input
            id="lobbyURL"
            type="text"
            onClick={(event) => event.target.select()}
            spellCheck="false"
            readOnly
            value={lobbyURL}
            size={lobbyURL.length + 1} />
          <button
            onClick={(event) => { copyToClipboard(lobbyURL); setHasCopiedURL(true); document.getElementById("lobbyURL").select() }}
            id="lobbyURLButton">
            {hasCopiedURL ? <i className="fas fa-check"></i> : <i className="fas fa-link"></i>}
          </button>
        </div>
      </>
    } else {
      return <p
        id="bottomText"
        style={{
          animation: "flash 1s",
          fontSize: "2vw",
        }}>
        {gameState === undefined ?
          (clientsTurn() ? `Your turn to move (${props.lobby.local.marking === 1 ? "X" : "0"}).` : "Waiting for opponent to move.") :
          (gameState === 0 ? "The game has ended in a draw." :
            (gameState === props.lobby.local.marking ? <span>You <span style={{ color: "green" }}>won</span> the game.</span> : <span>You <span style={{ color: "red" }}>lost</span> the game.</span>))
        }
      </p>
    }
  }
  const cellBorder = "1.5px solid rgb(50,50,50)"
  const cells = props.lobby.server.board.map(
    (array, y) => <tr key={y}>{array.map(
      (e, x) => <td key={x}
        onClick={() => handleCellPress(x, y)}
        id={`cell${y * 3 + x}`}
        style={{
          cursor: canPressCell(x, y) ? "pointer" : "default",
          borderTop: y === 0 ? "none" : cellBorder,
          borderBottom: y === 2 ? "none" : cellBorder,
          borderLeft: x === 0 ? "none" : cellBorder,
          borderRight: x === 2 ? "none" : cellBorder,
          animation: e === 0 ? undefined : "fontBounce 0.2s ease-in-out, flash 0.2s ease-in-out"
        }}
        onAnimationEnd={() => document.getElementById(`cell${3 * y + x}`).style.animation = "none"}
        className="tictactoeCell">
        {e === 1 ? "X" : (e === -1 ? "O" : "")}
      </td>
    )}</tr>
  )
  return (
    <div>
      <span onClick={() => window.location.search = ""} className="clickableSpan" style={{margin: "0px", padding: "0px", fontSize: "2vw"}}>Main Menu</span>
      <center>
        <table cellSpacing="0">
          <tbody>
            {cells}
          </tbody>
        </table>
        <BottomText lobby={props} />
        {!props.lobbyExists && <p style={{fontSize:"1.5vw"}}className="errorMsg">Opponent disconnected.</p>}
      </center>
    </div>
  )
}

export default Lobby