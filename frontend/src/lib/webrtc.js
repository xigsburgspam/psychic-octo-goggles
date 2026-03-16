/**
 * Addagle WebRTC Manager
 *
 * Handles:
 * - Local media (camera / mic)
 * - Peer connection creation (offer / answer)
 * - ICE candidate exchange (via Socket.IO signaling)
 * - Track management (mute, camera toggle)
 */

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add your own TURN server for production:
    // {
    //   urls: 'turn:your.turn.server:3478',
    //   username: 'user',
    //   credential: 'password',
    // },
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCManager {
  constructor({ socket, onRemoteStream, onConnectionState, onError }) {
    this.socket = socket;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionState = onConnectionState;
    this.onError = onError;

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitiator = false;

    // Bind socket signaling listeners
    this._bindSignaling();
  }

  /** Acquire local camera + microphone */
  async getLocalMedia({ video = true, audio = true } = {}) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      return this.localStream;
    } catch (err) {
      console.error('[WebRTC] getUserMedia failed:', err);
      // Try audio-only fallback
      if (video) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio });
          return this.localStream;
        } catch (e) {
          // Complete failure
        }
      }
      this.onError?.('Could not access camera/microphone. Check permissions.');
      return null;
    }
  }

  /** Create peer connection and set up tracks */
  async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Receive remote tracks
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      this.onRemoteStream?.(this.remoteStream);
    };

    // ICE candidate gathering
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc:ice-candidate', { candidate: event.candidate });
      }
    };

    // Connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('[WebRTC] Connection state:', state);
      this.onConnectionState?.(state);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      if (state === 'failed') {
        this.peerConnection.restartIce();
      }
    };

    return this.peerConnection;
  }

  /** Initiator: create and send offer */
  async createOffer() {
    this.isInitiator = true;
    await this.createPeerConnection();

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit('webrtc:offer', { offer });
  }

  /** Responder: handle received offer, send answer */
  async handleOffer(offer) {
    this.isInitiator = false;
    await this.createPeerConnection();

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.socket.emit('webrtc:answer', { answer });
  }

  /** Handle received answer */
  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /** Handle received ICE candidate */
  async handleIceCandidate(candidate) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] Could not add ICE candidate:', err);
    }
  }

  /** Toggle audio mute */
  toggleAudio() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  /** Toggle video */
  toggleVideo() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  /** Check if video is currently enabled */
  isVideoEnabled() {
    const track = this.localStream?.getVideoTracks()[0];
    return track ? track.enabled : false;
  }

  isAudioEnabled() {
    const track = this.localStream?.getAudioTracks()[0];
    return track ? track.enabled : false;
  }

  /** Clean up all resources */
  destroy() {
    this._unbindSignaling();

    // Stop local tracks
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  /** Bind socket listeners for WebRTC signaling */
  _bindSignaling() {
    this._onOffer = async ({ offer }) => { await this.handleOffer(offer); };
    this._onAnswer = async ({ answer }) => { await this.handleAnswer(answer); };
    this._onIce = async ({ candidate }) => { await this.handleIceCandidate(candidate); };

    this.socket.on('webrtc:offer', this._onOffer);
    this.socket.on('webrtc:answer', this._onAnswer);
    this.socket.on('webrtc:ice-candidate', this._onIce);
  }

  _unbindSignaling() {
    if (this._onOffer) this.socket.off('webrtc:offer', this._onOffer);
    if (this._onAnswer) this.socket.off('webrtc:answer', this._onAnswer);
    if (this._onIce) this.socket.off('webrtc:ice-candidate', this._onIce);
  }
}

export default WebRTCManager;
