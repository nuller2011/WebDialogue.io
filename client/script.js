const screenShareButton = document.getElementById('screenShareButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

let localStream;
let remoteStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const socket = io();

canvas.width = 500;
canvas.height = 300;

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    
    peerConnection.addEventListener('icecandidate', event => {
        if (event.candidate) {
            socket.emit('ice-candidate', event.candidate);
        }
    });

    peerConnection.addEventListener('track', event => {
        remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
        remoteVideo.srcObject = remoteStream;
    });

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('video-offer', offer);
}

screenShareButton.onclick = async () => {
    const displayStream = await navigator.mediaDevices.getDisplayMedia();
    const screenTrack = displayStream.getTracks()[0];
    peerConnection.addTrack(screenTrack, displayStream);

    screenTrack.onended = () => {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    };
};

canvas.onmousedown = function (e) {
    ctx.moveTo(e.offsetX, e.offsetY);
    canvas.onmousemove = function (e) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        socket.emit('drawing', { x: e.offsetX, y: e.offsetY });
    };
};

canvas.onmouseup = function () {
    canvas.onmousemove = null;
};

socket.on('connect', startCall);

socket.on('video-answer', async answer => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async candidate => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('drawing', data => {
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
});
