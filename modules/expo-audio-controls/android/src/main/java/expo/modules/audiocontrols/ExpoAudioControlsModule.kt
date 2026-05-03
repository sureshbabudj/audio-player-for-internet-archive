package expo.modules.audiocontrols

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL
import kotlin.concurrent.thread

class ExpoAudioControlsModule : Module() {
  private var mediaSession: MediaSessionCompat? = null
  private var audioManager: AudioManager? = null
  private var focusRequest: AudioFocusRequest? = null

  private val focusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
    when (focusChange) {
      AudioManager.AUDIOFOCUS_LOSS,
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        sendEvent("onPause")
      }
      AudioManager.AUDIOFOCUS_GAIN -> {
        sendEvent("onPlay")
      }
    }
  }

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        "expo.modules.audiocontrols.NEXT_TRACK" -> {
          this@ExpoAudioControlsModule.sendEvent("onNextTrack")
        }
        "expo.modules.audiocontrols.PREV_TRACK" -> {
          this@ExpoAudioControlsModule.sendEvent("onPreviousTrack")
        }
        "expo.modules.audiocontrols.PLAY" -> {
          this@ExpoAudioControlsModule.sendEvent("onPlay")
        }
        "expo.modules.audiocontrols.PAUSE" -> {
          this@ExpoAudioControlsModule.sendEvent("onPause")
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack", "onPlay", "onPause")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      
      // Register receiver for patched expo-audio broadcasts
      val filter = IntentFilter().apply {
        addAction("expo.modules.audiocontrols.NEXT_TRACK")
        addAction("expo.modules.audiocontrols.PREV_TRACK")
        addAction("expo.modules.audiocontrols.PLAY")
        addAction("expo.modules.audiocontrols.PAUSE")
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        context.registerReceiver(receiver, filter)
      }

      mediaSession = MediaSessionCompat(context, "ExpoAudioControls").apply {
        setCallback(object : MediaSessionCompat.Callback() {
          override fun onPlay() {
            requestAudioFocus()
            sendEvent("onPlay")
          }
          override fun onPause() {
            sendEvent("onPause")
          }
          override fun onSkipToNext() {
            sendEvent("onNextTrack")
          }
          override fun onSkipToPrevious() {
            sendEvent("onPreviousTrack")
          }
          override fun onSeekTo(pos: Long) {
            // Optional: send seek event to JS
          }
        })
        isActive = true
      }
    }

    OnDestroy {
      val context = appContext.reactContext
      try {
        context?.unregisterReceiver(receiver)
      } catch (e: Exception) {}
      
      mediaSession?.release()
      mediaSession = null
      abandonAudioFocus()
    }

    AsyncFunction("setupRemoteControls") {
      mediaSession?.isActive = true
      requestAudioFocus()
    }

    Function("updateNowPlaying") { metadata: Map<String, Any> ->
      val session = mediaSession ?: return@Function
      
      val title = metadata["title"] as? String
      val artist = metadata["artist"] as? String
      val album = metadata["album"] as? String
      val artworkUrl = metadata["artworkUrl"] as? String
      val duration = (metadata["duration"] as? Number)?.toLong() ?: 0L
      val position = (metadata["position"] as? Number)?.toLong() ?: 0L
      val isPlaying = metadata["isPlaying"] as? Boolean ?: false

      // Update Metadata
      val metadataBuilder = MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
        .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album)
        .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration)

      if (!artworkUrl.isNullOrEmpty()) {
        thread {
          try {
            val url = URL(artworkUrl)
            val connection = url.openConnection()
            connection.doInput = true
            connection.connect()
            val input = connection.getInputStream()
            val bitmap = BitmapFactory.decodeStream(input)
            if (bitmap != null) {
              metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, bitmap)
              metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, bitmap)
              session.setMetadata(metadataBuilder.build())
            } else {
              session.setMetadata(metadataBuilder.build())
            }
          } catch (e: Exception) {
            session.setMetadata(metadataBuilder.build())
          }
        }
      } else {
        session.setMetadata(metadataBuilder.build())
      }

      // Update Playback State
      val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
      val stateBuilder = PlaybackStateCompat.Builder()
        .setActions(
          PlaybackStateCompat.ACTION_PLAY or
          PlaybackStateCompat.ACTION_PAUSE or
          PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
          PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
          PlaybackStateCompat.ACTION_STOP or
          PlaybackStateCompat.ACTION_SEEK_TO
        )
        .setState(state, position, 1.0f)
      
      session.setPlaybackState(stateBuilder.build())
    }
  }

  private fun requestAudioFocus(): Boolean {
    val am = audioManager ?: return false
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (focusRequest == null) {
        focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
          .setAudioAttributes(
            AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_MEDIA)
              .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
              .build()
          )
          .setAcceptsDelayedFocusGain(true)
          .setOnAudioFocusChangeListener(focusChangeListener)
          .build()
      }
      am.requestAudioFocus(focusRequest!!) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus(focusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    }
  }

  private fun abandonAudioFocus() {
    val am = audioManager ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      focusRequest?.let { am.abandonAudioFocusRequest(it) }
    } else {
      @Suppress("DEPRECATION")
      am.abandonAudioFocus(focusChangeListener)
    }
  }
}
