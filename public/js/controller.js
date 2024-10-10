const socket = io();
const statusDisplay = document.getElementById("connection-status");
const enableMotionContainer = document.getElementById("enable-container");
const enableMotionButton = document.getElementById("enable-btn");
const peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:europe.relay.metered.ca:80",
      username: "a364761ad3c223aa804bf078",
      credential: "HEMEFtku+UYDMgxv",
    },
    {
      urls: "turn:europe.relay.metered.ca:80?transport=tcp",
      username: "a364761ad3c223aa804bf078",
      credential: "HEMEFtku+UYDMgxv",
    },
    {
      urls: "turn:europe.relay.metered.ca:443",
      username: "a364761ad3c223aa804bf078",
      credential: "HEMEFtku+UYDMgxv",
    },
    {
      urls: "turns:europe.relay.metered.ca:443?transport=tcp",
      username: "a364761ad3c223aa804bf078",
      credential: "HEMEFtku+UYDMgxv",
    },
  ],
});
const motionThreshold = 5;

let dataChannel;
let isFlickDetected = false;

socket.on("connect", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const socketId = urlParams.get("socketId");

  if (socketId) {
    urlParams.delete("socketId");
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);

    socket.emit("pair", socketId);
  } else {
    statusDisplay.className = "disconnected";
  }
});

socket.on("connected", () => {
  statusDisplay.className = "connected";
  establishWebRTCConnection();
});

socket.on("disconnected", () => {
  statusDisplay.className = "disconnected";
});

// Create a data channel and set up event listeners
function createDataChannel() {
  dataChannel = peerConnection.createDataChannel("channel");
  dataChannel.onopen = () => {
    showEnableButton();
  };
}

// Handle ICE candidate generation
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("ice-candidate", event.candidate);
  }
};

// Handle receiving an answer
socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE candidates from the peer
socket.on("ice-candidate", (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

async function establishWebRTCConnection() {
  createDataChannel();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

function handleMotionEvent(e) {
  const acceleration = e.acceleration;

  if (
    acceleration.x > motionThreshold ||
    acceleration.y > motionThreshold ||
    acceleration.z > motionThreshold
  ) {
    if (!isFlickDetected) {
      isFlickDetected = true;
      if (dataChannel) {
        dataChannel.send("jump");
      }
    }
  } else {
    isFlickDetected = false;
  }
}

function enableMotionDetection() {
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    DeviceMotionEvent.requestPermission().then((permissionState) => {
      if (permissionState === "granted") {
        hideEnableButton();
        window.addEventListener("devicemotion", handleMotionEvent, true);
      }
    });
  } else {
    hideEnableButton();
    window.addEventListener("devicemotion", handleMotionEvent, true);
  }
}

function showEnableButton() {
  enableMotionContainer.style.display = "block";
}
function hideEnableButton() {
  enableMotionContainer.style.display = "none";
}

enableMotionButton.addEventListener("click", enableMotionDetection);
