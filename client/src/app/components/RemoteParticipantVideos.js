import Video from "./Video"; // Import the Video component
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
const utf8 = require('utf8');

const RemoteParticipantVideos = ({
  isInitializeComplete, // Boolean indicating if the initialization is complete
  participants, // Array of participants
  tabooWords,
  hitWords,
  isGameEnd,
  participantToken,
  socket,
}) => {
  if (!isInitializeComplete) return; // If initialization is not complete, return

  return participants // Filter the participants that are not local and map each participant
    ?.filter(
      (participantAndStreamInfo) =>
        !participantAndStreamInfo.participant.isLocal // Filter out the local participants
    )
    .map((participantAndStreamInfo, index) => {
      const { participant, streams } = participantAndStreamInfo; // Destructure the participant and streams
      const { username } = participant?.attributes; // Destructure the username from the participant attributes
      let streamsToDisplay = streams; // Initialize streamsToDisplay with the remote streams

      const words = tabooWords?.filter(
                          tabooWord =>  tabooWord.memberId == participant?.id).map(tabooWord => tabooWord.word);
      const word = words[0];

      return (
        <div className="flex margin" key={participant?.id}>
          {/* Container for the remote participant videos */}
         <h4>
         <div align='center' >
         <Box component="section" fontWeight='fontWeightMedium' sx={{  display: 'flex', alignItems: 'center', width: '200px', margin: 1, p: 2,  borderRadius: 0, backgroundImage: 'url("/images/warning_frame.png")', backgroundRepeat: 'no-repeat', backgroundSize: "100% 100%", backgroundPosition: "center center", justifyContent: 'center', textAlign: 'center', bgcolor: hitWords?.filter(hitWord => hitWord.word == word).length > 0 ? 'error.main' : isGameEnd ? 'white' : 'info.main', color:  hitWords?.filter(hitWord => hitWord.word == word).length > 0 ? 'white' : isGameEnd ? 'success.main' : 'white'  }}>
                {tabooWords.length > 0 ? tabooWords?.filter(
                    tabooWord =>  tabooWord.memberId == participant?.id).map(tabooWord => tabooWord.word) : <img src={"/images/warning_sign.png"} height="30px" width="auto" align="center" />
                }
          </Box>
          </div>
          </h4>
          <div className="video-container" key={participant?.id}>
            {/* Video container for the remote participant */}
            {/* Render the Video component with necessary props */}
            <Video
              className="remote-participant-video" // CSS class for the remote participant video
              participant={participant} // Pass the participant information
              streamsToDisplay={streamsToDisplay} // Pass the streams to display
              username={username} // Pass the username
              participantSize={index+1} // Pass the participant size
              key={participant?.id}
            />
          </div>
            <button disabled={isGameEnd || (hitWords?.filter(hitWord => hitWord.word == word).length > 0)   }
                onClick={() => {
                    let players = { members: [] }
                    for(let i in participants) {
                      if (participants[i].participant.isLocal) {
                        players.members.push( { memberId: participants[i].participant?.id, member: utf8.decode(participants[i].participant?.attributes.username) });
                      } else {
                        players.members.push( { memberId: participants[i].participant?.id, member: participants[i].participant?.attributes.username });
                      }
                    }
                    hitWords.push({ "memberId": participant?.id, "member": username, "word": word });

                    //sendWebPushHitWord(data, tabooWords, hitWords)
                    let pushBody = {
                        title: 'Send Hit Words',
                        body: players ?? 'No Player sent',
                        token: participantToken,
                        playedWords: tabooWords,
                        hitWords: hitWords,
                        isStartGame: 'false',
                    };
                    socket?.emit("hit", pushBody);
                  }
                }
                className="button" style={{ width: "100%"}}
              >
                You Loss!!
            </button>

        </div>
      );
    });
};

export default RemoteParticipantVideos; // Export the RemoteParticipantVideos component
