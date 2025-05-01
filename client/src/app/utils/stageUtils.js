import { getMediaForDevices, CAMERA, MIC } from "./mediaDevices";
import { CreateParticipantTokenCommand, CreateStageCommand, IVSRealTimeClient } from "@aws-sdk/client-ivs-realtime";

const utf8 = require('utf8');

// Function creates a local stage stream based on the specified device ID and type (CAMERA or MIC).
export const createLocalStageStream = async (deviceId, deviceType) => {
  const { LocalStageStream } = IVSBroadcastClient;

  // Warn and return if the device ID is null
  if (!deviceId) {
    console.warn("Attempted to set local media with a null device ID");
    return;
  }

  // Get media stream for the specified device
  const newDevice = await getMediaForDevices(deviceId, deviceType);

  // Create a LocalStageStream based on the device type
  const stageStream =
    deviceType === CAMERA
      ? new LocalStageStream(newDevice.getVideoTracks()[0])
      : new LocalStageStream(newDevice.getAudioTracks()[0]);

  return stageStream;
};

// Function creates a strategy object for IVS stage, considering initialization status
const setupStrategy = (
  isInitializeComplete // Parameter representing the initialization completion status
) => {
  // Check if the initialization is complete; if not, return nothing
  if (!isInitializeComplete) {
    return;
  }

  const { SubscribeType } = IVSBroadcastClient; // Reference the SubscribeType property from the IVSBroadcastClient object
  // More information can be found here: https://aws.github.io/amazon-ivs-web-broadcast/docs/v1.3.1/sdk-reference/enums/SubscribeType?_highlight=subscribetype

  const strategy = {
    audioTrack: undefined,
    videoTrack: undefined,

    // Method to update audio and video tracks
    updateTracks(newAudioTrack, newVideoTrack) {
      this.audioTrack = newAudioTrack;
      this.videoTrack = newVideoTrack;
    },

    // Method to define streams to publish
    stageStreamsToPublish() {
      return [this.audioTrack, this.videoTrack];
    },

    // Method to determine participant publishing
    shouldPublishParticipant(participant) {
      return true;
    },

    // Method to determine type of subscription for participants
    shouldSubscribeToParticipant(participant) {
      return SubscribeType.AUDIO_VIDEO;
    },
  };

  return strategy; // Return the strategy object
};

/**
 * Click handler for Join Stage Button
 */

export const joinStage = async (
  isInitializeComplete, // Indicates if the initialization is complete
  participantToken, // Token of the participant
  selectedAudioDeviceId, // Represents the selected audio device
  selectedVideoDeviceId, // Represents the selected video device
  setIsConnected, // Setter for the connection status
  setIsMicMuted, // Setter for the microphone mute state
  setLocalParticipant, // Setter for the local participant
  setParticipants, // Setter for the list of participants
  strategyRef,
  stageRef, // Setter for the stage
  localParticipantRef,
  setParticipantToken,
  setJoinRoom,
  socket,
  participantTokenRef
) => {
  const {
    Stage, // Reference to the Stage class
    StageEvents, // Reference to the StageEvents object
    ConnectionState, // Reference to the ConnectionState object
  } = IVSBroadcastClient; // IVS Broadcast Client object

  if (!isInitializeComplete) return; // If the initialization is not complete, stop execution and return

  const cameraStageStream = await createLocalStageStream(
    selectedVideoDeviceId,
    CAMERA
  );
  const micStageStream = await createLocalStageStream(selectedAudioDeviceId, MIC);

  // Set up the strategy for the stage
  const strategy = setupStrategy(isInitializeComplete);

  strategy.updateTracks(micStageStream, cameraStageStream);

  strategyRef.current = strategy;

  // Create a new stage instance
  let stage = new Stage(participantToken, strategyRef.current);

  // Event listener for stage connection state changes
  stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
    // Update the connection status
    setIsConnected(state === ConnectionState.CONNECTED);

    // Mute the microphone stage stream and update the state for the mic button
    micStageStream.setMuted(true);
    setIsMicMuted(true);
  });

  // Event listener for when participant streams are added
  stage.on(
    StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
    (participant, streams) => {
      console.log(participant?.attributes.username);

      // Set the local participant and update the list of participants
      if (participant.isLocal) {
        setLocalParticipant({ participant, streams });

        localParticipantRef.current = participant;  // Custom add to use localParticipantRef
      }
      console.log("Participant Media Added: ", participant, streams);
      setParticipants((prevParticipants) => {
        const participantExists = prevParticipants.some(
          (participantObj) => participantObj.participant.id === participant.id
        );

        if (!participantExists) {
          return [...prevParticipants, { participant, streams }];
        } else {
          return prevParticipants;
        }
      });
    }
  );

  // Event listener for when a participant leaves
  stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, (participant) => {
    console.log("Participant Left: ", participant);

    // Update the list of participants by removing the participant who left
    setParticipants((prevParticipants) => {
      const filteredParticipants = prevParticipants.filter(
        ({ participant: currentParticipant }) => {
          return currentParticipant.id !== participant.id;
        }
      );
      return [...filteredParticipants];
    });
  });

  try {
    await stage.join(); // Attempt to join the stage

    setParticipantToken(participantToken);
    setJoinRoom(true);
    //checkPermissionStateAndAct(setSubscription);
    socket?.emit("join_room", participantToken);
    participantTokenRef.current = participantToken;
  } catch (err) {
    stage = null;
    alert("รหัสสมาชิกหมดอายุ กรุณาสร้าง user นี้ในห้องเดิม โดยใช้ รหัสกุญแจห้อง ใหม่อีกครั้งเพื่อรับ รหัสสมาชิกใหม่!");
  }

  stageRef.current = stage;
};

/**
 * Click handler for the Leave Stage button
 */
export const leaveStage = async (stage, setIsConnected) => {
  await stage.leave();
  setIsConnected(false);
};

const region = process.env.AWS_REGION;

const config = {
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  correctClockSkew: true,
  region
};

export default class IvsRealtimeService {
  ivsRealtimeClient = new IVSRealTimeClient(config);
  stages = {};
  stageParticipants = {};

  getStage(name) {
    return this.stages[name];
  }

  stageExists(name) {
    return this.stages.hasOwnProperty(name);
  }

  async createStage(name) {
    const createStageRequest = new CreateStageCommand({ name });
    const createStageResponse = await this.ivsRealtimeClient.send(createStageRequest);
    this.stages[name] = createStageResponse.stage;
    this.stageParticipants[name] = [];
    return this.stages[name];
  };

  async createStageParticipantToken(stageName, stageArn, userId, username, duration = 90) {
/*    let stage;
    if (!this.stageExists(stageName)) {
      stage = await this.createStage(stageName)
    }
    else {
      stage = this.getStage(stageName);
    }
    const stageArn = stage.arn;
*/
    if(this.stageParticipants[stageName] == null) {
        this.stageParticipants[stageName] = [];
    }
    const createStageTokenRequest = new CreateParticipantTokenCommand({
      attributes: {
        username,
      },
      userId,
      stageArn,
      duration,
    });
    const createStageTokenResponse = await this.ivsRealtimeClient.send(createStageTokenRequest);
    const participantToken = createStageTokenResponse.participantToken;
    this.stageParticipants[stageName].push(participantToken);
    return participantToken;
  };
}

export var ivsRealtimeService = new IvsRealtimeService();
