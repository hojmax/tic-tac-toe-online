import React from 'react'
import {Database} from "./components/Fire.js"
import getRandomString from "./components/RandomString.js"
import "./App.css"

class App extends React.Component {
  constructor(props) {
    super()
    this.state = {playerId: getRandomString(16),
                  lobbyCode: "",
                  errorMsg:"",
                  gameState: undefined,
                  opponentDisconnected:false}
    this.handleChange = this.handleChange.bind(this)
    this.joinLobby = this.joinLobby.bind(this)
    this.createLobby = this.createLobby.bind(this)
    this.establishConnection = this.establishConnection.bind(this)
    this.cellPressed = this.cellPressed.bind(this)
    this.getBoardEvaluation = this.getBoardEvaluation.bind(this)
    this.copyLobbyCode = this.copyLobbyCode.bind(this)
  }

  handleChange(event) {
    this.setState({lobbyCode: event.target.value, errorMsg:""})
  }

  establishConnection() {
    Database.ref("tictactoeGames/_"+this.state.lobbyCode).once("value", (snapshot) => {
      const data = snapshot.val()
      this.setState({marking: this.state.playerId === data.players[data.playerTurn] ? 1 : -1})
    })
    Database.ref("tictactoeGames/_"+this.state.lobbyCode).on("value", (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        this.setState({
          board:data.board,
          yourTurn: this.state.playerId === data.players[data.playerTurn],
          playerList: data.players,
          gameState: this.getBoardEvaluation(data.board)
        })
      } else {
        this.setState({opponentDisconnected:true})
      }
    })
    Database.ref("tictactoeGames/_"+this.state.lobbyCode).onDisconnect().remove();
  }

  joinLobby(event) {
    Database.ref("tictactoeGames/_"+this.state.lobbyCode).once("value").then(
      (snapshot) => {
        if (snapshot.exists() && snapshot.val().players.length < 2) {
          Database.ref("tictactoeGames/_"+this.state.lobbyCode+"/players")
                  .set([snapshot.val().players[0], this.state.playerId])
                  .then(this.establishConnection)
        } else {
          this.setState({errorMsg: "Invalid code."})
        }
      }
    )
    event.preventDefault()
  }

  createLobby() {
    const randomLobbyCode = getRandomString(16)
    Database.ref("tictactoeGames/_"+randomLobbyCode).set({
      board:[[0,0,0],
             [0,0,0],
             [0,0,0]],
      players: [this.state.playerId],
      playerTurn: Math.floor(Math.random() * 2)
    }).then(() => {
      this.setState({lobbyCode:randomLobbyCode})
      this.establishConnection()
    })
  }

  canPress(x,y) {
    return (
      this.state.yourTurn &&
      this.state.gameState === undefined &&
      !this.state.opponentDisconnected &&
      this.state.playerList.length === 2 &&
      this.state.board[y][x] === 0
    )
  }

  cellPressed(x,y) {
    if (this.canPress(x,y)) {
      Database.ref("tictactoeGames/_"+this.state.lobbyCode+"/board/"+y+"/"+x).set(this.state.marking)
      Database.ref("tictactoeGames/_"+this.state.lobbyCode+"/playerTurn").once("value").then(
        (snapshot) => {
          const current = snapshot.val()
          Database.ref("tictactoeGames/_"+this.state.lobbyCode+"/playerTurn").set(Math.abs(current-1))
      })
    }
  }

  getBoardEvaluation(board) {
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
        return rowSum / 3
      } else if (Math.abs(colSum) === 3) {
        return colSum / 3
      }
    }
    const diagonals = [
      board[0][0] + board[1][1] + board[2][2],
      board[0][2] + board[1][1] + board[2][0]
    ]
    for (let diagonal of diagonals) {
      if (Math.abs(diagonal) === 3) {
        return diagonal / 3
      }
    }
    if (!hasEmptyCell) {
      return 0
    }
    return undefined
  }

  copyLobbyCode() {
    const el = document.createElement('textarea');
    el.value = this.state.lobbyCode;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  getBottomText() {
    if (this.state.playerList.length < 2) {
      return <>
        <p>Waiting for opponent to join.</p>
        <div id="loadingAnimation"></div>
        <p style={{display:"inline-block"}}>
          <span style={{fontFamily: "Montserrat",fontWeight:"500"}}>Lobby code: </span>
          {this.state.lobbyCode}
        </p>
        <span style={{display:"inline-block",marginLeft:"5px",fontSize:"17px"}}
              onClick={this.copyLobbyCode}
              className="clickableSpan">
          Copy
        </span>
      </>
    } else {
      if (this.state.gameState === undefined) {
        if (this.state.yourTurn) {
          return <p>Your turn to move ({this.state.marking === 1 ? "X" : "0"}).</p>
        } else {
          return <p>Waiting for opponent to move.</p>
        }
      } else if (this.state.gameState === 0) {
        return <p>The game has ended in a draw.</p>
      } else if (this.state.gameState === this.state.marking) {
        return <p>You won the game.</p>
      } else {
        return <p>You lost the game.</p>
      }
    }
  }

  render() {
    if (this.state.marking && this.state.playerList) {
      const cells = this.state.board.map(
          (array,y) => <tr key={y}>{array.map(
              (e,x) => <td key={x}
                           onClick={()=>this.cellPressed(x,y)}
                           style={this.canPress(x,y) ? {cursor:"pointer"} : {}}
                           className="tictactoeCell">
                          {e === 1 ? "X" : (e === -1 ? "O" : "")}
                        </td>
            )}</tr>
        )
      return (
        <div>
          <span onClick={() => window.location.reload()} className="clickableSpan">Main Menu</span>
          <center>
            <table style={{fontSize:"40px"}}>
              <tbody>
                {cells}
              </tbody>
            </table>
            <div style={{marginBottom:"-8px"}}>
              {this.getBottomText()}
            </div>
            {this.state.opponentDisconnected && <p className="errorMsg">Opponent disconnected.</p>}
          </center>
        </div>
      )
    } else {
      return (
        <center>
          <form name="lobbyForm" style={{marginTop:"50px"}}>
            <label>
              Join a game with a code:<br/>
              <input type="text"
                     id = "lobbyCodeInput"
                     spellCheck="false"
                     value={this.state.lobbyCode}
                     onChange={this.handleChange}/>
            </label>
            {" "}
            <span onClick={this.joinLobby} className="clickableSpan">Connect</span>
            <div className="errorContainer" style={{minHeight: "20px",marginTop: "10px"}}>
              {this.state.errorMsg && <p className="errorMsg">{this.state.errorMsg}</p>}
            </div>
          </form>
          <p>Or create a new lobby <span className="clickableSpan" onClick={this.createLobby}>here.</span></p>
        </center>
      )
    }
  }
}

export default App