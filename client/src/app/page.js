"use client";
// Importing the necessary dependencies for managing state and side effects in a React component
import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import io from "socket.io-client";
import toast, { Toaster } from 'react-hot-toast';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Swal from 'sweetalert2';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import MuiInput from '@mui/material/Input';
import Typography from '@mui/material/Typography';

import {
  getDevices,
  handleMediaToggle,
  MIC,
  CAMERA,
} from "./utils/mediaDevices";
import {
  leaveStage,
  joinStage,
  createLocalStageStream,
} from "./utils/stageUtils";
import {
  getLocalPlayer,
  countdown,
  updateSubscriptionToRedis,
  getScoresFromRedis,
  addScoreToPlayer,
  deductScoreToPlayer,
  getParticipantTokenFromRedis,
} from './utils/Push';

import {
  getCategories,
} from './utils/mysql';

import Footer from "./components/Footer";
import Header from "./components/Header";
import Input from "./components/Input";
import LocalParticipantVideo from "./components/LocalParticipantVideo";
import RemoteParticipantVideos from "./components/RemoteParticipantVideos";
import Select from "./components/Select";
import RoomForm from './components/RoomForm';
import SearchForm from './components/SearchForm';
import AddMemberForm from './components/AddMemberForm';

const util = require('util');
const utf8 = require('utf8');
var moment = require('moment');

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const marks = [
  {
    value: 1,
    label: '1 min',
  },
  {
    value: 3,
    label: '3 mins',
  },
  {
    value: 5,
    label: '5 mins',
  },
  {
    value: 8,
    label: '8 mins',
  },
];

let socket;

export default function Home() {
  // Initializing a state variable and its update function
  const [isInitializeComplete, setIsInitializeComplete] = useState(false);

  // Using the useState hook to create and manage state for video and audio devices and their selections
  const [videoDevices, setVideoDevices] = useState([]); // Stores the available video devices
  const [audioDevices, setAudioDevices] = useState([]); // Stores the available audio devices
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState(null); // Tracks the selected video device
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState(null); // Tracks the selected audio device

  // Initialize state for the participant token as an empty string
  const [participantToken, setParticipantToken] = useState("");
  const [participantId, setParticipantId] = useState("");

  // Initialize state variables for managing the current stage, connection status, participant list, and local participant information
  const [isConnected, setIsConnected] = useState(false); // Tracks the connection status
  const [participants, setParticipants] = useState([]); // Manages the list of participants
  const [localParticipant, setLocalParticipant] = useState({}); // Manages the local participant information

  // Create a ref for the stage to hold a reference to the IVS stage instance.
  const stageRef = useRef(undefined);

  // Create a ref for the strategy to hold a reference to the strategy configuration used in the IVS stage.
  const strategyRef = useRef();

  // Initialize a state variable to manage the muted status of the microphone
  const [isMicMuted, setIsMicMuted] = useState(true);

  // Initialize a state variable to manage the visibility status of the camera
  const [isCameraHidden, setIsCameraHidden] = useState(false);

  const localParticipantRef = useRef({});
  const participantTokenRef = useRef("");
  const tabooWordsRef = useRef([]);
  const hitWordsRef = useRef([]);

  const [gameDuration, setGameDuration] = useState([{ "deviceId": 1, "label": "1" }, { "deviceId": 3, "label": "3" }, { "deviceId": 5, "label": "5" }, { "deviceId": 8, "label": "8" }]);
  const [selectedDuration, setSelectedDuration] = useState('1');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tabooWords, setTabooWords] = useState([]);
  const [hitWords, setHitWords] = useState([]);
  const [isGameEnd, setIsGameEnd] = useState(true);

  const [joinRoom, setJoinRoom] = useState(false);

  const handleClickJoinRoom = async () => {
    const token = await getParticipantTokenFromRedis(participantId);
    console.log("token:" + JSON.stringify(token));
    if(token === undefined ){
        alert("รหัสสมาชิกไม่ถูกต้อง!");
    }else{
            joinStage(
                      isInitializeComplete,
                      token,
                      selectedAudioDeviceId,
                      selectedVideoDeviceId,
                      setIsConnected,
                      setIsMicMuted,
                      setLocalParticipant,
                      setParticipants,
                      strategyRef,
                      stageRef,
                      localParticipantRef,
                      setParticipantToken,
                      setJoinRoom,
                      socket,
                      participantTokenRef
                    );
    }
  };

  const handleLeaveRoom = () => {
    setJoinRoom(false);
    leaveStage(stageRef.current, setIsConnected);
  };

  /**
   * Function gets the video and audio devices connected to the laptop and stores them in the state
   */
  const handleDeviceUpdate = async () => {
    try {
      const { videoDevices, audioDevices } = await getDevices();
      setVideoDevices(videoDevices);
      setSelectedVideoDeviceId(videoDevices[0]?.deviceId);

      setAudioDevices(audioDevices);
      setSelectedAudioDeviceId(audioDevices[0]?.deviceId);
    } catch (error) {
      // Handle any errors that may occur during the device update process
      console.error("An error occurred during device update:", error);
      // You can add additional error-handling logic here as needed
    }
  };

  /**
   * Initialize after the client is loaded
   */
  const initialize = async () => {
    // Call the handleDeviceUpdate function to update the video and audio devices
    handleDeviceUpdate();
    // Set the value of isInitializeComplete to true
    setIsInitializeComplete(true);
/*
    initPostMessageListener(setTabooWords, handleStartGameCountdown, setIsGameEnd, setHitWords);

    const isUnsupported = notificationUnsupported();
    setUnsupported(isUnsupported);
    if (isUnsupported) {
      alert('Browser Not Support to Play');
      return;
    }
*/
   let categories = [];
    const cats = await getCategories();

    categories.push( { "deviceId": "Random", "label": "Random" });
    for (let i in cats) {
        categories.push( { "deviceId": cats[i].category, "label": cats[i].category });
    }
    //alert(util.inspect(categories));
    setSelectedCategory('Random');
    setCategories(categories);
  };

  const updateLocalParticipantMedia = async () => {
    const { participant } = localParticipant;

    // Create new local streams
    const newVideoStream = await createLocalStageStream(
      selectedVideoDeviceId,
      CAMERA
    );
    const newAudioStream = await createLocalStageStream(
      selectedAudioDeviceId,
      MIC
    );

    // Update the streams array with the new streams
    const updatedStreams = [newVideoStream, newAudioStream];

    // Update the participant object with the new streams
    const updatedParticipant = {
      participant,
      streams: updatedStreams,
    };

    setLocalParticipant(updatedParticipant);

    strategyRef.current.updateTracks(newAudioStream, newVideoStream);
    stageRef.current.refreshStrategy();
  };

  //const [unsupported, setUnsupported] = useState(false);
  //const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    //Check to ensure that the stage and the strategy have completed initialization
    const isInitializingStreams =
      !strategyRef.current?.audioTrack && !strategyRef.current?.videoTrack;
    if (!isInitializeComplete || isInitializingStreams) return; // If initialization is not complete, return

    if (localParticipant.streams) {
      updateLocalParticipantMedia();
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  const initializeSocket = async () => {
      await fetch("/api/socket");
      socket = io();

      socket.on("receive-message", (message) => {
        //setMessages((messages) => [...messages, message]);
        console.log(JSON.stringify(message));
        let payload = message;
        let localPlayer = utf8.decode(localParticipantRef.current?.attributes?.username);
        let localPlayerId = utf8.decode(localParticipantRef.current?.id);

        console.log("Token:" + participantTokenRef.current);
        console.log("LocalPlayer:" + localPlayer);
        console.log("Message '" + JSON.stringify(message) + "' handled.");
        console.log("Start Game :" + payload.isStartGame);
        console.log("GameDuration : " + payload.gameDuration + " mins");
        const isStartGame = payload.isStartGame == "true" ? true : false;

        let data = { members: [] }
        for(let i in payload.playedWords) {
          data.members.push( { memberId: payload.playedWords[i].memberId, member: payload.playedWords[i].member });
        }
        console.log(data);
        if(isStartGame) {
          console.log("Starting Game");
          setTabooWords(payload.playedWords);
          tabooWordsRef.current = payload.playedWords;
          setHitWords(payload.hitWords);
          hitWordsRef.current = payload.hitWords;
          setIsGameEnd(false);
          countdown(handleStartGameCountdown, isStartGame, data, payload.gameDuration);
        }else{
          const player = new Audio("/sounds/mixkit-attention-bell-ding-586.wav");
          player.play();
          setHitWords(payload.hitWords);
          hitWordsRef.current = payload.hitWords;
          console.log(payload.hitWords);
          console.log(payload.playedWords);
          console.log("Remaining Players:" + payload.playedWords.length - payload.hitWords.length);
          console.log("You're Loss:" + payload.hitWords?.filter(hitWord => hitWord.memberId == localPlayerId).length);
          if ((payload.playedWords.length - payload.hitWords.length) == 1) {
              handleStartGameCountdown(isStartGame,data, payload.gameDuration);
          }
        }
      });
  }

  const socketHandler = async () => {
        initializeSocket();

        return () => {
            socket.disconnect();
        }
  }

  useEffect(() => {
      socketHandler();
  }, []);

  const startGame = async () => {

    //countdown();

    let players = { members: [] }
    for(let i in participants) {
      if (participants[i].participant.isLocal) {
        players.members.push( { memberId: participants[i].participant?.id, member: utf8.decode(participants[i].participant?.attributes.username) });
      } else {
        players.members.push( { memberId: participants[i].participant?.id, member: participants[i].participant?.attributes.username });
      }
    }
    console.log(selectedCategory);
    console.log(selectedDuration);
    //sendWebPushParticipants(data, selectedCategory, participantToken);
    const pushBody = {
            body: players ?? 'No Player sent',
            url: 'https://acquaintedgame.com',
            token: participantToken,
            category: selectedCategory,
            isStartGame: 'true',
            gameDuration: selectedDuration,
            startTime: moment().format('yyyy-MM-DD:hh:mm:ss'),
    };
    socket?.emit("start_game", pushBody);
  };

/*
  useEffect(() => {
    if(subscription != null) {
        console.log(subscription);
        updateSubscriptionToRedis(participantToken, subscription);
    }
  }, [subscription]);
*/
  var duration = "...";

  const handleStartGameCountdown = (isStartGame, players, selectedGameDuration) => {

    if(!isStartGame) {
        duration = 0;
    } else {
        const toastId =  toast.loading(<div>Game finish in {duration}</div>, {
               style: {
                   border: '1px solid #713200',
                   padding: '16px',
                   color: '#713200',
                 },
                 iconTheme: {
                   primary: '#713200',
                   secondary: '#FFFAEE',
                 }
        });

        duration = selectedGameDuration * 60;

        let interval = setInterval(() => {

              if (duration != 0) {
                   duration--
                   console.log(duration);

                   toast.loading(<div>Game finish in {duration}</div>, {
                              style: {
                                  border: '1px solid #713200',
                                  padding: '16px',
                                  color: '#713200',
                                },
                                iconTheme: {
                                  primary: '#713200',
                                  secondary: '#FFFAEE',
                                },
                                id: toastId
                   });
               } else {
                   console.log(hitWordsRef.current);
                   console.log(utf8.decode(localParticipantRef.current?.id));
                   clearInterval(interval)
                   toast.dismiss(toastId);
                   duration = "...";
                   //setIsGameEnd(true);
                   if(hitWordsRef.current?.filter(hitWord => hitWord.memberId == utf8.decode(localParticipantRef.current?.id)).length == 0) {
                      addScoreToPlayer(participantTokenRef.current);
                      guessTabooWord(players);
                   } else {
                    setIsGameEnd(true);
                    let timerInterval;
                    Swal.fire({
                      title: "Wait for others to guess Taboo Word",
                      html: "<b></b>",
                      customClass: {
                        container: 'my-swal'
                      },
                      timer: 15000,
                      timerProgressBar: true,
                      allowOutsideClick: false,
                      didOpen: () => {
                          Swal.showLoading();
                          const timer = Swal.getPopup().querySelector("b");
                          timerInterval = setInterval(() => {
                              timer.textContent = `${Math.round(Swal.getTimerLeft()/1000)}`;
                          }, 100);
                      },
                      willClose: () => {
                          clearInterval(timerInterval);
                      }
                    }).then((result) => {

                       /* Read more about handling dismissals below */
                        if (result.dismiss === Swal.DismissReason.timer) {
                            console.log("I was closed by the timer");
                            checkCurrentScores(players);
                        }
                    });
                   }
               }
        }, 1000);
    }
  };

  const guessTabooWord = async (players) => {
    let timerInterval;
    await Swal.fire({
      title: "Guess Your Word",
      input: "text",
      inputAttributes: {
        autocapitalize: "off"
      },
      html: "<b>",
      customClass: {
        container: 'my-swal',
        input: 'static-controls',
      },
      timer: 10000,
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: () => {
          Swal.showLoading();
          const timer = Swal.getPopup().querySelector("b");
          timerInterval = setInterval(() => {
              timer.textContent = `${Math.round(Swal.getTimerLeft()/1000)}`;
          }, 100);
      },
      willClose: () => {
          clearInterval(timerInterval);
          console.log(Swal.getInput().value);
          let playedWord = tabooWordsRef.current?.filter(tabooWord =>  tabooWord.memberId == utf8.decode(localParticipantRef.current?.id))
                                           .map(tabooWord => tabooWord.word);
          console.log(playedWord[0]);
          if(Swal.getInput().value.trim() != ""){
              if(Swal.getInput().value.trim() == playedWord[0]) {
                      addScoreToPlayer(participantTokenRef.current);
              }
          }
      }
    });
    setIsGameEnd(true);
    checkCurrentScores(players);
 }

  const checkCurrentScores = async (data) => {
    let scores = await getScoresFromRedis(participantTokenRef.current, data);

    let html = '<table border=1><thead><tr>';
    for (let i in scores) {
        html = html + "<th style='text-align: center; vertical-align: middle;'>" + scores[i].member + "</th>";
    }
    html = html + "</tr></thead><tbody><tr>";
    for (let i in scores) {
        html = html + "<td style='text-align: center; vertical-align: middle;'>" + scores[i].score + "</td>";
    }
    html = html + "</tbody></table>";
/*
    let column = [];
    var row = "{";
    for (let i in scores) {
        console.log(scores[i]);
        column.push( { field: scores[i].member, headerName: scores[i].member, width: 130 });
        if( i == 0 ) { row = row + '"' + scores[i].member + '"' + ":" + '"' + scores[i].score + '"';
        }else{ row = row + ", " + '"' + scores[i].member + '"' + ":" + '"' + scores[i].score + '"'; }
    }
    row = row + "}";
    console.log(row);
    let jsonRow = JSON.parse(row);
    console.log(jsonRow);
    let rows = [];
    rows.push(jsonRow);
    console.log(rows);
*/
    Swal.fire({
      title: "<strong>Scores Board</u></strong>",
      background: "#fff url(/images/trees.png)",
      backdrop: "rgba(0,0,123,0.4) url('/images/nyan-cat.gif') left top no-repeat",
      color: "#716add",
      icon: "info",
      html: html,
      customClass: {
        container: 'my-swal'
      },
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
  }

  return (
   <React.Fragment>
    <div>
      <Script
        src="https://web-broadcast.live-video.net/1.6.0/amazon-ivs-web-broadcast.js" // Load the Amazon IVS Web Broadcast JavaScript library
        onLoad={initialize} // Call the 'initialize' function after the script has loaded
      ></Script>
      <Header />
      <hr />
      <div>
        <Toaster position="bottom-left" reverseOrder={false} />
      </div>
      <RoomForm />
      <AddMemberForm />
      <div className="row">
        <Select
          deviceType="Camera"
          updateDevice={setSelectedVideoDeviceId}
          devices={videoDevices}
        />
        <Select
          deviceType="Microphone"
          updateDevice={setSelectedAudioDeviceId}
          devices={audioDevices}
        />
        <Input
          label="รหัสสมาชิกเข้าห้องของผู้เล่น"
          value={participantId}
          onChange={setParticipantId}
        />
        {isInitializeComplete && (
          <div className="button-container row" >
            <button
              onClick={handleClickJoinRoom}
              className="btn btn-primary"
            >
              Join Room
            </button>
          </div>
        )}
      </div>
      <Dialog
        fullScreen
        open={joinRoom}
        onClose={handleLeaveRoom}
        scroll="body"
        TransitionComponent={Transition}
        disableAutoFocus
        disableEnforceFocus
      >
          {isConnected && (
            <div className="static-controls">
             <div className="row">
              <div className="button-container row">

              <button
                onClick={() => {
                    let data = { members: [] };
                    for(let i in participants) {

                      if (participants[i].participant.isLocal) {
                        data.members.push( { memberId: participants[i].participant?.id, member: utf8.decode(participants[i].participant?.attributes.username) });
                      } else {
                        data.members.push( { memberId: participants[i].participant?.id, member: participants[i].participant?.attributes.username });
                      }
                    }
                    //alert(JSON.stringify(data));
                    checkCurrentScores(data);
                  }
                }
                className="button"
              >
                เช็คคะแนนรอบล่าสุด
              </button>
              <button
                onClick={() =>
                  handleMediaToggle(MIC, stageRef, setIsMicMuted)
                }
                className="button"
              >
                {isMicMuted ? "Unmute Mic" : "Mute Mic"}
              </button>
              <button
                onClick={() =>
                  handleMediaToggle(CAMERA, stageRef, setIsCameraHidden)
                }
                className="button"
              >
                {isCameraHidden ? "Unhide Camera" : "Hide Camera"}
              </button>
               <button
                className="button"
                onClick={handleLeaveRoom}
              >
                Leave Room
              </button>

            </div>
            </div>
          </div>
          )}
          {isConnected && (
          <>
            <h3>
             <Stack sx={{ width: '50%' }} spacing={0}>

                 <div className="row">
                     <Select
                         deviceType="เลือกหมวดคำต้องห้าม"
                         updateDevice={setSelectedCategory}
                         devices={categories}
                     />
                     <Select
                         deviceType="ระยะเวลาเล่นต่อรอบ (นาที)"
                         updateDevice={setSelectedDuration}
                         devices={gameDuration}
                     />

                     <div className="button-container row">
                        <button className="btn btn-primary" style={{ marginLeft: "auto", marginRight: "auto" }}
                         onClick={() => {
                           startGame()
                           }
                         }
                         disabled={!isGameEnd}
                        >
                         Start Game
                        </button>
                     </div>
                 </div>
              <Box component="section" fontWeight='fontWeightMedium' sx={{ p: 4,  borderRadius: 5, backgroundImage: 'url("/images/warning-striped-rectangular-background-yellow-black-stripes.jpg")', backgroundRepeat: 'no-repeat', backgroundSize: "70% 85px", backgroundPosition: "center center", justifyContent: 'center', textAlign: 'center', color:  (hitWords?.filter(hitWord => hitWord.member == utf8.decode(localParticipant?.participant?.attributes?.username)).length > 0) ? 'error.main' : (isGameEnd ? 'success.main' : 'info.main')  }}>
                      { ( (hitWords?.filter(hitWord => hitWord.memberId == utf8.decode(localParticipant?.participant?.id)).length > 0)
                            || isGameEnd) && (tabooWords.length != 0) ? tabooWords?.filter(
                          tabooWord =>  tabooWord.memberId == utf8.decode(localParticipant?.participant?.id)).map(tabooWord => tabooWord.word) : (tabooWords.length != 0) ? 'Start Playing!' : <img src={"/images/warning_sign.png"} height="50px" width="auto" align="center" />
                      }

              </Box>
             </Stack>
            </h3>
            <LocalParticipantVideo
              localParticipantInfo={localParticipant}
              isInitializeComplete={isInitializeComplete}
              participantSize={participants.length}
            />
          </>
          )}
          {isConnected && (
            <>
              <div className="center">
                <RemoteParticipantVideos
                  isInitializeComplete={isInitializeComplete}
                  participants={participants}
                  participantSize={participants.length}
                  tabooWords={tabooWordsRef.current}
                  hitWords={hitWordsRef.current}
                  isGameEnd={isGameEnd}
                  participantToken={participantToken}
                  socket={socket}
                />
              </div>
            </>
          )}
      </Dialog>
    </div>
    <div>
    <Footer />
    </div>
   </React.Fragment>

  );
}
